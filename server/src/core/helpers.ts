import { Types } from "mongoose";
import { StudyNote, Subject } from "./database";

/* ================================
   Helpers
================================== */
export function parseJSON<T>(s?: string | null): T | undefined {
  if (!s) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
}

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSubjectMatch(subjectFilter?: string | null) {
  if (!subjectFilter) return null;
  const s = String(subjectFilter).trim();
  if (!s) return null;

  const or: any[] = [{ subject_id: s }];

  if (Types.ObjectId.isValid(s)) {
    const oid = new Types.ObjectId(s);
    or.push({ subject_id: oid }, { "subject._id": oid });
  }

  const exact = new RegExp(`^${escapeRegExp(s)}$`, "i");
  or.push({ "subject.name": exact }, { "subject.code": exact });

  return { $or: or };
}

export async function dynamicFind(res: Response, Model: any, options: any = {}) {
  const { q, sort, limit, offset, select, populate } = options;
  try {
    // Handle _id queries that might not be valid ObjectIds
    let processedQuery = q || {};
    if (processedQuery._id && typeof processedQuery._id === 'string') {
      // If _id is not a valid ObjectId, treat it as user_id instead
      if (!/^[0-9a-fA-F]{24}$/.test(processedQuery._id)) {
        processedQuery = { ...processedQuery, user_id: processedQuery._id };
        delete processedQuery._id;
      }
    }

    const query = Model.find(processedQuery);
    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (typeof limit === "number") query.limit(Math.min(limit, 500));
    if (typeof offset === "number") query.skip(offset);
    if (populate) query.populate(populate);
    const rows = await query.exec();
    res.json({ ok: true, data: rows });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export function buildStudyNotesPipeline(opts: {
  searchTerm?: string;
  subjectFilter?: string;
  gradeFilter?: string;
  limit?: number;
}) {
  const { searchTerm, subjectFilter, gradeFilter, limit } = opts;

  const pipeline: any[] = [
    { $match: { is_active: true, ...(gradeFilter ? { grade_level_code: gradeFilter } : {}) } },
    { $lookup: { from: "subjects", localField: "subject_id", foreignField: "_id", as: "subject" } },
    { $addFields: { subject: { $arrayElemAt: ["$subject", 0] } } },
  ];

  const subjMatch = buildSubjectMatch(subjectFilter);
  if (subjMatch) pipeline.push({ $match: subjMatch });

  if (searchTerm && String(searchTerm).trim()) {
    const rx = new RegExp(escapeRegExp(String(searchTerm).trim()), "i");
    pipeline.push({
      $match: {
        $or: [
          { title: rx },
          { description: rx },
          { "subject.name": rx },
          { "subject.code": rx },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $limit: Math.min(Number(limit ?? 100), 200) },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        grade_level_code: 1,
        file_url: 1,
        file_name: 1,
        file_size: 1,
        view_count: 1,
        download_count: 1,
        createdAt: 1,
        subject_id: { $ifNull: ["$subject._id", "$subject_id"] },
        subject_name: { $ifNull: ["$subject.name", null] },
        subject_color: { $ifNull: ["$subject.color", null] },
      },
    }
  );

  return pipeline;
}
