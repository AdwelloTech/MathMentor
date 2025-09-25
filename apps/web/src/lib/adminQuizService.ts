import { AxiosError } from "axios";
import { getApi } from "./api";

const api = getApi();

type RawDoc = Record<string, any> | null | undefined;
type RawList = RawDoc[] | { data?: RawDoc[]; items?: RawDoc[] } | null | undefined;

export type AdminQuizTutor = {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
};

export type AdminQuizAnswer = {
  id: string;
  answer_text: string;
  answer_order: number;
  is_correct: boolean;
};

export type AdminQuizQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  answers: AdminQuizAnswer[];
  explanation?: string;
};

export type AdminQuiz = {
  id: string;
  title: string;
  description?: string;
  subject: string;
  subject_id?: string;
  tutor: AdminQuizTutor;
  is_active: boolean;
  total_questions: number;
  total_attempts: number;
  duration_minutes?: number;
  created_at?: string;
  updated_at?: string;
  questions?: AdminQuizQuestion[];
};

export type QuizStats = {
  total: number;
  active: number;
  inactive: number;
  total_attempts: number;
  by_subject: Record<string, number>;
};

type ProfileInfo = {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
};

let inflightQuizzesPromise: Promise<AdminQuiz[]> | null = null;

function unwrapList(payload: RawList): RawDoc[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean) as RawDoc[];
  if (Array.isArray(payload.data)) return payload.data.filter(Boolean) as RawDoc[];
  if (Array.isArray(payload.items)) return payload.items.filter(Boolean) as RawDoc[];
  return [];
}

function toStringId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (value._id) return toStringId(value._id);
    if (value.id) return toStringId(value.id);
  }
  return String(value);
}

function looksLikeObjectId(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function normalizeTutor(raw: RawDoc, fallbackId: string, profile?: ProfileInfo): AdminQuizTutor {
  if (profile) {
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
    };
  }
  const name =
    raw?.tutor_name ??
    raw?.tutor_full_name ??
    raw?.tutor?.full_name ??
    raw?.tutorName ??
    raw?.tutorFullName ??
    "Unknown tutor";
  const email = raw?.tutor_email ?? raw?.tutor?.email ?? raw?.email ?? raw?.tutorEmail;
  const avatar = raw?.tutor?.avatar_url ?? raw?.avatar_url ?? raw?.avatarUrl;
  return {
    id: fallbackId,
    full_name: String(name || "Unknown tutor"),
    email: email ? String(email) : undefined,
    avatar_url: avatar ? String(avatar) : undefined,
  };
}

function normalizeAnswers(
  rawQuestion: RawDoc,
  answers: RawDoc[],
  correctIndex: number
): AdminQuizAnswer[] {
  return answers.map((answer, idx) => {
    const text =
      answer?.answer_text ??
      answer?.text ??
      answer?.value ??
      answer?.label ??
      answer?.answer ??
      answer ??
      "";
    const orderRaw =
      answer?.answer_order ??
      answer?.order ??
      answer?.answerOrder ??
      idx;
    const order = typeof orderRaw === "number" ? orderRaw : Number(orderRaw) || idx;
    const isCorrect =
      answer?.is_correct ??
      answer?.correct ??
      answer?.isCorrect ??
      answer?.answer_is_correct ??
      idx === correctIndex;
    return {
      id: toStringId(answer?.id ?? answer?._id ?? `${toStringId(rawQuestion?._id ?? rawQuestion?.id ?? "q")}-${idx}`),
      answer_text: String(text ?? ""),
      answer_order: order,
      is_correct: Boolean(isCorrect),
    };
  });
}

