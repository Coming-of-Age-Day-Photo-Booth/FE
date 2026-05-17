import { Suspense } from "react";
import ChooContent from "./ChooContent";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ChooContent />
    </Suspense>
  );
}
