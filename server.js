const express = require('express'), Database = require('better-sqlite3'), path = require('path');
const crypto = require('crypto');
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'data.db'));
db.pragma('journal_mode=WAL');

db.exec(`
create table if not exists ingredients(id text primary key,name text,unit text,stock real not null default 0 check(stock>=0),min real,cost real,loc text default 'Main Store', img text);
create table if not exists recipes(id text primary key,name text,price real, img text);
create table if not exists recipe_items(recipe_id text,ing_id text,qty real);
create table if not exists ledger(id integer primary key autoincrement,ts integer,ing_id text,qty real,type text,ref text,bal real);
create table if not exists orders(id text primary key,ts integer,total real,lines text);
create table if not exists idem(key text primary key,result text);
create table if not exists po(id text primary key,sup text,ing_id text,qty real,up real,acc real,status text);
create table if not exists users(id integer primary key autoincrement,username text unique not null,name text,role text not null,pass text not null,active integer default 1);
create table if not exists sessions(token text primary key,user_id integer,exp integer);
create table if not exists audit(id integer primary key autoincrement,ts integer,actor text,action text,detail text);
create table if not exists batches(id integer primary key autoincrement,code text unique,ing_id text,qty real not null check(qty>=0),exp text,recv integer,ref text);
create table if not exists qr_codes(code text primary key,kind text,ref text,active integer default 1,created integer);
create table if not exists locations(id text primary key,name text);
create table if not exists settings(key text primary key, value text);`);

try { db.exec('alter table ledger add column actor text') } catch (e) {}
try { db.exec('alter table ledger add column batch text') } catch (e) {}
try { db.exec("alter table ingredients add column loc text default 'Main Store'") } catch (e) {}
try { db.exec("alter table ingredients add column img text") } catch (e) {}
try { db.exec("alter table recipes add column img text") } catch (e) {}

const A = (s, ...a) => db.prepare(s).all(...a),
      G = (s, ...a) => db.prepare(s).get(...a),
      R = (s, ...a) => db.prepare(s).run(...a);
const bad = (m, s = 400) => Object.assign(new Error(m), { status: s });

const P = {
  owner: ['*'],
  manager: ['view', 'sale', 'stock', 'po', 'po_receive', 'po_pay', 'audit', 'report', 'users'],
  storekeeper: ['view', 'stock', 'po', 'po_receive'],
  cashier: ['view', 'sale'],
  accountant: ['view', 'po_pay', 'audit', 'report']
};

let cur = 'system';
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const hash = pw => { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(pw, s, 64).toString('hex') };
const verify = (pw, h) => { const [s, k] = h.split(':'); return crypto.timingSafeEqual(crypto.scryptSync(pw, s, 64), Buffer.from(k, 'hex')) };
const audit = (actor, action, detail) => R('insert into audit(ts,actor,action,detail) values(?,?,?,?)', Date.now(), actor, action, JSON.stringify(detail || {}).slice(0, 500));
const guard = (req, perm) => { if (!req.user) return false; const p = P[req.user.role] || []; if (p.includes('*') || p.includes(perm)) return true; audit(req.user.username, 'DENIED', { perm, path: req.path }); return false };

// --- Seed Initial Data ---
if (!G('select 1 x from users')) {
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString('base64url');
  R('insert into users(username,name,role,pass) values(?,?,?,?)', 'admin', 'Administrator', 'owner', hash(pw));
  if (!process.env.ADMIN_PASSWORD) console.log('\n*** FIRST RUN — login: admin / ' + pw + '  (shown once) ***\n');
}
if (!G('select 1 x from locations')) {
  ['Main Store', 'Kitchen', 'Bar', 'Cold Room'].forEach(l => R('insert into locations values(?,?)', l, l));
}
if (!G('select 1 x from settings')) {
  R('insert into settings values(?,?)', 'company_name', 'CafePilot');
  R('insert into settings values(?,?)', 'company_address', '123 Coffee Lane, Bean City');
  R('insert into settings values(?,?)', 'company_phone', '+1 234 567 890');
  R('insert into settings values(?,?)', 'company_email', 'hello@cafepilot.com');
  R('insert into settings values(?,?)', 'company_logo', '/assets/Creating_app_symbol_for_Restaurant.jpg'); 
  R('insert into settings values(?,?)', 'currency', 'LKR');
}