function normalizeQuestion(raw: RawDoc, idx: number): AdminQuizQuestion {
  const id = toStringId(raw?.id ?? raw?._id ?? `question-${idx}`);
  const questionText =
    raw?.question_text ??
    raw?.question ??
    raw?.prompt ??
    raw?.q ??
    raw?.title ??
    "Untitled question";
  const type =
    raw?.question_type ??
    raw?.type ??
    raw?.format ??
    (Array.isArray(raw?.answers) || Array.isArray(raw?.options)
      ? "multiple_choice"
      : "short_answer");
  const pointsRaw = raw?.points ?? raw?.point_value ?? raw?.score ?? raw?.weight ?? 1;
  const points = typeof pointsRaw === "number" ? pointsRaw : Number(pointsRaw) || 1;
  const answersRaw = Array.isArray(raw?.answers)
    ? raw?.answers
    : Array.isArray(raw?.options)
    ? raw?.options
    : Array.isArray(raw?.choices)
    ? raw?.choices
    : [];
  const correctIndex =
    typeof raw?.correct_index === "number"
      ? raw.correct_index
      : typeof raw?.correctIndex === "number"
      ? raw.correctIndex
      : typeof raw?.answer_index === "number"
      ? raw.answer_index
      : typeof raw?.correctAnswerIndex === "number"
      ? raw.correctAnswerIndex
      : -1;

  return {
    id,
    question_text: String(questionText ?? "Untitled question"),
    question_type: String(type || "multiple_choice"),
    points,
    answers: normalizeAnswers(raw, answersRaw as RawDoc[], correctIndex),
    explanation: raw?.explanation ? String(raw.explanation) : undefined,
  };
}

function normalizeQuiz(
  raw: RawDoc,
  attempts: number,
  profile?: ProfileInfo,
  includeQuestions = false
): AdminQuiz {
  const id = toStringId(raw?._id ?? raw?.id ?? raw?.quiz_id ?? raw?.uuid ?? "");
  let subjectNameValue =
    raw?.subject ??
    raw?.subject_name ??
    raw?.subjectName ??
    raw?.subject_title ??
    raw?.subjectId ??
    null;
  if (!subjectNameValue && raw?.subject_id) {
    if (typeof raw.subject_id === "object") {
      subjectNameValue =
        raw.subject_id.name ??
        raw.subject_id.title ??
        raw.subject_id.display_name ??
        raw.subject_id.code ??
        null;
    } else {
      subjectNameValue = raw.subject_id;
    }
  }

  const subject = String(subjectNameValue || "Unknown Subject");
  const subjectId =
    typeof raw?.subject_id === "object"
      ? toStringId(raw?.subject_id?._id ?? raw?.subject_id?.id)
      : toStringId(raw?.subject_id);
  const created = raw?.created_at ?? raw?.createdAt;
  const updated = raw?.updated_at ?? raw?.updatedAt;
  const isActive =
    raw?.is_active !== undefined
      ? Boolean(raw.is_active)
      : raw?.active !== undefined
      ? Boolean(raw.active)
      : true;
  const tutorId = toStringId(
    raw?.tutor_profile_id ??
      raw?.tutor_id ??
      raw?.owner_id ??
      raw?.profile_id ??
      raw?.tutor?.id ??
      ""
  );
  const tutor = normalizeTutor(raw, tutorId, profile);
  const totalQuestions =
    typeof raw?.total_questions === "number"
      ? raw.total_questions
      : typeof raw?.questionCount === "number"
      ? raw.questionCount
      : Array.isArray(raw?.questions)
      ? raw.questions.length
      : 0;
  const duration =
    raw?.time_limit_minutes ??
    raw?.duration_minutes ??
    raw?.duration ??
    raw?.timeLimit ??
    undefined;

  const questionsRaw = Array.isArray(raw?.questions)
    ? (raw?.questions as RawDoc[])
    : [];
  const questions = includeQuestions
    ? questionsRaw.map((question, index) => normalizeQuestion(question, index))
    : undefined;

  return {
    id,
    title: String(raw?.title ?? raw?.name ?? "Untitled Quiz"),
    description: raw?.description ? String(raw.description) : undefined,
    subject,
    subject_id: subjectId || undefined,
    tutor,
    is_active: isActive,
    total_questions: totalQuestions,
    total_attempts: attempts,
    duration_minutes:
      typeof duration === "number" ? duration : Number(duration) || undefined,
    created_at: created ? String(created) : undefined,
    updated_at: updated ? String(updated) : undefined,
    questions,
  };
}

