#!/usr/bin/env node

/**
 * Script to check and reset password for a specific user account
 * 
 * Usage: node check-reset-password.js <email> [newPassword]
 * Example: node check-reset-password.js user@example.com NewPassword123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User schema definition matching the main User model
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: {
    type: String,
    enum: ['admin', 'principal', 'teacher', 'student', 'parent', 'tutor', 'hr', 'finance', 'support'],
    required: true
  },
  phone: String,
  studentId: String,
  package: { type: String, enum: ['free', 'silver', 'gold'] },
  enrollmentDate: Date,
  currentGrade: String,
  hasLearningDisabilities: { type: Boolean, default: false },
  parentName: String,
  parentPhone: String,
  parentEmail: String,
  city: String,
  postcode: String,
  schoolName: String,
  isActive: { type: Boolean, default: true },
  tutorialCompleted: { type: Boolean, default: false },
  tutorialDismissedCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

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
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoUrl.split('/').pop()}\n`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Display user information
function displayUserInfo(user) {
  console.log('\n═══════════════════════════════════════');
  console.log('📧 Email:       ', user.email);
  console.log('👤 Name:        ', user.fullName);
  console.log('🎭 Role:        ', user.role);
  console.log('🆔 User ID:     ', user._id);
  console.log('✅ Active:      ', user.isActive);
  console.log('🔒 Has Password:', !!user.password);
  
  if (user.role === 'student') {
    console.log('📚 Package:     ', user.package || 'None');
    console.log('🎓 Grade:       ', user.currentGrade || 'Not set');
    console.log('🏫 School:      ', user.schoolName || 'Not set');
  }
  
  console.log('📅 Created:     ', user.createdAt?.toLocaleDateString());
  console.log('🔄 Updated:     ', user.updatedAt?.toLocaleDateString());
  console.log('═══════════════════════════════════════\n');
}

// Check and reset password
async function checkAndResetPassword(email, newPassword = null) {
  try {
    // Find user by email (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('   Please check the email address and try again.\n');
      return;
    }

    console.log('✅ User found!');
    displayUserInfo(user);

    // If no new password provided, just show info and exit
    if (!newPassword) {
      console.log('ℹ️  To reset password, run:');
      console.log(`   node check-reset-password.js ${email} <newPassword>\n`);
      return;
    }

    // Reset password
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question(`⚠️  Reset password for ${user.email} to "${newPassword}"? (y/N): `, async (answer) => {
        readline.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          // Update password
          user.password = newPassword;
          await user.save();
          
          console.log('\n✅ Password reset successfully!\n');
          console.log('═══════════════════════════════════════');
          console.log('📧 Email:       ', user.email);
          console.log('🔒 New Password:', newPassword);
          console.log('═══════════════════════════════════════\n');
          console.log('⚠️  IMPORTANT: Share this password securely with the user!\n');
          
          // Verify the password works
          const userCheck = await User.findById(user._id).select('+password');
          const isValid = await userCheck.comparePassword(newPassword);
          console.log('✅ Password verification:', isValid ? 'PASSED' : 'FAILED');
          console.log('');
        } else {
          console.log('✋ Password reset cancelled\n');
        }
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('\n🔐 MathMentor Password Check & Reset Tool');
  console.log('═══════════════════════════════════════\n');

  // Get email from command line arguments
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email) {
    console.log('Usage: node check-reset-password.js <email> [newPassword]');
    console.log('');
    console.log('Examples:');
    console.log('  Check user:         node check-reset-password.js user@example.com');
    console.log('  Reset password:     node check-reset-password.js user@example.com NewPass123');
    console.log('');
    process.exit(1);
  }

  await connectDB();
  await checkAndResetPassword(email, newPassword);
  
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
  console.log('   Script completed\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


