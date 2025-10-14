/**
 * Migration script to generate student codes for existing students
 * Run this once to add student codes to all existing student accounts
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Student code generation functions
function generateStudentCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let part1 = '';
  for (let i = 0; i < 3; i++) {
    part1 += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part2 += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  let part3 = '';
  for (let i = 0; i < 3; i++) {
    part3 += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  }

  return `${part1}-${part2}-${part3}`;
}

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Find all students without a student code
    const studentsWithoutCode = await User.find({
      role: 'student',
      $or: [
        { studentCode: { $exists: false } },
        { studentCode: null },
        { studentCode: '' }
      ]
    });

    console.log(`Found ${studentsWithoutCode.length} students without student codes`);

    if (studentsWithoutCode.length === 0) {
      console.log('All students already have student codes. Exiting...');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const student of studentsWithoutCode) {
      try {
        let studentCode = generateStudentCode();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure unique code
        while (attempts < maxAttempts) {
          const existing = await User.findOne({ studentCode });
          if (!existing) {
            break;
          }
          studentCode = generateStudentCode();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error(`Failed to generate unique code for student ${student.email}`);
          errorCount++;
          continue;
        }

        // Update student with new code
        await User.updateOne(
          { _id: student._id },
          { $set: { studentCode } }
        );

        console.log(`✓ Generated code ${studentCode} for ${student.fullName} (${student.email})`);
        successCount++;
      } catch (error) {
        console.error(`Error updating student ${student.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

main();

