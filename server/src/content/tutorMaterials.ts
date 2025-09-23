import { Request, Response } from "express";
import { TutorMaterial, Subject, dynamicFind, parseJSON } from "../core";

/* ---------- Tutor Materials ---------- */
export async function getTutorMaterials(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, TutorMaterial, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
}

export async function getStudentTutorMaterials(req: Request, res: Response) {
  try {
    const student_id = String(req.query.student_id || "").trim();
    const extra = parseJSON<any>(req.query.q as string) || {};
    const q: any = { is_active: true, ...extra };
    if (student_id) q.student_ids = student_id;

    const rows = await TutorMaterial.find(q)
      .populate({ path: "subject_id", model: Subject })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();

    const out = rows.map((r: any) => ({
      id: (r._id ?? r.id)?.toString(),
      title: r.title,
      description: r.description,
      subject_id: r.subject_id?._id?.toString?.() ?? r.subject_id,
      subject_name: r.subject_id?.name ?? null,
      subject_color: r.subject_id?.color ?? null,
      file_url: r.file_url ?? null,
      download_count: r.download_count ?? 0,
      created_at: r.createdAt,
    }));
    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("get_student_tutor_materials error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function getStudentTutorMaterialById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const doc = await TutorMaterial.findById(id)
      .populate({ path: "subject_id", model: Subject })
      .lean()
      .exec();
    if (!doc) return res.status(404).json({ ok: false, error: "Not found" });

    const out = {
      id: (doc._id ?? doc.id)?.toString(),
      title: doc.title,
      description: doc.description,
      subject_id: doc.subject_id?._id?.toString?.() ?? doc.subject_id,
      subject_name: doc.subject_id?.name ?? null,
      subject_color: doc.subject_id?.color ?? null,
      file_url: doc.file_url ?? null,
      download_count: doc.download_count ?? 0,
      created_at: doc.createdAt,
    };
    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("get_student_tutor_material_by_id error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function incrementTutorNoteDownloadCount(req: Request, res: Response) {
  try {
    const { note_id } = req.body || {};
    if (!note_id) return res.status(400).json({ ok: false, error: "note_id required" });
    await TutorMaterial.updateOne({ _id: note_id }, { $inc: { download_count: 1 } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error("increment_tutor_note_download_count error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function createTutorMaterial(req: Request, res: Response) {
  try {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const doc = await TutorMaterial.create(payload);
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}
