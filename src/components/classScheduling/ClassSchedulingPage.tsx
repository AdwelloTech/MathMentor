import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { classSchedulingService } from "@/lib/classSchedulingService";
import type {
  ClassType,
  CreateClassFormData,
  TutorClass,
  CalendarDay,
  TimeSlot,
} from "@/types/classScheduling";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const ClassSchedulingPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [existingClasses, setExistingClasses] = useState<TutorClass[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Check if tutor is active
  const isActiveTutor = profile?.is_active !== false; // Default to true if not set

  // Form state
  const [formData, setFormData] = useState<CreateClassFormData>({
    class_type_id: "",
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    max_students: 1,
    price_per_session: 0,
    is_recurring: false,
  });

  // If tutor is inactive, show error message
  if (!isActiveTutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XMarkIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Account Temporarily Inactive
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Your tutor account has been temporarily deactivated by the admin.
            You cannot schedule new classes at this time. Please contact support
            for more information.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [existingClasses]);

  useEffect(() => {
    generateCalendar();
  }, [currentMonth, currentYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [types, classes] = await Promise.all([
        classSchedulingService.classTypes.getAll(),
        classSchedulingService.classes.getByTutorId(user!.id),
      ]);

      setClassTypes(types);
      setExistingClasses(classes);
      generateCalendar();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const days: CalendarDay[] = [];

    // Get the first day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get the start of the week that contains the first day of the month
    const startOfWeek = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
    startOfWeek.setDate(firstDayOfMonth.getDate() - dayOfWeek);

    // Generate calendar days (6 weeks to ensure we cover the entire month)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      // Use timezone-safe date formatting to avoid UTC conversion issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      const today = new Date();
      const isPastDate =
        date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Only show classes for the current month being viewed
      const dayClasses = existingClasses.filter(
        (c) =>
          c.date === dateString &&
          new Date(c.date).getMonth() === currentMonth &&
          new Date(c.date).getFullYear() === currentYear
      );

      days.push({
        date: dateString,
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isToday: date.toDateString() === today.toDateString(),
        isSelected: false,
        isDisabled: isPastDate || date.getMonth() !== currentMonth,
        hasClasses: dayClasses.length > 0,
        classes: dayClasses,
        isCurrentMonth: date.getMonth() === currentMonth,
      });
    }

    setCalendarDays(days);
  };

  const generateTimeSlots = (classType: ClassType, date: string) => {
    const slots: TimeSlot[] = [];
    const startHour = 7; // 7 AM - earlier start for early birds
    const endHour = 22; // 10 PM - later end for evening classes

    for (let hour = startHour; hour < endHour; hour++) {
      // Add 15-minute intervals for more flexibility
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;

        // Check if this time slot conflicts with existing classes
        const conflictingClass = existingClasses.find(
          (c) =>
            c.date === date &&
            c.start_time === timeString &&
            c.status !== "cancelled"
        );

        // Check if time slot fits the class duration
        const slotEndTime = new Date(`2000-01-01T${timeString}`);
        slotEndTime.setMinutes(
          slotEndTime.getMinutes() + classType.duration_minutes
        );
        const slotEndString = slotEndTime.toTimeString().slice(0, 5);

        const hasConflict = existingClasses.some(
          (c) =>
            c.date === date &&
            c.status !== "cancelled" &&
            c.start_time < slotEndString &&
            c.end_time > timeString
        );

        slots.push({
          time: timeString,
          isAvailable: !hasConflict && !conflictingClass,
          isSelected: false,
          isDisabled: hasConflict || !!conflictingClass,
        });
      }
    }

    setTimeSlots(slots);
  };

  const handleClassTypeSelect = (classType: ClassType) => {
    setSelectedClassType(classType);
    setFormData((prev) => ({
      ...prev,
      class_type_id: classType.id,
      max_students: classType.max_students,
      price_per_session: classType.price_per_session,
    }));
    setShowTimeSelection(false);
    setSelectedDate("");
    setSelectedTime("");
  };

  const handleDateSelect = (date: string) => {
    if (!selectedClassType) return;

    console.log("Selected date:", date); // Debug log
    setSelectedDate(date);
    setCalendarDays((prev) =>
      prev.map((day) => ({
        ...day,
        isSelected: day.date === date,
      }))
    );

    generateTimeSlots(selectedClassType, date);
    setShowTimeSelection(true);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTimeSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        isSelected: slot.time === time,
      }))
    );

    // Use the current selectedDate state directly
    setFormData((prev) => ({
      ...prev,
      date: selectedDate,
      start_time: time,
    }));
  };

  const handleCreateClass = async () => {
    if (!selectedClassType || !selectedDate || !selectedTime) {
      toast.error("Please select class type, date, and time");
      return;
    }

    try {
      setLoading(true);

      // Calculate end time
      const startTime = new Date(`2000-01-01T${selectedTime}`);
      const endTime = new Date(
        startTime.getTime() +
          (selectedClassType?.duration_minutes || 60) * 60000
      );
      const endTimeString = endTime.toTimeString().slice(0, 5);

      const classData: CreateClassFormData & { tutor_id: string } = {
        ...formData,
        tutor_id: user!.id,
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTimeString,
        max_students: selectedClassType?.max_students || 1,
      };

      await classSchedulingService.classes.create(classData);

      toast.success("Class created successfully!");
      setShowClassForm(false);
      setSelectedClassType(null);
      setSelectedDate("");
      setSelectedTime("");
      setShowTimeSelection(false);

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error creating class:", error);
      // Show more detailed error message
      let errorMessage = "An unexpected error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object") {
        // Handle Supabase error objects
        if ("message" in error) {
          errorMessage = String(error.message);
        } else if ("details" in error) {
          errorMessage = String(error.details);
        } else if ("hint" in error) {
          errorMessage = String(error.hint);
        } else {
          errorMessage = JSON.stringify(error);
        }
      }

      toast.error(`Failed to create class: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getClassTypeIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "one-to-one":
      case "one-to-one extended":
        return <UserIcon className="h-6 w-6 text-white" />;
      case "group class":
        return <UserGroupIcon className="h-6 w-6 text-white" />;
      case "consultation":
        return <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />;
      default:
        return <CalendarDaysIcon className="h-6 w-6 text-white" />;
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Schedule Your Classes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your class type, select a date and time, and start teaching!
          </p>
        </motion.div>

        {/* Class Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {classTypes.map((classType, index) => (
            <motion.div
              key={classType.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className={`cursor-pointer p-6 bg-white rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 ${
                selectedClassType?.id === classType.id
                  ? "ring-2 ring-[#16803D] ring-offset-2"
                  : ""
              }`}
              onClick={() => handleClassTypeSelect(classType)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-[#16803D]">
                  <div className="bg-[#16803D] w-10 h-10 rounded-lg flex items-center justify-center">
                    <div className="text-white">
                      {getClassTypeIcon(classType.name)}
                    </div>
                  </div>
                </div>
                {selectedClassType?.id === classType.id && (
                  <div className="bg-[#16803D] w-6 h-6 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {classType.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {classType.description}
                </p>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 w-6 h-6 rounded-md flex items-center justify-center">
                      <ClockIcon className="h-3 w-3 text-[#16803D]" />
                    </div>
                    <span className="font-medium">
                      {classType.duration_minutes} minutes
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-yellow-100 w-6 h-6 rounded-md flex items-center justify-center">
                      <UserGroupIcon className="h-3 w-3 text-yellow-600" />
                    </div>
                    <span className="font-medium">
                      Max {classType.max_students} student
                      {classType.max_students > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 w-6 h-6 rounded-md flex items-center justify-center">
                      <CurrencyDollarIcon className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="font-medium">
                      ${classType.price_per_session}/session
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar and Time Selection */}
        {selectedClassType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="w-4 h-4 text-white" />
              </div>
              <span>Select Date and Time for {selectedClassType?.name}</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select Date
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Previous Month"
                  >
                    &lt;
                  </button>
                  <span className="text-lg font-semibold text-gray-900">
                    {new Date(currentYear, currentMonth, 1).toLocaleDateString(
                      "en-US",
                      { month: "long", year: "numeric" }
                    )}
                  </span>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Next Month"
                  >
                    &gt;
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Day headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium text-gray-500"
                      >
                        {day}
                      </div>
                    )
                  )}
                  {/* Calendar days */}
                  {calendarDays.map((day) => (
                    <motion.button
                      key={day.date}
                      whileHover={{ scale: day.isDisabled ? 1 : 1.05 }}
                      whileTap={{ scale: day.isDisabled ? 1 : 0.95 }}
                      className={`p-2 text-center rounded-lg transition-all ${
                        day.isToday
                          ? "bg-[#16803D] text-white font-semibold"
                          : day.isSelected
                          ? "bg-[#199421] text-white ring-2 ring-[#16803D] ring-offset-2"
                          : day.hasClasses
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : day.isCurrentMonth
                          ? "bg-gray-50 hover:bg-gray-100 text-gray-700"
                          : "bg-gray-100 text-gray-400"
                      } ${
                        day.isDisabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      onClick={() =>
                        !day.isDisabled && handleDateSelect(day.date)
                      }
                      disabled={day.isDisabled}
                    >
                      <div className="text-sm font-medium">{day.day}</div>
                      {day.hasClasses && (
                        <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {showTimeSelection && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Select Time
                  </h3>
                  <div className="max-h-80 overflow-y-auto">
                    {/* Group time slots by hour */}
                    {Array.from({ length: 16 }, (_, hourIndex) => {
                      const hour = hourIndex + 7; // Start from 7 AM
                      const hourSlots = timeSlots.filter((slot) => {
                        const slotHour = parseInt(slot.time.split(":")[0]);
                        return slotHour === hour;
                      });

                      if (hourSlots.length === 0) return null;

                      return (
                        <div key={hour} className="mb-4">
                          <div className="grid grid-cols-4 gap-2">
                            {hourSlots.map((slot) => (
                              <motion.button
                                key={slot.time}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-2 text-center rounded-lg transition-all text-xs ${
                                  slot.isSelected
                                    ? "bg-[#16803D] text-white ring-2 ring-[#199421] ring-offset-1"
                                    : slot.isAvailable
                                    ? "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:bg-[#16803D] hover:text-black"
                                    : "bg-red-50 text-red-500 cursor-not-allowed"
                                } ${
                                  slot.isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                                onClick={() =>
                                  slot.isAvailable &&
                                  handleTimeSelect(slot.time)
                                }
                                disabled={slot.isDisabled}
                              >
                                <div className="font-medium">
                                  {new Date(
                                    `2000-01-01T${slot.time}`
                                  ).toLocaleTimeString([], {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                                {!slot.isAvailable && (
                                  <div className="text-xs mt-1 opacity-75">
                                    Booked
                                  </div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Create Class Button */}
            {selectedDate && selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center"
              >
                <button
                  onClick={handleCreateClass}
                  disabled={loading}
                  className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white px-8 py-3 rounded-xl font-semibold shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Creating Class...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <PlusIcon className="w-5 h-5" />
                      <span>Create Class</span>
                    </div>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ClassSchedulingPage;
