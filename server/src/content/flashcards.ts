import { Request, Response } from "express";
import { FlashcardSet, Flashcard, dynamicFind, parseJSON } from "../core";

/* ---------- Flashcards ---------- */
export async function getFlashcardSets(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, FlashcardSet, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: "Subject" }],
  });
}

export async function createFlashcardSet(req: Request, res: Response) {
  try {
    const doc = await FlashcardSet.create(req.body || {});
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function getFlashcards(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { card_order: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 500;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Flashcard, { q, sort, limit, offset });
}

export async function createFlashcards(req: Request, res: Response) {
  try {
    let cards = req.body;
    if (!Array.isArray(cards)) cards = [cards];
    const docs = await Flashcard.insertMany(cards);
    res.json({ ok: true, data: docs });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function updateFlashcard(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await Flashcard.updateOne({ _id: id }, { $set: req.body || {} });
    const updated = await Flashcard.findById(id);
    res.json({ ok: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}
