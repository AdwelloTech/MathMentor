const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Define schemas directly
const gradeLevelSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  displayName: { type: String, required: true },
  sortOrder: { type: Number, required: true },
  category: { type: String, required: true, enum: ['preschool', 'elementary', 'middle', 'high', 'college', 'graduate'] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true },
  displayName: { type: String, required: true },
  description: String,
  color: { type: String, required: true, default: '#3B82F6' },
  icon: String,
  category: { type: String, lowercase: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const quizPdfSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  gradeLevelId: { type: mongoose.Schema.Types.ObjectId, ref: 'GradeLevel' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Default data
const DEFAULT_GRADE_LEVELS = [
  { code: 'PS', displayName: 'Preschool', sortOrder: 1, category: 'preschool' },
  { code: 'K', displayName: 'Kindergarten', sortOrder: 2, category: 'preschool' },
  { code: '1', displayName: '1st Grade', sortOrder: 3, category: 'elementary' },
  { code: '2', displayName: '2nd Grade', sortOrder: 4, category: 'elementary' },
  { code: '3', displayName: '3rd Grade', sortOrder: 5, category: 'elementary' },
  { code: '4', displayName: '4th Grade', sortOrder: 6, category: 'elementary' },
  { code: '5', displayName: '5th Grade', sortOrder: 7, category: 'elementary' },
  { code: '6', displayName: '6th Grade', sortOrder: 8, category: 'middle' },
  { code: '7', displayName: '7th Grade', sortOrder: 9, category: 'middle' },
  { code: '8', displayName: '8th Grade', sortOrder: 10, category: 'middle' },
  { code: '9', displayName: '9th Grade', sortOrder: 11, category: 'high' },
  { code: '10', displayName: '10th Grade', sortOrder: 12, category: 'high' },
  { code: '11', displayName: '11th Grade', sortOrder: 13, category: 'high' },
  { code: '12', displayName: '12th Grade', sortOrder: 14, category: 'high' }
];

const DEFAULT_SUBJECTS = [
  { name: 'mathematics', displayName: 'Mathematics', color: '#3B82F6', category: 'stem', sortOrder: 1 },
  { name: 'physics', displayName: 'Physics', color: '#10B981', category: 'stem', sortOrder: 2 },
  { name: 'chemistry', displayName: 'Chemistry', color: '#F59E0B', category: 'stem', sortOrder: 3 },
  { name: 'biology', displayName: 'Biology', color: '#EF4444', category: 'stem', sortOrder: 4 },
  { name: 'english', displayName: 'English', color: '#8B5CF6', category: 'languages', sortOrder: 5 },
  { name: 'history', displayName: 'History', color: '#F97316', category: 'humanities', sortOrder: 6 }
];

async function uploadPDF(pdfPath, gradeLevelCode, subjectName, userId) {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get models
    const GradeLevel = mongoose.model('GradeLevel', gradeLevelSchema);
    const Subject = mongoose.model('Subject', subjectSchema);
    const QuizPdf = mongoose.model('QuizPdf', quizPdfSchema);

    // Seed default data if needed
    console.log('Checking and seeding default data...');
    const glCount = await GradeLevel.countDocuments();
    if (glCount === 0) {
      await GradeLevel.insertMany(DEFAULT_GRADE_LEVELS);
      console.log('Grade levels seeded');
    }

    const subjCount = await Subject.countDocuments();
    if (subjCount === 0) {
      await Subject.insertMany(DEFAULT_SUBJECTS);
      console.log('Subjects seeded');
    }

    // Read and convert PDF to base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64Data = pdfBuffer.toString('base64');
    const fileName = path.basename(pdfPath);

    // Find grade level
    let gradeLevel = null;
    if (gradeLevelCode && gradeLevelCode !== '') {
      gradeLevel = await GradeLevel.findOne({ code: gradeLevelCode.toUpperCase() });
      if (!gradeLevel) {
        console.log(`Grade level ${gradeLevelCode} not found`);
      }
    }

    // Find subject
    const subject = await Subject.findOne({ name: subjectName.toLowerCase() });
    if (!subject) {
      console.error(`Subject ${subjectName} not found`);
      process.exit(1);
    }

    // Create quiz PDF record
    const quizPdf = new QuizPdf({
      fileName,
      filePath: `data:application/pdf;base64,${base64Data}`,
      fileSize: pdfBuffer.length,
      gradeLevelId: gradeLevel?._id,
      subjectId: subject._id,
      uploadedBy: userId,
      isActive: true,
    });

    const savedPdf = await quizPdf.save();
    console.log('PDF uploaded successfully!');
    console.log('ID:', savedPdf._id);
    console.log('File:', fileName);
    console.log('Grade Level:', gradeLevel?.displayName || 'None');
    console.log('Subject:', subject.displayName);
    console.log('Size:', pdfBuffer.length, 'bytes');

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error uploading PDF:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length < 4) {
  console.log('Usage: node upload-pdf-simple.js <pdf-path> <grade-level-code> <subject-name> <user-id>');
  console.log('Example: node upload-pdf-simple.js math.pdf "5" mathematics "507f1f77bcf86cd799439011"');
  console.log('Example: node upload-pdf-simple.js math.pdf "" mathematics "507f1f77bcf86cd799439011" (for all grades)');
  console.log('');
  console.log('Parameters:');
  console.log('  pdf-path: Path to the PDF file');
  console.log('  grade-level-code: Grade level code (e.g., "5", "K", "C1") or empty string for all grades');
  console.log('  subject-name: Subject name (e.g., "mathematics", "physics")');
  console.log('  user-id: User ID who is uploading (MongoDB ObjectId)');
  process.exit(1);
}

const [pdfPath, gradeLevelCode, subjectName, userId] = args;
uploadPDF(pdfPath, gradeLevelCode, subjectName, userId);