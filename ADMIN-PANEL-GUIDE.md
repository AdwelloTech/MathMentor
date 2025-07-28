# Admin Panel Guide - MathMentor LMS

## Overview

The Admin Panel provides comprehensive management capabilities for the MathMentor Learning Management System. It allows administrators to manage students, view subscription details, monitor system performance, and handle administrative tasks.

## Features

### 🔐 Admin Authentication
- **Fixed Credentials**: 
  - Email: `admin@mathmentor.com`
  - Password: `admin123`
- **Secure Login**: Dedicated admin login page with enhanced security
- **Session Management**: Admin sessions are stored securely in localStorage

### 📊 Dashboard Overview
- **Real-time Statistics**: 
  - Total Students
  - Active Subscriptions
  - Monthly Revenue
  - Active Students
- **Visual Analytics**: Interactive charts and graphs
- **Quick Actions**: Direct access to common administrative tasks

### 👥 Student Management
- **Comprehensive Student List**: View all students with key information
- **Search & Filter**: 
  - Search by name, email, or student ID
  - Filter by package type (Free, Silver, Gold)
- **Student Details**: Complete student information including:
  - Personal Information
  - Academic Details
  - Subscription Information
  - Package Features
  - Account Status

### 💳 Package & Subscription Management
- **Package Information**: 
  - Free Package: Basic features
  - Silver Package: $29.99/month - Enhanced features
  - Gold Package: $49.99/month - Premium features
- **Subscription Tracking**: Monitor active subscriptions and payment status
- **Revenue Analytics**: Track monthly revenue and subscription trends

### 📈 Advanced Features
- **Activity Logging**: Track all admin actions
- **Notification System**: Real-time alerts and notifications
- **Report Generation**: Generate detailed reports
- **System Monitoring**: Monitor system performance and health

## Database Structure

### Core Tables
1. **profiles**: Enhanced with admin-specific fields
2. **admin_activity_log**: Track admin actions
3. **admin_dashboard_stats**: Cache dashboard statistics
4. **admin_notifications**: Admin notification system
5. **admin_reports**: Report generation and storage

### Key Functions
- `log_admin_activity()`: Log admin actions
- `generate_admin_stats()`: Generate dashboard statistics
- `get_admin_dashboard_data()`: Get comprehensive dashboard data
- `cache_admin_stats()`: Cache statistics for performance

## Usage Instructions

### 1. Accessing Admin Panel
1. Navigate to `/admin/login`
2. Enter admin credentials:
   - Email: `admin@mathmentor.com`
   - Password: `admin123`
3. Click "Admin Login"

### 2. Dashboard Navigation
- **Overview**: View system statistics and recent activity
- **Student Management**: Manage all student accounts
- **Subscriptions**: Monitor package subscriptions
- **Reports**: Generate and view reports

### 3. Student Management
1. **View Students**: Browse the complete student list
2. **Search**: Use the search bar to find specific students
3. **Filter**: Filter by package type
4. **View Details**: Click the eye icon to view complete student information
5. **Edit**: Click the pencil icon to edit student information
6. **Delete**: Click the trash icon to remove students (with confirmation)

### 4. Student Details Modal
When viewing a student, you can see:
- **Personal Information**: Name, email, phone, address, etc.
- **Academic Information**: Student ID, grade level, learning needs
- **Subscription Details**: Package type, status, pricing, features
- **Account Information**: Status, last login, creation date

## Package Information

### Free Package
- **Price**: $0/month
- **Features**:
  - Group classes
  - Basic support
  - Basic dashboard

### Silver Package
- **Price**: $29.99/month
- **Features**:
  - Group classes
  - Learning resources
  - Priority support
  - Enhanced dashboard

### Gold Package
- **Price**: $49.99/month
- **Features**:
  - All Silver features
  - One-to-one sessions
  - Consultation booking
  - Premium resources
  - Advanced analytics

## Security Features

### Authentication
- Fixed admin credentials for demo purposes
- Secure session management
- Role-based access control

### Data Protection
- Row Level Security (RLS) policies
- Encrypted data transmission
- Secure API endpoints

### Activity Logging
- All admin actions are logged
- IP address tracking
- User agent logging
- Timestamp recording

## Database Setup

### Running the Admin Database Updates
1. Copy the contents of `database-admin-update.sql`
2. Paste into your Supabase SQL Editor
3. Run the script to create admin-specific tables and functions

### Key Database Updates
- Enhanced profiles table with admin fields
- New admin activity logging system
- Dashboard statistics caching
- Notification system
- Report generation capabilities

## Customization

### Adding New Admin Features
1. **Database**: Add new tables/functions in Supabase
2. **Frontend**: Create new React components
3. **Routing**: Add new routes in App.tsx
4. **Permissions**: Update admin permissions array

### Styling
- Uses Tailwind CSS for styling
- Responsive design for all screen sizes
- Consistent with the main application theme
- Admin-specific color scheme (red/orange theme)

## Troubleshooting

### Common Issues
1. **Login Issues**: Verify credentials are correct
2. **Data Loading**: Check database connection
3. **Permissions**: Ensure admin role is properly set
4. **Session Issues**: Clear localStorage and re-login

### Performance Optimization
- Statistics are cached for better performance
- Pagination for large student lists
- Efficient database queries
- Optimized React components

## Future Enhancements

### Planned Features
- **Bulk Operations**: Select multiple students for batch actions
- **Advanced Analytics**: More detailed charts and graphs
- **Email Integration**: Send notifications to students
- **Export Features**: Export data to CSV/PDF
- **API Integration**: Connect with external services

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live data
- **Offline Support**: PWA capabilities
- **Mobile App**: Native mobile application
- **Advanced Security**: Two-factor authentication

## Support

For technical support or questions about the admin panel:
1. Check the database logs for errors
2. Verify all database functions are properly created
3. Ensure RLS policies are correctly configured
4. Test with the provided demo credentials

## Demo Data

The admin panel includes demo data for testing:
- **Students**: 3 sample students with different packages
- **Packages**: Complete package information with pricing
- **Notifications**: Sample admin notifications
- **Activity Logs**: Sample admin activity entries

This provides a complete testing environment for all admin features. 