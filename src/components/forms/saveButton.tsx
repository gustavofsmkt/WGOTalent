import { useFormContext } from "~/hooks/form";
import { Button } from "../ui/button";

export default function SaveButton({
  label = "Salvar",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit} className={className}>
          {isSubmitting ? "..." : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
