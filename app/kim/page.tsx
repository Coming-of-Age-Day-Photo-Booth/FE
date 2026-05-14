"use client";

import { useState } from "react";
import Image from "next/image";
import LionismLogo from "./Lionism.svg";
import "./kim.css";

type PageType = "download";

const PHOTO_COUNT = 5;

// TODO: 실제 서버 연동 시 아래 두 가지 방법 중 하나로 교체
// 1. 환경변수 사용: .env.local에 NEXT_PUBLIC_API_URL=https://api.example.com 정의 후
//    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/photos/${qrCode}`);
//    const photos: string[] = await res.json();
// 2. Next.js API Route 프록시: /app/api/photos/route.ts 생성 후 상대경로(/api/photos)만 호출
//    → 도메인은 서버 환경변수에만 존재하게 됨
// QR코드 값은 URL 파라미터로 수신: const qrCode = useSearchParams().get("qrCode")
const MOCK_PHOTOS = [
  "https://picsum.photos/seed/a/1600/900",
  "https://picsum.photos/seed/b/1600/900",
  "https://picsum.photos/seed/c/1600/900",
  "https://picsum.photos/seed/d/1600/900",
  "https://picsum.photos/seed/e/1600/900",
];

export default function KimPage() {
  const [page] = useState<PageType>("download");

  const photos: string[] = MOCK_PHOTOS;

  const handleDownload = async () => {
    for (let i = 0; i < photos.length; i++) {
      const res = await fetch(photos[i]);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photo-${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="kim-container">
      <Image src={LionismLogo} alt="Lionism" className="kim-logo" loading="eager" />

      {page === "download" && (
        <div className="kim-image-list">
          {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
            <div key={i} className="kim-image-wrapper">
              {photos[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[i]} alt={`photo ${i + 1}`} className="kim-image" />
              ) : (
                <div className="kim-placeholder">
                  <svg viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="400" y2="300" stroke="#ccc" strokeWidth="1" />
                    <line x1="400" y1="0" x2="0" y2="300" stroke="#ccc" strokeWidth="1" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="kim-download-bar">
        <button className="kim-download-btn" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
}
