import { HRBlankView } from "@/components/hr/HRBlankView";
import { HRDashboardView } from "@/components/hr/HRDashboardView";
import { EmployeeListView } from "@/components/hr/EmployeeListView";
import { AddEmployeeView } from "@/components/hr/AddEmployeeView";
import { EmployeeProfileView } from "@/components/hr/EmployeeProfileView";
import { EmployeeDocumentsView } from "@/components/hr/EmployeeDocumentsView";
import { DocumentMastersView } from "@/components/hr/DocumentMastersView";
import { ShiftManagementView } from "@/components/hr/ShiftManagementView";
import { LeaveManagementView } from "@/components/hr/LeaveManagementView";
import { OvertimeManagementView } from "@/components/hr/OvertimeManagementView";
import { WeeklyOffView } from "@/components/hr/WeeklyOffView";
import { HolidayAttendanceView } from "@/components/hr/HolidayAttendanceView";
import { AttendanceView } from "@/components/hr/AttendanceView";
import { SalaryStructureView } from "@/components/hr/SalaryStructureView";
import { PayrollSettingsView } from "@/components/hr/PayrollSettingsView";
import { ProcessPayrollView } from "@/components/hr/ProcessPayrollView";
import { PayslipsView } from "@/components/hr/PayslipsView";
import { TaxManagementView } from "@/components/hr/TaxManagementView";
import { ComplaintCategoriesView } from "@/components/hr/ComplaintCategoriesView";
import { RaiseComplaintView } from "@/components/hr/RaiseComplaintView";
import { ComplaintListView } from "@/components/hr/ComplaintListView";
import { ComplaintStatusView } from "@/components/hr/ComplaintStatusView";
import { DepartmentMasterView } from "@/components/hr/DepartmentMasterView";
import { DesignationMasterView } from "@/components/hr/DesignationMasterView";

export default async function HumanResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugArray = resolvedParams.slug || [];
  const slugPath = slugArray.join("/");

  if (!slugPath || slugPath === "dashboard") {
    return <HRDashboardView />;
  }

  if (slugPath === "employees/list" || slugPath === "employees") {
    return <EmployeeListView />;
  }

  if (slugPath === "employees/add") {
    return <AddEmployeeView />;
  }

  if (slugPath === "employees/profile") {
    return <EmployeeProfileView initialEmpId={resolvedSearchParams.id} />;
  }

  if (slugPath === "employees/documents") {
    return <EmployeeDocumentsView />;
  }

  if (slugPath === "attendance-leave/attendance") {
    return <AttendanceView />;
  }

  if (slugPath === "attendance-leave/shift-management") {
    return <ShiftManagementView />;
  }

  if (slugPath === "attendance-leave/leave-management") {
    return <LeaveManagementView />;
  }

  if (slugPath === "attendance-leave/overtime") {
    return <OvertimeManagementView />;
  }

  if (slugPath === "attendance-leave/weekly-off") {
    return <WeeklyOffView />;
  }

  if (slugPath === "attendance-leave/holiday-attendance") {
    return <HolidayAttendanceView />;
  }

  if (slugPath === "payroll/process-payroll") {
    return <ProcessPayrollView />;
  }

  if (slugPath === "payroll/salary-structure") {
    return <SalaryStructureView />;
  }

  if (slugPath === "payroll/payslips") {
    return <PayslipsView />;
  }

  if (slugPath === "payroll/tax-management") {
    return <TaxManagementView />;
  }

  if (slugPath === "payroll/payroll-settings") {
    return <PayrollSettingsView />;
  }

  if (
    slugPath === "grievances/complaint-categories" ||
    slugPath === "grievances/categories" ||
    slugPath === "masters/complaint-categories"
  ) {
    return <ComplaintCategoriesView />;
  }

  if (
    slugPath === "grievances/raise-complaint" ||
    slugPath === "grievances/raise"
  ) {
    return <RaiseComplaintView />;
  }

  if (
    slugPath === "grievances/complaint-list" ||
    slugPath === "grievances/list"
  ) {
    return <ComplaintListView />;
  }

  if (
    slugPath === "grievances/complaint-status" ||
    slugPath === "grievances/status" ||
    slugPath === "grievances"
  ) {
    return <ComplaintStatusView />;
  }

  // Masters pages set to blank placeholder view (data hidden in browser, sidebar links intact)
  if (slugPath.startsWith("masters")) {
    return <HRBlankView slugPath={slugPath} />;
  }

  return <HRBlankView slugPath={slugPath} />;
}