const mv = (id, q, type, ref, batch) => {
  R('update ingredients set stock=round(stock+?,3) where id=?', q, id);
  R('insert into ledger(ts,ing_id,qty,type,ref,actor,batch,bal) values(?,?,?,?,?,?,?,?)',
    Date.now(), id, q, type, ref, cur, batch || null, G('select stock from ingredients where id=?', id).stock);
};

const today = () => new Date().toISOString().slice(0, 10);
const chkExp = e => { if (e && (!/^\d{4}-\d{2}-\d{2}$/.test(e) || e < today())) throw bad('Expiry must be a valid future date (YYYY-MM-DD)') };

const newQR = (kind, ref) => {
  const code = crypto.randomBytes(6).toString('hex').toUpperCase();
  R('insert into qr_codes(code,kind,ref,created) values(?,?,?,?)', code, kind, ref, Date.now());
  return code;
};

const receive = (ing, q, exp, ref, type = 'RECEIVE') => {
  const code = 'LOT-' + String(G('select count(*) c from batches').c + 1).padStart(4, '0');
  R('insert into batches(code,ing_id,qty,exp,recv,ref) values(?,?,?,?,?,?)', code, ing, q, exp || null, Date.now(), ref);
  mv(ing, q, type, ref, code);
  return code;
};

const take = (ing, q, type, ref, only, any) => {
  let need = q;
  const rows = only
    ? A('select * from batches where id=? and ing_id=? and qty>0', only, ing)
    : A('select * from batches where ing_id=? and qty>0' + (any ? '' : ' and (exp is null or exp>=?)') + ' order by exp is null, exp, recv', ...(any ? [ing] : [ing, today()]));
  for (const b of rows) {
    if (need <= 0) break;
    const t = Math.min(b.qty, need);
    R('update batches set qty=round(qty-?,3) where id=?', t, b.id);
    mv(ing, -t, type, ref, b.code);
    need = Math.round((need - t) * 1000) / 1000;
  }
  if (need > 0) throw bad('Insufficient ' + (only || any ? '' : 'non-expired ') + 'stock for ' + ing, 409);
};

db.transaction(() => {
  for (const i of A('select * from ingredients where stock>0 and id not in (select ing_id from batches)'))
    R('insert into batches(code,ing_id,qty,exp,recv,ref) values(?,?,?,?,?,?)', 'OPEN-' + i.id, i.id, i.stock, null, Date.now(), 'Migrated opening stock');
})();

