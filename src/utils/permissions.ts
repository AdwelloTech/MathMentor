import type { UserRole, StudentPackage, FeaturePermissions } from '@/types/auth';

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  principal: 90,
  hr: 80,
  finance: 70,
  support: 60,
  teacher: 50,
  parent: 30,
  student: 20,
};

// Define package hierarchy
const PACKAGE_HIERARCHY: Record<StudentPackage, number> = {
  gold: 30,
  silver: 20,
  free: 10,
};

// Feature access based on roles
const ROLE_PERMISSIONS: Record<UserRole, Partial<FeaturePermissions>> = {
  admin: {
    // Admin has access to everything
    viewClasses: true,
    manageClasses: true,
    viewGrades: true,
    manageGrades: true,
    viewAttendance: true,
    manageAttendance: true,
    accessLearningResources: true,
    bookOneToOne: true,
    bookConsultation: true,
    joinGroupClasses: true,
    manageUsers: true,
    viewReports: true,
    manageFinance: true,
    manageAdmissions: true,
    manageHR: true,
    sendMessages: true,
    receiveMessages: true,
    makeAnnouncements: true,
    accessDashboard: true,
    manageSettings: true,
    viewAuditLogs: true,
  },
  principal: {
    viewClasses: true,
    manageClasses: true,
    viewGrades: true,
    manageGrades: true,
    viewAttendance: true,
    manageAttendance: true,
    accessLearningResources: true,
    manageUsers: true,
    viewReports: true,
    manageFinance: true,
    manageAdmissions: true,
    manageHR: true,
    sendMessages: true,
    receiveMessages: true,
    makeAnnouncements: true,
    accessDashboard: true,
    manageSettings: true,
    viewAuditLogs: true,
  },
  teacher: {
    viewClasses: true,
    manageClasses: true,
    viewGrades: true,
    manageGrades: true,
    viewAttendance: true,
    manageAttendance: true,
    accessLearningResources: true,
    bookOneToOne: true,
    bookConsultation: true,
    joinGroupClasses: true,
    sendMessages: true,
    receiveMessages: true,
    accessDashboard: true,
  },
  student: {
    viewClasses: true,
    viewGrades: true,
    viewAttendance: true,
    // Package-dependent features will be handled separately
    sendMessages: true,
    receiveMessages: true,
    accessDashboard: true,
  },
  parent: {
    viewClasses: true,
    viewGrades: true,
    viewAttendance: true,
    sendMessages: true,
    receiveMessages: true,
    accessDashboard: true,
  },
  hr: {
    viewClasses: true,
    viewAttendance: true,
    manageUsers: true,
    viewReports: true,
    manageHR: true,
    sendMessages: true,
    receiveMessages: true,
    makeAnnouncements: true,
    accessDashboard: true,
  },
  finance: {
    viewClasses: true,
    viewReports: true,
    manageFinance: true,
    sendMessages: true,
    receiveMessages: true,
    accessDashboard: true,
  },
  support: {
    viewClasses: true,
    sendMessages: true,
    receiveMessages: true,
    accessDashboard: true,
  },
};

// Package-specific permissions for students
const PACKAGE_PERMISSIONS: Record<StudentPackage, Partial<FeaturePermissions>> = {
  free: {
    accessLearningResources: false,
    bookOneToOne: false,
    bookConsultation: false,
    joinGroupClasses: true,
  },
  silver: {
    accessLearningResources: true,
    bookOneToOne: false,
    bookConsultation: false,
    joinGroupClasses: true,
  },
  gold: {
    accessLearningResources: true,
    bookOneToOne: true,
    bookConsultation: true,
    joinGroupClasses: true,
  },
};

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: UserRole | null, requiredRole: UserRole | UserRole[]): boolean {
  if (!userRole) return false;
  
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return requiredRoles.includes(userRole);
}

/**
 * Check if a user has a role with at least the specified hierarchy level
 */
export function hasRoleHierarchy(userRole: UserRole | null, minRole: UserRole): boolean {
  if (!userRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole];
  const minLevel = ROLE_HIERARCHY[minRole];
  
  return userLevel >= minLevel;
}

/**
 * Check if a student has a specific package
 */
export function hasPackage(userPackage: StudentPackage | null, requiredPackage: StudentPackage | StudentPackage[]): boolean {
  if (!userPackage) return false;
  
  const requiredPackages = Array.isArray(requiredPackage) ? requiredPackage : [requiredPackage];
  return requiredPackages.includes(userPackage);
}

/**
 * Check if a student has a package with at least the specified hierarchy level
 */
