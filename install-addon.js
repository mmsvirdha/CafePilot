// One-time installer. Put reports.js, reports-api.js and this file in your restaurantiq folder, then run:  node install-addon.js
const fs = require('fs'), path = require('path');
const root = __dirname, pub = path.join(root, 'public'), say = m => console.log(m);
const die = m => { say('\nSTOP: ' + m); process.exit(1); };
const src = path.join(root, 'reports.js'), dst = path.join(pub, 'reports.js');
if (!fs.existsSync(pub)) die('No "public" folder next to this file. Put install-addon.js in the main restaurantiq folder.');
if (fs.existsSync(src)) { fs.copyFileSync(src, dst); say('1. Copied reports.js into public/'); }
else if (!fs.existsSync(dst)) die('reports.js not found. Put it in the same folder as this file.');
else say('1. public/reports.js already there');
if (!fs.existsSync(path.join(root, 'reports-api.js'))) die('reports-api.js not found. Put it in the same folder as this file.');
const ih = path.join(pub, 'index.html');
if (!fs.existsSync(ih)) die('public/index.html not found.');
let h = fs.readFileSync(ih, 'utf8');
if (!fs.existsSync(ih + '.bak')) fs.writeFileSync(ih + '.bak', h);
h = h.replace(/<script src="\/reports\.js[^"]*"><\/script>\s*/g, '');
if (!h.includes('</body>')) die('index.html has no </body> tag.');
h = h.replace('</body>', () => '<script src="/reports.js?v=3"></script>\n</body>');
fs.writeFileSync(ih, h); say('2. index.html now loads reports.js (backup: index.html.bak)');
const sv = path.join(root, 'server.js');
if (!fs.existsSync(sv)) die('server.js not found.');
let s = fs.readFileSync(sv, 'utf8');
if (s.includes('reports-api')) say('3. server.js already loads reports-api.js');
else {
  if (!/module\.exports\s*=/.test(s)) die('Could not find "module.exports" in server.js.');
  if (!fs.existsSync(sv + '.bak')) fs.writeFileSync(sv + '.bak', s);
  s = s.replace(/module\.exports\s*=/, () => "require('./reports-api')(app, { A, guard });\n\nmodule.exports =");
  fs.writeFileSync(sv, s); say('3. server.js now loads reports-api.js (backup: server.js.bak)');
}
say('\nDone. Now restart the server (Ctrl+C, then npm start) and press Ctrl+F5 in the browser.');
