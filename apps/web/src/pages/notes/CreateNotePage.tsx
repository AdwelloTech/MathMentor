import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { getStudyNoteById, getNoteSubjects } from "@/lib/notes";
import { NOTE_TITLE_MAX_LENGTH } from "@/constants/form";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/notes/RichTextEditor";
import type { Database } from "@/types/database";

type StudyNote = Database["public"]["Tables"]["study_notes"]["Row"];
type NoteSubject = Database["public"]["Tables"]["note_subjects"]["Row"];

const CreateNotePage: React.FC = () => {
  console.log("CreateNotePage component rendered");
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    subjectId: "",
  });

  // Load subjects and note data if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading data...");
        setLoading(true);
        const subjectsData = await getNoteSubjects();
        console.log("Subjects loaded:", subjectsData);
        setSubjects(subjectsData);

        if (noteId) {
          // Editing existing note
          console.log("Editing note with ID:", noteId);
          setIsEditing(true);
          const note = await getStudyNoteById(noteId);
          if (note) {
            console.log("Note loaded:", note);
            console.log("Note subject_id:", note.subject_id);
            
            setFormData({
              title: note.title,
              description: note.description || "",
              content: note.content,
              subjectId: note.subject_id || "",
            });
            console.log("Form data set with subjectId:", note.subject_id);
          } else {
            toast.error("Note not found");
            navigate("/student/notes");
          }
        } else {
          console.log("Creating new note");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data - check console for details");
        // Set loading to false even on error so user can see the form
        setLoading(false);
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    loadData();
  }, [noteId, navigate]);

  // Ensure subject is selected when editing and subjects are loaded
  useEffect(() => {
    if (isEditing && subjects.length > 0 && formData.subjectId) {
      // Verify the subject exists in the loaded subjects
      const subjectExists = subjects.some(
        (subject) => subject.id === formData.subjectId
      );

      if (!subjectExists) {
        console.warn(
          "Subject not found in loaded subjects:",
          formData.subjectId
        );
        // Reset subject if it doesn't exist
        setFormData((prev) => ({ ...prev, subjectId: "" }));
      }
    }
  }, [subjects, isEditing, formData.subjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create notes");
      return;
    }

    if (
      !formData.title.trim() ||
      !formData.content.trim() ||
      !formData.subjectId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        // Update existing note
        const { error } = await supabase
          .from("study_notes")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            content: formData.content.trim(),
            subject_id: formData.subjectId,
          })
          .eq("id", noteId)
          .eq("created_by", user.id);

        if (error) {
          console.error("Error updating note:", error);
          toast.error("Failed to update note. Please try again.");
          return;
        }

        toast.success("Note updated successfully!");
      } else {
        // Create new note
        const { error } = await supabase.from("study_notes").insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content: formData.content.trim(),
          subject_id: formData.subjectId,
          created_by: user.id,
          is_public: false,
        });

        if (error) {
          console.error("Error creating note:", error);
          toast.error("Failed to create note. Please try again.");
          return;
        }

        toast.success("Note created successfully!");
      }

      navigate("/student/notes");
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900 mx-auto"></div>
          <p className="mt-4 text-green-800 font-medium">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">
            Loading subjects and form...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <button
              onClick={() => navigate("/student/notes")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="p-2 bg-green-900 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-900">
                {isEditing ? "Edit Note" : "Create New Note"}
              </h1>
              <p className="text-lg text-gray-700">
                {isEditing
                  ? "Update your study material"
                  : "Add your own study material"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-green-200 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Note Title *
            </label>
            <Input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full border-green-900/60 focus:border-green-900 focus:ring-green-900"
              placeholder="Enter note title..."
              required
              maxLength={NOTE_TITLE_MAX_LENGTH}
              showCharCount
            />
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Subject *
            </label>
            {subjects.length > 0 ? (
              <Select
                value={formData.subjectId}
                onValueChange={(value) => handleInputChange("subjectId", value)}
                required
              >
                <SelectTrigger className="w-full border-green-900/60 focus:border-green-900 focus:ring-green-900">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50">
                <p className="text-red-600 text-sm">
                  Failed to load subjects. Please refresh the page or try again
                  later.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-green-900/60 focus:ring-2 focus:ring-green-900 focus:border-green-900 rounded-md transition-colors"
              placeholder="Brief description of your note..."
              maxLength={300}
              showCharCount
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Note Content *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleInputChange("content", value)}
              placeholder="Write your note content here..."
              rows={20}
            />
            <p className="mt-2 text-xs text-gray-500">
              Write your study notes and materials
            </p>
          </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/student/notes")}
                className="flex items-center space-x-2 px-6 py-3 text-gray-700 border border-green-900/60 hover:bg-gray-50 rounded-md transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 bg-green-900 hover:bg-green-800 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>{isEditing ? "Update Note" : "Create Note"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateNotePage;
