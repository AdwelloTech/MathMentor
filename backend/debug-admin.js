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

// User schema (simplified for debugging)
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
  isActive: { type: Boolean, default: true }
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

async function debugAdmin() {
  try {
    await connectDB();

    // Find admin user
    const admin = await User.findOne({ email: 'admin@mathmentor.com' }).select('+password');
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Is Active:', admin.isActive);
    console.log('   Has Password:', !!admin.password);

    // Test password comparison
    const testPasswords = ['admin123', 'admin', 'password', 'Admin123'];
    for (const testPass of testPasswords) {
      const isValid = await admin.comparePassword(testPass);
      console.log(`   Password "${testPass}" matches:`, isValid);
    }

    // If password doesn't match, recreate it
    const correctPassword = 'admin123';
    const isCorrect = await admin.comparePassword(correctPassword);
    if (!isCorrect) {
      console.log('🔧 Password does not match, recreating admin account...');

      // Delete existing admin
      await User.deleteOne({ email: 'admin@mathmentor.com' });

      // Create new admin
      const newAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        email: 'admin@mathmentor.com',
        password: correctPassword,
        role: 'admin',
        isActive: true,
        employeeId: 'ADM001',
        department: 'Administration',
        position: 'System Administrator',
        qualification: 'System Administrator',
        experienceYears: 5,
        hireDate: new Date('2023-01-01'),
        profileCompleted: true,
        hasLearningDisabilities: false
      });

      await newAdmin.save();
      console.log('✅ New admin account created with password: admin123');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugAdmin();

