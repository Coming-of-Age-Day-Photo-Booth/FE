"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // 라우팅을 위해 useRouter 추가
import "./PhotoBooth.css";
import Image from "next/image";
import Logo from "./Lionism.png";

interface Photo {
  photoId: number;
  imageUrl: string;
}

export default function PhotoBooth() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL에서 ?sessionUuid=... 값을 추출
  const sessionUuid = searchParams.get("sessionUuid") || "";

  const [step, setStep] = useState<1 | 2>(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
        const response = await fetch(`/api/v1/booth/photos/${sessionUuid}`);

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

  // 1단계 -> 2단계(전화번호 입력) 이동
  const handleNextClick = () => {
    if (selectedPhotoIds.length !== 2) {
      alert("출력할 사진 2장을 모두 선택해주세요.");
      return;
    }
    setStep(2);
  };

  // ==========================================
  // [API 연동 2] 인쇄할 사진 선택 및 고유번호 발급 (POST)
  // ==========================================
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    // TODO: 타임라인(사진 선택4)에 따라 여기서 '개인정보처리 동의서' 모달을 띄우는 로직을 추가할 수 있습니다.
    // 현재는 전화번호 입력 후 바로 서버로 전송합니다.

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/booth/photos/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // API 명세서와 100% 동일한 Body 규격
        body: JSON.stringify({
          sessionUuid: sessionUuid,
          selectedPhotoIds: selectedPhotoIds,
          phoneNumber: phoneNumber,
          printCopies: 2,
        }),
      });

      if (response.ok) {
        // 200 OK
        const data = await response.json();

        // 성공 시 다음 단계인 '온라인 저장 QR코드 페이지'로 이동
        // 발급받은 shortCode(ex: 1R4C6)를 파라미터로 넘겨줍니다.
        router.push(`/choo?sessionUuid=${sessionUuid}&shortCode=${data.shortCode}`);
      } 
      else {
        // 실패 코드 처리 (API 명세서 기준 400, 404, 500)
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          alert("필수 파라미터가 누락되었습니다.");
        } else if (response.status === 404) {
          alert(
            errorData.code === "photo_not_found"
              ? "존재하지 않는 사진 ID입니다."
              : "유효하지 않은 세션입니다.",
          );
        } else if (response.status === 500) {
          alert("DB 저장에 실패했습니다. 관리자에게 문의해주세요.");
        } else {
          alert("인쇄 접수에 실패했습니다. 다시 시도해주세요.");
        }
      }
    } catch (error) {
      console.error("인쇄 요청 통신 오류:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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

      {step === 1 && (
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
      )}

      {step === 2 && (
        <main className="phone-input-main">
          <h1 className="phone-title">
            사진 출력이 완료되면 문자로 알려드릴게요!
          </h1>
          <form onSubmit={handlePhoneSubmit} className="phone-form">
            <input
              type="text"
              className="phone-input"
              placeholder="전화번호 입력"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
            <button type="submit" style={{ display: "none" }}>
              제출
            </button>
          </form>
        </main>
      )}
    </div>
  );
}
