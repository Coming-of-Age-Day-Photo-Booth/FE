"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useBoothScale } from "../useBoothScale";
import "./PhotoBooth.css";

type PageType = "phone" | "agree" | "save" | "done";

interface Photo {
  photoId: number;
  imageUrl: string;
}

export default function ChooContent() {
  useBoothScale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionUuid = searchParams.get("sessionUuid") || "";

  // /lim에서 선택한 사진 ID 목록 (예: "?photoIds=1,2")
  const selectedPhotoIds = (searchParams.get("photoIds") || "")
    .split(",")
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const [shortCode, setShortCode] = useState<string>("");
  const [page, setPage] = useState<PageType>("phone");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [phoneNumber, setPhoneNumber] = useState("");

  // QR 페이지에서 함께 보여줄 촬영 원본 사진 목록
  const [photos, setPhotos] = useState<Photo[]>([]);

  // ==========================================
  // QR 페이지 진입 시 세션의 사진 목록 조회 (GET)
  // ==========================================
  useEffect(() => {
    if (page !== "save" || !sessionUuid) return;

    const fetchPhotos = async () => {
      try {
        const res = await fetch(
          `https://hellofriend-eulji.site/api/v1/booth/photos/${sessionUuid}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPhotos(data);
        }
      } catch (error) {
        console.error("QR 페이지 사진 조회 실패:", error);
      }
    };

    fetchPhotos();
  }, [page, sessionUuid]);

  const pressNumber = (num: string) => {
    if (phoneNumber.length >= 11) return;

    const nextNumber = phoneNumber + num;
    setPhoneNumber(nextNumber);

    if (nextNumber.length === 11) {
      setPage("agree");
    }
  };

  const deleteNumber = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
  };

  const formatPhoneNumber = (value: string) => {
    if (value.length <= 3) return value;
    if (value.length <= 7) return `${value.slice(0, 3)}-${value.slice(3)}`;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  const handleAgreeAndSubmit = async () => {
    if (selectedPhotoIds.length === 0) {
      alert("선택된 사진 정보가 없습니다. 사진 선택부터 다시 진행해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://hellofriend-eulji.site/api/v1/booth/photos/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionUuid: sessionUuid || "test-session-uuid",
          selectedPhotoIds: selectedPhotoIds,
          phoneNumber: phoneNumber,
          printCopies: 2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShortCode(data.shortCode); // 서버가 준 꿀 같은 영수증 코드 저장 (ex: 5X7A9)
        setPage("save");
      } else {
        alert("인쇄 요청 접수에 실패했습니다. 다시 시도해 주세요.");
        setPage("phone");
      }
    } catch (error) {
      console.error("인쇄 최종 접수 통신 에러:", error);
      setShortCode("WELCOME7");
      setPage("save");
    } finally {
      setIsSubmitting(false);
    }
  };
  // QR은 이 프론트엔드가 배포된 도메인의 /kim(모바일 저장 페이지)으로 연결한다.
  // window.location.origin 을 쓰면 개발/배포 환경에 상관없이 항상 올바른 도메인이 된다.
  const mobileDownloadUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/kim?shortCode=${shortCode}`
      : "";

  return (
    <main className="booth-container">
      <div className="logo">Lionism</div>

      {page === "phone" && (
        <section className="phone-page">
          <h1>사진 출력이 완료되면 문자로 알려드릴게요!</h1>

          <div className="phone-input">
            {formatPhoneNumber(phoneNumber) || "010-1234-1234"}
          </div>

          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} type="button" onClick={() => pressNumber(String(num))}>
                {num}
              </button>
            ))}

            <div></div>

            <button type="button" onClick={() => pressNumber("0")}>
              0
            </button>

            <button type="button" className="delete-btn" onClick={deleteNumber}>
              ⌫
            </button>
          </div>
        </section>
      )}

      {page === "agree" && (
        <section className="agree-card">
          <h2>개인정보 처리방침 동의</h2>

          <div className="agree-text">
            <p>
              <span className="agree-bold">수집하는 개인정보 항목</span>
              <br />
              <span className="agree-normal">개인식별정보 : 휴대전화번호</span>
            </p>

            <p>
              <span className="agree-bold">개인정보의 수집 및 이용목적</span>
              <br />
              <span className="agree-normal">
                제공하신 정보는 완료 문자 전송과 사용자가 고유번호를
                분실하였을 경우 2차 식별용으로 사용됩니다.
              </span>
            </p>

            <p>
              <span className="agree-bold">개인정보의 보유 및 이용기간</span>
              <br />
              <span className="agree-normal">
                수집된 개인정보는 부스 종료 후 즉시 파기합니다.
              </span>
            </p>

            <p className="agree-last">
              * 사용자는 이에 대한 동의를 거부할 수 있으며, 동의가 없을 경우
              고유번호 분실 시 2차 식별이 불가능하고 이에 대해 책임지지 않습니다.
            </p>
          </div>

          <button
            type="button"
            className="blue-btn"
            onClick={handleAgreeAndSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? "접수 중..." : "동의함"}
          </button>

          <button type="button" className="gray-btn" onClick={() => setPage("phone")}>
            동의하지않음
          </button>
        </section>
      )}

      {page === "save" && (
        <section className="save-page">
          <div className="qr-card">
            <h2>QR Code</h2>
            <p>QR Code를 스캔하고 사진을 다운받으세요</p>

            <div className="qr-box"><QRCodeSVG value={mobileDownloadUrl}/></div>
            {}
            <h3>{shortCode || "발급 실패"}</h3>
          </div>

          <div className="photo-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="photo-placeholder" key={i}>
                {photos[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photos[i].imageUrl} alt={`photo-${i + 1}`} />
                )}
              </div>
            ))}
          </div>

          <button type="button" className="hidden-done-btn" onClick={() => setPage("done")}>
            완료
          </button>
        </section>
      )}

      {page === "done" && (
        <section className="done-page">
          <button type="button" className="final-btn" onClick={() => router.push("/")}>
            Done!
          </button>
        </section>
      )}
    </main>
  );
}
