const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { QuizPdf } = require('./src/models/QuizPdf');
const { GradeLevel, DEFAULT_GRADE_LEVELS } = require('./src/models/GradeLevel');
const { Subject, DEFAULT_SUBJECTS } = require('./src/models/Subject');

async function uploadPDF(pdfPath, gradeLevelCode, subjectName, userId) {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

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
    if (gradeLevelCode) {
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
  console.log('Usage: node upload-pdf.js <pdf-path> <grade-level-code> <subject-name> <user-id>');
  console.log('Example: node upload-pdf.js ./sample.pdf "5" mathematics "507f1f77bcf86cd799439011"');
  console.log('');
  console.log('Parameters:');
  console.log('  pdf-path: Path to the PDF file');
  console.log('  grade-level-code: Grade level code (e.g., "5", "K", "C1") or empty string for all grades');
  console.log('  subject-name: Subject name (e.g., "mathematics", "physics")');
  console.log('  user-id: User ID who is uploading (MongoDB ObjectId)');
  process.exit(1);
}

const [pdfPath, gradeLevelCode, subjectName, userId] = args;
uploadPDF(pdfPath, gradeLevelCode || null, subjectName, userId);
