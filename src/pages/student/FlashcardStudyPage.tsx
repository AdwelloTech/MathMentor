import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { flashcards } from "@/lib/flashcards";
import type { Flashcard, FlashcardSet } from "@/types/flashcards";
import { motion } from "framer-motion";
// Removed jsPDF/html2canvas usage in favor of fast vector export only
// @ts-ignore - types are bundled differently
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";
// Make vfs assignment robust across different builds (pdfFonts.vfs or pdfFonts.pdfMake.vfs)
// @ts-ignore
const _vfs = (pdfFonts as any)?.vfs || (pdfFonts as any)?.pdfMake?.vfs;
// @ts-ignore
if (_vfs) (pdfMake as any).vfs = _vfs;

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

  // Removed: text list PDF

  // Removed: 2x3 grid PDF

  // Removed: single card per page PDF

  // Utility: render a styled card (Front/Back) into an image via html2canvas for full Unicode support
  // Removed: html2canvas styled capture utilities

  // Removed: side-by-side image PDF

  // Removed: stacked image PDF

  // Removed: exact-style image PDF

  const downloadVectorFastPdf = () => {
    if (!setData) return;
    const dd: any = {
      pageSize: "A4",
      pageMargins: [36, 36, 36, 36],
      defaultStyle: { fontSize: 12 },
      content: [] as any[],
    };

    const makeCard = (text: string, isFront: boolean) => {
      const cardH = 280; // keep original card size
      const cardW = 500; // keep original card size
      const innerPad = 24; // padding for text only
      const fontSz = isFront ? 14 : 12;
      const lineH = Math.round(fontSz * 1.25);
      const approxCharsPerLine = Math.max(
        10,
        Math.floor((cardW - innerPad * 2) / (fontSz * 0.6))
      );
      const linesApprox = Math.max(
        1,
        Math.ceil((text || "").length / approxCharsPerLine)
      );
      const estBlockH = linesApprox * lineH;
      const topOffset =
        -cardH + Math.floor(cardH / 2) - Math.floor(estBlockH / 2);
      const svg = `<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" rx="16" ry="16" width="${cardW}" height="${cardH}" fill="#ffffff" stroke="#e5e7eb" stroke-width="1" />
      </svg>`;
      return {
        alignment: "center",
        stack: [
          { svg, margin: [0, 0, 0, 0] },
          {
            columns: [
              {
                width: cardW - innerPad * 2,
                text: text || "",
                alignment: "center",
                bold: isFront,
                fontSize: fontSz,
                lineHeight: 1.25,
              },
            ],
            columnGap: 0,
            margin: [innerPad, topOffset, innerPad, 0],
          },
          { text: "", margin: [0, Math.ceil(cardH / 2), 0, 8] },
        ],
        margin: [0, 0, 0, 0],
      } as any;
    };

    setData.cards.forEach((c, idx) => {
      // Each card pair gets its own page
      if (idx > 0) {
        dd.content.push({ text: "", pageBreak: "before" });
      }

      dd.content.push({
        text: "Front",
        bold: true,
        fontSize: 14,
        margin: [2, 0, 0, 4],
      });
      dd.content.push(makeCard(c.front_text, true));
      dd.content.push({
        text: "Back",
        bold: true,
        fontSize: 14,
        margin: [2, 12, 0, 4], // more space between cards
      });
      dd.content.push(makeCard(c.back_text, false));
    });

    pdfMake
      .createPdf(dd)
      .download(
        `${(setData.title || "flashcards").replace(
          /[^a-z0-9\-\_]+/gi,
          "_"
        )}_fast.pdf`
      );
  };

  if (!setData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{setData.title}</h1>
          <div className="text-sm text-gray-600">
            {setData.subject}
            {setData.topic ? ` • ${setData.topic}` : ""}
          </div>
        </div>
        <button
          onClick={downloadVectorFastPdf}
          className="px-4 py-2 bg-green-600 text-white rounded-md mt-2"
        >
          Download PDF
        </button>
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

      {/* Removed bottom PDF button; moved to top-right */}
    </div>
  );
};

export default FlashcardStudyPage;
