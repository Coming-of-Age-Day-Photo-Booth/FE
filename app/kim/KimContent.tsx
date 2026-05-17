"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import LionismLogo from "./Lionism.svg";
import "./kim.css";

type PageType = "download";

const PHOTO_COUNT = 5;

export default function KimContent() {
  const searchParams = useSearchParams();
  const shortCode = searchParams.get("shortCode") || "";

  const [page] = useState<PageType>("download");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getMobilePhotos = async () => {
      if(!shortCode) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`https://hellofriend-eulji.site/api/v1/photos/${shortCode}`);
        if (res.ok) {
          const data = await res.json(); // 백엔드에서 이미지 URL 문자열 배열을 준다고 가정
          setPhotos(data);
        }
      } catch (error) {
        console.error("모바일 사진 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getMobilePhotos();
  }, [shortCode]);

  const handleDownload = async () => {
    if (photos.length === 0) {
      alert("다운로드할 사진이 존재하지 않습니다.");
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      try {
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
      catch (err) {
        console.error("개별 이미지 다운로드 실패:", err);
      }
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
