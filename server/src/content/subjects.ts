import { Request, Response } from "express";
import { Subject, GradeLevel, dynamicFind, parseJSON } from "../core";

/* ---------- Subjects / Grade Levels ---------- */
export async function getSubjects(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { name: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Subject, { q, sort, limit, offset });
}

// Alias used by notes UI
export async function getNoteSubjects(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || { is_active: true };
  const sort = parseJSON<any>(req.query.sort as string) || { sort_order: 1, name: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Subject, { q, sort, limit, offset });
}

export async function createSubject(req: Request, res: Response) {
  try {
    const doc = await Subject.create(req.body || {});
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function getGradeLevels(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || { is_active: true };
  const sort = parseJSON<any>(req.query.sort as string) || { code: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, GradeLevel, { q, sort, limit, offset });
}
