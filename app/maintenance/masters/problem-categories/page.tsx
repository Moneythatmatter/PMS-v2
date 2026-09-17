import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function ProblemCategoriesPage() {
  return (
    <MaintenanceBlankView
      title="Problem Categories"
      category="Masters"
      description="Taxonomy for staff defect reporting (Cooling issue, pipe leak, power trip, hardware broken)."
      actionLabel="+ New Category"
    />
  );
}
