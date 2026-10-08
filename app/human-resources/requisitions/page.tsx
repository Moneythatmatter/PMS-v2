import { ModuleRequisitionsPage } from "@/components/requisitions/ModuleRequisitionsPage";
import { MODULE_REQUISITION_CONFIG } from "@/components/requisitions/moduleRequisitionConfig";

export default function HumanResourcesRequisitionsPage() {
  return <ModuleRequisitionsPage config={MODULE_REQUISITION_CONFIG.humanResources} />;
}
