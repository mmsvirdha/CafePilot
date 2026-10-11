// Adds GET /api/reports/full (complete data for printed reports). Needs one line in server.js.
module.exports = (app, { A, guard }) => {
  app.get('/api/reports/full', (req, res) => {
    if (!guard(req, 'view')) return res.status(401).json({ error: 'Login required' });
    res.json({
      orders: A('select * from orders order by ts desc limit 1000'),
      led: A('select * from ledger order by id desc limit 2000'),
      po: A('select * from po order by rowid desc'),
      batches: A('select b.*,i.name from batches b join ingredients i on i.id=b.ing_id where b.qty>0 order by b.exp is null, b.exp')
    });
  });
};
