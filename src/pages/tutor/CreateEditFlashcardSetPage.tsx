import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { flashcards } from "@/lib/flashcards";
import type { CreateFlashcardSetData, FlashcardSet } from "@/types/flashcards";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { getNoteSubjects } from "@/lib/notes";

const CreateEditFlashcardSetPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const isEdit = Boolean(setId);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [cards, setCards] = useState<{ front: string; back: string }[]>([
    { front: "", back: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<
    { id: string; name: string; display_name: string }[]
  >([]);

  useEffect(() => {
    if (!isEdit || !setId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await flashcards.sets.withCards(setId);
        setTitle(data.title);
        setSubject(data.subject);
        setCards(
          (data.cards || []).map((c) => ({
            front: c.front_text,
            back: c.back_text,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, setId]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getNoteSubjects();
        setSubjects(list);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const addCard = () => setCards([...cards, { front: "", back: "" }]);
  const removeCard = (idx: number) =>
    setCards(cards.filter((_, i) => i !== idx));

  const save = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      if (!isEdit) {
        const payload: CreateFlashcardSetData = {
          title,
          subject,
          cards: cards.map((c, i) => ({
            front_text: c.front,
            back_text: c.back,
            card_order: i,
          })),
        };
        await flashcards.sets.create(profile.id, payload);
        toast.success("Flash card set created");
      } else if (setId) {
        await flashcards.sets.update(setId, { title, subject });
        // Simplify: delete and recreate cards for now
        // In a later pass, do granular edits
        // Remove existing cards
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error } = await (await import("@/lib/supabase")).supabase
          .from("flashcards")
          .delete()
          .eq("set_id", setId);
        // Reinsert
        const rows = cards.map((c, i) => ({
          set_id: setId,
          front_text: c.front,
          back_text: c.back,
          card_order: i,
        }));
        const { error: insertError } = await (
          await import("@/lib/supabase")
        ).supabase
          .from("flashcards")
          .insert(rows);
        if (insertError) throw insertError;
        toast.success("Flash card set updated");
      }
      navigate("/tutor/flashcards");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save set");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit" : "Create"} Flash Card Set
        </h1>
        <button
          onClick={save}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {loading
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
            ? "Update"
            : "Create"}
        </button>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Set Title"
            className="border rounded-md p-2"
          />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border rounded-md p-2 bg-white"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <h2 className="font-semibold">Cards</h2>
          <button
            onClick={addCard}
            className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" /> Add Card
          </button>
        </div>

        <div className="space-y-4">
          {cards.map((c, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4"
            >
              <textarea
                value={c.front}
                onChange={(e) =>
                  setCards(
                    cards.map((cc, i) =>
                      i === idx ? { ...cc, front: e.target.value } : cc
                    )
                  )
                }
                className="border rounded-md p-2 min-h-[90px]"
                placeholder={`Front (term/question) #${idx + 1}`}
              />
              <div className="relative">
                <textarea
                  value={c.back}
                  onChange={(e) =>
                    setCards(
                      cards.map((cc, i) =>
                        i === idx ? { ...cc, back: e.target.value } : cc
                      )
                    )
                  }
                  className="border rounded-md p-2 min-h-[90px] w-full"
                  placeholder={`Back (definition/answer) #${idx + 1}`}
                />
                {cards.length > 1 && (
                  <button
                    onClick={() => removeCard(idx)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                    title="Remove card"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateEditFlashcardSetPage;
