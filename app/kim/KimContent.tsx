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
      // 1. 모든 사진을 File 객체로 변환 (S3 이미지에 CORS 허용이 되어 있어야 한다)
      const files: File[] = [];
      for (let i = 0; i < photos.length; i++) {
        const res = await fetch(photos[i].imageUrl);
        if (!res.ok) throw new Error(`이미지 응답 오류: ${res.status}`);
        const blob = await res.blob();
        files.push(
          new File([blob], `lionism-photo-${i + 1}.jpg`, {
            type: blob.type || "image/jpeg",
          }),
        );
      }

      // 2. iOS/모바일: Web Share API → 공유 시트의 '이미지 저장'으로 사진 앱에 저장
      //    (iOS는 <a download> 를 지원하지 않아 이 경로가 필수다)
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: "Lionism 포토부스" });
        return;
      }

      // 3. 데스크톱/안드로이드: 파일 다운로드
      for (let i = 0; i < files.length; i++) {
        const url = URL.createObjectURL(files[i]);
        const a = document.createElement("a");
        a.href = url;
        a.download = files[i].name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // 사용자가 공유 시트를 직접 닫은 경우(AbortError)는 실패로 취급하지 않는다
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("사진 저장 실패:", err);
      alert(
        "사진 저장에 실패했습니다. 사진을 길게 눌러 '사진에 저장'을 선택해 주세요.",
      );
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