async function fetchProfiles(profileIds: string[]): Promise<Map<string, ProfileInfo>> {
  const out = new Map<string, ProfileInfo>();
  const unique = Array.from(new Set(profileIds.filter(Boolean)));
  if (!unique.length) return out;

  const objectIds = unique.filter(looksLikeObjectId);
  const emails = unique.filter((id) => id.includes("@"));
  const userIds = unique.filter(
    (id) => !looksLikeObjectId(id) && !id.includes("@")
  );

  const or: any[] = [];
  if (objectIds.length) or.push({ _id: { $in: objectIds } });
  if (userIds.length) or.push({ user_id: { $in: userIds } });
  if (emails.length) or.push({ email: { $in: emails } });

  if (!or.length) return out;

  const res = await api.get("/api/profiles", {
    params: {
      q: JSON.stringify({ $or: or }),
      limit: Math.max(unique.length * 2, 50),
    },
  });
  const rows = unwrapList(res.data);
  for (const row of rows) {
    const base: ProfileInfo = {
      id: toStringId(row?._id ?? row?.id ?? row?.user_id ?? row?.email ?? ""),
      full_name: String(row?.full_name ?? row?.name ?? row?.display_name ?? ""),
      email: row?.email ? String(row.email) : undefined,
      avatar_url: row?.avatar_url ? String(row.avatar_url) : undefined,
    };
    if (!base.id) continue;
    out.set(base.id, base);
    if (row?.user_id) out.set(String(row.user_id), base);
    if (row?.email) out.set(String(row.email), base);
  }
  return out;
}

async function fetchAttemptsMap(quizIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!quizIds.length) return map;

  const res = await api.get("/api/quiz_attempts", {
    params: {
      q: JSON.stringify({ quiz_id: { $in: quizIds } }),
      limit: Math.max(quizIds.length * 50, 200),
    },
  });
  const rows = unwrapList(res.data);
  for (const row of rows) {
    const quizId = toStringId(row?.quiz_id ?? row?.quizId ?? row?.quiz?.id ?? "");
    if (!quizId) continue;
    map.set(quizId, (map.get(quizId) ?? 0) + 1);
  }
  return map;
}

async function fetchQuizzesFromApi(): Promise<RawDoc[]> {
  const res = await api.get("/api/quizzes", {
    params: {
      limit: 200,
      sort: JSON.stringify({ createdAt: -1 }),
    },
  });
  return unwrapList(res.data);
}

async function normalizeQuizzes(
  rawQuizzes: RawDoc[],
  includeQuestions: boolean
): Promise<AdminQuiz[]> {
  if (!rawQuizzes.length) return [];
  const quizIds = Array.from(
    new Set(
      rawQuizzes.map((q) => toStringId(q?._id ?? q?.id ?? "")).filter(Boolean)
    )
  );
  const tutorIds = Array.from(
    new Set(
      rawQuizzes
        .map((q) =>
          toStringId(
            q?.tutor_profile_id ??
              q?.tutor_id ??
              q?.owner_id ??
              q?.profile_id ??
              q?.tutor?.id ??
              ""
          )
        )
        .filter(Boolean)
    )
  );

  const [attemptsMap, profiles] = await Promise.all([
    fetchAttemptsMap(quizIds),
    fetchProfiles(tutorIds),
  ]);

  return rawQuizzes.map((raw, index) => {
    const quizId = toStringId(raw?._id ?? raw?.id ?? String(index));
    const tutorId = toStringId(
      raw?.tutor_profile_id ??
        raw?.tutor_id ??
        raw?.owner_id ??
        raw?.profile_id ??
        raw?.tutor?.id ??
        ""
    );
    const attempts = attemptsMap.get(quizId) ?? 0;
    return normalizeQuiz(raw, attempts, tutorId ? profiles.get(tutorId) : undefined, includeQuestions);
  });
}

async function buildQuizzes(includeQuestions: boolean): Promise<AdminQuiz[]> {
  const raw = await fetchQuizzesFromApi();
  return normalizeQuizzes(raw, includeQuestions);
}

async function ensureQuizzesLoaded(includeQuestions = false): Promise<AdminQuiz[]> {
  if (!inflightQuizzesPromise) {
    inflightQuizzesPromise = buildQuizzes(includeQuestions).finally(() => {
      inflightQuizzesPromise = null;
    });
  }
  const quizzes = await inflightQuizzesPromise;
  if (!includeQuestions) {
    return quizzes.map((quiz) => ({ ...quiz, questions: undefined }));
  }
  return quizzes.map((quiz) => ({ ...quiz, questions: quiz.questions ? [...quiz.questions] : undefined }));
}

function computeStats(quizzes: AdminQuiz[]): QuizStats {
  const total = quizzes.length;
  const active = quizzes.filter((q) => q.is_active).length;
  const inactive = total - active;
  const by_subject: Record<string, number> = {};
  let total_attempts = 0;
  for (const quiz of quizzes) {
    const subjectKey = quiz.subject || "Unknown";
    by_subject[subjectKey] = (by_subject[subjectKey] ?? 0) + 1;
    total_attempts += quiz.total_attempts ?? 0;
  }
  return { total, active, inactive, total_attempts, by_subject };
}

