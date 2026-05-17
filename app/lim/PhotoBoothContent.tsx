"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // 라우팅을 위해 useRouter 추가
import "./PhotoBooth.css";
import Image from "next/image";
import { useBoothScale } from "../useBoothScale";
import Logo from "./Lionism.png";

interface Photo {
  photoId: number;
  imageUrl: string;
}

export default function PhotoBoothContent() {
  useBoothScale();
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL에서 ?sessionUuid=... 값을 추출
  const sessionUuid = searchParams.get("sessionUuid") || "";

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ==========================================
  // [API 연동 1] 원본 전체 사진 목록 조회 (GET)
  // ==========================================
  useEffect(() => {
    const fetchPhotos = async () => {
      if (!sessionUuid) {
        alert("유효하지 않은 세션입니다. 처음부터 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://hellofriend-eulji.site/api/v1/booth/photos/${sessionUuid}`);

        if (response.ok) {
          // 200 OK
          const data = await response.json();
          setPhotos(data);
        } else {
          // 실패 코드 처리 (API 명세서 기준 404, 500)
          if (response.status === 404) {
            alert("유효하지 않은 세션 UUID입니다.");
          } else if (response.status === 500) {
            alert("서버 오류: 사진 목록을 불러오지 못했습니다.");
          } else {
            alert("사진 목록을 불러오는데 실패했습니다.");
          }
        }
      } catch (error) {
        console.error("사진 목록 조회 통신 오류:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhotos();
  }, [sessionUuid]);

  // 사진 클릭 핸들러
  const handlePhotoClick = (photoId: number) => {
    if (selectedPhotoIds.length >= 2) {
      setSelectedPhotoIds([photoId]);
      return;
    }
    setSelectedPhotoIds([...selectedPhotoIds, photoId]);
  };

  // 선택 순번 뱃지 로직
  const getSelectionBages = (photoId: number) => {
    const badges: number[] = [];
    selectedPhotoIds.forEach((id, index) => {
      if (id === photoId) {
        badges.push(index + 1);
      }
    });
    return badges;
  };

  // 사진 2장 선택 후 전화번호/개인정보 동의 페이지(/choo)로 이동
  // 인쇄 POST는 개인정보 동의 이후 /choo에서 수행한다.
  const handleNextClick = () => {
    if (selectedPhotoIds.length !== 2) {
      alert("출력할 사진 2장을 모두 선택해주세요.");
      return;
    }
    router.push(
      `/choo?sessionUuid=${sessionUuid}&photoIds=${selectedPhotoIds.join(",")}`,
    );
  };

  if (isLoading) {
    return (
      <div className="booth-container" style={{ justifyContent: "center" }}>
        <div className="loading">사진을 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="booth-container">
      <header className="header">
        <Image src={Logo} alt="Lionism Logo" className="logo" />
      </header>

      <main className="main-content">
        <div className="photo-grid">
          {photos.slice(0, 5).map((photo) => (
            <div
              key={photo.photoId}
              className={`photo-item ${selectedPhotoIds.includes(photo.photoId) ? "selected" : ""}`}
              onClick={() => handlePhotoClick(photo.photoId)}
            >
              {/* 넥스트 최적화 오류를 피하기 위해 일반 img 태그 사용 */}
              <img src={photo.imageUrl} alt={`photo-${photo.photoId}`} />
              {getSelectionBages(photo.photoId).map((badgeNum, idx) => (
                <div
                  key={idx}
                  className={`selection-badge badge-${badgeNum}`}
                >
                  {badgeNum}
                </div>
              ))}
            </div>
          ))}

          <div className="instruction-text">
            <p className="main-text">출력할 2장의 사진을 골라주세요</p>
            <p className="sub-text">동일 사진 2장 출력 가능</p>
          </div>
        </div>

        <button
          className={`next-button ${selectedPhotoIds.length === 2 ? "active" : ""}`}
          onClick={handleNextClick}
        >
          Next
        </button>
      </main>
    </div>
  );
}
