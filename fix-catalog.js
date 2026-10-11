// One-time cleanup: removes duplicate/wrong items, fixes names + images, adds missing opening stock.
// Stop the server first, then run:  node fix-catalog.js
const Database = require('better-sqlite3'), path = require('path'), fs = require('fs');
const file = process.env.DB_FILE || path.join(__dirname, 'data.db');
if (!fs.existsSync(file)) { console.log('data.db not found at ' + file); process.exit(1); }
const db = new Database(file);
const A = (s, ...a) => db.prepare(s).all(...a), G = (s, ...a) => db.prepare(s).get(...a), R = (s, ...a) => db.prepare(s).run(...a);
const log = [];
const KEEP = [ // id, name, unit, min, cost, image, opening stock if the item has no stock history
  ['coffee', 'Coffee powder', 'g', 300, 6, '/assets/Ceramic_bowl_with_coffee_powder.jpg', 2000],
  ['beans', 'Coffee beans', 'g', 200, 4.5, '/assets/Three_coffee_beans_floating.jpg', 1000],
  ['sugar', 'Sugar', 'g', 500, 0.25, '/assets/Ceramic_bowl_filled_with_sugar.jpg', 5000],
  ['milk', 'Milk', 'ml', 1500, 0.3, '/assets/Glass_milk_jug_filled_with.jpg', 10000],
  ['syrup', 'Chocolate syrup', 'ml', 200, 1.2, '/assets/Glass_bottle_pouring_chocolate.jpg', 1000],
  ['cup', 'Paper cups', 'pcs', 50, 12, '/assets/Three_white_coffee_cups.jpg', 500],
  ['cup2', 'Ceramic cups', 'pcs', 20, 50, '/assets/Three_coffee_cups_displayed.jpg', 60]];
const RECIMG = { r1: '/assets/a-freshly-prepared-classic-milk-coffee-served-in-a.png', r2: '/assets/a-freshly-brewed-black-americano-in-a-simple-trans.png', r3: '/assets/a-beautifully-prepared-latte-in-a-clear-tall-glass.png', r4: '/assets/a-rich-chocolate-mocha-served-in-a-white-ceramic-m.png' };
db.transaction(() => {
  for (const id of ['r5', 'r6', 'r7', 'r8', 'r9']) {
    const r = G('select * from recipes where id=?', id); if (!r) continue;
    if (G('select 1 x from orders where lines like ?', '%' + r.name + '%')) { log.push('KEPT recipe "' + r.name + '" (already sold)'); continue; }
    R('delete from recipe_items where recipe_id=?', id); R('delete from recipes where id=?', id); log.push('Removed recipe "' + r.name + '" (wrong image / duplicate)');
  }
  for (const id of ['chocolate', 'sugar_cubes', 'milk_carton', 'ceramic_cup', 'ing_container', 'ingredient_container']) {
    const i = G('select * from ingredients where id=?', id); if (!i) continue;
    if (G('select 1 x from ledger where ing_id=?', id) || G('select 1 x from recipe_items where ing_id=?', id) || G('select 1 x from po where ing_id=?', id)) { log.push('KEPT "' + i.name + '" (it has history or is used by a recipe)'); continue; }
    R('delete from batches where ing_id=?', id); R("delete from qr_codes where kind='ING' and ref=?", id); R('delete from ingredients where id=?', id); log.push('Removed duplicate item "' + i.name + '"');
  }
  for (const [id, name, unit, min, cost, img, open] of KEEP) {
    if (!G('select 1 x from ingredients where id=?', id)) { R('insert into ingredients(id,name,unit,min,cost,img) values(?,?,?,?,?,?)', id, name, unit, min, cost, img); log.push('Added "' + name + '"'); }
    else R('update ingredients set name=?,unit=?,img=? where id=?', name, unit, img, id);
    if (!G('select 1 x from ledger where ing_id=?', id)) {
      let code = 'OPEN-' + id; if (G('select 1 x from batches where code=?', code)) code += '-' + Date.now();
      R('insert into batches(code,ing_id,qty,exp,recv,ref) values(?,?,?,?,?,?)', code, id, open, null, Date.now(), 'Opening balance');
      R('update ingredients set stock=round(stock+?,3) where id=?', open, id);
      R('insert into ledger(ts,ing_id,qty,type,ref,actor,batch,bal) values(?,?,?,?,?,?,?,?)', Date.now(), id, open, 'OPENING', 'Opening balance', 'system', code, G('select stock from ingredients where id=?', id).stock);
      log.push('Opening stock for "' + name + '": ' + open + ' ' + unit);
    }
  }
  for (const [id, img] of Object.entries(RECIMG)) R('update recipes set img=? where id=?', img, id);
})();
console.log(log.join('\n') || 'Nothing to change.');
console.log('\nItems now: ' + A('select name,stock,unit from ingredients').map(i => i.name + ' (' + i.stock + ' ' + i.unit + ')').join(', '));
console.log('Recipes now: ' + A('select name from recipes').map(r => r.name).join(', '));
db.close();
