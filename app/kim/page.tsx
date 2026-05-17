import { Suspense } from "react";
import KimClient from "./KimClient";

export default function KimPage() {
  return (
    <Suspense fallback={<div>사진첩을 열고 있습니다...</div>}>
      <KimClient />
    </Suspense>
  );
}
