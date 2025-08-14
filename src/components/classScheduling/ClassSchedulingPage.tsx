import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@heroicons/react/24/outline';
import { classSchedulingService } from '@/lib/classSchedulingService';
import type {
  ClassType,
  CreateClassFormData,
  TutorClass,
  CalendarDay,
  TimeSlot
} from '@/types/classScheduling';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { subjectsService } from '@/lib/subjects';
import type { Subject } from '@/types/subject';

const ClassSchedulingPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [existingClasses, setExistingClasses] = useState<TutorClass[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Check if tutor is active
  const isActiveTutor = profile?.is_active !== false; // Default to true if not set

  // Form state
  const [formData, setFormData] = useState<CreateClassFormData>({
    class_type_id: '',
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
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
            Your tutor account has been temporarily deactivated by the admin. You cannot schedule new classes at this time. Please contact support for more information.
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
      const [types, classes, subs] = await Promise.all([
        classSchedulingService.classTypes.getAll(),
        classSchedulingService.classes.getByTutorId(user!.id),
        subjectsService.listActive(),
      ]);
      
      setClassTypes(types);
      setExistingClasses(classes);
      setSubjects(subs);
      generateCalendar();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load class data');
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
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const today = new Date();
      const isPastDate = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Only show classes for the current month being viewed
      const dayClasses = existingClasses.filter(c => 
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
        isCurrentMonth: date.getMonth() === currentMonth
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
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this time slot conflicts with existing classes
        const conflictingClass = existingClasses.find(c => 
          c.date === date && 
          c.start_time === timeString &&
          c.status !== 'cancelled'
        );
        
        // Check if time slot fits the class duration
        const slotEndTime = new Date(`2000-01-01T${timeString}`);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + classType.duration_minutes);
        const slotEndString = slotEndTime.toTimeString().slice(0, 5);
        
        const hasConflict = existingClasses.some(c => 
          c.date === date && 
          c.status !== 'cancelled' &&
          ((c.start_time < slotEndString && c.end_time > timeString))
        );
        
        slots.push({
          time: timeString,
          isAvailable: !hasConflict && !conflictingClass,
          isSelected: false,
          isDisabled: hasConflict || !!conflictingClass,
          existingClass: conflictingClass
        });
      }
    }
    
    setTimeSlots(slots);
  };

  const handleClassTypeSelect = (classType: ClassType) => {
    setSelectedClassType(classType);
    setFormData(prev => ({
      ...prev,
      class_type_id: classType.id,
      max_students: classType.max_students,
      price_per_session: classType.price_per_session,
      duration_minutes: classType.duration_minutes
    }));
    setShowTimeSelection(false);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleDateSelect = (date: string) => {
    if (!selectedClassType) return;
    
    console.log('Selected date:', date); // Debug log
    setSelectedDate(date);
    setCalendarDays(prev => prev.map(day => ({
      ...day,
      isSelected: day.date === date
    })));
    
    generateTimeSlots(selectedClassType, date);
    setShowTimeSelection(true);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTimeSlots(prev => prev.map(slot => ({
      ...slot,
      isSelected: slot.time === time
    })));
    
    // Use the current selectedDate state directly
    setFormData(prev => ({
      ...prev,
      date: selectedDate,
      start_time: time
    }));
  };

  const handleCreateClass = async () => {
    if (!selectedClassType || !selectedDate || !selectedTime) {
      toast.error('Please select class type, date, and time');
      return;
    }

    try {
      setLoading(true);
      
      // Calculate end time
      const startTime = new Date(`2000-01-01T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + (selectedClassType?.duration_minutes || 60) * 60000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      const classData: CreateClassFormData & { tutor_id: string } = {
        ...formData,
        tutor_id: user!.id,
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTimeString,
        max_students: selectedClassType?.max_students || 1,
        price_per_session: formData.price_per_session || selectedClassType?.price_per_session || 25.00
      };

      await classSchedulingService.classes.create(classData);
      
      toast.success('Class created successfully!');
      setShowClassForm(false);
      setSelectedClassType(null);
      setSelectedDate('');
      setSelectedTime('');
      setShowTimeSelection(false);
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error creating class:', error);
      // Show more detailed error message
      let errorMessage = 'Failed to create class';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle Supabase error objects
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('details' in error) {
          errorMessage = String(error.details);
        } else if ('hint' in error) {
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
      case 'one-to-one':
      case 'one-to-one extended':
        return <UserIcon className="h-6 w-6" />;
      case 'group class':
        return <UserGroupIcon className="h-6 w-6" />;
      case 'consultation':
        return <ChatBubbleLeftRightIcon className="h-6 w-6" />;
      default:
        return <CalendarDaysIcon className="h-6 w-6" />;
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Schedule Your Classes
        </h1>
        <p className="text-gray-600">
          Choose your class type, select a date and time, and start teaching!
        </p>
      </div>

      {/* Class Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classTypes.map((classType) => (
          <motion.div
            key={classType.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedClassType?.id === classType.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleClassTypeSelect(classType)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getClassTypeIcon(classType.name)}
                <h3 className="text-lg font-semibold text-gray-900">
                  {classType.name}
                </h3>
              </div>
              {selectedClassType?.id === classType.id && (
                <CheckIcon className="h-6 w-6 text-blue-500" />
              )}
            </div>
            
            <p className="text-gray-600 mb-4">{classType.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span>{classType.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-4 w-4 text-gray-500" />
                <span>Max {classType.max_students} student{classType.max_students > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                <span>${classType.price_per_session}/session</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calendar and Time Selection */}
      {selectedClassType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select Date and Time for {selectedClassType?.name}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Previous Month"
                >
                  &lt;
                </button>
                <span className="text-lg font-semibold text-gray-900">
                  {new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Next Month"
                >
                  &gt;
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day) => (
                  <motion.button
                    key={day.date}
                    whileHover={{ scale: day.isDisabled ? 1 : 1.05 }}
                    whileTap={{ scale: day.isDisabled ? 1 : 0.95 }}
                    className={`p-2 text-center rounded-lg transition-all ${
                      day.isToday
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : day.isSelected
                        ? 'bg-blue-500 text-white'
                        : day.hasClasses
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : day.isCurrentMonth
                        ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        : 'bg-gray-100 text-gray-400'
                    } ${day.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !day.isDisabled && handleDateSelect(day.date)}
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
                    const hourSlots = timeSlots.filter(slot => {
                      const slotHour = parseInt(slot.time.split(':')[0]);
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
                                  ? 'bg-blue-500 text-white'
                                  : slot.isAvailable
                                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                  : 'bg-red-50 text-red-500 cursor-not-allowed'
                              } ${slot.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={() => slot.isAvailable && handleTimeSelect(slot.time)}
                              disabled={slot.isDisabled}
                            >
                              <div className="font-medium">
                                {new Date(`2000-01-01T${slot.time}`).toLocaleTimeString([], {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                              {slot.existingClass && (
                                <div className="text-xs mt-1 opacity-75">Booked</div>
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
                onClick={() => setShowClassForm(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Class
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Class Creation Form Modal */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create {selectedClassType?.name}
              </h3>
              <button
                onClick={() => setShowClassForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select subject (optional)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter class title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter class description"
                />
              </div>

              {selectedClassType && selectedClassType.max_students > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedClassType.max_students}
                    value={formData.max_students}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_students: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Session ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_per_session}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_session: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleCreateClass}
                  disabled={loading || !formData.title}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Class'}
                </button>
                <button
                  onClick={() => setShowClassForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ClassSchedulingPage; 