if (!G('select 1 x from ingredients')) db.transaction(() => {
  // --- 1. INGREDIENTS with correct images ---
  const ing = [
    ['coffee',        'Coffee powder',      'g',   300,  6.0, '/assets/Ceramic_bowl_with_coffee_powder.jpg'],
    ['sugar',         'Sugar',              'g',   500,  0.25,'/assets/Ceramic_bowl_filled_with_sugar.jpg'],
    ['milk',          'Milk',               'ml', 1500,  0.30,'/assets/Glass_milk_jug_filled_with.jpg'],
    ['cup',           'Paper cups',         'pcs',  50, 12.0, '/assets/Three_white_coffee_cups.jpg'],
    ['syrup',         'Chocolate syrup',    'ml',  200,  1.20,'/assets/Glass_bottle_pouring_chocolate.jpg'],
    ['cup2',          'Ceramic cups',       'pcs',  20, 50.0, '/assets/Three_coffee_cups_displayed.jpg'],
    ['chocolate',     'Dark Chocolate',     'g',   100,  2.50,'/assets/Three_coffee_beans_floating.jpg'],
    ['sugar_cubes',   'Sugar Cubes',        'g',   200,  0.50,'/assets/White_sugar_cubes_and_crystals.jpg'],
    ['milk_carton',   'Milk Carton',        'pcs',  10, 80.0, '/assets/Milk_carton_product_render.jpg'],
    ['ceramic_cup',   'Ceramic Coffee Cup', 'pcs',  15, 60.0, '/assets/Ceramic_coffee_cup_floating.jpg'],
    ['ing_container', 'Ingredient Container','pcs',  5,100.0, '/assets/a-premium-minimalist-generic-ingredient-container.png']
  ];
  ing.forEach(r => R('insert into ingredients(id,name,unit,min,cost,img) values(?,?,?,?,?,?)', ...r));

  // --- 2. Opening stock ---
  const opening = [['coffee',2000],['sugar',5000],['milk',10000],['cup',500],['syrup',1000],
                   ['cup2',60],['chocolate',500],['sugar_cubes',500],['milk_carton',30],
                   ['ceramic_cup',40],['ing_container',10]];
  opening.forEach(([i,q]) => receive(i, q, null, 'Opening balance', 'OPENING'));

  // --- 3. RECIPES with correct images ---
  const rec = [
    ['r1','Regular Milk Coffee',300,
      {coffee:10, sugar:8, milk:100, cup:1},
      '/assets/a-freshly-prepared-classic-milk-coffee-served-in-a.png'],
    ['r2','Black Coffee',200,
      {coffee:10, sugar:5, cup:1},
      '/assets/a-freshly-brewed-black-americano-in-a-simple-trans.png'],
    ['r3','Latte',450,
      {coffee:14, milk:200, cup2:1},
      '/assets/a-beautifully-prepared-latte-in-a-clear-tall-glass.png'],
    ['r4','Mocha',520,
      {coffee:14, milk:150, syrup:20, cup2:1},
      '/assets/a-rich-chocolate-mocha-served-in-a-white-ceramic-m.png'],
    ['r5','Iced Coffee',350,
      {coffee:12, milk:120, sugar:5, cup:1},
      '/assets/a-premium-minimalist-generic-ingredient-container.png'],
    ['r6','Hot Chocolate',400,
      {chocolate:30, milk:200, sugar:10, cup2:1},
      '/assets/Milk_carton_product_render.jpg'],
    ['r7','Ceramic Latte',500,
      {coffee:14, milk:200, ceramic_cup:1},
      '/assets/Ceramic_coffee_cup_floating.jpg'],
    ['r8','Sugar Cane Latte',480,
      {coffee:14, milk:180, sugar_cubes:20, cup2:1},
      '/assets/White_sugar_cubes_and_crystals.jpg'],
    ['r9','Brand Presentation Coffee',600,
      {coffee:15, milk:150, chocolate:10, cup2:1},
      '/assets/RestaurantIQ_brand_presentation.jpg']
  ];
  rec.forEach(([id,n,p,items,img]) => {
    R('insert into recipes values(?,?,?,?)', id, n, p, img);
    for (const k in items) R('insert into recipe_items values(?,?,?)', id, k, items[k]);
  });
})();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const m = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  if (m) {
    const u = G('select u.* from sessions s join users u on u.id=s.user_id where s.token=? and s.exp>? and u.active=1', sha(m[1]), Date.now());
    if (u) { req.user = u; req.tok = sha(m[1]) }
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

const tx = (perm, fn) => (req, res) => {
  try {
    if (!guard(req, perm)) throw bad(req.user ? 'Forbidden' : 'Login required', req.user ? 403 : 401);
    cur = req.user.username;
    res.json(db.transaction(() => {
      const o = fn(req.body || {}, req.params);
      audit(cur, perm, { ...req.body, ...req.params });
      return o;
    })());
  } catch (e) {
    const chk = /CHECK/.test(e.message);
    res.status(e.status || (chk ? 409 : 500)).json({ error: chk ? 'Insufficient stock — rejected, nothing was deducted' : e.message });
  }
};

app.get('/api/state', (q, s) => {
  if (!guard(q, 'view')) return s.status(401).json({ error: 'Login required' });
  const ing = A('select * from ingredients');
  const sums = A('select ing_id,sum(qty) t from ledger group by ing_id');
  s.json({
    ing,
    today: today(),
    batches: A('select b.*,i.name from batches b join ingredients i on i.id=b.ing_id where b.qty>0 order by b.exp is null, b.exp'),
    bok: ing.every(i => Math.abs(G('select coalesce(sum(qty),0) t from batches where ing_id=?', i.id).t - i.stock) < .01),
    rec: A('select * from recipes').map(r => ({ ...r, items: A('select ing_id,qty from recipe_items where recipe_id=?', r.id) })),
    led: A('select * from ledger order by id desc limit 100'),
    ord: A('select * from orders order by ts desc limit 8'),
    po: A('select * from po order by rowid desc'),
    locs: A('select * from locations'),
    settings: A('select * from settings'),
    ok: ing.every(i => Math.abs((sums.find(x => x.ing_id == i.id) || { t: 0 }).t - i.stock) < .01)
  });
});

app.post('/api/settings', tx('users', ({ key, value }) => {
  R('insert or replace into settings values(?,?)', key, value);
  return { ok: 1 };
}));

app.post('/api/sale', tx('sale', ({ key, items }) => {
  if (!key || !Array.isArray(items) || !items.length) throw bad('Invalid sale');
  const d = G('select result from idem where key=?', key);
  if (d) return { ...JSON.parse(d.result), duplicate: true };
  const need = {};
  let total = 0, lines = [];
  for (const { id, q } of items) {
    const r = G('select * from recipes where id=?', id);
    if (!r || !(q > 0)) throw bad('Invalid item');
    total += r.price * q;
    lines.push(q + '× ' + r.name);
    for (const it of A('select * from recipe_items where recipe_id=?', id)) need[it.ing_id] = (need[it.ing_id] || 0) + it.qty * q;
  }
  const oid = 'ORD-' + String(G('select count(*) c from orders').c + 1).padStart(4, '0');
  for (const i in need) take(i, need[i], 'SALE', oid);
  R('insert into orders values(?,?,?,?)', oid, Date.now(), total, lines.join(', '));
  const out = { id: oid, total };
  R('insert into idem values(?,?)', key, JSON.stringify(out));
  return out;
}));

app.post('/api/stock', tx('stock', ({ ing, type, qty, exp, batch, loc }) => {
  const g = G('select * from ingredients where id=?', ing); qty = Number(qty);
  if (!g || !(qty >= 0)) throw bad('Invalid request');
  if (type == 'RECEIVE') { chkExp(exp); receive(ing, qty, exp, 'Goods received') }
  else if (type == 'WASTE') take(ing, qty, 'WASTE', 'Waste', batch || null);
  else if (type == 'COUNT') {
    const d = Math.round((qty - g.stock) * 1000) / 1000;
    if (d > 0) receive(ing, d, null, 'Count variance +' + d, 'COUNT_ADJ');
    else if (d < 0) take(ing, -d, 'COUNT_ADJ', 'Count variance ' + d, null, true);
  }
  else if (type == 'MOVE' && loc) { R('update ingredients set loc=? where id=?', loc, ing); audit(cur, 'MOVE', { ing, loc }) }
  else throw bad('Bad type');
  return { ok: 1 };
}));

app.post('/api/po', tx('po', ({ sup, ing, qty, up }) => {
  qty = Number(qty); up = Number(up);
  if (!sup || !G('select 1 x from ingredients where id=?', ing) || !(qty > 0) || !(up >= 0)) throw bad('Invalid PO');
  const id = 'PO-' + String(G('select count(*) c from po').c + 1).padStart(3, '0');
  R('insert into po values(?,?,?,?,?,null,?)', id, sup, ing, qty, up, 'ORDERED');
  return { id };
}));

app.post('/api/po/:id/receive', tx('po_receive', ({ acc, exp }, { id }) => {
  const p = G('select * from po where id=?', id); acc = Number(acc);
  if (!p || p.status != 'ORDERED') throw bad('PO not receivable', 409);
  if (!(acc >= 0) || acc > p.qty) throw bad('Accepted must be 0..ordered');
  if (acc > 0) { chkExp(exp); receive(p.ing_id, acc, exp, id + ' GRN') }
  R("update po set acc=?,status='RECEIVED' where id=?", acc, id);
  return { ok: 1 };
}));

app.post('/api/po/:id/pay', tx('po_pay', (b, { id }) => {
  const p = G('select * from po where id=?', id);
  if (!p || p.status != 'RECEIVED') throw bad('PO not payable', 409);
  R("update po set status='PAID' where id=?", id);
  return { ok: 1 };
}));

app.get('/api/qr/ingredient/:id', (req, res) => {
  if (!guard(req, 'view')) return res.status(401).json({ error: 'Login' });
  let row = G('select code from qr_codes where kind=? and ref=? and active=1', ['ING', req.params.id]);
  if (!row) { const code = newQR('ING', req.params.id); row = { code } }
  res.json({ code: 'RIQ:ING:' + row.code });
});

app.get('/api/qr/lookup/:code', (req, res) => {
  if (!guard(req, 'view')) return res.status(401).json({ error: 'Login' });
  const payload = req.params.code.replace(/^RIQ:/, '');
  const [kind, code] = payload.split(':');
  const row = G('select * from qr_codes where code=? and active=1', code);
  if (!row) return res.status(404).json({ error: 'Unknown or revoked QR code' });
  if (row.kind === 'ING') return res.json({ kind: 'ingredient', item: G('select * from ingredients where id=?', row.ref) });
  if (row.kind === 'LOT') return res.json({ kind: 'batch', batch: G('select * from batches where code=?', row.ref) });
  res.status(400).json({ error: 'Unsupported QR kind' });
});

app.get('/api/reports/consumption', (req, res) => {
  if (!guard(req, 'report')) return res.status(403).json({ error: 'Forbidden' });
  const days = Math.min(Number(req.query.days) || 7, 90);
  const since = Date.now() - days * 864e5;
  const rows = A(`select ing_id, sum(case when type='SALE' then -qty else 0 end) sold,
                       sum(case when type='WASTE' then -qty else 0 end) wasted
                from ledger where ts>=? group by ing_id`, since);
  res.json({ days, rows, ing: A('select id,name,unit,cost,img from ingredients') });
});

app.get('/api/reports/margins', (req, res) => {
  if (!guard(req, 'report')) return res.status(403).json({ error: 'Forbidden' });
  const out = A('select * from recipes').map(r => {
    const items = A('select ri.ing_id,ri.qty,i.cost,i.name,i.unit from recipe_items ri join ingredients i on i.id=ri.ing_id where ri.recipe_id=?', r.id);
    const cost = items.reduce((a, x) => a + x.qty * x.cost, 0);
    return { ...r, items, cost, margin: r.price - cost, foodcost: cost / r.price * 100 };
  });
  res.json(out);
});

const fails = {};
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}, k = String(username || ''), f = fails[k] || { n: 0, t: 0 };
  if (f.n >= 5 && Date.now() - f.t < 60000) return res.status(429).json({ error: 'Too many attempts — wait a minute' });
  const u = G('select * from users where username=? and active=1', k);
  if (!u || !verify(String(password || ''), u.pass)) {
    fails[k] = { n: f.n + 1, t: Date.now() };
    audit(k, 'LOGIN_FAILED', {});
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  delete fails[k];
  const tok = crypto.randomBytes(32).toString('hex');
  R('insert into sessions values(?,?,?)', sha(tok), u.id, Date.now() + 12 * 3600e3);
  res.setHeader('Set-Cookie', 'sid=' + tok + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200');
  audit(u.username, 'LOGIN', {});
  res.json({ ok: 1 });
});
app.post('/api/logout', (req, res) => { if (req.tok) R('delete from sessions where token=?', req.tok); res.setHeader('Set-Cookie', 'sid=; Max-Age=0; Path=/'); res.json({ ok: 1 }) });
app.get('/api/me', (req, res) => req.user ? res.json({ username: req.user.username, name: req.user.name, role: req.user.role, perms: P[req.user.role] }) : res.status(401).json({ error: 'Login required' }));
app.get('/api/audit', (req, res) => guard(req, 'audit') ? res.json(A('select * from audit order by id desc limit 200')) : res.status(req.user ? 403 : 401).json({ error: 'Forbidden' }));
app.get('/api/users', (req, res) => guard(req, 'users') ? res.json(A('select id,username,name,role,active from users')) : res.status(req.user ? 403 : 401).json({ error: 'Forbidden' }));
app.post('/api/users', (req, res) => {
  if (!guard(req, 'users')) return res.status(req.user ? 403 : 401).json({ error: 'Forbidden' });
  const { username, name, role, password } = req.body || {};
  if (!/^[a-z0-9_.-]{3,30}$/.test(username || '') || !P[role] || String(password || '').length < 8)
    return res.status(400).json({ error: 'Username 3-30 lowercase chars, valid role, password 8+ chars' });
  try { R('insert into users(username,name,role,pass) values(?,?,?,?)', username, String(name || username), role, hash(password)) }
  catch (e) { return res.status(409).json({ error: 'Username already exists' }) }
  audit(req.user.username, 'USER_CREATED', { username, role });
  res.json({ ok: 1 });
});

require('./reports-api')(app, { A, guard });
module.exports = { app, db };
const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, '0.0.0.0', () => console.log('CafePilot running → http://0.0.0.0:' + PORT));