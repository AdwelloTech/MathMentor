import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  TrendingUp,
  MessageSquare,
  User,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionRating } from "@/hooks/useSessionRating";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { format } from "date-fns";

const TutorRatingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [showAnonymous, setShowAnonymous] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

  // Always call hooks at top level; the hook should handle undefined tutorId gracefully
  const { ratings, stats, loading, error } = useSessionRating(profile?.id);

  // Early return while profile is loading/undefined
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center text-red-600">
              <p className="text-lg">Failed to load ratings: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center text-gray-500">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-2xl font-semibold mb-2">No ratings yet</h2>
              <p className="text-lg">
                Start teaching sessions to receive student feedback!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
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
      <div className="space-y-3">
        {Object.entries(stats.rating_distribution)
          .reverse()
          .map(([rating, count]) => {
            if (count === 0) return null;

            const percentage = total > 0 ? (count / total) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-12">
                  <span className="text-sm font-semibold">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-16 text-right">
                  {count}
                </span>
                <span className="text-sm text-gray-500 w-20">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
      </div>
    );
  };

  const filteredRatings =
    ratings
      ?.filter((rating) => {
        if (!showAnonymous && rating.is_anonymous) return false;
        if (filterRating && rating.rating !== filterRating) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        return b.rating - a.rating;
      }) || [];

  const anonymousCount = ratings?.filter((r) => r.is_anonymous).length || 0;
  const namedCount = ratings?.filter((r) => !r.is_anonymous).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Ratings & Feedback
          </h1>
          <p className="text-gray-600">
            Track your performance and student satisfaction
          </p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.average_rating))}
              </div>
              <p className="text-sm text-gray-600">Average Rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.total_reviews}
              </div>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {namedCount}
              </div>
              <p className="text-sm text-gray-600">Named Reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {anonymousCount}
              </div>
              <p className="text-sm text-gray-600">Anonymous Reviews</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>{renderRatingDistribution()}</CardContent>
            </Card>
          </motion.div>

          {/* Individual Reviews */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Student Reviews
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnonymous(!showAnonymous)}
                      className="flex items-center gap-2"
                    >
                      {showAnonymous ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      {showAnonymous ? "Hide" : "Show"} Anonymous
                    </Button>
                    <Select
                      value={filterRating?.toString() || "all"}
                      onValueChange={(value) =>
                        setFilterRating(value === "all" ? null : Number(value))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All Ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={sortBy}
                      onValueChange={(value) =>
                        setSortBy(value as "date" | "rating")
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Sort by Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Sort by Date</SelectItem>
                        <SelectItem value="rating">Sort by Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRatings.map((rating) => (
                    <div
                      key={rating.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {renderStars(rating.rating)}
                          <Badge
                            variant={
                              rating.rating >= 4
                                ? "default"
                                : rating.rating >= 3
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {rating.rating} Star{rating.rating !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(rating.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>

                      {rating.review_text && (
                        <p className="text-gray-700 mb-3 italic">
                          "{rating.review_text}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {rating.is_anonymous
                              ? "Anonymous Student"
                              : rating.student?.full_name || "Student"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Session on{" "}
                            {format(
                              new Date(rating.created_at),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredRatings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No reviews match your current filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TutorRatingsPage;
