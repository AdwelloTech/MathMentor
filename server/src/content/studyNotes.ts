import { Request, Response } from "express";
import { StudyNote, buildStudyNotesPipeline, parseJSON } from "../core";

/* ---------- Study Notes ---------- */
export async function getStudyNotes(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, StudyNote, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: "Subject" }],
  });
}

// search (POST compat)
export async function searchStudyNotes(req: Request, res: Response) {
  try {
    const { search_term, subject_filter, grade_filter, limit } = req.body || {};
    const pipeline = buildStudyNotesPipeline({
      searchTerm: search_term,
      subjectFilter: subject_filter,
      gradeFilter: grade_filter,
      limit,
    });
    const rows = await StudyNote.aggregate(pipeline).exec();

    const out = rows.map((n: any) => ({
      id: n._id?.toString(),
      title: n.title,
      description: n.description,
      subject_id: n.subject_id?.toString?.() ?? n.subject_id ?? null,
      subject_name: n.subject_name ?? null,
      subject_color: n.subject_color ?? null,
      grade_level_code: n.grade_level_code ?? null,
      file_url: n.file_url ?? null,
      file_name: n.file_name ?? null,
      file_size: n.file_size ?? null,
      view_count: n.view_count ?? 0,
      download_count: n.download_count ?? 0,
      created_at: n.createdAt,
    }));

    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("search_study_notes error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

// search (GET alias)
export async function searchStudyNotesGet(req: Request, res: Response) {
  try {
    const search_term = (req.query.q as string) || (req.query.search_term as string) || "";
    const subject_filter = (req.query.subject as string) || (req.query.subject_filter as string) || "";
    const grade_filter = (req.query.grade as string) || (req.query.grade_filter as string) || "";
    const limit = Number(req.query.limit ?? 100);

    const pipeline = buildStudyNotesPipeline({
      searchTerm: search_term,
      subjectFilter: subject_filter,
      gradeFilter: grade_filter,
      limit,
    });
    const rows = await StudyNote.aggregate(pipeline).exec();

    const out = rows.map((n: any) => ({
      id: n._id?.toString(),
      title: n.title,
      description: n.description,
      subject_id: n.subject_id?.toString?.() ?? n.subject_id ?? null,
      subject_name: n.subject_name ?? null,
      subject_color: n.subject_color ?? null,
      grade_level_code: n.grade_level_code ?? null,
      file_url: n.file_url ?? null,
      file_name: n.file_name ?? null,
      file_size: n.file_size ?? null,
      view_count: n.view_count ?? 0,
      download_count: n.download_count ?? 0,
      created_at: n.createdAt,
    }));

    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("study-notes/search (GET) error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

// counters
export async function incrementStudyNoteViews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await StudyNote.updateOne(
      { _id: id },
      { $inc: { view_count: 1 }, $set: { updated_at: new Date().toISOString() } }
    ).exec();
    const doc = await StudyNote.findById(id).lean().exec();
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    console.error("study_notes views error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function incrementStudyNoteDownloads(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await StudyNote.updateOne(
      { _id: id },
      { $inc: { download_count: 1 }, $set: { updated_at: new Date().toISOString() } }
    ).exec();
    const doc = await StudyNote.findById(id).lean().exec();
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    console.error("study_notes downloads error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
