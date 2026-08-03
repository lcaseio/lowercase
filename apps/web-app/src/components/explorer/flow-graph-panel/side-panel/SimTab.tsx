import type { SimDefinition } from "@lcase/types";
import { IdentityField } from "@/components/fields/IdentityField";
import { InputField } from "@/components/fields/InputField";

export function SimTab({
  simDefinition,
}: {
  simDefinition: SimDefinition | null;
}) {
  if (!simDefinition) {
    return (
      <div className="text-sm text-muted-foreground">
        This panel isn't viewing a sim.
      </div>
    );
  }

  const { sim, spec } = simDefinition;
  return (
    <div className="flex flex-col gap-3">
      <IdentityField label="Id" value={sim.id} />
      <InputField label="Name" value={sim.name} />
      <InputField label="Description" value={sim.description} />
      <IdentityField label="Parent Run" value={spec.parentRunId} />
    </div>
  );
}
