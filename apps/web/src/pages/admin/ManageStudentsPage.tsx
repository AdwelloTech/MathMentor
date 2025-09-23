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
  type Student,
  type PackageInfo,
} from "@/lib/adminStudentService";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Safe helpers so we never call .toString() on undefined */
const S = (v: any, fallback = "—") => (v === null || v === undefined ? fallback : String(v));
const N = (v: any, fallback = 0) => (v === null || v === undefined || isNaN(Number(v)) ? fallback : Number(v));

const ManageStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPackage, setFilterPackage] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byPackage: {} as Record<string, number>,
    recentRegistrations: 0,
  });
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading data in ManageStudentsPage...");

      const [studentsArr, packagesArr, statsData] = await Promise.all([
        AdminStudentService.getAllStudents({ page: 1, pageSize: 50 }),
        AdminStudentService.getPackages(), // <-- use catalog
        AdminStudentService.getStudentStats(),
      ]);

      console.log("Students data received:", studentsArr);
      console.log("Packages data received:", packagesArr);
      console.log("Stats data received:", statsData);

      setStudents(studentsArr);
      setFilteredStudents(studentsArr);
      setPackages(packagesArr);
      setStats({
        total: N(statsData?.total, 0),
        active: N(statsData?.active, 0),
        byPackage: statsData?.byPackage ?? {},
        recentRegistrations: N(statsData?.recentRegistrations, 0),
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => {
        const name = (s.full_name || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        const sid = (s.student_id || "").toLowerCase();
        return name.includes(q) || email.includes(q) || sid.includes(q);
      });
    }

    if (filterPackage !== "all") {
      filtered = filtered.filter((s) => (s.package || "free") === filterPackage);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterPackage]);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const getPackageInfo = (packageType: string) =>
    packages.find((p) => p.package_type === packageType);

  const formatDate = (dateString?: string | null) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  const formatCurrency = (amountCents?: number) => {
    const v = N(amountCents, 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v / 100);
  };

  const dashboardStats = [
    { name: "Total Students",         value: S(stats.total),                       icon: UserGroupIcon,     change: "+12%", changeType: "positive" as const },
    { name: "Active Students",        value: S(stats.active),                      icon: CheckCircleIcon,   change: "+5%",  changeType: "positive" as const },
    { name: "Recent Registrations",   value: S(stats.recentRegistrations),         icon: AcademicCapIcon,   change: "+8%",  changeType: "positive" as const },
    {
      name: "Premium Subscriptions",
      value: S(N((stats.byPackage["gold"] ?? 0) + (stats.byPackage["silver"] ?? 0), 0)),
      icon: CurrencyDollarIcon,
      change: "+15%",
      changeType: "positive" as const,
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
    <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pb-16 relative z-10">
        <div className="space-y-8">
          <div className="pt-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
            <p className="mt-2 text-lg text-gray-600">View and manage all student accounts, subscriptions, and information.</p>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 justify-center">
            {dashboardStats.map((stat, i) => (
              <motion.div key={stat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 max-w-xs">{stat.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="flex items-start space-x-2">
                        <div className="text-3xl font-bold text-gray-900 ml-3">{stat.value}</div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${"text-green-600"}`}>{stat.change}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Student Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>Student Management</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10 w-full"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select value={filterPackage} onChange={(e) => setFilterPackage(e.target.value)} className="input">
                      <option value="all">All Packages</option>
                      <option value="free">Free</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            {students.length === 0 ? "No students found" : "No students match your search criteria"}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, idx) => {
                          const pkg = student.package || "free";
                          const pkgInfo = getPackageInfo(pkg);
                          const initials =
                            (student.first_name?.[0] || student.full_name?.[0] || student.email?.[0] || "?") +
                            (student.last_name?.[0] || "");
                          const key = String(student.id || student.student_id || student.email || idx);

                          return (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {student.profile_image_url ? (
                                    <img
                                      src={student.profile_image_url}
                                      alt={`${student.full_name || student.email}'s profile`}
                                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.nextElementSibling?.classList.remove("hidden");
                                      }}
                                    />
                                  ) : null}
                                  <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${student.profile_image_url ? "hidden" : ""}`}>
                                    <span className="text-sm font-medium text-gray-600">{initials}</span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{student.full_name || student.email}</div>
                                    <div className="text-sm text-gray-500">{student.email}</div>
                                    <div className="text-xs text-gray-400">ID: {student.student_id || "—"}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CreditCardIcon className="h-4 w-4 mr-2 text-gray-400" />
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      pkg === "gold"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : pkg === "silver"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {pkgInfo?.display_name || pkg}
                                  </span>
                                </div>
                                {pkgInfo && (
                                  <div className="text-xs text-gray-500 mt-1">{formatCurrency(pkgInfo.price_monthly)}/month</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {student.is_active ? (
                                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                  ) : (
                                    <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                  )}
                                  <span className={`text-sm ${student.is_active ? "text-green-600" : "text-red-600"}`}>
                                    {student.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
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

          {/* Student Modal */}
          {showStudentModal && selectedStudent && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Student Details: {selectedStudent.full_name || selectedStudent.email}
                    </h3>
                    <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center mb-6">
                    {selectedStudent.profile_image_url ? (
                      <img
                        src={selectedStudent.profile_image_url}
                        alt={`${selectedStudent.full_name || selectedStudent.email}'s profile`}
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200 shadow-lg ${
                        selectedStudent.profile_image_url ? "hidden" : ""
                      }`}
                    >
                      <span className="text-2xl font-bold text-gray-600">
                        {(selectedStudent.first_name?.[0] || selectedStudent.full_name?.[0] || selectedStudent.email?.[0] || "?") +
                          (selectedStudent.last_name?.[0] || "")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Personal Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {selectedStudent.full_name || "—"}</div>
                        <div><strong>Email:</strong> {selectedStudent.email || "—"}</div>
                        <div><strong>Phone:</strong> {selectedStudent.phone || "N/A"}</div>
                        <div><strong>Date of Birth:</strong> {formatDate(selectedStudent.date_of_birth)}</div>
                        <div><strong>Gender:</strong> {selectedStudent.gender || "N/A"}</div>
                        <div><strong>Age:</strong> {S(selectedStudent.age)}</div>
                        <div><strong>Emergency Contact:</strong> {selectedStudent.emergency_contact || "N/A"}</div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Location Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>City:</strong> {selectedStudent.city || "N/A"}</div>
                        <div><strong>Postcode:</strong> {selectedStudent.postcode || "N/A"}</div>
                        <div><strong>Full Address:</strong> {selectedStudent.address || "N/A"}</div>
                        <div><strong>School Name:</strong> {selectedStudent.school_name || "N/A"}</div>
                      </div>
                    </div>

                    {/* Parent */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Parent Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Parent Name:</strong> {selectedStudent.parent_name || "N/A"}</div>
                        <div><strong>Parent Phone:</strong> {selectedStudent.parent_phone || "N/A"}</div>
                        <div><strong>Parent Email:</strong> {selectedStudent.parent_email || "N/A"}</div>
                      </div>
                    </div>

                    {/* Academic */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Academic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Student ID:</strong> {selectedStudent.student_id || "—"}</div>
                        <div><strong>Current Grade:</strong> {selectedStudent.current_grade || "N/A"}</div>
                        <div><strong>Academic Set:</strong> {selectedStudent.academic_set || "N/A"}</div>
                        <div><strong>Learning Disabilities:</strong> {selectedStudent.has_learning_disabilities ? "Yes" : "No"}</div>
                        {selectedStudent.learning_needs_description && (
                          <div><strong>Learning Needs:</strong> {selectedStudent.learning_needs_description}</div>
                        )}
                      </div>
                    </div>

                    {/* Subscription */}
                    <div className="md:col-span-2">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Subscription Details</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-500">Package</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {getPackageInfo(selectedStudent.package || "free")?.display_name || selectedStudent.package || "free"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Status</div>
                            <div className="text-lg font-semibold text-green-600">
                              {selectedStudent.subscription_status || (selectedStudent.is_active ? "Active" : "Inactive")}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Monthly Price</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {getPackageInfo(selectedStudent.package || "free")
                                ? formatCurrency(getPackageInfo(selectedStudent.package || "free")!.price_monthly)
                                : "Free"}
                            </div>
                          </div>
                        </div>

                        {(selectedStudent.subscription_start_date || selectedStudent.subscription_end_date) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm font-medium text-gray-500">Start Date</div>
                              <div className="text-sm text-gray-900">{formatDate(selectedStudent.subscription_start_date)}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">End Date</div>
                              <div className="text-sm text-gray-900">{formatDate(selectedStudent.subscription_end_date)}</div>
                            </div>
                          </div>
                        )}

                        {getPackageInfo(selectedStudent.package || "free")?.features?.length ? (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-500 mb-2">Package Features</div>
                            <div className="flex flex-wrap gap-2">
                              {getPackageInfo(selectedStudent.package || "free")!.features!.map((f, i) => (
                                <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Account */}
                    <div className="md:col-span-2">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Account Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><strong>Account Status:</strong> {selectedStudent.is_active ? "Active" : "Inactive"}</div>
                        <div><strong>Last Login:</strong> {formatDate(selectedStudent.last_login)}</div>
                        <div><strong>Created:</strong> {formatDate(selectedStudent.created_at)}</div>
                        <div><strong>Updated:</strong> {formatDate(selectedStudent.updated_at)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={() => setShowStudentModal(false)} className="btn btn-secondary">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageStudentsPage;
