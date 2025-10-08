import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import {
  AdminStudentService,
  Student,
  PackageInfo,
} from "@/lib/adminStudentService";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManageStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPackage, setFilterPackage] = useState("all");
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byPackage: {} as Record<string, number>,
    recentRegistrations: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading data in ManageStudentsPage...");

      // Load students, packages, and stats in parallel
      const [studentsData, packagesData, statsData] = await Promise.all([
        AdminStudentService.getAllStudents(),
        AdminStudentService.getPackageInfo(),
        AdminStudentService.getStudentStats(),
      ]);

      console.log("Students data received:", studentsData);
      console.log("Packages data received:", packagesData);
      console.log("Stats data received:", statsData);

      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setPackages(packagesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter students based on search and package filter
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPackage !== "all") {
      filtered = filtered.filter(
        (student) => student.package === filterPackage
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterPackage]);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const getPackageInfo = (packageType: string) => {
    return packages.find((p) => p.package_type === packageType);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const dashboardStats = [
    {
      name: "Total Students",
      value: stats.total.toString(),
      change: "+12%",
      changeType: "positive",
      icon: UserGroupIcon,
    },
    {
      name: "Active Students",
      value: stats.active.toString(),
      change: "+5%",
      changeType: "positive",
      icon: CheckCircleIcon,
    },
    {
      name: "Recent Registrations",
      value: stats.recentRegistrations.toString(),
      change: "+8%",
      changeType: "positive",
      icon: AcademicCapIcon,
    },
    {
      name: "Premium Subscriptions",
      value: (
        (stats.byPackage.gold || 0) + (stats.byPackage.silver || 0)
      ).toString(),
      change: "+15%",
      changeType: "positive",
      icon: CurrencyDollarIcon,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
          {/* Header */}
          <div className="pt-6">
            <h1 className="text-3xl font-bold text-foreground">
              Manage Students
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              View and manage all student accounts, subscriptions, and
              information.
            </p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 justify-center"
          >
            {dashboardStats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg border border-border h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground max-w-xs">
                          {stat.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="flex items-start space-x-2">
                        <div className="text-3xl font-bold text-foreground ml-3">
                          {stat.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Student Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-lg border border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>Student Management</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 pl-10 w-full focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={filterPackage}
                      onChange={(e) => setFilterPackage(e.target.value)}
                      className="bg-input border border-border text-foreground rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">All Packages</option>
                      <option value="free">Free</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-muted-foreground"
                          >
                            {students.length === 0
                              ? "No students found"
                              : "No students match your search criteria"}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => {
                          const packageInfo = getPackageInfo(student.package);
                          return (
                            <tr key={student.id} className="hover:bg-muted/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {student.profile_image_url ? (
                                    <img
                                      src={student.profile_image_url}
                                      alt={`${student.full_name}'s profile`}
                                      className="h-10 w-10 rounded-full object-cover border-2 border-border"
                                      onError={(e) => {
                                        // Fallback to initials if image fails to load
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.nextElementSibling?.classList.remove(
                                          "hidden"
                                        );
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${
                                      student.profile_image_url ? "hidden" : ""
                                    }`}
                                  >
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {student.first_name[0]}
                                      {student.last_name[0]}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-foreground">
                                      {student.full_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {student.email}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {student.student_id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CreditCardIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      student.package === "gold"
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                        : student.package === "silver"
                                        ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    }`}
                                  >
                                    {packageInfo?.display_name ||
                                      student.package}
                                  </span>
                                </div>
                                {packageInfo && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatCurrency(packageInfo.price_monthly)}
                                    /month
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {student.is_active ? (
                                    <CheckCircleIcon className="h-4 w-4 text-emerald-400 mr-2" />
                                  ) : (
                                    <XCircleIcon className="h-4 w-4 text-red-400 mr-2" />
                                  )}
                                  <span
                                    className={`text-sm ${
                                      student.is_active
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {student.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {formatDate(student.last_login)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewStudent(student)}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#34A853] to-[#6DD47E] rounded-lg hover:from-[#2E8B47] hover:to-[#5BC06F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#34A853] transition-all duration-200 shadow-[0_2px_2px_0_#16803D] hover:shadow-[0_4px_4px_0_#16803D] transform hover:scale-105"
                                    title="View Details"
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Student Details Modal */}
          {showStudentModal && selectedStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border border-border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-card">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground">
                      Student Details: {selectedStudent.full_name}
                    </h3>
                    <button
                      onClick={() => setShowStudentModal(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Profile Image Section */}
                  <div className="flex justify-center mb-6">
                    {selectedStudent.profile_image_url ? (
                      <img
                        src={selectedStudent.profile_image_url}
                        alt={`${selectedStudent.full_name}'s profile`}
                        className="h-24 w-24 rounded-full object-cover border-4 border-border shadow-lg"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-24 w-24 rounded-full bg-muted flex items-center justify-center border-4 border-border shadow-lg ${
                        selectedStudent.profile_image_url ? "hidden" : ""
                      }`}
                    >
                      <span className="text-2xl font-bold text-muted-foreground">
                        {selectedStudent.first_name[0]}
                        {selectedStudent.last_name[0]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-3">
                        Personal Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Name:</strong> {selectedStudent.full_name}
                        </div>
                        <div>
                          <strong>Email:</strong> {selectedStudent.email}
                        </div>
                        <div>
                          <strong>Phone:</strong>{" "}
                          {selectedStudent.phone || "N/A"}
                        </div>
                        <div>
                          <strong>Date of Birth:</strong>{" "}
                          {formatDate(selectedStudent.date_of_birth)}
                        </div>
                        <div>
                          <strong>Gender:</strong>{" "}
                          {selectedStudent.gender || "N/A"}
                        </div>
                        <div>
                          <strong>Age:</strong> {selectedStudent.age}
                        </div>
                        <div>
                          <strong>Emergency Contact:</strong>{" "}
                          {selectedStudent.emergency_contact || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-3">
                        Location Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>City:</strong> {selectedStudent.city || "N/A"}
                        </div>
                        <div>
                          <strong>Postcode:</strong>{" "}
                          {selectedStudent.postcode || "N/A"}
                        </div>
                        <div>
                          <strong>Full Address:</strong>{" "}
                          {selectedStudent.address || "N/A"}
                        </div>
                        <div>
                          <strong>School Name:</strong>{" "}
                          {selectedStudent.school_name || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Parent Contact Information */}
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-3">
                        Parent Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Parent Name:</strong>{" "}
                          {selectedStudent.parent_name || "N/A"}
                        </div>
                        <div>
                          <strong>Parent Phone:</strong>{" "}
                          {selectedStudent.parent_phone || "N/A"}
                        </div>
                        <div>
                          <strong>Parent Email:</strong>{" "}
                          {selectedStudent.parent_email || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                      <h4 className="text-md font-medium text-foreground mb-3">
                        Academic Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Student ID:</strong>{" "}
                          {selectedStudent.student_id}
                        </div>
                        <div>
                          <strong>Current Grade:</strong>{" "}
                          {selectedStudent.current_grade || "N/A"}
                        </div>
                        <div>
                          <strong>Academic Set:</strong>{" "}
                          {selectedStudent.academic_set || "N/A"}
                        </div>
                        <div>
                          <strong>Learning Disabilities:</strong>{" "}
                          {selectedStudent.has_learning_disabilities
                            ? "Yes"
                            : "No"}
                        </div>
                        {selectedStudent.learning_needs_description && (
                          <div>
                            <strong>Learning Needs:</strong>{" "}
                            {selectedStudent.learning_needs_description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subscription Information */}
                    <div className="md:col-span-2">
                      <h4 className="text-md font-medium text-foreground mb-3">
                        Subscription Details
                      </h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Package
                            </div>
                            <div className="text-lg font-semibold text-foreground">
                              {getPackageInfo(selectedStudent.package)
                                ?.display_name || selectedStudent.package}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Status
                            </div>
                            <div className="text-lg font-semibold text-emerald-400">
                              {selectedStudent.subscription_status}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">
                              Monthly Price
                            </div>
                            <div className="text-lg font-semibold text-foreground">
                              {getPackageInfo(selectedStudent.package)
                                ? formatCurrency(
                                    getPackageInfo(selectedStudent.package)!
                                      .price_monthly
                                  )
                                : "Free"}
                            </div>
                          </div>
                        </div>

                        {selectedStudent.subscription_start_date && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">
                                Start Date
                              </div>
                              <div className="text-sm text-foreground">
                                {formatDate(
                                  selectedStudent.subscription_start_date
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">
                                End Date
                              </div>
                              <div className="text-sm text-foreground">
                                {formatDate(
                                  selectedStudent.subscription_end_date
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {getPackageInfo(selectedStudent.package)?.features && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-muted-foreground mb-2">
                              Package Features
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {getPackageInfo(
                                selectedStudent.package
                              )!.features.map((feature: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Information */}
                    <div className="md:col-span-2">
                      <h4 className="text-md font-medium text-foreground mb-3">
                        Account Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Account Status:</strong>{" "}
                          {selectedStudent.is_active ? "Active" : "Inactive"}
                        </div>
                        <div>
                          <strong>Last Login:</strong>{" "}
                          {formatDate(selectedStudent.last_login)}
                        </div>
                        <div>
                          <strong>Created:</strong>{" "}
                          {formatDate(selectedStudent.created_at)}
                        </div>
                        <div>
                          <strong>Updated:</strong>{" "}
                          {formatDate(selectedStudent.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowStudentModal(false)}
                      className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
    </motion.div>
  );
};

export default ManageStudentsPage;
