import { useFormContext } from "~/hooks/form";
import { Button } from "../ui/button";
// import { ButtonDestructiveHold } from "../botaoDestrutivoHold";

export default function ResetButton({ label = "Limpar" }: { label?: string }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          disabled={isSubmitting}
          variant="secondary"
          onClick={() => {
            form.reset();
          }}
        >
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
}
