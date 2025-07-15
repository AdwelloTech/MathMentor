# 🚀 Complete LMS Project Setup Guide

## **Issues Fixed:**
- ✅ Database schema errors
- ✅ Profile loading errors  
- ✅ Email confirmation issues
- ✅ Authentication flow problems
- ✅ Better error handling
- ✅ Improved user experience

---

## **🔧 Step 1: Database Setup**

### **1.1 Access Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `tspzdsawiabtdoaupymk`
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### **1.2 Run Database Setup Script**
1. Copy the entire contents of `database-setup-simple.sql`
2. Paste into the SQL Editor
3. Click **"Run"** button
4. Wait for "Database setup completed successfully!" message

### **1.3 Verify Database Setup**
1. Go to **"Table Editor"** in the left sidebar
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `classes`
   - ✅ `bookings`

3. Click on `profiles` table to verify it has these columns:
   - `id`, `user_id`, `email`, `first_name`, `last_name`, `full_name`, `role`, `package`, etc.

---

## **📧 Step 2: Email Configuration**

### **2.1 Configure Email Settings**
1. In Supabase Dashboard, go to **"Authentication"** → **"Settings"**
2. Scroll to **"Email Templates"**
3. **Enable Email Confirmations**:
   - Toggle **"Enable email confirmations"** to ON
   - Set **"Site URL"** to: `http://localhost:3000`
   - Set **"Redirect URLs"** to: `http://localhost:3000/**`

### **2.2 Configure SMTP (Optional - for production)**
1. Go to **"Authentication"** → **"Settings"** → **"SMTP Settings"**
2. For development, you can use Supabase's built-in email service
3. For production, configure your own SMTP provider

---

## **🔄 Step 3: Test the Application**

### **3.1 Start Development Server**
```bash
npm run dev
```

### **3.2 Test Registration Flow**
1. Open [http://localhost:3000](http://localhost:3000)
2. Click **"Create Account"**
3. Fill in the registration form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Password: `password123`
   - Role: `Student`
   - Package: `Free`
4. Click **"Register"**
5. You should see: **"Registration successful! Please check your email..."**

### **3.3 Test Email Confirmation**
1. Check your email inbox for confirmation email
2. Click the confirmation link
3. You should be redirected back to the app
4. Try logging in with your credentials

### **3.4 Test Login Flow**
1. Go to login page
2. Enter your credentials
3. Click **"Sign In"**
4. You should see the appropriate dashboard based on your role

---

## **🎯 Step 4: Dashboard Access**

### **4.1 Role-Based Dashboards**
After successful login, you'll be redirected to:
- **Student** → Student Dashboard (with package restrictions)
- **Admin** → Admin Dashboard (full access)
- **Teacher** → Teacher Dashboard
- **Parent** → Parent Dashboard
- etc.

### **4.2 Package-Based Features (Students)**
- **Free Package**: Access to group classes only
- **Silver Package**: Group classes + learning resources
- **Gold Package**: All features including 1-on-1 sessions

---

## **🔍 Step 5: Troubleshooting**

### **5.1 Database Issues**
**Error**: "relation 'public.profiles' does not exist"
**Solution**: Run the database setup script again

### **5.2 Email Issues**
**Error**: "Email not confirmed"
**Solution**: 
1. Check your email for confirmation link
2. Verify email settings in Supabase
3. Check spam folder

### **5.3 Profile Loading Issues**
**Error**: "Error loading user profile"
**Solution**: 
1. Refresh the page
2. Check browser console for detailed errors
3. Verify database connection

### **5.4 Authentication Issues**
**Error**: "Invalid login credentials"
**Solution**: 
1. Ensure email is confirmed
2. Check password is correct
3. Try password reset if needed

---

## **🚀 Step 6: Ready to Use!**

Your LMS system is now ready with:

✅ **Complete Authentication System**
- User registration with email confirmation
- Role-based login (Student, Teacher, Admin, etc.)
- Password reset functionality

✅ **Profile Management**
- Automatic profile creation
- Role-specific data
- Package-based permissions

✅ **Dashboard System**
- Role-based dashboards
- Package-aware UI for students
- Modern, responsive design

✅ **Database Structure**
- Profiles, classes, bookings tables
- Proper relationships and constraints
- Row Level Security (RLS) enabled

---

## **🎨 Features Overview**

### **Student Features**
- **Free Package**: Group classes
- **Silver Package**: Group classes + resources
- **Gold Package**: All features + 1-on-1 sessions

### **Teacher Features**
- Class management
- Student progress tracking
- Schedule management

### **Admin Features**
- User management
- System analytics
- Complete control panel

### **Common Features**
- Modern UI with animations
- Responsive design
- Real-time updates
- Secure authentication

---

## **📞 Support**

If you encounter any issues:

1. **Check the browser console** for error messages
2. **Verify database setup** in Supabase dashboard
3. **Check email settings** for confirmation issues
4. **Refresh the page** for temporary loading issues

The application is now fully functional with all major issues resolved! 