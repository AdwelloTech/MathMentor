const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'principal', 'teacher', 'student', 'parent', 'tutor', 'hr', 'finance', 'support'],
    required: true
  },
  phone: String,
  address: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  emergencyContact: String,
  studentId: String,
  package: { type: String, enum: ['free', 'silver', 'gold'] },
  enrollmentDate: Date,
  classId: mongoose.Schema.Types.ObjectId,
  currentGrade: String,
  gradeLevelId: mongoose.Schema.Types.ObjectId,
  academicSet: String,
  hasLearningDisabilities: { type: Boolean, default: false },
  learningNeedsDescription: String,
  parentName: String,
  parentPhone: String,
  parentEmail: String,
  city: String,
  postcode: String,
  schoolName: String,
  profileImageId: mongoose.Schema.Types.ObjectId,
  profileImageUrl: String,
  cvUrl: String,
  cvFileName: String,
  specializations: [String],
  hourlyRate: Number,
  availability: String,
  bio: String,
  certifications: [String],
  languages: [String],
  qualification: String,
  experienceYears: Number,
  employeeId: String,
  department: String,
  hireDate: Date,
  salary: Number,
  position: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  profileCompleted: { type: Boolean, default: false },
  childrenIds: [mongoose.Schema.Types.ObjectId],
  relationship: String,
  age: Number
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createDemoAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mathmentor.com' });
    if (existingAdmin) {
      console.log('Demo admin account already exists!');
      console.log('Email: admin@mathmentor.com');
      console.log('Password: admin123');
      return;
    }

    // Create demo admin
    const adminData = {
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      email: 'admin@mathmentor.com',
      password: 'admin123', // Will be hashed by pre-save middleware
      role: 'admin',
      phone: '+1-555-0123',
      address: '123 Admin Street, Admin City, AC 12345',
      employeeId: 'ADM001',
      department: 'Administration',
      position: 'System Administrator',
      qualification: 'System Administrator',
      experienceYears: 5,
      bio: 'System administrator for MathMentor platform',
      specializations: ['System Management', 'User Administration'],
      certifications: ['System Administration', 'Database Management'],
      languages: ['English'],
      hireDate: new Date('2023-01-01'),
      isActive: true,
      profileCompleted: true,
      hasLearningDisabilities: false
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Demo admin account created successfully!');
    console.log('📧 Email: admin@mathmentor.com');
    console.log('🔒 Password: admin123');
    console.log('👤 Role: admin');
    console.log('🆔 ID:', admin._id);

  } catch (error) {
    console.error('❌ Error creating demo admin:', error);
    process.exit(1);
  }
}

async function main() {
  await connectDB();
  await createDemoAdmin();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

main().catch(console.error);

