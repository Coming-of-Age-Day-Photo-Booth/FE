import { Suspense } from "react";
import KimContent from "./KimContent";

export default function KimPage() {
  return (
    <Suspense fallback={<div>사진첩을 열고 있습니다...</div>}>
      <KimContent />
    </Suspense>
  );
}
