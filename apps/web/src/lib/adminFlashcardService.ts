import { AxiosError } from "axios";
import { getApi } from "./api";

const api = getApi();

type RawDoc = Record<string, any> | null | undefined;
type RawList = RawDoc[] | { data?: RawDoc[]; items?: RawDoc[] } | null | undefined;

export type AdminFlashcardTutor = {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
};

export type AdminFlashcardCard = {
  id: string;
  front_text: string;
  back_text: string;
  card_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AdminFlashcardSet = {
  id: string;
  title: string;
  subject: string;
  subject_id?: string;
  topic?: string;
  grade_level?: string;
  grade_level_code?: string;
  description?: string;
  is_active: boolean;
  card_count: number;
  tutor: AdminFlashcardTutor;
  created_at?: string;
  updated_at?: string;
  cards?: AdminFlashcardCard[];
};

export type FlashcardStats = {
  total: number;
  active: number;
  inactive: number;
  total_cards: number;
  by_subject: Record<string, number>;
};

type ProfileInfo = {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
};

let inflightSetsPromise: Promise<AdminFlashcardSet[]> | null = null;

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

function normalizeCard(raw: RawDoc, setId: string, fallbackIndex: number): AdminFlashcardCard {
  const id = toStringId(raw?.id ?? raw?._id ?? `${setId}-${fallbackIndex}`);
  const front =
    (raw?.front_text ?? raw?.front ?? raw?.q ?? raw?.question ?? "").toString();
  const back =
    (raw?.back_text ?? raw?.back ?? raw?.a ?? raw?.answer ?? raw?.explanation ?? "")
      .toString();
  const orderRaw =
    raw?.card_order ??
    raw?.order ??
    raw?.cardOrder ??
    raw?.answer_order ??
    fallbackIndex;
  const order = typeof orderRaw === "number" ? orderRaw : Number(orderRaw) || fallbackIndex;
  const isActive = raw?.is_active !== undefined ? Boolean(raw.is_active) : true;
  const created = raw?.created_at ?? raw?.createdAt;
  const updated = raw?.updated_at ?? raw?.updatedAt;

  return {
    id,
    front_text: front,
    back_text: back,
    card_order: order,
    is_active: isActive,
    created_at: created ? String(created) : undefined,
    updated_at: updated ? String(updated) : undefined,
  };
}

function deriveEmbeddedCards(raw: RawDoc, setId: string): AdminFlashcardCard[] {
  if (!raw) return [];
  const embedded = Array.isArray(raw.cards) ? raw.cards : [];
  return embedded.map((card, idx) => normalizeCard(card, setId, idx));
}

function normalizeTutor(raw: RawDoc, fallbackId: string): AdminFlashcardTutor {
  const tutorName =
    raw?.tutor_name ??
    raw?.tutor_full_name ??
    raw?.tutor?.full_name ??
    raw?.tutorName ??
    raw?.tutorFullName ??
    "Unknown tutor";
  const tutorEmail =
    raw?.tutor_email ?? raw?.tutor?.email ?? raw?.email ?? raw?.tutorEmail;
  const avatar = raw?.tutor?.avatar_url ?? raw?.avatar_url ?? raw?.avatarUrl;
  return {
    id: fallbackId,
    full_name: String(tutorName || "Unknown tutor"),
    email: tutorEmail ? String(tutorEmail) : undefined,
    avatar_url: avatar ? String(avatar) : undefined,
  };
}

function normalizeSet(
  raw: RawDoc,
  cards: AdminFlashcardCard[],
  tutorInfo: ProfileInfo | undefined
): AdminFlashcardSet {
  const id = toStringId(raw?._id ?? raw?.id ?? raw?.set_uuid ?? raw?.slug ?? "");
  let subjectNameValue =
    raw?.subject?.name ??
    raw?.subject_name ??
    raw?.subject ??
    raw?.subject_title ??
    raw?.subjectId ??
    raw?.subjectName ??
    null;

  if (!subjectNameValue && raw?.subject_id) {
    if (typeof raw.subject_id === "object") {
      subjectNameValue =
        raw.subject_id.name ??
        raw.subject_id.title ??
        raw.subject_id.display_name ??
        raw.subject_id.code ??
        raw.subject_id.subject ??
        null;
    } else {
      subjectNameValue = raw.subject_id;
    }
  }

  const subjectName = String(subjectNameValue || "Unknown Subject");
  const subjectId =
    typeof raw?.subject_id === "object"
      ? toStringId(raw?.subject_id?._id ?? raw?.subject_id?.id)
      : toStringId(raw?.subject_id);
  const grade =
    raw?.grade_level ??
    raw?.grade ??
    raw?.grade_level_code ??
    raw?.gradeLevel ??
    raw?.gradeLevelCode ??
    undefined;
  const description = raw?.description ?? raw?.details ?? undefined;
  const topic = raw?.topic ?? raw?.subtopic ?? undefined;
  const created = raw?.created_at ?? raw?.createdAt;
  const updated = raw?.updated_at ?? raw?.updatedAt;
  const isActive =
    raw?.is_active !== undefined ? Boolean(raw.is_active) : raw?.active !== undefined ? Boolean(raw.active) : true;
  const tutorId =
    toStringId(
      raw?.tutor_profile_id ??
        raw?.tutor_id ??
        raw?.owner_id ??
        raw?.profile_id ??
        raw?.tutor?.id ??
        ""
    );
  const tutor = tutorInfo
    ? {
        id: tutorInfo.id,
        full_name: tutorInfo.full_name,
        email: tutorInfo.email,
        avatar_url: tutorInfo.avatar_url,
      }
    : normalizeTutor(raw, tutorId);
  const cardCount = cards.length || (Array.isArray(raw?.cards) ? raw.cards.length : Number(raw?.card_count) || 0);

  const sortedCards = [...cards].sort((a, b) => a.card_order - b.card_order);

  return {
    id,
    title: String(raw?.title ?? raw?.name ?? "Untitled Set"),
    subject: String(subjectName || "Unknown Subject"),
    subject_id: subjectId || undefined,
    topic: topic ? String(topic) : undefined,
    grade_level: grade ? String(grade) : undefined,
    grade_level_code: raw?.grade_level_code ? String(raw.grade_level_code) : undefined,
    description: description ? String(description) : undefined,
    is_active: isActive,
    card_count: cardCount,
    tutor,
    created_at: created ? String(created) : undefined,
    updated_at: updated ? String(updated) : undefined,
    cards: sortedCards,
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

async function fetchCardsForSets(setIds: string[]): Promise<Map<string, AdminFlashcardCard[]>> {
  const map = new Map<string, AdminFlashcardCard[]>();
  if (!setIds.length) return map;

  const res = await api.get("/api/flashcards", {
    params: {
      q: JSON.stringify({ set_id: { $in: setIds } }),
      limit: Math.max(setIds.length * 200, 500),
    },
  });
  const rows = unwrapList(res.data);
  rows.forEach((row, index) => {
    const setId = toStringId(row?.set_id ?? row?.setId ?? "");
    const normalizedSetId = setIds.includes(setId) ? setId : toStringId(row?.set_id?._id);
    const key = normalizedSetId || setId;
    if (!key) return;
    const bucket = map.get(key) ?? [];
    bucket.push(normalizeCard(row, key, index));
    map.set(key, bucket);
  });
  return map;
}

async function fetchSetsFromApi(): Promise<RawDoc[]> {
  const res = await api.get("/api/flashcard_sets", {
    params: {
      limit: 500,
      sort: JSON.stringify({ createdAt: -1 }),
    },
  });
  return unwrapList(res.data);
}

async function buildSets(includeCards: boolean): Promise<AdminFlashcardSet[]> {
  const rawSets = await fetchSetsFromApi();
  return normalizeSets(rawSets, includeCards);
}

async function normalizeSets(
  rawSets: RawDoc[],
  includeCards: boolean
): Promise<AdminFlashcardSet[]> {
  if (!rawSets.length) return [];
  const setIds = Array.from(new Set(rawSets.map((s) => toStringId(s?._id ?? s?.id ?? "")).filter(Boolean)));
  const tutorIds = Array.from(
    new Set(
      rawSets
        .map((s) =>
          toStringId(
            s?.tutor_profile_id ??
              s?.tutor_id ??
              s?.owner_id ??
              s?.profile_id ??
              s?.tutor?.id ??
              ""
          )
        )
        .filter(Boolean)
    )
  );

  const [profileMap, cardsMap] = await Promise.all([
    fetchProfiles(tutorIds),
    fetchCardsForSets(setIds),
  ]);

  return rawSets.map((raw, rawIndex) => {
    const setId = toStringId(raw?._id ?? raw?.id ?? raw?.set_uuid ?? raw?.slug ?? String(rawIndex));
    const tutorId = toStringId(
      raw?.tutor_profile_id ??
        raw?.tutor_id ??
        raw?.owner_id ??
        raw?.profile_id ??
        raw?.tutor?.id ??
        ""
    );
    const cardsFromQuery = cardsMap.get(setId) ?? [];
    const embedded = deriveEmbeddedCards(raw, setId);
    const cards = cardsFromQuery.length ? cardsFromQuery : embedded;
    const normalized = normalizeSet(raw, cards, tutorId ? profileMap.get(tutorId) : undefined);
    if (!includeCards) {
      return { ...normalized, cards: undefined };
    }
    return normalized;
  });
}

async function ensureSetsLoaded(includeCards = false): Promise<AdminFlashcardSet[]> {
  if (!inflightSetsPromise) {
    inflightSetsPromise = buildSets(includeCards).finally(() => {
      inflightSetsPromise = null;
    });
  }
  const sets = await inflightSetsPromise;
  if (!includeCards) {
    return sets.map((set) => ({ ...set, cards: undefined }));
  }
  return sets.map((set) => ({ ...set, cards: set.cards ? [...set.cards] : undefined }));
}

function computeStats(sets: AdminFlashcardSet[]): FlashcardStats {
  const total = sets.length;
  const active = sets.filter((s) => s.is_active).length;
  const inactive = total - active;
  const by_subject: Record<string, number> = {};
  let total_cards = 0;
  for (const set of sets) {
    const subjectKey = set.subject || "Unknown";
    by_subject[subjectKey] = (by_subject[subjectKey] ?? 0) + 1;
    total_cards += set.card_count ?? 0;
  }
  return { total, active, inactive, total_cards, by_subject };
}

async function getAllFlashcardSets(): Promise<AdminFlashcardSet[]> {
  return ensureSetsLoaded(false);
}

async function getFlashcardStats(): Promise<FlashcardStats> {
  const sets = await ensureSetsLoaded(false);
  return computeStats(sets);
}

async function getFlashcardSetDetails(id: string): Promise<AdminFlashcardSet | null> {
  const query = {
    $or: [
      { _id: id },
      { id },
      { set_uuid: id },
      { slug: id },
    ],
  };
  const res = await api.get("/api/flashcard_sets", {
    params: { q: JSON.stringify(query), limit: 1 },
  });
  const rawSet = unwrapList(res.data)[0];
  if (!rawSet) return null;

  const setId = toStringId(rawSet?._id ?? rawSet?.id ?? id);
  const cardsRes = await api.get("/api/flashcards", {
    params: {
      q: JSON.stringify({ set_id: setId }),
      limit: 500,
    },
  });
  const cardsRaw = unwrapList(cardsRes.data);
  const cards = cardsRaw.length
    ? cardsRaw.map((card, idx) => normalizeCard(card, setId, idx))
    : deriveEmbeddedCards(rawSet, setId);

  const tutorId = toStringId(
    rawSet?.tutor_profile_id ??
      rawSet?.tutor_id ??
      rawSet?.owner_id ??
      rawSet?.profile_id ??
      rawSet?.tutor?.id ??
      ""
  );
  const profileMap = await fetchProfiles(tutorId ? [tutorId] : []);
  return normalizeSet(rawSet, cards, tutorId ? profileMap.get(tutorId) : undefined);
}

async function deleteFlashcardSet(id: string): Promise<void> {
  try {
    await api.delete(`/api/flashcard_sets/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      if (status === 404 || status === 405) {
        throw new Error("Deleting flashcard sets is not supported by the current API.");
      }
    }
    throw err;
  }
}

export const AdminFlashcardService = {
  getAllFlashcardSets,
  getFlashcardStats,
  getFlashcardSetDetails,
  deleteFlashcardSet,
};

export default AdminFlashcardService;

