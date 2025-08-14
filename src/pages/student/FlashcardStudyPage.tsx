import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { flashcards } from "@/lib/flashcards";
import type { Flashcard, FlashcardSet } from "@/types/flashcards";
import { motion } from "framer-motion";

const FlashcardStudyPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const [setData, setSetData] = useState<
    (FlashcardSet & { cards: Flashcard[] }) | null
  >(null);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    if (!setId) return;
    (async () => {
      const s = await flashcards.student.getSet(setId);
      setSetData(s);
    })();
  }, [setId]);

  const current = setData?.cards?.[index];
  const next = () => {
    setShowBack(false);
    if (!setData) return;
    setIndex((i) => (i + 1) % (setData.cards.length || 1));
  };
  const prev = () => {
    setShowBack(false);
    if (!setData) return;
    setIndex((i) => (i - 1 + setData.cards.length) % setData.cards.length);
  };

  if (!setData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{setData.title}</h1>
        <div className="text-sm text-gray-600">
          {setData.subject}
          {setData.topic ? ` • ${setData.topic}` : ""}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-gray-500 text-xs mb-2">Click card to flip</div>
        <motion.div
          className="relative [perspective:1200px]"
          onClick={() => setShowBack((s) => !s)}
        >
          <motion.div
            className="bg-white border rounded-xl shadow-md select-none cursor-pointer"
            style={{
              width: "min(90vw, 640px)",
              height: "clamp(260px, 52vw, 380px)",
              transformStyle: "preserve-3d",
            }}
            animate={{ rotateY: showBack ? 180 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center px-8 text-xl font-semibold whitespace-pre-wrap [backface-visibility:hidden]"
              style={{ transform: "rotateY(0deg)" }}
            >
              {current?.front_text}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center px-8 text-xl font-semibold whitespace-pre-wrap [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg)" }}
            >
              {current?.back_text}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={prev} className="px-4 py-2 bg-gray-100 rounded-md">
          Previous
        </button>
        <div className="text-sm text-gray-600">
          {index + 1} / {setData.cards.length}
        </div>
        <button onClick={next} className="px-4 py-2 bg-gray-100 rounded-md">
          Next
        </button>
      </div>
    </div>
  );
};

export default FlashcardStudyPage;
