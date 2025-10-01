import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  subject: string;
  topic?: string;
}

import { flashcards } from "@/lib/flashcards";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

// PDF imports
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
  const { profile } = useAuth();
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
      setIndex(0);
      setShowBack(false);
    })();
  }, [setId]);

  const current = setData?.cards?.[index];
  const isTutor = profile?.role === 'tutor';

  const next = () => {
    if (!setData || setData.cards.length === 0) return;
    setShowBack(false);
    setIndex((i) => (i + 1) % setData.cards.length);
  };

  const prev = () => {
    if (!setData || setData.cards.length === 0) return;
    setShowBack(false);
    setIndex((i) => (i - 1 + setData.cards.length) % setData.cards.length);
  };

  const downloadVectorFastPdf = () => {
    if (!setData || !setData.cards?.length) return;

    const dd: any = {
      pageSize: "A4",
      pageMargins: [36, 36, 36, 36],
      defaultStyle: { fontSize: 12 },
      content: [] as any[],
    };

    const makeCard = (text: string, isFront: boolean) => {
      const cardH = 280;
      const cardW = 500;
      const innerPad = 24;
      const fontSz = isFront ? 14 : 12;
      const lineH = Math.round(fontSz * 1.25);
      const approxCharsPerLine = Math.max(
        10,
        Math.floor((cardW - innerPad * 2) / (fontSz * 0.6))
      );
      const linesApprox = Math.max(1, Math.ceil((text || "").length / approxCharsPerLine));
      const estBlockH = linesApprox * lineH;
      const topOffset = -cardH + Math.floor(cardH / 2) - Math.floor(estBlockH / 2);
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
      if (idx > 0) dd.content.push({ text: "", pageBreak: "before" });

      dd.content.push({ text: "Front", bold: true, fontSize: 14, margin: [2, 0, 0, 4] });
      dd.content.push(makeCard(c.front_text, true));
      dd.content.push({ text: "Back", bold: true, fontSize: 14, margin: [2, 12, 0, 4] });
      dd.content.push(makeCard(c.back_text, false));
    });

    pdfMake
      .createPdf(dd)
      .download(
        `${(setData.title || "flashcards").replace(/[^a-z0-9\-\_]+/gi, "_")}_fast.pdf`
      );
  };

  if (!setData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin p-4 bg-green-900 rounded-2xl">
              <BookOpen className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-green-900">Loading Flashcards</h3>
              <p className="text-base text-slate-600">Preparing your study session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = setData.cards.length || 1;
  const progressPct = Math.round(((index + 1) / total) * 100);

  return (
    <div className={`min-h-screen ${isTutor ? 'bg-slate-800 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-4 sm:px-6 lg:px-8 py-10' : ''}`}>
      {/* Animated Background Elements */}
      {isTutor ? (
        <>
          {/* Tutor theme background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>

          {/* Floating decorative elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/15 to-yellow-400/15 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/15 to-green-400/15 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/10 to-yellow-300/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </>
      ) : (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-900/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      )}

      <div className={`relative ${isTutor ? 'z-10 max-w-7xl mx-auto px-6 pb-16 space-y-8' : 'max-w-6xl mx-auto px-6 py-8 space-y-8'}`}>
        {/* Header Section */}
        <motion.div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl shadow-lg ${isTutor ? 'bg-green-600' : 'bg-gradient-to-br from-green-900 to-green-800'}`}>
                <Sparkles className={`h-6 w-6 ${isTutor ? 'text-white' : 'text-yellow-400'}`} />
              </div>
              <h1 className={`text-4xl font-bold ${isTutor ? 'text-green-400' : 'bg-gradient-to-r from-green-900 to-green-700 bg-clip-text text-transparent'}`}>
                {setData.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="secondary"
                className={isTutor ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-xl px-4 py-2 text-base font-medium" : "bg-green-900/10 text-green-900 hover:bg-green-900/20 rounded-xl px-4 py-2 text-base font-medium"}
              >
                {setData.subject}
              </Badge>
              {setData.topic && (
                <Badge
                  variant="outline"
                  className={isTutor ? "border-slate-400 text-slate-300 rounded-xl px-4 py-2 text-base" : "border-yellow-400 text-yellow-600 rounded-xl px-4 py-2 text-base"}
                >
                  {setData.topic}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={isTutor ? "border-slate-400 text-slate-300 rounded-xl px-4 py-2 text-base" : "border-slate-300 text-slate-600 rounded-xl px-4 py-2 text-base"}
              >
                {setData.cards.length} cards
              </Badge>
            </div>
          </div>

          <Button
            onClick={downloadVectorFastPdf}
            className={isTutor ? "bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white px-6 py-3 rounded-2xl shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300" : "bg-yellow-400 text-black font-semibold px-6 py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"}
          >
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
        </motion.div>

        {/* Main Flashcard Area */}
        <div className="flex flex-col items-center space-y-6">
          {/* Flip Instruction */}
          <motion.div
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${isTutor ? 'text-slate-300 bg-slate-700/60 backdrop-blur-sm' : 'text-slate-600 bg-white/60 backdrop-blur-sm'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div animate={{ rotate: showBack ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <RotateCcw className="h-4 w-4" />
            </motion.div>
            <span className="text-sm font-medium">Click card to flip</span>
            {showBack ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </motion.div>

          {/* Flip Card */}
          <motion.div
            className="relative cursor-pointer"
            style={{ perspective: "1200px" }}
            onClick={() => setShowBack((s) => !s)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="relative select-none overflow-hidden rounded-3xl"
              style={{ width: "min(90vw, 700px)", height: "clamp(300px, 50vw, 420px)" }}
            >
              <motion.div
                className="relative select-none"
                style={{ width: "100%", height: "100%", transformStyle: "preserve-3d" }}
                animate={{ rotateY: showBack ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Front Side */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl shadow-2xl overflow-hidden ${isTutor ? 'bg-slate-700' : 'bg-white'}`}
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  animate={{ opacity: showBack ? 0 : 1 }}
                  transition={{ duration: 0.1, delay: showBack ? 0 : 0.25 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-10">
                    <div className="text-center space-y-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isTutor ? 'bg-green-500/20 text-green-300' : 'bg-green-900/10 text-green-900'}`}>
                        <BookOpen className="h-4 w-4" />
                        Front
                      </div>
                      <div className={`text-2xl lg:text-3xl font-bold whitespace-pre-wrap leading-relaxed ${isTutor ? 'text-slate-200' : 'text-green-900'}`}>
                        {current?.front_text}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Back Side */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl shadow-2xl overflow-hidden ${isTutor ? 'bg-slate-700' : 'bg-white'}`}
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  animate={{ opacity: showBack ? 1 : 0 }}
                  transition={{ duration: 0.1, delay: showBack ? 0.25 : 0 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-10">
                    <div className="text-center space-y-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isTutor ? 'bg-yellow-400/20 text-yellow-300' : 'bg-yellow-400/20 text-yellow-700'}`}>
                        <Sparkles className="h-4 w-4" />
                        Back
                      </div>
                      <div className={`text-xl lg:text-2xl font-semibold whitespace-pre-wrap leading-relaxed ${isTutor ? 'text-slate-200' : 'text-slate-800'}`}>
                        {current?.back_text}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Controls */}
        <motion.div
          className="flex items-center justify-between max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button
            onClick={prev}
            variant="outline"
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all duration-300 font-semibold ${isTutor ? 'border-green-500/30 hover:border-green-400 hover:bg-green-600 hover:text-white text-slate-300' : 'border-green-900/20 hover:border-green-900 hover:bg-green-900 hover:text-white'}`}
            disabled={!setData?.cards.length}
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>

          <div className={`rounded-2xl shadow-lg ${isTutor ? 'bg-slate-700/60 backdrop-blur-sm border border-slate-600' : 'bg-white/80 backdrop-blur-sm border-0'}`}>
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className={`text-lg font-bold ${isTutor ? 'text-green-400' : 'text-green-900'}`}>{index + 1}</div>
                <div className={`w-24 h-2 rounded-full overflow-hidden ${isTutor ? 'bg-slate-600' : 'bg-slate-200'}`}>
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-900 to-yellow-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((index + 1) / total) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className={`text-lg font-bold ${isTutor ? 'text-slate-400' : 'text-slate-600'}`}>{setData.cards.length}</div>
              </div>
            </div>
          </div>

          <Button
            onClick={next}
            variant="outline"
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all duration-300 font-semibold ${isTutor ? 'border-green-500/30 hover:border-green-400 hover:bg-green-600 hover:text-white text-slate-300' : 'border-green-900/20 hover:border-green-900 hover:bg-green-900 hover:text-white'}`}
            disabled={!setData?.cards.length}
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Study Progress Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className={`border-0 shadow-xl rounded-2xl ${isTutor ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-green-900 to-green-800 text-white'}`}>
            <div className="p-6 text-center">
              <div className={`text-3xl font-bold mb-2 ${isTutor ? 'text-green-400' : 'text-yellow-400'}`}>{setData.cards.length}</div>
              <div className="text-sm font-medium opacity-90">Total Cards</div>
            </div>
          </div>

          <div className={`border-0 shadow-xl rounded-2xl ${isTutor ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'}`}>
            <div className="p-6 text-center">
              <div className={`text-3xl font-bold mb-2 ${isTutor ? 'text-yellow-400' : 'text-green-900'}`}>{index + 1}</div>
              <div className={`text-sm font-medium opacity-90 ${isTutor ? 'text-slate-300' : 'text-green-900'}`}>Current Card</div>
            </div>
          </div>

          <div className={`border-0 shadow-xl rounded-2xl text-white ${isTutor ? 'bg-slate-700' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{progressPct}%</div>
              <div className="text-sm font-medium opacity-90">Progress</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FlashcardStudyPage;
