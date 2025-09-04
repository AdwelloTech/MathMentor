import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  sessionRatingService,
  type CreateRatingData,
} from "@/lib/sessionRatingService";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import type { StudentUpcomingSession } from "@/types/classScheduling";

interface SessionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudentUpcomingSession;
  onSubmit?: () => void;
}

const SessionRatingModal: React.FC<SessionRatingModalProps> = ({
  isOpen,
  onClose,
  session,
  onSubmit,
}) => {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const studentId = profile?.id ?? user?.id;
      if (!studentId) {
        toast.error("You must be signed in to submit a rating.");
        return;
      }

      const ratingData: CreateRatingData = {
        session_id: session.id,
        student_id: studentId,
        tutor_id: session.tutor.id,
        rating,
        review_text: reviewText.trim() || undefined,
        is_anonymous: isAnonymous,
      };

      await sessionRatingService.create(ratingData);

      toast.success("Thank you for your rating!");
      onSubmit?.();
      onClose();

      // Reset form
      setRating(0);
      setReviewText("");
      setIsAnonymous(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || rating);

      return (
        <button
          key={starValue}
          type="button"
          className={`p-1 transition-all duration-200 ${
            isFilled ? "text-yellow-400" : "text-gray-300"
          } hover:scale-110`}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(starValue)}
          disabled={isSubmitting}
        >
          <Star className={`w-8 h-8 ${isFilled ? "fill-current" : ""}`} />
        </button>
      );
    });
  };

  const getRatingText = () => {
    if (rating === 0) return "Select a rating";
    if (rating === 1) return "Poor";
    if (rating === 2) return "Fair";
    if (rating === 3) return "Good";
    if (rating === 4) return "Very Good";
    if (rating === 5) return "Excellent";
    return "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Rate Your Session
                  </h2>
                  <p className="text-sm text-gray-600">
                    How was your session with {session.tutor.full_name}?
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Session Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.tutor.full_name}
                    </p>
                    <p className="text-sm text-gray-600">{session.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(session.date).toLocaleDateString()} •{" "}
                  {session.duration_minutes} minutes
                </p>
              </div>

              {/* Rating Stars */}
              <div className="text-center space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Rate your experience
                </Label>
                <div className="flex justify-center gap-1">{renderStars()}</div>
                {rating > 0 && (
                  <p className="text-sm font-medium text-gray-900">
                    {getRatingText()}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <Label
                  htmlFor="review"
                  className="text-sm font-medium text-gray-700"
                >
                  Additional feedback (optional)
                </Label>
                <Textarea
                  id="review"
                  placeholder="Share your thoughts about the session..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) =>
                    setIsAnonymous(checked as boolean)
                  }
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="anonymous"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Submit anonymously
                </Label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionRatingModal;
