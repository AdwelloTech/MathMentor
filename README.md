# Institute Enterprise Management System (IEMS)

A comprehensive, modern enterprise-level management system for educational institutions built with React/TypeScript, Node.js, and Supabase.

## 🚀 Features

### 🔐 Authentication & Role-Based Access Control
- **Multi-role Authentication**: Admin, Principal, Teacher, Student, Parent, HR, Finance, Support
- **Role-based permissions** with hierarchical access control
- **Student Package System**: Free, Silver, Gold tiers with feature restrictions
- **Secure Registration**: Self-registration for Students and Parents only
- **Staff Account Management**: Admin-controlled accounts for staff members
- **Two-Factor Authentication** ready
- **Password Reset** functionality

### 📊 Student Package System
- **🟢 Free Package**: Group classes only
- **🟡 Silver Package**: Group classes + Learning resources
- **🟡 Gold Package**: Full access to all features including one-to-one sessions and consultations

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with full device compatibility
- **Framer Motion Animations**: Smooth transitions and micro-interactions
- **Tailwind CSS**: Modern design system with custom components
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Dark Mode Ready**: Built-in support for theme switching

### 👥 User Roles & Dashboards
- **Admin**: Full system control and analytics
- **Principal**: Academic oversight and management
- **Teacher**: Class management and student interaction
- **Student**: Learning resources and progress tracking
- **Parent**: Child progress monitoring and communication
- **HR**: Staff management and recruitment
- **Finance**: Financial operations and billing
- **Support**: Customer service and ticket management

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| State Management | Zustand |
| Forms | React Hook Form |
| Animations | Framer Motion |
| Icons | Heroicons |
| Notifications | React Hot Toast |

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://tspzdsawiabtdoaupymk.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   Create the following tables in your Supabase project:
   
   ```sql
   -- Profiles table
   CREATE TABLE profiles (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     full_name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'principal', 'teacher', 'student', 'parent', 'hr', 'finance', 'support')),
     avatar_url TEXT,
     phone TEXT,
     address TEXT,
     date_of_birth DATE,
     gender TEXT CHECK (gender IN ('male', 'female', 'other')),
     emergency_contact TEXT,
     student_id TEXT UNIQUE,
     package TEXT CHECK (package IN ('free', 'silver', 'gold')),
     enrollment_date DATE,
     class_id UUID,
     employee_id TEXT UNIQUE,
     department TEXT,
     subjects TEXT[],
     qualification TEXT,
     experience_years INTEGER,
     children_ids UUID[],
     relationship TEXT,
     hire_date DATE,
     salary DECIMAL,
     position TEXT,
     is_active BOOLEAN DEFAULT TRUE,
     last_login TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   
   -- Policies
   CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Demo Credentials

For testing purposes, you can use these demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iems.com | password123 |
| Student | student@iems.com | password123 |
| Teacher | teacher@iems.com | password123 |
| Parent | parent@iems.com | password123 |

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── layout/          # Layout components
│   └── ui/              # Basic UI components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Third-party library configurations
├── pages/               # Page components
│   ├── auth/           # Authentication pages
│   └── dashboards/     # Role-specific dashboards
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── assets/              # Static assets
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checker
```

### Component Development

All components are built with:
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Accessibility** best practices

## 🔐 Security Features

- **Role-Based Access Control (RBAC)**
- **Route Protection**
- **Input Validation**
- **SQL Injection Protection**
- **XSS Prevention**
- **CSRF Protection**
- **Secure Session Management**

## 📊 Package-Based Features

The system implements a sophisticated package-based feature control:

### Free Package (🟢)
- Group classes access
- Basic dashboard
- Messaging system
- Grade and attendance viewing

### Silver Package (🟡)
- All Free package features
- Learning resources access
- Enhanced dashboard
- Priority support

### Gold Package (🟡)
- All Silver package features
- One-to-one session booking
- Consultation scheduling
- Premium learning resources
- Advanced analytics

## 🎯 Key Features

### Authentication
- ✅ Multi-role login system
- ✅ Self-registration for students and parents
- ✅ Admin-controlled staff accounts
- ✅ Package selection during registration
- ✅ Password reset functionality

### User Management
- ✅ Role-based permissions
- ✅ Profile management
- ✅ Package-based feature access
- ✅ Account activation/deactivation

### UI/UX
- ✅ Responsive design
- ✅ Modern animations
- ✅ Accessibility compliance
- ✅ Toast notifications
- ✅ Loading states

### Dashboard Features
- ✅ Role-specific dashboards
- ✅ Package-aware UI rendering
- ✅ Statistics and analytics
- ✅ Quick actions
- ✅ Recent activity feeds

## 🚀 Future Enhancements

- [ ] Real-time notifications
- [ ] Video conferencing integration
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] AI-powered features
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Advanced reporting

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👨‍💻 Development Team

Built with ❤️ by the IEMS development team.

---

**Note**: This is a demonstration project showcasing modern web development practices and enterprise-level architecture. It includes comprehensive authentication, role-based access control, and package-based feature management suitable for educational institutions. 