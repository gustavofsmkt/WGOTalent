import { toast } from "~/components/ui/toast";

type ActionResult<T = undefined> = {
  success: boolean;
  message?: string | null;
  data?: T;
};

interface ToastActionPromiseOptions<T> {
  loading: string;
  success: string | ((result: ActionResult<T>) => string);
  onSuccess?: (result: ActionResult<T>) => void;
}

export function toastActionPromise<T = undefined>(
  promise: Promise<ActionResult<T>>,
  options: ToastActionPromiseOptions<T>,
) {
  return toast.promise(promise, {
    loading: options.loading,
    success: (result) => {
      if (!result.success) {
        throw new Error(result.message ?? "Ocorreu um erro inesperado.");
      }
      options.onSuccess?.(result);
      return typeof options.success === "function"
        ? options.success(result)
        : options.success;
    },
    error: (err: unknown) =>
      err instanceof Error ? err.message : "Ocorreu um erro inesperado.",
  });
}
