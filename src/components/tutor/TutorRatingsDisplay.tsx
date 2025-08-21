import React from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionRating } from "@/hooks/useSessionRating";
import type { TutorRatingStats } from "@/lib/sessionRatingService";

interface TutorRatingsDisplayProps {
  tutorId: string;
  className?: string;
}

const TutorRatingsDisplay: React.FC<TutorRatingsDisplayProps> = ({
  tutorId,
  className = "",
}) => {
  const { ratings, stats, loading, error } = useSessionRating(tutorId);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-4 text-center text-red-600">
          <p>Failed to load ratings: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="p-6 text-center text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No ratings yet</p>
          <p className="text-sm">Be the first to rate this tutor!</p>
        </CardContent>
      </Card>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const renderRatingDistribution = () => {
    if (!stats) return null;

    const total = stats.total_reviews;
    const maxCount = Math.max(...Object.values(stats.rating_distribution));

    return (
      <div className="space-y-2">
        {Object.entries(stats.rating_distribution)
          .reverse()
          .map(([rating, count]) => {
            if (count === 0) return null;

            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-8">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
                <span className="text-sm text-gray-500 w-16">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            Overall Rating
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(stats.average_rating))}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total_reviews} review
                {stats.total_reviews !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex-1">{renderRatingDistribution()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratings.slice(0, 5).map((rating) => (
                <motion.div
                  key={rating.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {rating.is_anonymous
                            ? "Anonymous Student"
                            : rating.student?.full_name || "Student"}
                        </p>
                        <div className="flex items-center gap-1">
                          {renderStars(rating.rating)}
                          <span className="text-sm text-gray-600 ml-1">
                            {rating.rating}.0
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {rating.review_text && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      "{rating.review_text}"
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {ratings.length > 5 && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Showing 5 of {ratings.length} reviews
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorRatingsDisplay;

