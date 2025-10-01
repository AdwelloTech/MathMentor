const mongoose = require('mongoose');
const { User } = require('./dist/models/User');
const { Subject } = require('./dist/models/Subject');
const { Class } = require('./dist/models/Class');
const { GradeLevel } = require('./dist/models/GradeLevel');
const bcrypt = require('bcryptjs');

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/mathmentor', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if subjects exist, create if not
    let subjects = await Subject.find({ isActive: true }).limit(2);
    if (subjects.length === 0) {
      subjects = await Subject.insertMany([
        {
          name: 'mathematics',
          displayName: 'Mathematics',
          color: '#3B82F6',
          category: 'stem',
          isActive: true,
          sortOrder: 1
        },
        {
          name: 'physics',
          displayName: 'Physics',
          color: '#10B981',
          category: 'stem',
          isActive: true,
          sortOrder: 2
        }
      ]);
      console.log('Created subjects:', subjects.map(s => s.displayName));
    } else {
      console.log('Subjects already exist:', subjects.map(s => s.displayName));
    }

    // Check if grade level exists, create if not
    let gradeLevel = await GradeLevel.findOne({ code: '9' });
    if (!gradeLevel) {
      gradeLevel = await GradeLevel.create({
        code: '9',
        displayName: '9th Grade',
        sortOrder: 11,
        category: 'high'
      });
      console.log('Created grade level:', gradeLevel.displayName);
    } else {
      console.log('Grade level already exists:', gradeLevel.displayName);
    }

    // Check if tutor exists, create if not
    let tutor = await User.findOne({ email: 'tutor@test.com' });
    if (!tutor) {
      const hashedPassword = await bcrypt.hash('Test@1010', 12);
      tutor = await User.create({
        firstName: 'John',
        lastName: 'Tutor',
        fullName: 'John Tutor',
        email: 'tutor@test.com',
        password: hashedPassword,
        role: 'tutor',
        tutorialCompleted: true,
        profileCompleted: true
      });
      console.log('Created tutor:', tutor.email);
    } else {
      console.log('Tutor already exists:', tutor.email);
    }

    // Check if class exists, create or update
    let classDoc = await Class.findOne({ title: 'Introduction to Algebra' });
    if (!classDoc) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow so it's upcoming

      classDoc = await Class.create({
        title: 'Introduction to Algebra',
        description: 'Learn the basics of algebra including variables, equations, and inequalities.',
        subjectId: subjects[0]._id,
        gradeLevelId: gradeLevel._id,
        teacherId: tutor._id,
        schedule: {
          dayOfWeek: 1, // Monday
          startTime: '14:00',
          endTime: '15:30',
          duration: 90
        },
        startDate: tomorrow, // Start tomorrow so it's upcoming
        capacity: 5,
        enrolledCount: 0,
        price: 25.00,
        currency: 'USD',
        isActive: true,
        isFull: false,
        prerequisites: ['Basic arithmetic']
      });
      console.log('Created class:', classDoc.title);
    } else {
      // Update the start date to tomorrow so it's upcoming
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      classDoc.startDate = tomorrow;
      classDoc.enrolledCount = 0; // Reset enrollment count
      await classDoc.save();
      console.log('Updated class start date:', classDoc.title);
    }

    console.log('Test data created successfully!');
    console.log('Class ID:', classDoc._id);
    console.log('Subject ID:', subjects[0]._id);
    console.log('Tutor ID:', tutor._id);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createTestData();
