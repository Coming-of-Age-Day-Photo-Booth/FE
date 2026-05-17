import { Suspense } from "react";
import PhotoBoothContent from "./PhotoBoothContent";

export default function PhotoBooth() {
  return (
    <Suspense fallback={null}>
      <PhotoBoothContent />
    </Suspense>
  );
}
