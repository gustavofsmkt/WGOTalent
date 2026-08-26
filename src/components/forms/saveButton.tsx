import { useFormContext } from "~/hooks/form";
import { Button } from "../ui/button";

export default function SaveButton({ label = "Salvar" }: { label?: string }) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "..." : label}
        </Button>
      )}
    />
  );
}
