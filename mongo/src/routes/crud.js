import express from 'express';
export function crudRouter(Model) {
  const r = express.Router();
  r.get('/', async (req,res,next)=>{
    try {
      const q = req.query.q ? JSON.parse(req.query.q) : {};
      const limit = Math.min(parseInt(req.query.limit||'50',10), 200);
      const skip = parseInt(req.query.skip||'0',10);
      const sort = req.query.sort ? JSON.parse(req.query.sort) : { created_at: -1 };
      const items = await Model.find(q).sort(sort).skip(skip).limit(limit).lean();
      res.json(items);
    } catch(e){ next(e); }
  });
  r.get('/:id', async (req,res,next)=>{
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch(e){ next(e); }
  });
  r.post('/', async (req,res,next)=>{
    try {
      const body = req.body;
      const docs = Array.isArray(body) ? body : [body];
      const created = await Model.insertMany(docs, { ordered: false });
      res.status(201).json(Array.isArray(body) ? created : created[0]);
    } catch(e){ next(e); }
  });
  r.patch('/:id', async (req,res,next)=>{
    try {
      const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch(e){ next(e); }
  });
  r.delete('/:id', async (req,res,next)=>{
    try {
      const del = await Model.findByIdAndDelete(req.params.id);
      if (!del) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch(e){ next(e); }
  });
  return r;
}
