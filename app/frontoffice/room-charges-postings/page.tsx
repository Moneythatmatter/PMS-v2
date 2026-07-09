import { FormField, FormSection, PageHeader, TextInput } from "@/components/frontoffice/ui";
import { Button } from "@/components/ui/Button";

export default function RoomChargesPostingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Room Charges Postings" description="Post charges to guest folios." />
      <FormSection title="Post Charge">
        <FormField label="Room"><TextInput placeholder="Room number" /></FormField>
        <FormField label="Guest"><TextInput placeholder="Guest name" /></FormField>
        <FormField label="Description"><TextInput placeholder="Charge description" /></FormField>
        <FormField label="Amount"><TextInput type="number" placeholder="0.00" /></FormField>
      </FormSection>
      <Button className="bg-blue-600 hover:bg-blue-700">Post to Folio</Button>
    </div>
  );
}
