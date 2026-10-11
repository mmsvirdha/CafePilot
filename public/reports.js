/* CafePilot reports v6 — isolated print frame (fixes blank PDF), company letterhead, colourful reports, large QR labels. Load AFTER the main script. */
(function () {
  /* small UI-only css (modal preview) */
  const st = document.createElement('style');
  st.textContent = `.lbp{background:#fff;border-radius:12px;padding:10px;max-height:52vh;overflow:auto}
.lbp .pv{width:100mm;max-width:100%;margin:auto;transform-origin:top center}`;
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
    cols: [['Item'], ['Unit'], ['On hand', 'r'], ['Minimum', 'r'], ['Status'], ['Unit cost', 'r'], ['Value', 'r']],
    rows: D.ing.map(i => [ph(i) + '<b>' + E(i.name) + '</b>', E(i.unit), f(i.stock), f(i.min), stat(i), m2(i.cost), m2(i.stock * i.cost)]),
    foot: ['Total', '', '', '', '', '', m2(tv())]
  });
  const ledRow = l => [dt(l.ts), ph(ING(l.ing_id)) + E(ING(l.ing_id).name), E(l.type),
    '<span class="' + (l.qty < 0 ? 'neg' : 'pos') + '">' + (l.qty > 0 ? '+' : '') + f(l.qty) + '</span>',
    f(l.bal), E(l.ref || '') + (l.batch ? ' [' + E(l.batch) + ']' : ''), E(l.actor || '')];
  const ledCols = [['Time'], ['Item'], ['Type'], ['Qty', 'r'], ['Balance', 'r'], ['Reference'], ['User']];

  const stockChart = () => ({ h: 'Stock level vs minimum (%)', items: D.ing.map(i => ({ l: i.name, v: i.min ? i.stock / i.min * 100 : 100, t: f(i.stock) + ' ' + i.unit, lo: i.stock <= i.min })) });

  /* ---- dashboard-style charts for print ---- */
  const PALP = ['#e08a3c', '#2f8f6b', '#b9631f', '#3b82c4', '#d94f3f', '#8a4414', '#f0b35f', '#6b5a9e'];
  function chartsHTML() {
    const top = [...D.ing].map(i => ({ n: i.name, v: i.stock * i.cost })).sort((a, b) => b.v - a.v).slice(0, 8);
    const tot = top.reduce((a, x) => a + x.v, 0) || 1, R = 60, C = 2 * Math.PI * R;
    let off = 0;
    const arcs = top.map((x, i) => { const len = x.v / tot * C, e = `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${PALP[i % 8]}" stroke-width="30" stroke-dasharray="${Math.max(0, len - 1.5)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"/>`; off += len; return e; }).join('');
    const donut = `<div class="ch"><h5>Stock value breakdown</h5><div style="display:flex;align-items:center;gap:4mm"><svg viewBox="0 0 160 160" width="150" height="150"><circle cx="80" cy="80" r="${R}" fill="none" stroke="#f4e8d6" stroke-width="30"/>${arcs}<text x="80" y="78" text-anchor="middle" font-size="13" font-weight="700" fill="#8a4414">${m2(tv()).split('.')[0]}</text><text x="80" y="94" text-anchor="middle" font-size="9" fill="#777">total value</text></svg><div style="font-size:8pt;flex:1">${top.map((x, i) => `<div style="margin:.8mm 0;white-space:nowrap"><i style="display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;background:${PALP[i % 8]};margin-right:1.5mm"></i>${E(x.n)} <b>${Math.round(x.v / tot * 100)}%</b></div>`).join('')}</div></div></div>`;
    const S = series(), W = 560, H = 210, pl = 40, pb = 26, pt = 10, pr = 8, n = S.days.length, mx = Math.max(1, ...S.dm, ...S.sp) * 1.1;
    const X = i => pl + i * (W - pl - pr) / (n - 1), Y = v => H - pb - v / mx * (H - pb - pt);
    const path = a => a.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
    const area = a => path(a) + ` L${X(n - 1)},${H - pb} L${X(0)},${H - pb} Z`;
    const grid = [0, .25, .5, .75, 1].map(t => `<line x1="${pl}" x2="${W - pr}" y1="${Y(mx * t)}" y2="${Y(mx * t)}" stroke="#eadcc6" stroke-dasharray="3 3"/><text x="${pl - 4}" y="${Y(mx * t) + 3}" text-anchor="end" font-size="9" fill="#777">${f(mx * t)}</text>`).join('');
    const xl = S.days.map((d, i) => i % 2 ? '' : `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#777">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</text>`).join('');
    const line = `<div class="ch"><h5>Demand &amp; supply (last 14 days)</h5><svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${xl}<path d="${area(S.dm)}" fill="#e08a3c" opacity=".18"/><path d="${area(S.sp)}" fill="#2f8f6b" opacity=".15"/><path d="${path(S.dm)}" fill="none" stroke="#d9803f" stroke-width="2.4"/><path d="${path(S.sp)}" fill="none" stroke="#2f8f6b" stroke-width="2.4"/></svg><div style="font-size:8pt;text-align:center"><i style="display:inline-block;width:6mm;height:1mm;background:#d9803f;margin-right:1.5mm"></i>Demand (sales) &nbsp;&nbsp; <i style="display:inline-block;width:6mm;height:1mm;background:#2f8f6b;margin-right:1.5mm"></i>Supply (received)</div></div>`;
    const mxs = Math.max(1, ...D.ing.map(i => i.stock));
    const tw = `<div class="ch" style="grid-column:1/-1"><h5>Stock towers</h5><div style="display:flex;align-items:flex-end;gap:2.5mm;height:42mm;border-bottom:1px solid #d9c3a0;padding:0 2mm">${D.ing.map(i => `<div style="flex:1;text-align:center;font-size:7pt;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><b style="font-size:7.5pt">${f(i.stock)}</b><div style="height:${Math.max(4, i.stock / mxs * 28)}mm;background:linear-gradient(90deg,${i.stock <= i.min ? '#c0392b,#e8786b' : '#b5651d,#f0b35f'});border-radius:1.5mm 1.5mm 0 0"></div></div>`).join('')}</div><div style="display:flex;gap:2.5mm;padding:0 2mm">${D.ing.map(i => `<div style="flex:1;text-align:center;font-size:6.8pt;line-height:1.15;padding-top:1mm">${E(i.name)}</div>`).join('')}</div></div>`;
    return `<div class="chg">${donut}${line}${tw}</div>`;
  }

  const B = {
    stock() {
      const low = D.ing.filter(i => i.stock <= i.min);
      return {
        title: 'Inventory Report', sub: 'Current stock position, valuation and reorder status',
        kpi: [['Items', D.ing.length], ['Stock value', 'LKR ' + m2(tv())], ['Low stock', low.length], ['Expiring ≤ 7 days', ex().length]],
        html: chartsHTML(),
        chart: stockChart(),
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
        title: 'Dashboard Report', sub: 'Stock, sales and operations at a glance',
        kpi: [['Stock value', 'LKR ' + m2(tv())], ['Sales today', 'LKR ' + m2(td.reduce((a, o) => a + o.total, 0))], ['Low stock', low.length], ['Unpaid invoices', 'LKR ' + m2(unp)]],
        html: chartsHTML(),
        chart: stockChart(),
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
        secs: [{ cols: [['PO'], ['Supplier'], ['Item'], ['Ordered', 'r'], ['Accepted', 'r'], ['Unit price', 'r'], ['Value', 'r'], ['Status']], rows: p.map(x => [E(x.id), E(x.sup), ph(ING(x.ing_id)) + E(ING(x.ing_id).name), f(x.qty), x.acc == null ? '—' : f(x.acc), m2(x.up), m2(v(x)), E(x.status)]) }],
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

  /* ---------- print document CSS (lives only inside the print frame) ---------- */
  const PCSS = `
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{margin:0;padding:0;background:#fff;color:#2a2018;font:10pt/1.4 'Segoe UI',Arial,Helvetica,sans-serif}
img{max-width:100%}
.rh{text-align:center;padding:4mm 0 0}
.band{height:5mm;background:linear-gradient(90deg,#8a4414,#d9803f,#f6c27a,#d9803f,#8a4414);border-radius:2mm;margin-bottom:5mm}
.lgw{width:42mm;height:42mm;margin:0 auto 3mm;border-radius:50%;border:1.2mm solid #f0c98f;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 0 0 1mm #fbf3e6}
.lgw img{width:100%;height:100%;object-fit:cover}
.cn{font-size:28pt;font-weight:800;color:#8a4414;letter-spacing:-.5px;line-height:1.1}
.tg{font-size:10pt;color:#d9803f;letter-spacing:.25em;text-transform:uppercase;margin-top:1mm;font-weight:600}
.ci{margin-top:2.5mm;font-size:9pt;color:#5b4a3a}
.ci span{display:inline-block;margin:0 2.5mm}
.ci b{color:#8a4414}
.tb{margin:5mm 0 3mm;background:linear-gradient(100deg,#5e2f0c,#b5651d 55%,#d9803f);color:#fff;border-radius:3mm;padding:4mm 6mm;text-align:center}
.tb .rt{font-size:19pt;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.tb .rs{font-size:9.5pt;opacity:.92;margin-top:1mm}
.meta{width:100%;border-collapse:separate;border-spacing:0;font-size:9pt;margin:0 0 4mm;border:1px solid #efd9b8;border-radius:2mm;overflow:hidden}
.meta td{padding:1.6mm 3mm;border-bottom:1px solid #f4e6cf}
.meta tr:last-child td{border-bottom:0}
.meta td:nth-child(odd){background:#fbf0de;color:#8a4414;font-weight:700;width:17%}
.kp{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin:4mm 0}
.kp div{border-radius:2.5mm;padding:3mm 3.5mm;color:#fff;break-inside:avoid}
.kp small{display:block;font-size:7.5pt;text-transform:uppercase;letter-spacing:.1em;opacity:.9}
.kp b{display:block;font-size:13pt;margin-top:.5mm;word-break:break-word}
.k0{background:linear-gradient(135deg,#d9803f,#b5651d)}.k1{background:linear-gradient(135deg,#2e9d62,#1b7a47)}
.k2{background:linear-gradient(135deg,#d94f3f,#a93226)}.k3{background:linear-gradient(135deg,#3b82c4,#255f96)}
h4{margin:6mm 0 2mm;font-size:11.5pt;color:#8a4414;padding:1.5mm 3mm;background:#fbf0de;border-left:1.6mm solid #d9803f;border-radius:0 1.5mm 1.5mm 0;break-after:avoid}
.dt{width:100%;border-collapse:collapse;font-size:8.8pt;margin-top:1mm}
.dt th{background:#b5651d;color:#fff;padding:2mm;text-align:left;font-weight:600}
.dt td{padding:1.7mm 2mm;border-bottom:1px solid #f0e4d2;vertical-align:middle}
.dt tbody tr:nth-child(even) td{background:#fdf7ee}
.dt thead{display:table-header-group}.dt tfoot{display:table-row-group}
.dt tr{break-inside:avoid}
.dt tfoot td{background:#f6dfb8;font-weight:700;border-top:2px solid #b5651d}
.dt img{width:8mm;height:8mm;object-fit:cover;border-radius:1.5mm;vertical-align:middle;margin-right:2mm}
.r{text-align:right}
.neg{color:#c0392b;font-weight:700}.pos{color:#1e8449;font-weight:700}
.bars{margin:2mm 0}.bars div.row{display:flex;align-items:center;gap:3mm;margin:1.2mm 0;font-size:8.5pt;break-inside:avoid}
.bars .lab{width:38mm;text-align:right;color:#5b4a3a}.bars .tr{flex:1;height:4mm;background:#f4e8d6;border-radius:2mm;overflow:hidden}
.bars .tr i{display:block;height:100%;border-radius:2mm;background:linear-gradient(90deg,#d9803f,#f6c27a)}
.bars .tr i.lo{background:linear-gradient(90deg,#c0392b,#e8786b)}.bars .v{width:26mm;font-weight:600}
.chg{display:grid;grid-template-columns:1fr 1.3fr;gap:3mm;margin:2mm 0}.ch{border:1px solid #efd9b8;border-radius:2.5mm;padding:3mm;background:#fffdf8;break-inside:avoid}.ch h5{margin:0 0 2mm;font-size:9.5pt;color:#8a4414}
.nt{margin:5mm 0 0;padding:3mm 3mm 3mm 8mm;font-size:9pt;color:#4a3a2c;background:#fff8ec;border:1px solid #f0d9b8;border-radius:2mm}
.nt li{margin:1mm 0}
.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:12mm;margin-top:16mm;break-inside:avoid}
.sig div{border-top:1px solid #6b5a4a;padding-top:1.5mm;font-size:8.5pt;color:#5b4a3a;text-align:center}
.rf{margin-top:7mm;text-align:center;font-size:7.5pt;color:#8a7a6a;border-top:2px solid #f0c98f;padding-top:2mm}
.wm{position:fixed;left:0;right:0;top:38%;text-align:center;opacity:.05;transform:rotate(-24deg);z-index:-1}
.wm b{font-size:60pt;color:#b5651d;display:block}
/* big label */
.lb{color:#2a2018;width:100%;height:100%;border:.8mm solid #d9803f;border-radius:5mm;background:#fffaf1;padding:4mm;display:flex;flex-direction:column;text-align:center;break-inside:avoid}
.lb .lh{display:flex;align-items:center;justify-content:center;gap:3mm;border-bottom:.5mm dashed #e0b77d;padding-bottom:2.5mm}
.lb .lh img{width:13mm;height:13mm;border-radius:50%;object-fit:cover;border:.4mm solid #f0c98f}
.lb .lh b{font-size:17pt;color:#8a4414;line-height:1}.lb .lh small{display:block;font-size:7pt;letter-spacing:.2em;color:#d9803f;margin-top:.8mm}
.lb .li{display:flex;gap:3.5mm;text-align:left;align-items:center;margin:3mm 0}
.lb .li img{width:30mm;height:30mm;object-fit:cover;border-radius:3mm;border:.4mm solid #ecd2a8;flex-shrink:0;background:#fff}
.lb .li h5{margin:0 0 1.2mm;font-size:15pt;line-height:1.15;color:#2a2018}
.lb .li p{margin:.5mm 0;font-size:9.5pt;color:#4a3a2c}.lb .li p b{color:#8a4414}
.lb .qw{background:#fff;border:.6mm solid #ecd2a8;border-radius:4mm;padding:3mm;margin:0 auto;display:flex;justify-content:center}
.lb .qr{width:60mm;height:60mm;display:block;image-rendering:pixelated}
.lb .cc{font:bold 10.5pt Consolas,'Courier New',monospace;margin:2mm 0 1mm;letter-spacing:.04em;color:#000;opacity:1}
.lb .scan{font-size:8pt;color:#8a4414;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.lb .lf{margin-top:auto;font-size:7.5pt;color:#6b5a4a;border-top:.5mm dashed #e0b77d;padding-top:2mm;line-height:1.45}
.sh{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.sl{display:flex;gap:3mm;align-items:center;border:.4mm dashed #b8a58c;border-radius:2mm;padding:3mm;height:64mm;text-align:left;background:#fffaf1;break-inside:avoid}
.sl .qr{width:36mm;height:36mm;flex-shrink:0}.sl b{font-size:12pt}.sl p{margin:.6mm 0;font-size:8.5pt}.sl small{color:#8a4414;font-size:7.5pt;font-weight:700}
.sl img.pi{width:12mm;height:12mm;object-fit:cover;border-radius:2mm;float:right;margin-left:2mm}
`;

  const LCSS = '.lb,.lb *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' + PCSS.slice(PCSS.indexOf('/* big label */'));
  const contact = c => {
    const a = [];
    if (c.company_address) a.push('<span>📍 ' + E(c.company_address) + '</span>');
    if (c.company_phone) a.push('<span>☎ ' + E(c.company_phone) + '</span>');
    if (c.company_email) a.push('<span>✉ ' + E(c.company_email) + '</span>');
    if (c.company_website) a.push('<span>🌐 ' + E(c.company_website) + '</span>');
    return a.join('');
  };
  const regLine = c => [c.company_reg && 'Reg. No: ' + E(c.company_reg), c.company_tax && 'Tax ID: ' + E(c.company_tax)].filter(Boolean).join(' &nbsp;·&nbsp; ');
  const plain = c => [c.company_address, c.company_phone, c.company_email, c.company_website].filter(Boolean).map(E).join(' · ');

  /* ---------- report document ---------- */
  function bars(items) {
    const mx = Math.max(1, ...items.map(x => x.v));
    return '<div class="bars">' + items.map(x => `<div class="row"><span class="lab">${E(x.l)}</span><span class="tr"><i class="${x.lo ? 'lo' : ''}" style="width:${Math.max(2, x.v / mx * 100)}%"></i></span><span class="v">${E(x.t)}</span></div>`).join('') + '</div>';
  }
  function repDoc(Q) {
    const c = co();
    const n = new Date();
    const p = x => String(x).padStart(2, '0');
    const no = 'RPT-' + n.getFullYear() + p(n.getMonth() + 1) + p(n.getDate()) + '-' + p(n.getHours()) + p(n.getMinutes()) + p(n.getSeconds());
    const lg = c.company_logo;
    const cur = c.currency || 'LKR';
    const rl = regLine(c);
    return `<div class="wm"><b>${E(c.company_name)}</b></div>
<div class="rh">
  <div class="band"></div>
  ${lg ? `<div class="lgw"><img src="${E(lg)}" alt=""></div>` : ''}
  <div class="cn">${E(c.company_name)}</div>
  ${c.company_tagline ? `<div class="tg">${E(c.company_tagline)}</div>` : ''}
  <div class="ci">${contact(c)}</div>
  ${rl ? `<div class="ci"><b>${rl}</b></div>` : ''}
</div>
<div class="tb"><div class="rt">${E(Q.title)}</div><div class="rs">${E(Q.sub || '')}</div></div>
<table class="meta">
  <tr><td>Report no.</td><td>${no}</td><td>Date</td><td>${n.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
  <tr><td>Prepared by</td><td>${E(ME.name)} (${E(ME.role)})</td><td>Time</td><td>${n.toLocaleTimeString()}</td></tr>
  <tr><td>Business date</td><td>${E(D.today)}</td><td>Currency</td><td>${E(cur)}</td></tr>
</table>
${Q.kpi ? `<div class="kp">${Q.kpi.map((k, i) => `<div class="k${i % 4}"><small>${E(k[0])}</small><b>${k[1]}</b></div>`).join('')}</div>` : ''}
${Q.html ? `<h4>Charts</h4>${Q.html}` : ''}
${Q.chart ? `<h4>${E(Q.chart.h)}</h4>${bars(Q.chart.items)}` : ''}
${Q.secs.map(s => `${s.h ? `<h4>${E(s.h)}</h4>` : ''}<table class="dt"><thead><tr>${s.cols.map(c => `<th class="${c[1] || ''}">${E(c[0])}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map((v, i) => `<td class="${s.cols[i][1] || ''}">${v}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${s.cols.length}" style="text-align:center;color:#888">No records</td></tr>`}</tbody>${s.foot ? `<tfoot><tr>${s.foot.map((v, i) => `<td class="${s.cols[i][1] || ''}">${v}</td>`).join('')}</tr></tfoot>` : ''}</table>`).join('')}
${Q.notes && Q.notes.length ? `<ul class="nt">${Q.notes.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
<div class="sig"><div>Prepared by<br><b>${E(ME.name)}</b></div><div>Checked by</div><div>Approved by</div></div>
<div class="rf"><b>${E(c.company_name)}</b> · ${plain(c)}<br>${c.company_footer ? E(c.company_footer) + ' · ' : ''}Confidential, for internal use only · ${no} · Printed ${n.toLocaleString()}</div>`;
  }

  /* ---------- isolated print frame (works in Edge / Chrome / Firefox / Save as PDF) ---------- */
  function printDoc(html, pg) {
    document.querySelectorAll('iframe.pfr').forEach(e => e.remove());
    const fr = document.createElement('iframe');
    fr.className = 'pfr';
    fr.setAttribute('aria-hidden', 'true');
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:210mm;height:297mm;border:0;opacity:0;pointer-events:none;z-index:-1';
    document.body.appendChild(fr);
    const doc = fr.contentDocument;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>' + E(pg.title || 'CafePilot') + '</title><base href="' + location.origin + '/"><style>@page{size:' + pg.size + ';margin:' + pg.margin + '}' + PCSS + (pg.css || '') + '</style></head><body>' + html.replace(/<img /g, '<img onerror="this.style.display=\'none\'" ') + '</body></html>');
    doc.close();
    let fired = false;
    const go = () => {
      if (fired) return; fired = true;
      try { fr.contentWindow.focus(); fr.contentWindow.print(); }
      catch (e) { console.error(e); toast('Print failed: ' + e.message); }
      setTimeout(() => fr.remove(), 120000);
    };
    const imgs = [...doc.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }));
    Promise.race([Promise.all(imgs), new Promise(r => setTimeout(r, 4000))]).then(() => setTimeout(go, 250));
  }

  window.__nativePrint = window.print.bind(window);

  async function makeReport() {
    const k = ({ scan: 'stock' })[tab] || tab;
    const b = B[k] || B.stock;
    toast('Preparing report…');
    let F = null;
    try { F = await api('reports/full'); } catch (e) { }
    const Q = b(F);
    printDoc(repDoc(Q), { size: 'A4', margin: '10mm 11mm 14mm', title: Q.title });
  }
  window.print = function () {
    if (typeof D == 'undefined' || !D || !ME) return window.__nativePrint();
    makeReport();
  };

  /* ---------- QR labels ---------- */
  function qrURL(t) {
    const d = document.createElement('div');
    try { new QRCode(d, { text: t, width: 600, height: 600, correctLevel: QRCode.CorrectLevel.M }); } catch (e) { return ''; }
    const c = d.querySelector('canvas');
    return c ? c.toDataURL('image/png') : ((d.querySelector('img') || {}).src || '');
  }
  function lbInfo(code) {
    let it = null, kind = 'ing';
    if (/^(RIQ|CP):ING:/.test(code)) it = ING(code.replace(/^(RIQ|CP):ING:/, ''));
    else if (/^(RIQ|CP):LOT:/.test(code)) { it = D.batches.find(x => x.code == code.replace(/^(RIQ|CP):LOT:/, '')); kind = 'lot'; }
    if (!it) return null;
    const base = kind == 'lot' ? ING(it.ing_id) : it;
    return { it, kind, base, unit: base.unit, qty: kind == 'lot' ? it.qty : it.stock, img: base.img, name: it.name || base.name };
  }
  const UN = { g: 'grams (g)', kg: 'kilograms (kg)', ml: 'millilitres (ml)', l: 'litres (l)', pcs: 'pieces (pcs)', pc: 'piece (pc)' };
  const unitLong = u => UN[String(u).toLowerCase()] || u;

  const lbL = (L, code, qr, c) => `<div class="lb">
<div class="lh">${c.company_logo ? `<img src="${E(c.company_logo)}" alt="">` : ''}<div><b>${E(c.company_name)}</b><small>INVENTORY LABEL</small></div></div>
<div class="li">
  ${L.img ? `<img src="${E(L.img)}" alt="">` : ''}
  <div>
    <h5>${E(L.name)}</h5>
    ${L.kind == 'lot' ? `<p><b>Lot:</b> ${E(L.it.code)}</p>` : ''}
    <p><b>Unit:</b> ${E(unitLong(L.unit))}</p>
    <p><b>${L.kind == 'lot' ? 'Lot qty' : 'In stock'}:</b> ${f(L.qty)} ${E(L.unit)}</p>
    ${L.base.min != null && L.kind == 'ing' ? `<p><b>Minimum:</b> ${f(L.base.min)} ${E(L.unit)}</p>` : ''}
    ${L.it.exp ? `<p><b>Expiry:</b> ${E(L.it.exp)}</p>` : ''}
  </div>
</div>
<div class="qw"><img class="qr" src="${qr}" alt="QR"></div>
<div class="cc">${E(code)}</div>
<div class="scan">Scan to receive · use · count</div>
<div class="lf">${plain(c)}<br>Printed ${new Date().toLocaleString()} by ${E(ME.name)}</div>
</div>`;

  const lbS = (L, code, qr, c) => `<div class="sl">
<img class="qr" src="${qr}" alt="QR">
<div>
  ${L.img ? `<img class="pi" src="${E(L.img)}" alt="">` : ''}
  <b>${E(L.name)}</b>
  ${L.kind == 'lot' ? `<p>Lot ${E(L.it.code)}</p>` : ''}
  <p>${f(L.qty)} ${E(L.unit)}${L.it.exp ? ' · Exp ' + E(L.it.exp) : ''}</p>
  <p style="font:7.5pt Consolas,monospace">${E(code)}</p>
  <small>${E(c.company_name)}</small>
</div>
</div>`;

  /* Download label as PNG: drawn on a canvas (no external libs, always works) */
  function loadImg(src) {
    return new Promise(r => { if (!src) return r(null); const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  }
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  async function labelPNG(L, code, qr, c) {
    const W = 1200, H = 1800, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.fillStyle = '#fffaf1'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#d9803f'; x.lineWidth = 12; rr(x, 20, 20, W - 40, H - 40, 60); x.stroke();
    const [lg, im, q] = await Promise.all([loadImg(c.company_logo), loadImg(L.img), loadImg(qr)]);
    x.textAlign = 'center'; x.fillStyle = '#8a4414'; x.font = '800 78px Segoe UI,Arial';
    x.fillText(c.company_name, W / 2 + (lg ? 70 : 0), 130);
    if (lg) { x.save(); x.beginPath(); x.arc(W / 2 - x.measureText(c.company_name).width / 2 - 20, 105, 55, 0, 7); x.clip(); x.drawImage(lg, W / 2 - x.measureText(c.company_name).width / 2 - 75, 50, 110, 110); x.restore(); }
    x.fillStyle = '#d9803f'; x.font = '600 28px Segoe UI,Arial'; x.fillText('I N V E N T O R Y   L A B E L', W / 2, 185);
    x.strokeStyle = '#e0b77d'; x.setLineDash([14, 10]); x.lineWidth = 4; x.beginPath(); x.moveTo(80, 215); x.lineTo(W - 80, 215); x.stroke(); x.setLineDash([]);
    if (im) { x.save(); rr(x, 90, 260, 340, 340, 36); x.clip(); x.drawImage(im, 90, 260, 340, 340); x.restore(); x.strokeStyle = '#ecd2a8'; x.lineWidth = 5; rr(x, 90, 260, 340, 340, 36); x.stroke(); }
    x.textAlign = 'left'; const tx = im ? 470 : 90;
    x.fillStyle = '#2a2018'; x.font = '800 62px Segoe UI,Arial'; x.fillText(L.name, tx, 330, W - tx - 80);
    const rows = [['Unit', unitLong(L.unit)], [L.kind == 'lot' ? 'Lot qty' : 'In stock', f(L.qty) + ' ' + L.unit]];
    if (L.kind == 'lot') rows.unshift(['Lot', L.it.code]);
    if (L.it.exp) rows.push(['Expiry', L.it.exp]);
    rows.forEach((r, i) => { x.font = '700 36px Segoe UI,Arial'; x.fillStyle = '#8a4414'; x.fillText(r[0] + ':', tx, 400 + i * 62); x.font = '36px Segoe UI,Arial'; x.fillStyle = '#4a3a2c'; x.fillText(r[1], tx + 200, 400 + i * 62, W - tx - 290); });
    x.fillStyle = '#fff'; x.strokeStyle = '#ecd2a8'; x.lineWidth = 6; rr(x, 180, 680, 840, 840, 50); x.fill(); x.stroke();
    if (q) { x.imageSmoothingEnabled = false; x.drawImage(q, 230, 730, 740, 740); }
    x.textAlign = 'center'; x.fillStyle = '#2a2018'; x.font = 'bold 44px Consolas,monospace'; x.fillText(code, W / 2, 1590, W - 120);
    x.fillStyle = '#6b5a4a'; x.font = '28px Segoe UI,Arial';
    x.fillText([c.company_phone, c.company_email].filter(Boolean).join(' · '), W / 2, 1670, W - 100);
    x.fillText(c.company_address || '', W / 2, 1712, W - 100);
    x.fillText('Printed ' + new Date().toLocaleString(), W / 2, 1754);
    return cv.toDataURL('image/png');
  }

  window.qrx = function (name, code) {
    const L = lbInfo(code);
    if (!L) { toast('Item not found'); return; }
    const c = co();
    const qr = qrURL(code);
    if (!qr) { toast('QR library not loaded (check internet)'); return; }
    const d = modal(`<h3>QR label · ${E(L.name)}</h3>
<div class="lbp"><style>${LCSS}</style><div class="pv" style="height:148mm">${lbL(L, code, qr, c)}</div></div>
<label class="sub" style="display:block;margin-top:12px">Print layout</label>
<select id="lsz">
  <option value="a6">Large label (A6, 100 × 148 mm)</option>
  <option value="a5">Extra large label (A5, 148 × 210 mm)</option>
  <option value="sheet">Sticker sheet (A4, 8 labels per page)</option>
</select>
<label class="sub" style="display:block;margin-top:8px">Copies</label>
<input id="lcp" type="number" min="1" max="50" value="1">
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
  <button class="btn" id="lpr">🖨️ Print / Save as PDF</button>
  <button class="btn s" id="ldl">⬇️ Download label as image</button>
  <button class="btn s" onclick="this.closest('.md').remove()">Close</button>
</div>`);
    d.querySelector('#lpr').onclick = () => {
      const m = d.querySelector('#lsz').value, n = Math.max(1, Math.min(50, +d.querySelector('#lcp').value || 1));
      if (m == 'sheet') printDoc('<div class="sh">' + Array(Math.max(8, n)).fill(lbS(L, code, qr, c)).join('') + '</div>', { size: 'A4', margin: '8mm', title: 'Labels ' + L.name });
      else {
        const sz = m == 'a5' ? ['148mm 210mm', '210mm'] : ['100mm 148mm', '148mm'];
        const one = lbL(L, code, qr, c);
        printDoc(Array(n).fill('<div class="pg">' + one + '</div>').join(''), { size: sz[0], margin: '4mm', title: 'Label ' + L.name, css: '.pg{height:calc(' + sz[1] + ' - 8.5mm);break-after:page}.pg:last-child{break-after:auto}' });
      }
    };
    d.querySelector('#ldl').onclick = async () => {
      try {
        const a = document.createElement('a');
        a.href = await labelPNG(L, code, qr, c);
        a.download = (L.name || 'label').replace(/[^\w-]/g, '_') + '_' + code.replace(/[^\w-]/g, '_') + '.png';
        a.click();
      } catch (e) { toast('Could not create image: ' + e.message); }
    };
  };

  /* ---------- extras ---------- */
  const ex2 = document.createElement('style');
  ex2.textContent = '.tw .col span{text-align:center;line-height:1.15;font-size:11px;max-width:74px;min-height:26px}';
  document.head.appendChild(ex2);
  function fixTw() {
    if (typeof D == 'undefined' || !D || !D.ing) return;
    document.querySelectorAll('.tw .col').forEach((c, i) => { const s = c.querySelector('span'), n = D.ing[i]; if (s && n) s.textContent = n.name; });
  }
  if (typeof window.render == 'function') {
    const _r = window.render;
    window.render = function () { const x = _r.apply(this, arguments); try { fixTw(); } catch (e) { } return x; };
  }
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() == 'p' && typeof ME != 'undefined' && ME && typeof D != 'undefined' && D) { e.preventDefault(); window.print(); }
  });
})();