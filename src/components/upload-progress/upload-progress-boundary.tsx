"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { UploadProgressProvider } from "./upload-progress-store";

const UploadProgressPopup = dynamic(() =>
  import("./upload-progress-popup").then(
    (module) => module.UploadProgressPopup,
  ),
);

export function UploadProgressBoundary({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  // Login is public and must not call authenticated upload actions. Leaving
  // the authenticated branch also clears progress before another login.
  if (pathname === "/login") return children;

  return (
    <UploadProgressProvider>
      {children}
      <UploadProgressPopup />
    </UploadProgressProvider>
  );
}
