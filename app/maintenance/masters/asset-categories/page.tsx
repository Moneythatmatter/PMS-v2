import { MaintenanceBlankView } from "@/components/maintenance/MaintenanceBlankView";

export default function AssetCategoriesPage() {
  return (
    <MaintenanceBlankView
      title="Asset Categories"
      category="Masters"
      description="Define equipment groupings like HVAC, Electrical, Plumbing, Laundry, and Kitchen Machinery."
      actionLabel="+ New Category"
    />
  );
}
