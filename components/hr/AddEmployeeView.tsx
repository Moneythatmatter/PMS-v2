"use client";

import React, { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { employeeDepartmentLabels } from "@/app/data/hr/employeeDepartmentOptions";
import {
  AddEmployeePreviewModal,
  type EmployeeFormPreviewData,
} from "@/components/hr/AddEmployeePreviewModal";
import { cn } from "@/lib/utils";

const inputClass = "rounded-xl h-10 text-sm";

const departmentOptions = employeeDepartmentLabels.map((label) => ({
  value: label,
  label,
}));

const designationOptions = [
  "Front Desk Manager",
  "Front Desk Associate",
  "Executive Housekeeper",
  "Housekeeping Attendant",
  "Executive Chef",
  "F&B Steward / Waiter",
  "Maintenance Technician",
  "HR Executive",
  "Finance Manager",
].map((label) => ({ value: label, label }));

const employmentTypeOptions = [
  { value: "Permanent", label: "Permanent" },
  { value: "Contractual", label: "Contractual" },
  { value: "Probation", label: "Probation" },
  { value: "Trainee / Intern", label: "Trainee / Intern" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Probation", label: "Probation" },
  { value: "Notice Period", label: "Notice Period" },
  { value: "Inactive", label: "Inactive" },
];

const shiftTypeOptions = [
  { value: "Morning Shift (07:00 AM - 03:30 PM)", label: "Morning Shift (07:00 AM - 03:30 PM)" },
  { value: "Evening Shift (03:00 PM - 11:30 PM)", label: "Evening Shift (03:00 PM - 11:30 PM)" },
  { value: "Night Shift (11:00 PM - 07:30 AM)", label: "Night Shift (11:00 PM - 07:30 AM)" },
  { value: "General Shift (09:00 AM - 05:30 PM)", label: "General Shift (09:00 AM - 05:30 PM)" },
];

const weeklyOffOptions = [
  { value: "Sunday Only", label: "Sunday Only" },
  { value: "Rotational Off", label: "Rotational Off" },
  { value: "Alternate Saturdays & Sundays", label: "Alternate Saturdays & Sundays" },
];

const leavePolicyOptions = [
  { value: "Standard Hotel Staff Policy (24 Days Annual)", label: "Standard Hotel Staff Policy (24 Days Annual)" },
  { value: "Executive Officer Leave Policy (30 Days Annual)", label: "Executive Officer Leave Policy (30 Days Annual)" },
  { value: "Contract Staff Policy (12 Days Annual)", label: "Contract Staff Policy (12 Days Annual)" },
];

const salaryStructureOptions = [
  { value: "Executive Staff Slab B", label: "Executive Staff Slab B" },
  { value: "Managerial Grade A", label: "Managerial Grade A" },
  { value: "Operative Staff Slab C", label: "Operative Staff Slab C" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const emergencyRelationOptions = [
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Sibling", label: "Sibling" },
  { value: "Friend", label: "Friend" },
];

const documentTypeOptions = [
  { value: "Aadhaar Card", label: "Aadhaar Card" },
  { value: "PAN Card", label: "PAN Card" },
  { value: "Resume", label: "Resume" },
  { value: "Offer Letter", label: "Offer Letter" },
  { value: "Joining Letter", label: "Joining Letter" },
  { value: "Bank Passbook", label: "Bank Passbook" },
  { value: "Other Documents", label: "Other Documents" },
];

interface UploadedDocument {
  id: string;
  type: string;
  fileName: string;
  uploadDate: string;
  size: string;
}

function FormSection({
  icon,
  iconClassName,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconClassName)}>
            {icon}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
            <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function ActionButtons({
  isSubmitting,
  onCancel,
  onReviewSave,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onReviewSave: (addAnother: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancel}
        className="rounded-xl bg-white text-xs font-semibold shadow-xs"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onReviewSave(true)}
        disabled={isSubmitting}
        className="rounded-xl border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100"
      >
        Save &amp; Add Another
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => onReviewSave(false)}
        disabled={isSubmitting}
        className="rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
      >
        <Save className="mr-1.5 h-3.5 w-3.5" />
        {isSubmitting ? "Saving..." : "Save Employee"}
      </Button>
    </div>
  );
}

export function AddEmployeeView() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveAfterPreview, setSaveAfterPreview] = useState(false);

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
    emergencyRelation: "Spouse",
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

  const updateField = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const previewData: EmployeeFormPreviewData = useMemo(
    () => ({
      ...formData,
      documents: documents.map((document) => ({
        type: document.type,
        fileName: document.fileName,
      })),
      salaryBreakdown,
    }),
    [formData, documents, salaryBreakdown],
  );

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setToastMessage("Please enter required first and last name.");
      return false;
    }
    if (!formData.phone.trim()) {
      setToastMessage("Please enter a valid mobile number.");
      return false;
    }
    if (!formData.department) {
      setToastMessage("Please select a department.");
      return false;
    }
    if (!formData.designation) {
      setToastMessage("Please select a designation.");
      return false;
    }
    if (!formData.employmentType) {
      setToastMessage("Please select an employment type.");
      return false;
    }
    if (formData.enableSystemAccess && formData.password !== formData.confirmPassword) {
      setToastMessage("System access passwords do not match.");
      return false;
    }
    return true;
  };

  const handleReviewSave = (addAnother = false) => {
    if (!validateForm()) return;
    setSaveAfterPreview(addAnother);
    setShowPreview(true);
  };

  const resetFormForAnother = () => {
    setFormData({
      ...formData,
      empCode: `EMP-0${Math.floor(100 + Math.random() * 900)}`,
      firstName: "",
      lastName: "",
      phone: "",
      personalEmail: "",
      department: "",
      designation: "",
      employmentType: "",
      shiftType: "",
      weeklyOffPattern: "",
      leavePolicy: "",
      salaryStructure: "",
      basicSalary: "",
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
  };

  const handleConfirmSave = () => {
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setShowPreview(false);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      setToastMessage(`Employee ${fullName} (${formData.empCode}) saved successfully.`);

      if (saveAfterPreview) {
        resetFormForAnother();
        return;
      }

      window.setTimeout(() => {
        router.push("/human-resources/employees/list");
      }, 800);
    }, 600);
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

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Add Employee"
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Add Employee" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      secondaryActions={
        <ActionButtons
          isSubmitting={isSubmitting}
          onCancel={() => router.push("/human-resources/employees/list")}
          onReviewSave={handleReviewSave}
        />
      }
    >
      <div className="space-y-5">
        <FormSection
          icon={<User className="h-4 w-4" />}
          iconClassName="bg-emerald-100 text-emerald-800"
          title="Section 1: Basic Information"
          subtitle="Personal identity and contact info"
          badge={
            <span className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              ID: {formData.empCode}
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Employee ID (Auto Generated)">
              <TextInput value={formData.empCode} readOnly className={cn(inputClass, "bg-slate-50 font-semibold text-slate-600")} />
            </FormField>
            <FormField label="Gender" required>
              <DropdownSelect
                value={formData.gender}
                onChange={(value) => updateField("gender", value)}
                options={genderOptions}
                aria-label="Gender"
              />
            </FormField>
            <FormField label="First Name" required>
              <TextInput
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Abhinav"
                className={inputClass}
              />
            </FormField>
            <FormField label="Last Name" required>
              <TextInput
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Nayak"
                className={inputClass}
              />
            </FormField>
            <FormField label="Date of Birth" required>
              <TextInput
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={inputClass}
              />
            </FormField>
            <FormField label="Mobile Number" required>
              <TextInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </FormField>
            <FormField label="Personal Email">
              <TextInput
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                placeholder="e.g. abhinav.nayak@gmail.com"
                className={inputClass}
              />
            </FormField>
            <FormField label="Profile Photo Upload">
              <input
                type="file"
                accept="image/*"
                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<Briefcase className="h-4 w-4" />}
          iconClassName="bg-blue-100 text-blue-800"
          title="Section 2: Employment Information"
          subtitle="Department, role, and tenure details (values from masters)"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Department" required>
              <DropdownSelect
                value={formData.department}
                onChange={(value) => updateField("department", value)}
                options={departmentOptions}
                placeholder="Select department"
                aria-label="Department"
              />
            </FormField>
            <FormField label="Designation" required>
              <DropdownSelect
                value={formData.designation}
                onChange={(value) => updateField("designation", value)}
                options={designationOptions}
                placeholder="Select designation"
                searchable
                aria-label="Designation"
              />
            </FormField>
            <FormField label="Reporting Manager">
              <TextInput
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleChange}
                placeholder="e.g. Vikram Malhotra (GM)"
                className={inputClass}
              />
            </FormField>
            <FormField label="Employment Type" required>
              <DropdownSelect
                value={formData.employmentType}
                onChange={(value) => updateField("employmentType", value)}
                options={employmentTypeOptions}
                placeholder="Select employment type"
                aria-label="Employment type"
              />
            </FormField>
            <FormField label="Joining Date" required>
              <TextInput
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                className={inputClass}
              />
            </FormField>
            <FormField label="Work Location">
              <TextInput
                name="workLocation"
                value={formData.workLocation}
                onChange={handleChange}
                placeholder="e.g. Grand Hotel Main Property"
                className={inputClass}
              />
            </FormField>
            <FormField label="Employee Status">
              <DropdownSelect
                value={formData.status}
                onChange={(value) => updateField("status", value)}
                options={statusOptions}
                aria-label="Employee status"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<Clock className="h-4 w-4" />}
          iconClassName="bg-purple-100 text-purple-800"
          title="Section 3: Attendance & Leave Configuration"
          subtitle="Shift allocation and leave policy rules"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Shift Type" required>
              <DropdownSelect
                value={formData.shiftType}
                onChange={(value) => updateField("shiftType", value)}
                options={shiftTypeOptions}
                placeholder="Select shift type"
                aria-label="Shift type"
              />
            </FormField>
            <FormField label="Weekly Off Pattern">
              <DropdownSelect
                value={formData.weeklyOffPattern}
                onChange={(value) => updateField("weeklyOffPattern", value)}
                options={weeklyOffOptions}
                placeholder="Select weekly off"
                aria-label="Weekly off pattern"
              />
            </FormField>
            <FormField label="Leave Policy" className="sm:col-span-2">
              <DropdownSelect
                value={formData.leavePolicy}
                onChange={(value) => updateField("leavePolicy", value)}
                options={leavePolicyOptions}
                placeholder="Select leave policy"
                aria-label="Leave policy"
              />
            </FormField>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-700" />
              <span className="font-bold text-purple-900">Assigned Shift Timing Preview</span>
            </div>
            <span className="rounded-lg border border-purple-200 bg-white px-3 py-1 font-semibold text-purple-950">
              {formData.shiftType || "No shift selected"}
            </span>
          </div>
        </FormSection>

        <FormSection
          icon={<CreditCard className="h-4 w-4" />}
          iconClassName="bg-amber-100 text-amber-800"
          title="Section 4: Payroll Information"
          subtitle="Salary structure, bank details, and statutory numbers"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Salary Structure" required>
              <DropdownSelect
                value={formData.salaryStructure}
                onChange={(value) => updateField("salaryStructure", value)}
                options={salaryStructureOptions}
                placeholder="Select salary structure"
                aria-label="Salary structure"
              />
            </FormField>
            <FormField label="Basic Salary (₹)" required>
              <TextInput
                type="number"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleChange}
                placeholder="20000"
                className={inputClass}
              />
            </FormField>
            <FormField label="Bank Name">
              <TextInput name="bankName" value={formData.bankName} onChange={handleChange} placeholder="HDFC Bank" className={inputClass} />
            </FormField>
            <FormField label="Account Holder Name">
              <TextInput name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} placeholder="Abhinav Nayak" className={inputClass} />
            </FormField>
            <FormField label="Account Number">
              <TextInput name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="5010023456789" className={inputClass} />
            </FormField>
            <FormField label="IFSC Code">
              <TextInput name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="HDFC0001234" className={inputClass} />
            </FormField>
            <FormField label="PAN Number">
              <TextInput name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" className={cn(inputClass, "uppercase")} />
            </FormField>
            <FormField label="UAN Number (PF)" helperText="Optional">
              <TextInput name="uanNumber" value={formData.uanNumber} onChange={handleChange} placeholder="e.g. 100987654321" className={inputClass} />
            </FormField>
            <FormField label="ESIC Number" helperText="Optional">
              <TextInput name="esicNumber" value={formData.esicNumber} onChange={handleChange} placeholder="e.g. 3100987654" className={inputClass} />
            </FormField>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="border-b border-amber-200/60 pb-2 text-xs font-bold uppercase tracking-wide text-amber-900">
              Live Salary Structure Breakdown
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-slate-500">Basic Salary</p>
                <p className="font-bold text-slate-900">₹{salaryBreakdown.basic.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">HRA (40%)</p>
                <p className="font-bold text-slate-900">₹{salaryBreakdown.hra.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Special Allowance</p>
                <p className="font-bold text-slate-900">₹{salaryBreakdown.specialAllowance.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-amber-800">Gross Salary</p>
                <p className="text-sm font-extrabold text-amber-950">₹{salaryBreakdown.gross.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          icon={<Heart className="h-4 w-4" />}
          iconClassName="bg-rose-100 text-rose-800"
          title="Section 5: Emergency Contact"
          subtitle="Primary next-of-kin or emergency reference"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Contact Name">
              <TextInput name="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder="e.g. Sunita Nayak" className={inputClass} />
            </FormField>
            <FormField label="Relationship">
              <DropdownSelect
                value={formData.emergencyRelation || "Spouse"}
                onChange={(value) => updateField("emergencyRelation", value)}
                options={emergencyRelationOptions}
                aria-label="Emergency contact relationship"
              />
            </FormField>
            <FormField label="Mobile Number">
              <TextInput type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder="+91 98765 00000" className={inputClass} />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<FileText className="h-4 w-4" />}
          iconClassName="bg-teal-100 text-teal-800"
          title="Section 6: Documents & Verification"
          subtitle="Multiple document uploads (Aadhaar, PAN, resume, offer letter)"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Document Type">
              <DropdownSelect
                value={selectedDocType}
                onChange={setSelectedDocType}
                options={documentTypeOptions}
                aria-label="Document type"
              />
            </FormField>
            <FormField label="Choose File to Upload" className="sm:col-span-2">
              <input
                type="file"
                onChange={handleFileUpload}
                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-800"
              />
            </FormField>
          </div>
          {documents.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Uploaded Files ({documents.length})
              </p>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-emerald-700" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {doc.type}: <span className="font-normal text-slate-600">{doc.fileName}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Uploaded: {doc.uploadDate} · Size: {doc.size}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <ActionButtons
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/human-resources/employees/list")}
            onReviewSave={handleReviewSave}
          />
        </div>
      </div>

      <AddEmployeePreviewModal
        open={showPreview}
        data={previewData}
        isSubmitting={isSubmitting}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmSave}
      />
    </ModulePageShell>
  );
}

