#!/usr/bin/env node

/**
 * Script to create an admin account for MathMentor
 * 
 * Credentials:
 * Email: admin@mathmentor.com
 * Password: admin123
 * 
 * Usage: node create-admin.js
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
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'principal', 'teacher', 'student', 'parent', 'tutor', 'hr', 'finance', 'support'],
    required: true
  },
  phone: String,
  employeeId: String,
  department: String,
  position: String,
  qualification: String,
  experienceYears: Number,
  isActive: { type: Boolean, default: true },
  tutorialCompleted: { type: Boolean, default: false },
  tutorialDismissedCount: { type: Number, default: 0 },
  hasLearningDisabilities: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
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

// Create admin account
async function createAdminAccount() {
  const adminEmail = 'admin@mathmentor.com';
  const adminPassword = 'admin123';

  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!\n');
      console.log('═══════════════════════════════════════');
      console.log('📧 Email:    admin@mathmentor.com');
      console.log('🔒 Password: admin123');
      console.log('👤 Role:     admin');
      console.log(`🆔 User ID:  ${existingAdmin._id}`);
      console.log('═══════════════════════════════════════\n');
      
      // Ask if user wants to delete and recreate
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        readline.question('Do you want to delete and recreate the admin account? (y/N): ', async (answer) => {
          readline.close();
          
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            await User.deleteOne({ email: adminEmail });
            console.log('\n🗑️  Deleted existing admin account');
            await createNewAdmin(adminEmail, adminPassword);
          } else {
            console.log('✋ Keeping existing admin account');
          }
          resolve();
        });
      });
    } else {
      await createNewAdmin(adminEmail, adminPassword);
    }

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - admin already exists');
    }
    process.exit(1);
  }
}

// Helper function to create new admin
async function createNewAdmin(email, password) {
  const adminData = {
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    email: email,
    password: password, // Will be hashed by pre-save middleware
    role: 'admin',
    phone: '+1-555-ADMIN',
    employeeId: 'ADM001',
    department: 'Administration',
    position: 'System Administrator',
    qualification: 'System Administrator',
    experienceYears: 5,
    isActive: true,
    tutorialCompleted: true,
    tutorialDismissedCount: 0,
    hasLearningDisabilities: false
  };

  const admin = new User(adminData);
  await admin.save();

  console.log('\n✅ Admin account created successfully!\n');
  console.log('═══════════════════════════════════════');
  console.log('📧 Email:    admin@mathmentor.com');
  console.log('🔒 Password: admin123');
  console.log('👤 Role:     admin');
  console.log(`🆔 User ID:  ${admin._id}`);
  console.log('═══════════════════════════════════════\n');
  console.log('⚠️  IMPORTANT: Change this password after first login!\n');
}

// Main execution
async function main() {
  console.log('\n🚀 MathMentor Admin Account Creator');
  console.log('═══════════════════════════════════════\n');

  await connectDB();
  await createAdminAccount();
  
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
  console.log('   Script completed\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


