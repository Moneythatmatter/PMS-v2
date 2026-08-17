"use client";

import React, { useState, useMemo } from "react";
import {
  UserPlus,
  ArrowLeft,
  Save,
  CheckCircle2,
  Building2,
  Briefcase,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  Upload,
  User,
  MapPin,
  Heart,
  ChevronRight,
  AlertCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";

interface UploadedDocument {
  id: string;
  type: string;
  fileName: string;
  uploadDate: string;
  size: string;
}

export function AddEmployeeView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State initialized for fresh employee creation
  const [formData, setFormData] = useState({
    empCode: "EMP-0111",
    firstName: "",
    lastName: "",
    gender: "Male",
    dob: "",
    phone: "",
    personalEmail: "",
    photoUrl: "",

    // Section 2: Employment Info
    department: "",
    designation: "",
    reportingManager: "",
    employmentType: "",
    joinDate: new Date().toISOString().split("T")[0],
    workLocation: "",
    status: "Active",

    // Section 3: Attendance & Leave
    shiftType: "",
    weeklyOffPattern: "",
    leavePolicy: "",

    // Section 4: Payroll Information
    salaryStructure: "",
    basicSalary: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
    uanNumber: "",
    esicNumber: "",

    // Section 5: Emergency Contact
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",

    // Section 7: PMS System Access
    enableSystemAccess: false,
    username: "",
    password: "",
    confirmPassword: "",
    userRole: "",
  });

  // Section 6: Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([
    {
      id: "doc-1",
      type: "Aadhaar Card",
      fileName: "aadhaar_card_front_back.pdf",
      uploadDate: new Date().toLocaleDateString("en-GB"),
      size: "1.2 MB",
    },
  ]);
  const [selectedDocType, setSelectedDocType] = useState("Aadhaar Card");

  // Live Auto-Calculated Salary Breakdown
  const salaryBreakdown = useMemo(() => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const hra = Math.round(basic * 0.4); // 40% HRA
    const specialAllowance = Math.round(basic * 0.25); // 25% Special Allowance
    const gross = basic + hra + specialAllowance;
    const pfDeduction = Math.round(basic * 0.12); // 12% PF
    const esicDeduction = gross < 21000 ? Math.round(gross * 0.0075) : 0;
    const net = gross - pfDeduction - esicDeduction;

    return { basic, hra, specialAllowance, gross, pfDeduction, esicDeduction, net };
  }, [formData.basicSalary]);

  // Form input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Mock File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      type: selectedDocType,
      fileName: file.name,
      uploadDate: new Date().toLocaleDateString("en-GB"),
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setToastMessage(`✓ ${selectedDocType} uploaded successfully.`);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Save Handlers
  const handleSave = (addAnother = false) => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setToastMessage("⚠️ Please enter required First Name & Last Name.");
      return;
    }
    if (!formData.phone.trim()) {
      setToastMessage("⚠️ Please enter a valid Mobile Number.");
      return;
    }
    if (formData.enableSystemAccess && formData.password !== formData.confirmPassword) {
      setToastMessage("⚠️ System Access passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      setToastMessage(`✓ Employee ${fullName} (${formData.empCode}) saved successfully!`);

      if (addAnother) {
        // Reset form for next employee
        setFormData({
          ...formData,
          empCode: `EMP-0${Math.floor(100 + Math.random() * 900)}`,
          firstName: "",
          lastName: "",
          phone: "",
          personalEmail: "",
          basicSalary: "20000",
          accountHolderName: "",
          accountNumber: "",
          panNumber: "",
          uanNumber: "",
          esicNumber: "",
          emergencyName: "",
          emergencyPhone: "",
          enableSystemAccess: false,
          username: "",
          password: "",
          confirmPassword: "",
        });
        setDocuments([]);
      } else {
        setTimeout(() => {
          window.location.href = "/human-resources/employees/list";
        }, 1000);
      }
    }, 600);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Add Employee"
      description="Create a new employee profile and assign HR, attendance, payroll settings, and system access."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Add Employee" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/human-resources/employees/list">
            <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold bg-white shadow-xs">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          </a>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 shadow-xs cursor-pointer"
          >
            Save &amp; Add Another
          </Button>

          <Button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Saving..." : "Save Employee"}
          </Button>
        </div>
      }
    >
      {/* Single Column Layout (Full Width Form) */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* SECTION 1: BASIC INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Section 1: Basic Information
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">Personal identity and contact info</p>
                </div>
              </div>
              <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                ID: {formData.empCode}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Employee ID (Auto Generated)</label>
                <input
                  type="text"
                  value={formData.empCode}
                  readOnly
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Gender <span className="text-rose-600">*</span></label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">First Name <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Abhinav"
                  required
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Last Name <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Nayak"
                  required
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Date of Birth <span className="text-rose-600">*</span></label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Mobile Number <span className="text-rose-600">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Personal Email</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  placeholder="e.g. abhinav.nayak@gmail.com"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Profile Photo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="h-9 w-full text-[11px] text-slate-500 file:mr-2 file:h-7 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-2.5 file:text-xs file:font-bold file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: EMPLOYMENT INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Section 2: Employment Information
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Department, role, and tenure details (Values from Masters)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Department <span className="text-rose-600">*</span></label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Department --</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Kitchen / Culinary">Kitchen / Culinary</option>
                  <option value="F&B Service">F&B Service</option>
                  <option value="Maintenance & Eng.">Maintenance &amp; Eng.</option>
                  <option value="HR & Admin">HR &amp; Admin</option>
                  <option value="Finance & Accounts">Finance &amp; Accounts</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Designation <span className="text-rose-600">*</span></label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Designation --</option>
                  <option value="Front Desk Manager">Front Desk Manager</option>
                  <option value="Front Desk Associate">Front Desk Associate</option>
                  <option value="Executive Housekeeper">Executive Housekeeper</option>
                  <option value="Housekeeping Attendant">Housekeeping Attendant</option>
                  <option value="Executive Chef">Executive Chef</option>
                  <option value="F&B Steward / Waiter">F&B Steward / Waiter</option>
                  <option value="Maintenance Technician">Maintenance Technician</option>
                  <option value="HR Executive">HR Executive</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Reporting Manager</label>
                <input
                  type="text"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleChange}
                  placeholder="e.g. Vikram Malhotra (GM)"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Employment Type <span className="text-rose-600">*</span></label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Employment Type --</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Probation">Probation</option>
                  <option value="Trainee / Intern">Trainee / Intern</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Joining Date <span className="text-rose-600">*</span></label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Work Location</label>
                <input
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                  placeholder="e.g. Grand Hotel Main Property"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Employee Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Probation">Probation</option>
                  <option value="Notice Period">Notice Period</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 3: ATTENDANCE & LEAVE CONFIGURATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Section 3: Attendance &amp; Leave Configuration
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Shift allocation and leave policy rules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Shift Type <span className="text-rose-600">*</span></label>
                <select
                  name="shiftType"
                  value={formData.shiftType}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Shift Type --</option>
                  <option value="Morning Shift (07:00 AM - 03:30 PM)">Morning Shift (07:00 AM - 03:30 PM)</option>
                  <option value="Evening Shift (03:00 PM - 11:30 PM)">Evening Shift (03:00 PM - 11:30 PM)</option>
                  <option value="Night Shift (11:00 PM - 07:30 AM)">Night Shift (11:00 PM - 07:30 AM)</option>
                  <option value="General Shift (09:00 AM - 05:30 PM)">General Shift (09:00 AM - 05:30 PM)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Weekly Off Pattern</label>
                <select
                  name="weeklyOffPattern"
                  value={formData.weeklyOffPattern}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Weekly Off --</option>
                  <option value="Sunday Only">Sunday Only</option>
                  <option value="Rotational Off">Rotational Off</option>
                  <option value="Alternate Saturdays & Sundays">Alternate Saturdays &amp; Sundays</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700">Leave Policy</label>
                <select
                  name="leavePolicy"
                  value={formData.leavePolicy}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Leave Policy --</option>
                  <option value="Standard Hotel Staff Policy (24 Days Annual)">Standard Hotel Staff Policy (24 Days Annual)</option>
                  <option value="Executive Officer Leave Policy (30 Days Annual)">Executive Officer Leave Policy (30 Days Annual)</option>
                  <option value="Contract Staff Policy (12 Days Annual)">Contract Staff Policy (12 Days Annual)</option>
                </select>
              </div>
            </div>

            {/* Shift Timing Live Preview Box */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-700" />
                <span className="font-bold text-purple-900">Assigned Shift Timing Preview:</span>
              </div>
              <span className="rounded-lg bg-white px-3 py-1 font-black text-purple-950 border border-purple-200 shadow-2xs">
                ⏰ {formData.shiftType || "No Shift Selected"}
              </span>
            </div>
          </section>

          {/* SECTION 4: PAYROLL INFORMATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Section 4: Payroll Information
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Salary structure, bank details, and statutory numbers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Salary Structure <span className="text-rose-600">*</span></label>
                <select
                  name="salaryStructure"
                  value={formData.salaryStructure}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Select Salary Structure --</option>
                  <option value="Executive Staff Slab B">Executive Staff Slab B</option>
                  <option value="Managerial Grade A">Managerial Grade A</option>
                  <option value="Operative Staff Slab C">Operative Staff Slab C</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Basic Salary (₹) <span className="text-rose-600">*</span></label>
                <input
                  type="number"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleChange}
                  placeholder="20000"
                  required
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="HDFC Bank"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="Abhinav Nayak"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="5010023456789"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 flex items-center justify-between">
                  <span>UAN Number (PF)</span>
                  <span className="text-[10px] font-normal text-slate-400 italic">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="uanNumber"
                  value={formData.uanNumber}
                  onChange={handleChange}
                  placeholder="e.g. 100987654321 (Optional)"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700 flex items-center justify-between">
                  <span>ESIC Number</span>
                  <span className="text-[10px] font-normal text-slate-400 italic">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="esicNumber"
                  value={formData.esicNumber}
                  onChange={handleChange}
                  placeholder="e.g. 3100987654 (Optional)"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Auto-Calculated Salary Structure Summary Card */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2 text-xs">
              <span className="font-bold text-amber-900 uppercase tracking-wider block border-b border-amber-200/60 pb-1">
                💰 Live Salary Structure Breakdown
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-500 block">Basic Salary</span>
                  <span className="font-bold text-slate-900">₹{salaryBreakdown.basic.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">HRA (40%)</span>
                  <span className="font-bold text-slate-900">₹{salaryBreakdown.hra.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Special Allowance</span>
                  <span className="font-bold text-slate-900">₹{salaryBreakdown.specialAllowance.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 block uppercase font-bold">Gross Salary</span>
                  <span className="font-extrabold text-amber-950 text-sm">₹{salaryBreakdown.gross.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: EMERGENCY CONTACT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-800 font-bold">
                <Heart className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Section 5: Emergency Contact
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Primary next-of-kin or emergency reference</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Contact Name</label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  placeholder="e.g. Sunita Nayak"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Relationship</label>
                <select
                  name="emergencyRelation"
                  value={formData.emergencyRelation}
                  onChange={handleChange}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Mobile Number</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 00000"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* SECTION 6: DOCUMENTS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Section 6: Documents &amp; Verification
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Multiple document uploads (Aadhaar, PAN, Resume, Offer Letter)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Resume">Resume</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Joining Letter">Joining Letter</option>
                  <option value="Bank Passbook">Bank Passbook</option>
                  <option value="Other Documents">Other Documents</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-700">Choose File to Upload</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="h-9 w-full text-xs text-slate-500 file:mr-3 file:h-7 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-800 cursor-pointer"
                />
              </div>
            </div>

            {/* List of Uploaded Documents */}
            {documents.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Uploaded Files ({documents.length}):</span>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-emerald-700" />
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.type}: <span className="font-normal text-slate-600">{doc.fileName}</span></span>
                          <span className="text-[10px] text-slate-400">Uploaded: {doc.uploadDate} • Size: {doc.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Form Action Buttons Footer */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <a href="/human-resources/employees/list">
              <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold text-slate-700 bg-white shadow-xs">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 shadow-xs cursor-pointer"
            >
              Save &amp; Add Another
            </Button>

            <Button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {isSubmitting ? "Saving..." : "Save Employee"}
            </Button>
          </div>
      </div>
    </ModulePageShell>
  );
}