async function getAllQuizzes(): Promise<AdminQuiz[]> {
  return ensureQuizzesLoaded(false);
}

async function getQuizStats(): Promise<QuizStats> {
  try {
    const res = await api.get("/api/quizzes/stats");
    const data = res.data;
    if (data && typeof data === "object") {
      const total = Number(data.total ?? data.count ?? data.total_quizzes ?? 0) || 0;
      const active = Number(data.active ?? data.active_quizzes ?? data.enabled ?? 0) || 0;
      const inactive = Number(data.inactive ?? total - active) || 0;
      const total_attempts = Number(data.total_attempts ?? data.attempts ?? 0) || 0;
      const by_subject = (typeof data.by_subject === "object" && data.by_subject)
        ? data.by_subject as Record<string, number>
        : {};
      return { total, active, inactive, total_attempts, by_subject };
    }
  } catch (err) {
    // swallow and fall back to computed stats
  }
  const quizzes = await ensureQuizzesLoaded(false);
  return computeStats(quizzes);
}

async function getQuizDetails(id: string): Promise<AdminQuiz | null> {
  const encoded = encodeURIComponent(id);
  try {
    const res = await api.get(`/api/quizzes/${encoded}`);
    const raw = res.data && typeof res.data === "object" && !Array.isArray(res.data)
      ? res.data
      : unwrapList(res.data)[0];
    if (raw) {
      const quizId = toStringId(raw?._id ?? raw?.id ?? id);
      const [attemptsMap, profiles] = await Promise.all([
        fetchAttemptsMap([quizId]),
        fetchProfiles([
          toStringId(
            raw?.tutor_profile_id ??
              raw?.tutor_id ??
              raw?.owner_id ??
              raw?.profile_id ??
              raw?.tutor?.id ??
              ""
          ),
        ].filter(Boolean)),
      ]);
      const tutorId = toStringId(
        raw?.tutor_profile_id ??
          raw?.tutor_id ??
          raw?.owner_id ??
          raw?.profile_id ??
          raw?.tutor?.id ??
          ""
      );
      return normalizeQuiz(
        raw,
        attemptsMap.get(quizId) ?? 0,
        tutorId ? profiles.get(tutorId) : undefined,
        true
      );
    }
  } catch (err) {
    // fall back to search via list endpoint below
  }

  const res = await api.get("/api/quizzes", {
    params: {
      q: JSON.stringify({
        $or: [
          { _id: id },
          { id },
          { quiz_id: id },
          { slug: id },
        ],
      }),
      limit: 1,
    },
  });
  const rawQuiz = unwrapList(res.data)[0];
  if (!rawQuiz) return null;
  const quizId = toStringId(rawQuiz?._id ?? rawQuiz?.id ?? id);
  const [attemptsMap, profiles] = await Promise.all([
    fetchAttemptsMap([quizId]),
    fetchProfiles([
      toStringId(
        rawQuiz?.tutor_profile_id ??
          rawQuiz?.tutor_id ??
          rawQuiz?.owner_id ??
          rawQuiz?.profile_id ??
          rawQuiz?.tutor?.id ??
          ""
      ),
    ].filter(Boolean)),
  ]);
  const tutorId = toStringId(
    rawQuiz?.tutor_profile_id ??
      rawQuiz?.tutor_id ??
      rawQuiz?.owner_id ??
      rawQuiz?.profile_id ??
      rawQuiz?.tutor?.id ??
      ""
  );
  return normalizeQuiz(
    rawQuiz,
    attemptsMap.get(quizId) ?? 0,
    tutorId ? profiles.get(tutorId) : undefined,
    true
  );
}

async function deleteQuiz(id: string): Promise<void> {
  try {
    await api.delete(`/api/quizzes/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      if (status === 404 || status === 405) {
        throw new Error("Deleting quizzes is not supported by the current API.");
      }
    }
    throw err;
  }
}

async function getQuizPdfs(): Promise<any[]> {
  const res = await api.get("/api/quiz_pdfs", {
    params: { limit: 200 },
  });
  const items = unwrapList(res.data);
  return Array.isArray(items) ? items : [];
}

export const AdminQuizService = {
  getAllQuizzes,
  getQuizStats,
  getQuizDetails,
  deleteQuiz,
  getQuizPdfs,
};

export default AdminQuizService;
