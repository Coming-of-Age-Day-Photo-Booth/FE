"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import LionismLogo from "./Lionism.svg";
import "./kim.css";

type PageType = "download";

interface Photo {
  photoId: number;
  imageUrl: string;
}

const PHOTO_COUNT = 5;

export default function KimContent() {
  const searchParams = useSearchParams();
  // QR(/choo)에서 넘어온 세션 식별자
  const sessionUuid = searchParams.get("sessionUuid") || "";

  const [page] = useState<PageType>("download");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const getMobilePhotos = async () => {
      if (!sessionUuid) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `https://hellofriend-eulji.site/api/v1/booth/photos/${sessionUuid}`,
        );
        if (res.ok) {
          // 백엔드 응답 규격: { photoId, imageUrl }[]
          const data: Photo[] = await res.json();
          setPhotos(data);
        }
      } catch (error) {
        console.error("모바일 사진 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getMobilePhotos();
  }, [sessionUuid]);

  const handleDownload = async () => {
    if (photos.length === 0) {
      alert("다운로드할 사진이 존재하지 않습니다.");
      return;
    }

    setIsDownloading(true);
    try {
      for (let i = 0; i < photos.length; i++) {
        try {
          const res = await fetch(photos[i].imageUrl);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `lionism-photo-${i + 1}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error("개별 이미지 다운로드 실패:", err);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div>사진첩을 열고 있습니다...</div>
    );
  }

  return (
    <div className="kim-container">
      <Image src={LionismLogo} alt="Lionism" className="kim-logo" loading="eager" />

      {page === "download" && (
        <div className="kim-image-list">
          {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
            <div key={i} className="kim-image-wrapper">
              {photos[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[i].imageUrl}
                  alt={`photo ${i + 1}`}
                  className="kim-image"
                />
              ) : (
                <div className="kim-placeholder" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="kim-download-bar">
        <button
          className="kim-download-btn"
          onClick={handleDownload}
          disabled={photos.length === 0 || isDownloading}
        >
          {isDownloading ? "저장 중..." : "Download"}
        </button>
      </div>
    </div>
  );
}
