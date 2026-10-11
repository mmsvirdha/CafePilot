process.env.DB_FILE=':memory:';process.env.ADMIN_PASSWORD='Admin-pass-123';
const test=require('node:test'),assert=require('node:assert'),{once}=require('node:events'),{app,db}=require('../server');
const srv=app.listen(0);let base;const ready=new Promise(r=>srv.listening?r():srv.once('listening',r));
async function call(p,body,ck){await ready;base='http://localhost:'+srv.address().port;
 const r=await fetch(base+'/api/'+p,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(ck?{Cookie:ck}:{})},body:body?JSON.stringify(body):undefined});
 return{s:r.status,j:await r.json(),c:(r.headers.get('set-cookie')||'').split(';')[0]}}
const login=async(u,p)=>(await call('login',{username:u,password:p})).c;
const bal=async ck=>{const s=(await call('state',null,ck)).j;return{ok:s.ok,...Object.fromEntries(s.ing.map(i=>[i.id,i.stock]))}};
const sale=(ck,key,q)=>call('sale',{key,items:[{id:'r1',q}]},ck);
let owner,cashier,keeper,acct;
test('login required, bad passwords rejected',async()=>{
 assert.equal((await call('state')).s,401);
 assert.equal((await call('login',{username:'admin',password:'wrong'})).s,401)});
test('owner creates staff; weak password and bad role rejected',async()=>{
 owner=await login('admin','Admin-pass-123');assert.ok(owner);
 for(const[u,r]of[['cash1','cashier'],['store1','storekeeper'],['acc1','accountant']])assert.equal((await call('users',{username:u,name:u,role:r,password:'password123'},owner)).s,200);
 assert.equal((await call('users',{username:'x1',role:'cashier',password:'short'},owner)).s,400);
 assert.equal((await call('users',{username:'x2',role:'god',password:'password123'},owner)).s,400);
 cashier=await login('cash1','password123');keeper=await login('store1','password123');acct=await login('acc1','password123')});
test('5 coffees deduct exact recipe quantities',async()=>{
 assert.equal((await sale(cashier,'k1',5)).s,200);const b=await bal(owner);
 assert.deepEqual([b.coffee,b.sugar,b.milk,b.cup],[1950,4960,9500,495])});
test('same sale key never deducts twice',async()=>{
 const r=await sale(cashier,'k1',5);assert.equal(r.j.duplicate,true);assert.equal((await bal(owner)).coffee,1950)});
test('insufficient stock rejected with no partial deduction',async()=>{
 const before=await bal(owner);assert.equal((await sale(cashier,'big',100000)).s,409);assert.deepEqual(await bal(owner),before)});
test('roles enforced on the server; denial is audited',async()=>{
 assert.equal((await call('stock',{ing:'coffee',type:'RECEIVE',qty:99},cashier)).s,403);
 assert.equal((await sale(acct,'z',1)).s,403);assert.equal((await sale(keeper,'z2',1)).s,403);
 assert.equal((await call('users',{username:'hack',role:'owner',password:'password123'},cashier)).s,403);
 assert.equal((await call('audit',null,cashier)).s,403);
 const a=(await call('audit',null,owner)).j;assert.ok(a.some(x=>x.action=='DENIED'&&x.actor=='cash1'))});
test('purchasing: partial receipt adds accepted qty only; paying adds no stock',async()=>{
 const b0=(await bal(owner)).coffee;
 assert.equal((await call('po',{sup:'Beans Ltd',ing:'coffee',qty:1000,up:6},keeper)).s,200);
 assert.equal((await call('po/PO-001/receive',{acc:900},keeper)).s,200);assert.equal((await bal(owner)).coffee,b0+900);
 assert.equal((await call('po/PO-001/receive',{acc:900},keeper)).s,409);
 assert.equal((await call('po/PO-001/pay',{},keeper)).s,403);
 assert.equal((await call('po/PO-001/pay',{},acct)).s,200);assert.equal((await bal(owner)).coffee,b0+900);
 assert.equal((await call('po/PO-001/pay',{},acct)).s,409)});
test('batches: FEFO, past expiry blocked, expired lots never sold, disposal reconciles',async()=>{
 const d=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10),st=async()=>(await call('state',null,owner)).j,mocha=k=>call('sale',{key:k,items:[{id:'r4',q:1}]},cashier);
 assert.equal((await call('stock',{ing:'syrup',type:'RECEIVE',qty:100,exp:'2000-01-01'},keeper)).s,400);
 await call('stock',{ing:'syrup',type:'RECEIVE',qty:100,exp:d(30)},keeper);await call('stock',{ing:'syrup',type:'RECEIVE',qty:100,exp:d(5)},keeper);
 const early=(await st()).batches.find(b=>b.ing_id=='syrup'&&b.exp==d(5));
 assert.equal((await mocha('m1')).s,200);assert.equal((await st()).led.find(l=>l.ing_id=='syrup'&&l.type=='SALE').batch,early.code);
 db.prepare("update batches set exp='2000-01-01' where id=?").run(early.id);
 assert.equal((await mocha('m2')).s,200);let s=await st();
 assert.notEqual(s.led.find(l=>l.ing_id=='syrup'&&l.type=='SALE').batch,early.code);assert.equal(s.batches.find(b=>b.id==early.id).qty,80);
 assert.equal((await call('stock',{ing:'syrup',type:'WASTE',qty:80,batch:early.id},keeper)).s,200);
 s=await st();assert.equal(s.ok&&s.bok,true)});
test('30 simultaneous sales cannot oversell',async()=>{
 const b=await bal(owner),exp=Math.min(Math.floor(b.coffee/100),Math.floor(b.sugar/80),Math.floor(b.milk/1000),Math.floor(b.cup/10));
 const rs=await Promise.all(Array.from({length:30},(_,i)=>sale(cashier,'c'+i,10)));
 assert.equal(rs.filter(r=>r.s==200).length,exp);const a=await bal(owner);
 assert.ok([a.coffee,a.sugar,a.milk,a.cup].every(v=>v>=0))});
test('ledger reconciles with balances; logout kills session',async()=>{
 assert.equal((await bal(owner)).ok,true);await call('logout',{},cashier);assert.equal((await call('state',null,cashier)).s,401)});
test('close',()=>srv.close());