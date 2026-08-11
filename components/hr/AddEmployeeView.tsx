"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { FormField } from "@/components/frontoffice/ui";

export function AddEmployeeView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State initialized to empty strings for fresh creation
  const [formData, setFormData] = useState({
    empCode: "EMP-0111",
    firstName: "",
    lastName: "",
    gender: "Male",
    dob: "",
    bloodGroup: "O+",
    email: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "Spouse",
    address: "",
    city: "",
    state: "",
    pincode: "",
    department: "Front Office",
    designation: "",
    employmentType: "Permanent",
    shiftType: "Morning Shift",
    joinDate: new Date().toISOString().split("T")[0],
    reportingManager: "",
    salary: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    panNumber: "",
    aadharNumber: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone || !formData.email) {
      setToastMessage("Please complete all required fields (First Name, Phone, Email).");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMessage(`✓ Employee ${formData.firstName} ${formData.lastName} (${formData.empCode}) registered successfully. Redirecting to Employee List...`);
      setTimeout(() => {
        window.location.href = "/human-resources/employees/list";
      }, 1000);
    }, 600);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Add New Employee"
      description="Register a new staff member, assign department roles, shift roster, compensation structure, and document verification."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Add Employee" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <a href="/human-resources/employees/list">
            <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold bg-white shadow-xs">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Employee List
            </Button>
          </a>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Saving..." : "Save & Register Employee"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─────────────────────────────────────────────────────────────
            SECTION 1: Basic Personal Information
        ───────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Basic Personal Information
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Employee identity and personal details</p>
              </div>
            </div>
            <span className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              Code: {formData.empCode}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-700">First Name <span className="text-rose-600">*</span></label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Ramesh"
                required
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Sharma"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Gender</label>
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
              <label className="mb-1 block font-bold text-slate-700">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Profile Photo Upload</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="h-9 w-full text-[11px] text-slate-500 file:mr-2 file:h-7 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-2.5 file:text-xs file:font-bold file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 2: Contact & Emergency Information
        ───────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Contact &amp; Emergency Information
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Communication channels and emergency contact</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Official Email <span className="text-rose-600">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. ramesh.sharma@grandhotel.com"
                required
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Personal Phone Number <span className="text-rose-600">*</span></label>
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
              <label className="mb-1 block font-bold text-slate-700">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyName"
                value={formData.emergencyName}
                onChange={handleChange}
                placeholder="e.g. Sunita Sharma"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Emergency Phone Number</label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                placeholder="+91 98765 00000"
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
              <label className="mb-1 block font-bold text-slate-700">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="400001"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block font-bold text-slate-700">Residential Address</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, apartment suite, locality..."
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: Employment & Work Assignment
        ───────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Employment &amp; Work Assignment
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Department role, shift roster, and reporting line</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Kitchen / Culinary">Kitchen / Culinary</option>
                <option value="F&B Service">F&B Service</option>
                <option value="Maintenance & Eng.">Maintenance & Eng.</option>
                <option value="HR & Admin">HR & Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Designation / Role</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Front Desk Associate"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contractual">Contractual</option>
                <option value="Probation">Probation</option>
                <option value="Trainee">Trainee</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Shift Roster</label>
              <select
                name="shiftType"
                value={formData.shiftType}
                onChange={handleChange}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Morning Shift">Morning Shift (07:00 - 15:30)</option>
                <option value="Evening Shift">Evening Shift (15:00 - 23:30)</option>
                <option value="Night Shift">Night Shift (23:00 - 07:30)</option>
                <option value="General Shift">General Shift (09:00 - 17:30)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Date of Joining</label>
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Reporting Manager</label>
              <input
                type="text"
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar (FO Mgr)"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: Payroll & Statutory Compliance
        ───────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                4. Payroll &amp; Bank Details
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Monthly salary structure and bank account details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-700">Monthly Gross Salary (₹)</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="35000"
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
              <label className="mb-1 block font-bold text-slate-700">Account Number</label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                placeholder="987654321098"
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
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">Aadhar Card Number</label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="1234 5678 9012"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Form Action Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <a href="/human-resources/employees/list">
            <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold text-slate-700 bg-white">
              Cancel
            </Button>
          </a>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Registering Employee..." : "Register Employee"}
          </Button>
        </div>
      </form>
    </ModulePageShell>
  );
}