export function hasPackageHierarchy(userPackage: StudentPackage | null, minPackage: StudentPackage): boolean {
  if (!userPackage) return false;
  
  const userLevel = PACKAGE_HIERARCHY[userPackage];
  const minLevel = PACKAGE_HIERARCHY[minPackage];
  
  return userLevel >= minLevel;
}

/**
 * Get all permissions for a user based on their role and package
 */
export function getUserPermissions(role: UserRole | null, userPackage?: StudentPackage | null): FeaturePermissions {
  const defaultPermissions: FeaturePermissions = {
    viewClasses: false,
    manageClasses: false,
    viewGrades: false,
    manageGrades: false,
    viewAttendance: false,
    manageAttendance: false,
    accessLearningResources: false,
    bookOneToOne: false,
    bookConsultation: false,
    joinGroupClasses: false,
    manageUsers: false,
    viewReports: false,
    manageFinance: false,
    manageAdmissions: false,
    manageHR: false,
    sendMessages: false,
    receiveMessages: false,
    makeAnnouncements: false,
    accessDashboard: false,
    manageSettings: false,
    viewAuditLogs: false,
  };

  if (!role) return defaultPermissions;

  // Get base permissions from role
  const rolePermissions = ROLE_PERMISSIONS[role] || {};
  const permissions = { ...defaultPermissions, ...rolePermissions };

  // Apply package-specific permissions for students
  if (role === 'student' && userPackage) {
    const packagePermissions = PACKAGE_PERMISSIONS[userPackage] || {};
    Object.assign(permissions, packagePermissions);
  }

  return permissions;
}

/**
 * Check if a user can access a specific feature
 */
export function canAccessFeature(
  feature: keyof FeaturePermissions,
  role: UserRole | null,
  userPackage?: StudentPackage | null
): boolean {
  const permissions = getUserPermissions(role, userPackage);
  return permissions[feature] || false;
}

/**
 * Get accessible features for a user
 */
export function getAccessibleFeatures(role: UserRole | null, userPackage?: StudentPackage | null): string[] {
  const permissions = getUserPermissions(role, userPackage);
  return Object.entries(permissions)
    .filter(([_, hasAccess]) => hasAccess)
    .map(([feature, _]) => feature);
}

/**
 * Check if a user is an admin or has admin-level permissions
 */
export function isAdmin(role: UserRole | null): boolean {
  return hasRole(role, 'admin');
}

/**
 * Check if a user is a staff member (admin, principal, teacher, hr, finance, support)
 */
export function isStaff(role: UserRole | null): boolean {
  return hasRole(role, ['admin', 'principal', 'teacher', 'hr', 'finance', 'support']);
}

/**
 * Check if a user is a student
 */
export function isStudent(role: UserRole | null): boolean {
  return hasRole(role, 'student');
}

/**
 * Check if a user is a parent
 */
export function isParent(role: UserRole | null): boolean {
  return hasRole(role, 'parent');
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(role: UserRole | null): boolean {
  return hasRoleHierarchy(role, 'hr');
}

/**
 * Check if a user can view financial reports
 */
export function canViewFinancialReports(role: UserRole | null): boolean {
  return hasRole(role, ['admin', 'principal', 'finance']);
}

/**
 * Check if a user can make announcements
 */
export function canMakeAnnouncements(role: UserRole | null): boolean {
  return hasRoleHierarchy(role, 'hr');
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    principal: 'Principal',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    hr: 'HR Manager',
    finance: 'Finance Manager',
    support: 'Support Staff',
  };
  
  return roleNames[role] || role;
}

/**
 * Get display name for a package
 */
export function getPackageDisplayName(pkg: StudentPackage): string {
  const packageNames: Record<StudentPackage, string> = {
    free: 'Free Package',
    silver: 'Silver Package',
    gold: 'Gold Package',
  };
  
  return packageNames[pkg] || pkg;
}

/**
 * Get package features list
 */
export function getPackageFeatures(pkg: StudentPackage): string[] {
  const features: Record<StudentPackage, string[]> = {
    free: [
      'Group Classes',
      'Basic Dashboard Access',
      'Messaging',
      'View Grades & Attendance',
    ],
    silver: [
      'All Free Package Features',
      'Access to Learning Resources',
      'Enhanced Dashboard',
      'Priority Support',
    ],
    gold: [
      'All Silver Package Features',
      'One-to-One Sessions',
      'Consultation Booking',
      'Premium Learning Resources',
      'Advanced Analytics',
    ],
  };
  
  return features[pkg] || [];
}

/**
 * Check if a package upgrade is available
 */
export function canUpgradePackage(currentPackage: StudentPackage, targetPackage: StudentPackage): boolean {
  const currentLevel = PACKAGE_HIERARCHY[currentPackage];
  const targetLevel = PACKAGE_HIERARCHY[targetPackage];
  
  return targetLevel > currentLevel;
} 