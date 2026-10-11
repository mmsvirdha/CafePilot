/* CafePilot add-on: professional reports + large QR labels. Load AFTER the main script. */
(function () {
  const st = document.createElement('style');
  st.id = 'rcss';
  st.textContent = `
#pdoc{position:fixed;left:0;top:0;width:210mm;min-height:297mm;padding:12mm;background:#fff;color:#222;font:10pt 'Segoe UI',Arial,sans-serif;z-index:-1;opacity:0;pointer-events:none;overflow:hidden}
body.printing #pdoc{opacity:1;z-index:99999;pointer-events:auto;overflow:visible}
@media print{
  body{background:#fff!important;color:#000!important;margin:0!important;padding:0!important}
  body>*:not(#pdoc){display:none!important}
  body::before,body::after{display:none!important}
  #pdoc{position:static!important;width:auto!important;min-height:0!important;padding:0!important;margin:0!important;opacity:1!important;z-index:auto!important;overflow:visible!important}
}
.rp,.lb,.sh{font:10pt 'Segoe UI',Arial,sans-serif;color:#222;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rp *{box-sizing:border-box}
.rp .wm{position:fixed;left:0;right:0;top:32%;text-align:center;opacity:.06;transform:rotate(-22deg);pointer-events:none;z-index:-1}
.rp .wm img{height:80mm;display:block;margin:0 auto}
.rp .wm b{display:block;font-size:44pt;color:#b5651d}
.rp .rh{text-align:center;margin-bottom:6mm}
.rp .lg{height:30mm;max-width:70mm;object-fit:contain;display:block;margin:0 auto 3mm}
.rp .cn{font-size:25pt;font-weight:800;color:#b5651d;letter-spacing:-.5px}
.rp .cd{color:#666;font-size:9pt;margin-top:1mm}
.rp .rule{height:3px;background:linear-gradient(90deg,#d9803f,#f0b35f,#d9803f);margin:4mm 0}
.rp .rt{font-size:16pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.rp .rs{color:#777;font-size:9pt;margin-top:1mm}
.rp .meta{width:100%;margin:4mm 0;border-collapse:collapse;font-size:9pt}
.rp .meta td{padding:1.6mm 3mm;border:1px solid #efe2cd}
.rp .meta td:nth-child(odd){background:#fbf3e6;color:#8a5a2b;font-weight:600;width:16%}
.rp .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:4mm 0}
.rp .kp div{border:1px solid #e7d3b8;border-left:3px solid #d9803f;background:#fff9f0;padding:2.5mm 3mm;border-radius:1.5mm}
.rp .kp small{display:block;color:#8a5a2b;font-size:7.5pt;text-transform:uppercase;letter-spacing:.08em}
.rp .kp b{font-size:12.5pt}
.rp h4{margin:6mm 0 2mm;font-size:11pt;color:#b5651d;border-bottom:1.5px solid #f0d9b8;padding-bottom:1mm}
.rp .dt{width:100%;border-collapse:collapse;font-size:8.8pt;margin-top:2mm}
.rp .dt th{background:#d9803f;color:#fff;padding:2mm;text-align:left;font-weight:600}
.rp .dt td{padding:1.8mm 2mm;border-bottom:1px solid #eee;vertical-align:middle}
.rp .dt tbody tr:nth-child(even) td{background:#fcf6ee}
.rp thead{display:table-header-group}
.rp tr{break-inside:avoid}
.rp .dt tfoot td{background:#f6e6cc;font-weight:700;border-top:2px solid #d9803f}
.rp .dt img{width:8mm;height:8mm;object-fit:cover;border-radius:1.5mm;vertical-align:middle;margin-right:2mm}
.rp .r{text-align:right}
.rp .neg{color:#c0392b;font-weight:600}
.rp .pos{color:#1e8449;font-weight:600}
.rp .nt{margin:5mm 0 0;padding-left:5mm;font-size:9pt;color:#555}
.rp .nt li{margin:1mm 0}
.rp .sig{display:grid;grid-template-columns:repeat(3,1fr);gap:10mm;margin-top:16mm;break-inside:avoid}
.rp .sig div{border-top:1px solid #444;padding-top:1.5mm;font-size:8.5pt;color:#555;text-align:center}
.rp .rf{margin-top:8mm;text-align:center;font-size:7.5pt;color:#888;border-top:1px solid #ddd;padding-top:1.5mm}
.lb{text-align:center;width:100%;padding:4mm}
.lb .lh{display:flex;align-items:center;justify-content:center;gap:3mm;border-bottom:1px solid #eee;padding-bottom:3mm}
.lb .lh img{height:14mm;border-radius:3mm}
.lb .lh b{font-size:17pt;color:#b5651d}
.lb .li{display:flex;gap:4mm;text-align:left;margin:4mm 0;align-items:center}
.lb .li img{width:28mm;height:28mm;object-fit:cover;border-radius:3mm;border:1px solid #eee}
.lb .li h5{margin:0 0 1mm;font-size:15pt}
.lb .li p{margin:.6mm 0;font-size:10pt;color:#444}
.lb .qr{width:60mm;height:60mm;display:block;margin:2mm auto}
.lb .cc{font:bold 11pt Consolas,monospace;margin:1mm 0 3mm}
.lb .lf{font-size:8pt;color:#777;border-top:1px solid #eee;padding-top:2mm;line-height:1.5}
.sh{display:grid;grid-template-columns:1fr 1fr;gap:4mm;padding:4mm}
.sh .sl{display:flex;gap:3mm;align-items:center;border:1px dashed #bbb;padding:3mm;height:66mm;text-align:left}
.sh .sl .qr{width:34mm;height:34mm;flex-shrink:0}
.sh .sl b{font-size:12pt}
.sh .sl p{margin:.6mm 0;font-size:8.5pt}
.sh .sl small{color:#888;font-size:7pt}
`;
  document.head.appendChild(st);

  const E = s => esc(s);
  const m2 = n => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dt = t => new Date(t).toLocaleString();
  const co = () => {
    const o = Object.fromEntries((D.settings || []).map(s => [s.key, s.value]));
    o.company_name = o.company_name || 'CafePilot';
    return o;
  };
  const ING = id => (D.ing || []).find(i => i.id == id) || { name: String(id), unit: '', cost: 0, stock: 0, min: 0 };
  const ph = i => (i && i.img) ? `<img src="${E(i.img)}" alt="">` : '';
  const ex = () => D.batches.filter(b => b.exp && b.exp <= d7());
  const stat = i => i.stock <= i.min ? '<span class="neg">LOW</span>' : '<span class="pos">OK</span>';
  const tv = () => D.ing.reduce((a, i) => a + i.stock * i.cost, 0);

  const stockSec = () => ({
    h: 'Stock on hand',
    cols: [['Item'], ['Unit'], ['On hand', 'r'], ['Minimum', 'r'], ['Status'], ['Unit cost', 'r'], ['Value (LKR)', 'r']],
    rows: D.ing.map(i => [ph(i) + '<b>' + E(i.name) + '</b>', E(i.unit), f(i.stock), f(i.min), stat(i), m2(i.cost), m2(i.stock * i.cost)]),
    foot: ['Total', '', '', '', '', '', m2(tv())]
  });
  const ledRow = l => [dt(l.ts), ph(ING(l.ing_id)) + E(ING(l.ing_id).name), E(l.type),
    '<span class="' + (l.qty < 0 ? 'neg' : 'pos') + '">' + (l.qty > 0 ? '+' : '') + f(l.qty) + '</span>',
    f(l.bal), E(l.ref || '') + (l.batch ? ' [' + E(l.batch) + ']' : ''), E(l.actor || '')];
  const ledCols = [['Time'], ['Item'], ['Type'], ['Qty', 'r'], ['Balance', 'r'], ['Reference'], ['User']];

  const B = {
    stock() {
      const low = D.ing.filter(i => i.stock <= i.min);
      return {
        title: 'Inventory Stock Report', sub: 'Current stock position, valuation and reorder status',
        kpi: [['Items', D.ing.length], ['Stock value', 'LKR ' + m2(tv())], ['Low stock', low.length], ['Expiring ≤ 7 days', ex().length]],
        secs: [stockSec()],
        notes: [low.length ? 'Items at or below minimum: <b>' + low.map(i => E(i.name)).join(', ') + '</b>. Reorder recommended.' : 'All items are above their minimum level.', 'Quantities are shown in base units. Valuation uses the current unit cost.']
      };
    },
    dash(F) {
      const low = D.ing.filter(i => i.stock <= i.min);
      const O = F ? F.orders : D.ord;
      const td = O.filter(o => new Date(o.ts).toDateString() == new Date().toDateString());
      const unp = D.po.filter(p => p.status == 'RECEIVED').reduce((a, p) => a + p.acc * p.up, 0);
      return {
        title: 'Business Summary Report', sub: 'Stock, sales and operations at a glance',
        kpi: [['Stock value', 'LKR ' + m2(tv())], ['Sales today', 'LKR ' + m2(td.reduce((a, o) => a + o.total, 0))], ['Low stock', low.length], ['Unpaid invoices', 'LKR ' + m2(unp)]],
        secs: [stockSec(), { h: 'Menu readiness', cols: [['Recipe'], ['Price (LKR)', 'r'], ['Servings available', 'r']], rows: D.rec.map(r => [ph(r) + E(r.name), m2(r.price), sv(r)]) }, { h: 'Recent stock movements', cols: ledCols, rows: (F ? F.led : D.led).slice(0, 12).map(ledRow) }],
        notes: [(low.length ? low.length + ' item(s) need reordering. ' : 'No items need reordering. ') + (ex().length ? ex().length + ' lot(s) expire within 7 days.' : 'No lots expire within 7 days.'), 'Ledger integrity: ' + (D.ok && D.bok ? '<b class="pos">balanced</b> (stock = ledger = lots).' : '<b class="neg">mismatch, investigate</b>.')]
      };
    },
    pos(F) {
      const o = F ? F.orders : D.ord;
      const t = o.reduce((a, x) => a + x.total, 0);
      const n = o.reduce((a, x) => a + (x.lines.match(/\d+(?=×)/g) || []).reduce((s, v) => s + Number(v), 0), 0);
      return {
        title: 'Sales Report', sub: F ? 'All recorded orders' : 'Latest orders',
        kpi: [['Orders', o.length], ['Total sales', 'LKR ' + m2(t)], ['Average order', 'LKR ' + m2(o.length ? t / o.length : 0)], ['Items sold', n]],
        secs: [{ h: 'Orders', cols: [['Order'], ['Date & time'], ['Items'], ['Total (LKR)', 'r']], rows: o.map(x => [E(x.id), dt(x.ts), E(x.lines), m2(x.total)]), foot: ['Total', '', '', m2(t)] }],
        notes: ['Ingredient deductions for each order are recorded in the stock ledger under the same order number.']
      };
    },
    bat(F) {
      const b = F ? F.batches : D.batches;
      const dl = e => e ? Math.ceil((new Date(e) - new Date(D.today)) / 864e5) : '—';
      return {
        title: 'Batch & Expiry Report', sub: 'Lots on hand, earliest expiry first',
        kpi: [['Lots', b.length], ['Expired', b.filter(x => x.exp && x.exp < D.today).length], ['Expiring ≤ 7 days', b.filter(x => x.exp && x.exp >= D.today && x.exp <= d7()).length], ['No expiry set', b.filter(x => !x.exp).length]],
        secs: [{ cols: [['Lot'], ['Item'], ['Qty', 'r'], ['Received'], ['Expiry'], ['Days left', 'r'], ['Status']], rows: b.map(x => [E(x.code), ph(ING(x.ing_id)) + E(x.name), f(x.qty) + ' ' + E(ING(x.ing_id).unit), x.recv ? new Date(x.recv).toLocaleDateString() : '—', E(x.exp || '—'), dl(x.exp), !x.exp ? 'No expiry' : x.exp < D.today ? '<span class="neg">EXPIRED</span>' : x.exp <= d7() ? '<span class="neg">Expiring soon</span>' : '<span class="pos">OK</span>']) }],
        notes: ['Sales use the earliest-expiring lot first (FEFO). Expired lots are never sold; dispose of them and record the waste.']
      };
    },
    buy(F) {
      const p = F ? F.po : D.po;
      const v = x => (x.acc == null ? x.qty : x.acc) * x.up;
      const sm = s => p.filter(x => x.status == s).reduce((a, x) => a + v(x), 0);
      return {
        title: 'Purchase Order Report', sub: 'Orders, receipts and supplier balances',
        kpi: [['Purchase orders', p.length], ['Order value', 'LKR ' + m2(p.reduce((a, x) => a + v(x), 0))], ['Awaiting payment', 'LKR ' + m2(sm('RECEIVED'))], ['Paid', 'LKR ' + m2(sm('PAID'))]],
        secs: [{ cols: [['PO'], ['Supplier'], ['Item'], ['Ordered', 'r'], ['Accepted', 'r'], ['Unit price', 'r'], ['Value (LKR)', 'r'], ['Status']], rows: p.map(x => [E(x.id), E(x.sup), ph(ING(x.ing_id)) + E(ING(x.ing_id).name), f(x.qty), x.acc == null ? '—' : f(x.acc), m2(x.up), m2(v(x)), E(x.status)]) }],
        notes: ['Receiving stock and paying the supplier are separate steps. Paying an invoice never changes stock.']
      };
    },
    rec() {
      const R1 = D.rec.map(r => ({ r, c: cost(r) }));
      const n = R1.length || 1;
      return {
        title: 'Recipe Costing Report', sub: 'Ingredient cost, selling price and margin per serving',
        kpi: [['Recipes', R1.length], ['Average food cost', f(R1.reduce((a, x) => a + x.c / x.r.price * 100, 0) / n) + '%'], ['Best margin', R1.length ? E([...R1].sort((a, b) => (b.r.price - b.c) - (a.r.price - a.c))[0].r.name) : '—'], ['Average margin', 'LKR ' + m2(R1.reduce((a, x) => a + x.r.price - x.c, 0) / n)]],
        secs: [{ cols: [['Recipe'], ['Ingredients (per serving)'], ['Cost', 'r'], ['Price', 'r'], ['Margin', 'r'], ['Food cost', 'r']], rows: R1.map(({ r, c }) => [ph(r) + '<b>' + E(r.name) + '</b>', r.items.map(i => E(ING(i.ing_id).name) + ' ' + i.qty + ' ' + E(ING(i.ing_id).unit)).join(', '), m2(c), m2(r.price), '<span class="pos">' + m2(r.price - c) + '</span>', (c / r.price * 100 > 40 ? '<span class="neg">' : '<span>') + f(c / r.price * 100) + '%</span>']) }],
        notes: ['Food cost above 40% is highlighted. Costs use the current ingredient unit costs.']
      };
    },
    rep(F) {
      const L = F ? F.led : D.led;
      const sum = (t, id) => -L.filter(l => l.type == t && l.ing_id == id).reduce((a, l) => a + l.qty, 0);
      const rows = D.ing.map(i => ({ i, s: sum('SALE', i.id), w: sum('WASTE', i.id) }));
      const ts = rows.reduce((a, x) => a + x.s * x.i.cost, 0);
      const tw = rows.reduce((a, x) => a + x.w * x.i.cost, 0);
      return {
        title: 'Consumption & Waste Report', sub: F ? 'Based on up to the latest 2,000 stock movements' : 'Based on the latest 100 stock movements',
        kpi: [['Cost of goods sold', 'LKR ' + m2(ts)], ['Waste cost', 'LKR ' + m2(tw)], ['Waste ratio', f(ts + tw ? tw / (ts + tw) * 100 : 0) + '%'], ['Ingredients', D.ing.length]],
        secs: [{ cols: [['Item'], ['Sold (recipes)', 'r'], ['Wasted', 'r'], ['Cost sold (LKR)', 'r'], ['Waste cost (LKR)', 'r']], rows: rows.map(x => [ph(x.i) + E(x.i.name), f(x.s) + ' ' + E(x.i.unit), x.w ? '<span class="neg">' + f(x.w) + ' ' + E(x.i.unit) + '</span>' : '0', m2(x.s * x.i.cost), m2(x.w * x.i.cost)]), foot: ['Total', '', '', m2(ts), m2(tw)] }]
      };
    },
    led(F) {
      const fl = typeof lf == 'undefined' ? 'all' : lf;
      const L = (F ? F.led : D.led).filter(l => fl == 'all' || l.type == fl);
      const c = t => L.filter(l => l.type == t).length;
      return {
        title: 'Stock Movement Ledger', sub: 'Append-only record of every stock change' + (fl != 'all' ? ' (filter: ' + fl + ')' : ''),
        kpi: [['Entries', L.length], ['Receipts', c('RECEIVE')], ['Sales deductions', c('SALE')], ['Waste entries', c('WASTE')]],
        secs: [{ cols: ledCols, rows: L.map(ledRow) }]
      };
    },
    audit() {
      const a = D.audit || [];
      const c = t => a.filter(x => x.action == t).length;
      return {
        title: 'Audit Trail Report', sub: 'Security and activity log',
        kpi: [['Entries', a.length], ['Logins', c('LOGIN')], ['Denied actions', c('DENIED')], ['Failed logins', c('LOGIN_FAILED')]],
        secs: [{ cols: [['Time'], ['User'], ['Action'], ['Detail']], rows: a.map(x => [dt(x.ts), E(x.actor), E(x.action), '<span style="font-size:8pt">' + E(x.detail) + '</span>']) }]
      };
    },
    users() {
      const u = D.users || [];
      return {
        title: 'Staff Directory', sub: 'Accounts and roles',
        kpi: [['Accounts', u.length], ['Owners', u.filter(x => x.role == 'owner').length], ['Active', u.filter(x => x.active).length], ['Roles', new Set(u.map(x => x.role)).size]],
        secs: [{ cols: [['Name'], ['Username'], ['Role'], ['Status']], rows: u.map(x => [E(x.name), E(x.username), E(x.role), x.active ? 'Active' : 'Disabled']) }]
      };
    }
  };

  function repDoc(Q) {
    const c = co();
    const n = new Date();
    const p = x => String(x).padStart(2, '0');
    const no = 'RPT-' + n.getFullYear() + p(n.getMonth() + 1) + p(n.getDate()) + '-' + p(n.getHours()) + p(n.getMinutes()) + p(n.getSeconds());
    const ad = [c.company_address, c.company_phone, c.company_email].filter(Boolean).map(E).join(' &nbsp;·&nbsp; ');
    const lg = c.company_logo;
    return `<div class="rp">
<div class="wm">${lg ? `<img src="${E(lg)}" alt="">` : ''}<b>${E(c.company_name)}</b></div>
<div class="rh">
  ${lg ? `<img class="lg" src="${E(lg)}" alt="">` : ''}
  <div class="cn">${E(c.company_name)}</div>
  <div class="cd">${ad}</div>
  <div class="rule"></div>
  <div class="rt">${E(Q.title)}</div>
  <div class="rs">${E(Q.sub || '')}</div>
</div>
<table class="meta">
  <tr><td>Report no.</td><td>${no}</td><td>Generated</td><td>${n.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${n.toLocaleTimeString()}</td></tr>
  <tr><td>Prepared by</td><td>${E(ME.name)} (${E(ME.role)})</td><td>Business date</td><td>${E(D.today)}</td></tr>
</table>
${Q.kpi ? `<div class="kp">${Q.kpi.map(k => `<div><small>${E(k[0])}</small><b>${k[1]}</b></div>`).join('')}</div>` : ''}
${Q.secs.map(s => `${s.h ? `<h4>${E(s.h)}</h4>` : ''}<table class="dt"><thead><tr>${s.cols.map(c => `<th class="${c[1] || ''}">${E(c[0])}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map((v, i) => `<td class="${s.cols[i][1] || ''}">${v}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${s.cols.length}" style="text-align:center;color:#888">No records</td></tr>`}</tbody>${s.foot ? `<tfoot><tr>${s.foot.map((v, i) => `<td class="${s.cols[i][1] || ''}">${v}</td>`).join('')}</tr></tfoot>` : ''}</table>`).join('')}
${Q.notes && Q.notes.length ? `<ul class="nt">${Q.notes.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
<div class="sig"><div>Prepared by<br><b>${E(ME.name)}</b></div><div>Checked by</div><div>Approved by</div></div>
<div class="rf">${E(c.company_name)} · ${ad} · Confidential, for internal use only · ${no}</div>
</div>`;
  }

  function printDoc(html, pg) {
    document.querySelectorAll('#pdoc, #pgs').forEach(e => e.remove());

    const s = document.createElement('style');
    s.id = 'pgs';
    s.textContent = '@page{size:' + pg.size + ';margin:' + pg.margin + ';' +
      (pg.num ? '@bottom-right{content:"Page " counter(page) " of " counter(pages);font:8pt Segoe UI,Arial;color:#888}' : '') + '}';
    document.head.appendChild(s);

    const d = document.createElement('div');
    d.id = 'pdoc';
    d.innerHTML = html;
    document.body.appendChild(d);

    // Give browser a moment to lay out before print class is added
    void d.offsetHeight;

    const done = () => {
      document.body.classList.remove('printing');
      const el = document.getElementById('pdoc');
      if (el) el.remove();
      const st = document.getElementById('pgs');
      if (st) st.remove();
      removeEventListener('afterprint', done);
    };
    addEventListener('afterprint', done);

    const imgs = [...d.querySelectorAll('img')].filter(i => !i.complete)
      .map(i => new Promise(r => { i.onload = i.onerror = r; }));

    Promise.race([Promise.all(imgs), new Promise(r => setTimeout(r, 1500))]).then(() => {
      document.body.classList.add('printing');
      setTimeout(() => {
        try { window.__nativePrint(); } catch (e) { console.error(e); }
      }, 300);
    });
  }

  window.__nativePrint = window.print.bind(window);

  async function makeReport() {
    const k = ({ scan: 'stock' })[tab] || tab;
    const b = B[k] || B.stock;
    toast('Preparing report…');
    let F = null;
    try { F = await api('reports/full'); } catch (e) { }
    printDoc(repDoc(b(F)), { size: 'A4', margin: '12mm 12mm 20mm', num: 1 });
  }

  window.print = function () {
    if (document.body.classList.contains('printing') || typeof D == 'undefined' || !D || !ME) return window.__nativePrint();
    makeReport();
  };

  /* ---------- QR labels ---------- */
  function qrURL(t) {
    const d = document.createElement('div');
    try { new QRCode(d, { text: t, width: 512, height: 512, correctLevel: QRCode.CorrectLevel.M }); } catch (e) { return ''; }
    const c = d.querySelector('canvas');
    return c ? c.toDataURL('image/png') : ((d.querySelector('img') || {}).src || '');
  }

  function lbInfo(code) {
    let it = null, kind = 'ing';
    if (code.startsWith('RIQ:ING:')) it = ING(code.slice(8));
    else if (code.startsWith('RIQ:LOT:')) { it = D.batches.find(x => x.code == code.slice(8)); kind = 'lot'; }
    if (!it) return null;
    const base = kind == 'lot' ? ING(it.ing_id) : it;
    return { it, kind, base, unit: base.unit, qty: kind == 'lot' ? it.qty : it.stock, img: base.img, name: it.name || base.name };
  }

  const lbL = (L, code, qr, c) => `<div class="lb">
<div class="lh">${c.company_logo ? `<img src="${E(c.company_logo)}" alt="">` : ''}<b>${E(c.company_name)}</b></div>
<div class="li">
  ${L.img ? `<img src="${E(L.img)}" alt="">` : ''}
  <div>
    <h5>${E(L.name)}</h5>
    ${L.kind == 'lot' ? `<p><b>Lot:</b> ${E(L.it.code)}</p>` : ''}
    <p><b>Unit:</b> ${E(L.unit)}</p>
    <p><b>${L.kind == 'lot' ? 'Lot qty' : 'In stock'}:</b> ${f(L.qty)} ${E(L.unit)}</p>
    ${L.it.exp ? `<p><b>Expiry:</b> ${E(L.it.exp)}</p>` : ''}
  </div>
</div>
<img class="qr" src="${qr}" alt="QR">
<div class="cc">${E(code)}</div>
<div class="lf">${[c.company_address, c.company_phone, c.company_email].filter(Boolean).map(E).join(' · ')}<br>Printed ${new Date().toLocaleString()}</div>
</div>`;

  const lbS = (L, code, qr, c) => `<div class="sl">
<img class="qr" src="${qr}" alt="QR">
<div>
  <b>${E(L.name)}</b>
  ${L.kind == 'lot' ? `<p>Lot ${E(L.it.code)}</p>` : ''}
  <p>${f(L.qty)} ${E(L.unit)}${L.it.exp ? ' · Exp ' + E(L.it.exp) : ''}</p>
  <p style="font:7.5pt Consolas,monospace">${E(code)}</p>
  <small>${E(c.company_name)}</small>
</div>
</div>`;

  // Download label as PNG (canvas capture of the label HTML)
  async function downloadLabelAsImage(html, filename) {
    // Use SVG foreignObject trick to render HTML to canvas
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:-10000px;top:0;width:400px;background:#fff;padding:16px;font:10pt "Segoe UI",Arial,sans-serif;color:#222;';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    try {
      const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js');
      const canvas = await html2canvas(wrapper, { backgroundColor: '#ffffff', scale: 3 });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename;
      a.click();
    } catch (e) {
      // Fallback: open the label in a new window so user can right-click → Save image
      const w = window.open('', '', 'width=500,height=700');
      w.document.write(`<html><head><title>Label</title><style>body{font-family:'Segoe UI',sans-serif;padding:20px;color:#000;background:#fff;max-width:400px}.lb{text-align:center;padding:12px;background:#fff}.lh{display:flex;align-items:center;justify-content:center;gap:10px;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:12px}.lh img{height:40px;border-radius:8px}.lh b{font-size:20px;color:#d9803f}.li{display:flex;gap:16px;text-align:left;margin-bottom:12px}.li img{width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #eee}.li h5{margin:0 0 4px;font-size:16px}.li p{margin:2px 0;font-size:12px;color:#555}.qr{width:160px;height:160px;display:block;margin:12px auto}.cc{font-family:monospace;font-weight:bold;margin:6px 0}.lf{font-size:10px;color:#888;border-top:1px solid #eee;padding-top:8px;margin-top:12px;line-height:1.5}</style></head><body>${html}</body></html>`);
      w.document.close();
    } finally {
      wrapper.remove();
    }
  }

  window.qrx = function (name, code) {
    const L = lbInfo(code);
    if (!L) { toast('Item not found'); return; }
    const c = co();
    const qr = qrURL(code);
    const labelHtml = lbL(L, code, qr, c);

    const d = modal(`<h3>QR label · ${E(L.name)}</h3>
<div style="background:#fff;border-radius:12px;padding:12px;max-height:48vh;overflow:auto">
  <div style="width:100mm;max-width:100%;margin:auto">${labelHtml}</div>
</div>
<label class="sub" style="display:block;margin-top:12px">Print layout</label>
<select id="lsz">
  <option value="a6">Large label (A6, 100 × 148 mm)</option>
  <option value="sheet">Sticker sheet (A4, 8 labels per page)</option>
</select>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
  <button class="btn" id="lpr">🖨️ Print / Save as PDF</button>
  <button class="btn s" id="ldl">⬇️ Download label as image</button>
  <button class="btn s" onclick="this.closest('.md').remove()">Close</button>
</div>`);

    d.querySelector('#lpr').onclick = () => {
      if (d.querySelector('#lsz').value == 'a6') {
        printDoc(lbL(L, code, qr, c), { size: '100mm 148mm', margin: '6mm' });
      } else {
        printDoc('<div class="sh">' + Array(8).fill(lbS(L, code, qr, c)).join('') + '</div>', { size: 'A4', margin: '8mm' });
      }
    };

    d.querySelector('#ldl').onclick = () => {
      const fname = (L.name || 'label').replace(/[^\w-]/g, '_') + '_' + code.replace(/[^\w-]/g, '_') + '.png';
      downloadLabelAsImage(labelHtml, fname);
    };
  };

  /* ---------- extras ---------- */
  const ex2 = document.createElement('style');
  ex2.textContent = '.tw .col span{text-align:center;line-height:1.15;font-size:11px;max-width:74px;min-height:26px}';
  document.head.appendChild(ex2);

  function fixTw() {
    if (typeof D == 'undefined' || !D || !D.ing) return;
    document.querySelectorAll('.tw .col').forEach((c, i) => {
      const s = c.querySelector('span'), n = D.ing[i];
      if (s && n) s.textContent = n.name;
    });
  }
  if (typeof window.render == 'function') {
    const _r = window.render;
    window.render = function () {
      const x = _r.apply(this, arguments);
      try { fixTw(); } catch (e) { }
      return x;
    };
  }

  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() == 'p' &&
        typeof ME != 'undefined' && ME && typeof D != 'undefined' && D) {
      e.preventDefault();
      window.print();
    }
  });
})();