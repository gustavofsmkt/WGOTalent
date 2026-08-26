import { useFormContext } from "@/hooks/form";
import { Button } from "../ui/button";

export default function SaveButton({ label = "Salvar" }: { label?: string }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <Button disabled={isSubmitting}>{label}</Button>}
    </form.Subscribe>
  );
}