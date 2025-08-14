import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { classSchedulingService } from '../lib/classSchedulingService';
import { TutorClass, ClassType } from '../types/classScheduling';
import { CalendarDays, Clock, Users, DollarSign, Edit, Trash2, Eye, Filter, Search, X } from 'lucide-react';

const TutorManageClassesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingClass, setEditingClass] = useState<TutorClass | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Check if tutor is active
  const isActiveTutor = profile?.is_active !== false; // Default to true if not set

  useEffect(() => {
    if (user) {
      loadClasses();
      loadClassTypes();
    }
  }, [user]);

  // If tutor is inactive, show error message
  if (!isActiveTutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Account Temporarily Inactive
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Your tutor account has been temporarily deactivated by the admin. You cannot manage classes at this time. Please contact support for more information.
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

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classSchedulingService.classes.getByTutorId(user!.id);
      setClasses(data || []);
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassTypes = async () => {
    try {
      const data = await classSchedulingService.classTypes.getAll();
      setClassTypes(data || []);
    } catch (err) {
      console.error('Error loading class types:', err);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await classSchedulingService.classes.delete(classId);
      setClasses(classes.filter(c => c.id !== classId));
      setSelectedClass(null);
      setShowDetails(false);
    } catch (err) {
      setError('Failed to delete class');
      console.error('Error deleting class:', err);
    }
  };

  const handleUpdateClass = async (updatedClass: Partial<TutorClass>) => {
    if (!editingClass) return;
    try {
      const updatedData = await classSchedulingService.classes.update(editingClass.id, updatedClass);
      setClasses(classes.map(c => c.id === editingClass.id ? updatedData : c));
      setEditingClass(null);
      setSelectedClass(null);
      setShowDetails(false);
    } catch (err) {
      setError('Failed to update class');
      console.error('Error updating class:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const getClassTypeName = (classTypeId: string) => {
    const classType = classTypes.find(ct => ct.id === classTypeId);
    return classType?.name || 'Unknown';
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesType = filterType === 'all' || classItem.class_type_id === filterType;
    const matchesDate = !filterDate || classItem.date === filterDate;
          const matchesSearch = !searchTerm || 
        classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (classItem.description && classItem.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesDate && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Classes</h1>
          <p className="text-gray-600">View, edit, and manage your scheduled classes</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Class Types</option>
              {classTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(filterType !== 'all' || filterDate || searchTerm) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterDate('');
                  setSearchTerm('');
                }}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600">
              {classes.length === 0 
                ? "You haven't scheduled any classes yet." 
                : "No classes match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {classItem.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getClassTypeName(classItem.class_type_id)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                      {classItem.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      {formatDate(classItem.date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {classItem.current_students}/{classItem.max_students} students
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      ${classItem.price_per_session}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedClass(classItem);
                        setShowDetails(true);
                      }}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => setEditingClass(classItem)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Class Details Modal */}
        {showDetails && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedClass.title}
                    </h2>
                    <p className="text-gray-600">{selectedClass.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Class Type</h3>
                      <p className="text-gray-900">{getClassTypeName(selectedClass.class_type_id)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
                      <p className="text-gray-900">{formatDate(selectedClass.date)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Time</h3>
                      <p className="text-gray-900">
                        {formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
                      <p className="text-gray-900">{selectedClass.duration_minutes} minutes</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Price</h3>
                      <p className="text-gray-900">${selectedClass.price_per_session}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Capacity</h3>
                      <p className="text-gray-900">
                        {selectedClass.current_students}/{selectedClass.max_students} students
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClass.status)}`}>
                        {selectedClass.status}
                      </span>
                    </div>
                    {selectedClass.jitsi_meeting_url && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Jitsi Meeting Link</h3>
                        <a
                          href={selectedClass.jitsi_meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm break-all"
                        >
                          {selectedClass.jitsi_meeting_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setEditingClass(selectedClass);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Class
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Class Modal */}
        {editingClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <EditClassForm
                classItem={editingClass}
                classTypes={classTypes}
                onSave={handleUpdateClass}
                onCancel={() => setEditingClass(null)}
              />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditClassFormProps {
  classItem: TutorClass;
  classTypes: ClassType[];
  onSave: (updatedClass: Partial<TutorClass>) => void;
  onCancel: () => void;
}

const EditClassForm: React.FC<EditClassFormProps> = ({ classItem, classTypes, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: classItem.title,
    description: classItem.description,
    class_type_id: classItem.class_type_id,
    date: classItem.date,
    start_time: classItem.start_time,
    end_time: classItem.end_time,
    max_students: classItem.max_students,
    price_per_session: classItem.price_per_session,
    status: classItem.status
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Class</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
            <select
              value={formData.class_type_id}
              onChange={(e) => setFormData({ ...formData, class_type_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {classTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
            <input
              type="number"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Session</label>
            <input
              type="number"
              step="0.01"
              value={formData.price_per_session}
              onChange={(e) => setFormData({ ...formData, price_per_session: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default TutorManageClassesPage; 