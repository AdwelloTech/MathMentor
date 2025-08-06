import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IdentificationIcon,
  CameraIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { idVerificationService, IDVerificationFormData } from '@/lib/idVerificationService';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface IDVerificationFormProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const IDVerificationForm: React.FC<IDVerificationFormProps> = ({
  userId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<IDVerificationFormData>>({
    id_type: 'national_id',
    id_number: '',
    full_name: '',
    date_of_birth: '',
    expiry_date: '',
    issuing_country: '',
    issuing_authority: ''
  });

  const [files, setFiles] = useState<{
    front_image: File | null;
    back_image: File | null;
    selfie_with_id: File | null;
  }>({
    front_image: null,
    back_image: null,
    selfie_with_id: null
  });

  const [previews, setPreviews] = useState<{
    front_image: string | null;
    back_image: string | null;
    selfie_with_id: string | null;
  }>({
    front_image: null,
    back_image: null,
    selfie_with_id: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    id_number: false,
    full_name: false
  });

  const fileInputRefs = {
    front_image: useRef<HTMLInputElement>(null),
    back_image: useRef<HTMLInputElement>(null),
    selfie_with_id: useRef<HTMLInputElement>(null)
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, [field]: 'Please upload a valid image file (JPEG, PNG, or WebP)' }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [field]: 'File size must be less than 5MB' }));
        return;
      }

      setFiles(prev => ({ ...prev, [field]: file }));
      setErrors(prev => ({ ...prev, [field]: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => ({ ...prev, [field]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.id_number?.trim()) {
      newErrors.id_number = 'ID number is required';
    }
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    // Required files
    if (!files.front_image) {
      newErrors.front_image = 'Front image is required';
    }
    if (!files.back_image) {
      newErrors.back_image = 'Back image is required';
    }
    if (!files.selfie_with_id) {
      newErrors.selfie_with_id = 'Selfie with ID is required';
    }

    // Date validation
    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = 'Expiry date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!files.front_image || !files.back_image || !files.selfie_with_id) {
      toast.error('Please upload all required images');
      return;
    }

    setLoading(true);
    try {
      const submissionData: IDVerificationFormData = {
        ...formData as IDVerificationFormData,
        front_image: files.front_image,
        back_image: files.back_image,
        selfie_with_id: files.selfie_with_id
      };

      await idVerificationService.submitVerification(userId, submissionData);
      
      toast.success('ID verification submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting ID verification:', error);
      toast.error('Failed to submit ID verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const removeFile = (field: keyof typeof files) => {
    setFiles(prev => ({ ...prev, [field]: null }));
    setPreviews(prev => ({ ...prev, [field]: null }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <IdentificationIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ID Verification</h2>
            <p className="text-sm text-gray-600">
              Please provide your identification documents for verification
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* ID Type and Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Type *
            </label>
            <select
              value={formData.id_type || ''}
              onChange={(e) => handleInputChange('id_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="student_id">Student ID</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Number *
            </label>
            <div className="relative">
              <input
                type={showPasswords.id_number ? 'text' : 'password'}
                value={formData.id_number || ''}
                onChange={(e) => handleInputChange('id_number', e.target.value)}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your ID number"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('id_number')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.id_number ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.id_number && (
              <p className="mt-1 text-sm text-red-600">{errors.id_number}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
               Full Name *
             </label>
             <div className="relative">
               <input
                 type={showPasswords.full_name ? 'text' : 'password'}
                 value={formData.full_name || ''}
                 onChange={(e) => handleInputChange('full_name', e.target.value)}
                 className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                   errors.full_name ? 'border-red-500' : 'border-gray-300'
                 }`}
                 placeholder="Enter your full name"
               />
               <button
                 type="button"
                 onClick={() => togglePasswordVisibility('full_name')}
                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
               >
                 {showPasswords.full_name ? (
                   <EyeSlashIcon className="h-5 w-5" />
                 ) : (
                   <EyeIcon className="h-5 w-5" />
                 )}
               </button>
             </div>
             {errors.full_name && (
               <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
             )}
          </div>

                     <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Date of Birth
             </label>
             <input
               type="date"
               value={formData.date_of_birth || ''}
               onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiry_date || ''}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.expiry_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expiry_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expiry_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issuing Country
            </label>
            <input
              type="text"
              value={formData.issuing_country || ''}
              onChange={(e) => handleInputChange('issuing_country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Sri Lanka"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issuing Authority
          </label>
          <input
            type="text"
            value={formData.issuing_authority || ''}
            onChange={(e) => handleInputChange('issuing_authority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Department of Registration of Persons"
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• All images must be clear and legible</li>
                    <li>• Maximum file size: 5MB per image</li>
                    <li>• Supported formats: JPEG, PNG, WebP</li>
                    <li>• Selfie must show your face clearly with the ID visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Front Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Front Image *
              </label>
              <div className="space-y-3">
                {previews.front_image ? (
                  <div className="relative">
                    <img
                      src={previews.front_image}
                      alt="Front ID"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile('front_image')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.front_image.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload front image</p>
                  </div>
                )}
                <input
                  ref={fileInputRefs.front_image}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('front_image', e.target.files?.[0] || null)}
                  className="hidden"
                />
                {errors.front_image && (
                  <p className="text-sm text-red-600">{errors.front_image}</p>
                )}
              </div>
            </div>

            {/* Back Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Back Image *
              </label>
              <div className="space-y-3">
                {previews.back_image ? (
                  <div className="relative">
                    <img
                      src={previews.back_image}
                      alt="Back ID"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile('back_image')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.back_image.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload back image</p>
                  </div>
                )}
                <input
                  ref={fileInputRefs.back_image}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('back_image', e.target.files?.[0] || null)}
                  className="hidden"
                />
                {errors.back_image && (
                  <p className="text-sm text-red-600">{errors.back_image}</p>
                )}
              </div>
            </div>

            {/* Selfie with ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selfie with ID *
              </label>
              <div className="space-y-3">
                {previews.selfie_with_id ? (
                  <div className="relative">
                    <img
                      src={previews.selfie_with_id}
                      alt="Selfie with ID"
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile('selfie_with_id')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.selfie_with_id.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <CameraIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload selfie</p>
                  </div>
                )}
                <input
                  ref={fileInputRefs.selfie_with_id}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('selfie_with_id', e.target.files?.[0] || null)}
                  className="hidden"
                />
                {errors.selfie_with_id && (
                  <p className="text-sm text-red-600">{errors.selfie_with_id}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Submit Verification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default IDVerificationForm; 