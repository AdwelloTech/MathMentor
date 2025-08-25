import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { flashcards } from "@/lib/flashcards";
import type { CreateFlashcardSetData } from "@/types/flashcards";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { subjectsService } from "@/lib/subjects";
import { generateAIFlashcards, extractTextFromPdf } from "@/lib/ai";

// Local type to track AI workflow in UI
type DraftCard = {
  front: string;
  back: string;
  aiGenerated?: boolean;
  aiStatus?: "pending" | "approved";
};

const CreateEditFlashcardSetPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const isEdit = Boolean(setId);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [cards, setCards] = useState<DraftCard[]>([{ front: "", back: "" }]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<
    { id: string; name: string; display_name: string }[]
  >([]);
  const [gradeLevel, setGradeLevel] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNumCards, setAiNumCards] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [pdfs, setPdfs] = useState<
    Array<{ pdfText: string; fileName: string; fileSize: number }>
  >([]);

  useEffect(() => {
    if (!isEdit || !setId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await flashcards.sets.withCards(setId);
        setTitle(data.title);
        setSubject(data.subject);
        setGradeLevel(data.grade_level || "");
        setCards(
          (data.cards || []).map((c) => ({
            front: c.front_text,
            back: c.back_text,
            aiGenerated: false,
            aiStatus: undefined,
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
        const list = await subjectsService.listActive();
        setSubjects(list as any);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const addCard = () => setCards([...cards, { front: "", back: "" }]);
  const removeCard = (idx: number) => {
    // Prevent removing the last card
    if (cards.length <= 1) {
      toast.error(
        "Cannot remove the last card. Please add another card first."
      );
      return;
    }
    setCards(cards.filter((_, i) => i !== idx));
  };

  const approveAICard = (idx: number) => {
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, aiStatus: "approved" } : c))
    );
  };

  const discardAICard = (idx: number) => {
    setCards((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!profile) return;
    try {
      setLoading(true);

      // Block save if there are pending AI cards
      const pending = cards.filter(
        (c) => c.aiGenerated && c.aiStatus !== "approved"
      );
      if (pending.length > 0) {
        toast.error(
          `Please approve or discard ${pending.length} pending AI card${
            pending.length > 1 ? "s" : ""
          }`
        );
        setLoading(false);
        return;
      }

      // Validate that we have at least one non-empty card
      const validCards = cards.filter(
        (card) => card.front.trim() && card.back.trim()
      );

      if (validCards.length === 0) {
        toast.error(
          "Please add at least one flashcard with both question and answer filled in."
        );
        setLoading(false);
        return;
      }

      // Only include manual or approved AI cards
      const includedCards = validCards.filter(
        (c) => !c.aiGenerated || c.aiStatus === "approved"
      );

      if (!isEdit) {
        if (!gradeLevel.trim()) {
          toast.error("Grade is required");
          setLoading(false);
          return;
        }
        const payload: CreateFlashcardSetData = {
          title,
          subject,
          grade_level: gradeLevel,
          cards: includedCards.map((c, i) => ({
            front_text: c.front,
            back_text: c.back,
            card_order: i,
          })),
        };
        await flashcards.sets.create(profile.id, payload);
        toast.success("Flash card set created");
      } else if (setId) {
        if (!gradeLevel.trim()) {
          toast.error("Grade is required");
          setLoading(false);
          return;
        }
        await flashcards.sets.update(setId, {
          title,
          subject,
          grade_level: gradeLevel,
        });
        // Remove existing cards
        await (await import("@/lib/supabase")).supabase
          .from("flashcards")
          .delete()
          .eq("set_id", setId);
        // Reinsert with validation (only approved/manual)
        const validCardsForUpdate = includedCards.map((c, i) => ({
          set_id: setId,
          front_text: c.front.trim(),
          back_text: c.back.trim(),
          card_order: i,
        }));

        if (validCardsForUpdate.length > 0) {
          const { error: insertError } = await (
            await import("@/lib/supabase")
          ).supabase
            .from("flashcards")
            .insert(validCardsForUpdate);
          if (insertError) throw insertError;
        }
        toast.success("Flash card set updated");
      }
      navigate("/tutor/flashcards");
    } catch (e: any) {
      console.error(e);
      // Show specific validation error if available
      if (e.message && e.message.includes("Card")) {
        toast.error(e.message);
      } else {
        toast.error("Failed to save set");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!subject) {
      toast.error("Please select a subject first.");
      return;
    }
    if (!gradeLevel.trim()) {
      toast.error("Please enter a grade level first.");
      return;
    }
    setAiLoading(true);
    try {
      // Combine all PDF texts for context
      const combinedPdfText = pdfs.length > 0
        ? pdfs.map(pdf => pdf.pdfText).join('\n\n')
        : undefined;

      // Use dedicated flashcards AI generator
      const aiCards = await generateAIFlashcards({
        subject,
        gradeLevel,
        numCards: aiNumCards,
        title,
        difficulty: aiDifficulty,
        pdfText: combinedPdfText,
      });

      // Map AI cards directly to flashcard format with pending status
      const mapped: DraftCard[] = aiCards.map((card: any) => ({
        front: card.front_text,
        back: card.back_text,
        aiGenerated: true,
        aiStatus: "pending",
      }));

      setCards((prev) => {
        const combined = [...prev, ...mapped];
        return combined;
      });

      toast.success(`Generated ${mapped.length} flashcards`);
    } catch (e) {
      console.error(e);
      toast.error("AI generation failed. Please try again.");
    } finally {
      setAiLoading(false);
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
          <input
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            placeholder="Grade (e.g., Grade 7)"
            className="border rounded-md p-2"
          />
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Cards:</span>
            <input
              type="number"
              min={1}
              max={40}
              value={aiNumCards}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setAiNumCards(1); // Default to 1 if empty
                } else {
                  const num = parseInt(value, 10);
                  if (!isNaN(num) && num >= 1 && num <= 40) {
                    setAiNumCards(num);
                  }
                }
              }}
              className="border rounded-md p-2 w-24"
              placeholder="# Cards"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Difficulty:</span>
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as any)}
              className="border rounded-md p-2"
              aria-label="Difficulty"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating…
              </>
            ) : (
              "Generate with AI"
            )}
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optional: Upload syllabus PDF for context
          </label>
          <div className="flex items-center justify-between rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-3">
            <div className="flex items-center gap-3">
              <input
                id="flashcards-pdf"
                type="file"
                accept="application/pdf"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;

                  if (files.length > 10) {
                    toast.error("Maximum 10 PDF files allowed per selection");
                    return;
                  }

                  try {
                    const currentCount = pdfs.length;
                    if (currentCount + files.length > 10) {
                      toast.error("You can upload up to 10 PDFs in total");
                      return;
                    }

                    const { pdfs: extractedPdfs } = await extractTextFromPdf(files);
                    setPdfs((prev) => [...prev, ...extractedPdfs]);

                    const newTotal = currentCount + extractedPdfs.length;
                    if (newTotal === 1) {
                      toast.success("1 PDF processed for AI context");
                    } else {
                      toast.success(
                        `${extractedPdfs.length} PDF${
                          extractedPdfs.length > 1 ? "s" : ""
                        } processed for AI context (Total: ${newTotal}/10)`
                      );
                    }
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err?.message || "Failed to extract text from PDFs");
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="flashcards-pdf"
                className="inline-flex items-center px-3 py-2 bg-white border rounded-md text-sm cursor-pointer hover:bg-gray-50"
              >
                Choose PDFs (up to 10)
              </label>
              {pdfs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pdfs.map((pdf, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-700 bg-white border rounded-full px-2 py-1 flex items-center gap-1"
                    >
                      {pdf.fileName} ({Math.round(pdf.fileSize / 1024)} KB, {pdf.pdfText.length} chars)
                      <button
                        onClick={() =>
                          setPdfs((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="ml-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full w-4 h-4 flex items-center justify-center"
                        title="Remove PDF"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500">No files selected</span>
              )}
            </div>
            {pdfs.length > 0 && (
              <button
                onClick={() => setPdfs([])}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            PDFs up to 10MB each, maximum 10 files. We'll use their text as AI
            context.
          </p>
        </div>

        <div className="space-y-4">
          {cards.map((c, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4"
            >
              <div className="md:col-span-2 flex items-center justify-between -mt-1 mb-1">
                <div className="text-xs">
                  {c.aiGenerated && (
                    <span
                      className={`px-2 py-1 rounded-full ${
                        c.aiStatus === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      AI {c.aiStatus || "pending"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {c.aiGenerated && c.aiStatus !== "approved" && (
                    <>
                      <button
                        onClick={() => approveAICard(idx)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => discardAICard(idx)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Discard
                      </button>
                    </>
                  )}
                </div>
              </div>

              <textarea
                value={c.front}
                onChange={(e) =>
                  setCards(
                    cards.map((cc, i) =>
                      i === idx ? { ...cc, front: e.target.value } : cc
                    )
                  )
                }
                className="border rounded-md p-2 min-h-[90px] w-full"
                placeholder={`Front (term/question) #${idx + 1}`}
              />
              <div className="relative w-full">
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
                <button
                  onClick={() => removeCard(idx)}
                  className="absolute -top-2 -right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
                  title="Remove Card"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateEditFlashcardSetPage;
