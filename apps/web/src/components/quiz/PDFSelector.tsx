import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { GradeSelect } from "@/components/ui/GradeSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quizPdfService } from "@/lib/quizPdfService";
import { subjectsService } from "@/lib/subjects";
import { fetchGradeLevels } from "@/lib/gradeLevels";
import type { QuizPdf } from "@/types/quizPdf";
import type { Subject } from "@/types/subject";
import type { GradeLevel } from "@/types/database";
import { FileText, BookOpen, GraduationCap, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface PDFSelectorProps {
  onPDFSelect: (pdf: QuizPdf) => void;
  selectedPDF?: QuizPdf | null;
}

const PDFSelector: React.FC<PDFSelectorProps> = ({
  onPDFSelect,
  selectedPDF,
}) => {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availablePDFs, setAvailablePDFs] = useState<QuizPdf[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    loadGradeLevelsAndSubjects();
  }, []);

  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      loadAvailablePDFs();
    } else {
      setAvailablePDFs([]);
    }
  }, [selectedGrade, selectedSubject]);

  const loadGradeLevelsAndSubjects = async () => {
    try {
      const [gradeLevelsData, subjectsData] = await Promise.all([
        fetchGradeLevels(),
        subjectsService.listActive(),
      ]);
      setGradeLevels(gradeLevelsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading grade levels and subjects:", error);
      toast.error("Failed to load grade levels and subjects");
    }
  };

  const loadAvailablePDFs = async () => {
    if (!selectedGrade || !selectedSubject) return;

    setLoading(true);
    try {
      const pdfs = await quizPdfService.getByGradeAndSubject(
        selectedGrade,
        selectedSubject
      );
      setAvailablePDFs(pdfs);
    } catch (error) {
      console.error("Error loading PDFs:", error);
      toast.error("Failed to load available PDFs");
    } finally {
      setLoading(false);
    }
  };

  const handlePDFSelect = (pdf: QuizPdf) => {
    onPDFSelect(pdf);
    toast.success(`Selected: ${pdf.file_name}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Grade and Subject Selection */}
      <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <GraduationCap className="w-5 h-5" />
            Select Grade & Subject
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="grade-select"
                className="text-green-700 font-medium"
              >
                Grade Level
              </Label>
              <GradeSelect
                value={selectedGrade}
                onValueChange={setSelectedGrade}
                placeholder="Select grade level"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="subject-select"
                className="text-green-700 font-medium"
              >
                Subject
              </Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: subject.color || "#6B7280",
                          }}
                        />
                        {subject.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available PDFs */}
      {selectedGrade && selectedSubject && (
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <FileText className="w-5 h-5" />
              Available PDFs for Context
            </CardTitle>
            <p className="text-sm text-green-600">
              Select a PDF to use as AI context for quiz generation
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : availablePDFs.length > 0 ? (
              <div className="space-y-3">
                {availablePDFs.map((pdf) => (
                  <motion.div
                    key={pdf.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPDF?.id === pdf.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-green-300"
                    }`}
                    onClick={() => handlePDFSelect(pdf)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {pdf.file_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <BookOpen className="w-4 h-4" />
                            {formatFileSize(pdf.file_size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPDF?.id === pdf.id && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(pdf.file_size)}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No PDFs Available</p>
                <p className="text-sm">
                  No PDFs have been uploaded for this grade and subject
                  combination.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected PDF Summary */}
      {selectedPDF && (
        <Card className="bg-green-50/80 backdrop-blur-sm border-2 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Selected PDF Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {selectedPDF.file_name}
                </h4>
                <p className="text-sm text-gray-600">
                  This PDF will be used as context for AI quiz generation
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPDFSelect(null as any)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFSelector;
