import React, { useState, useEffect } from "react";
import "./Lionism.css";

const LionismBooth: React.FC = () => {
  const [page, setPage] = useState<"LOGIN" | "START" | "CAMERA">("LOGIN");
  const [count, setCount] = useState(10);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sessionUuid, setSessionUuid] = useState<string>("");

  // 1. [로그인] 부스 입장 인증 API 호출 (명세: POST /api/v1/booth/auth)
  const handleLogin = async () => {
    try {
      /* const res = await fetch('/api/v1/booth/auth', { method: 'POST', ... });
      const data = await res.json();
      setSessionUuid(data.sessionUuid);
      */
      setPage("START");
    } catch (err) {
      console.error("인증 실패", err);
    }
  };

  // 2. [촬영] 캡처 및 업로드 (명세: POST /api/v1/booth/photos)
  const onCapture = async () => {
    if (photos.length >= 4) return;

    // 실제로는 camera stream을 canvas로 캡처한 base64 데이터를 넣어야 합니다.
    const capturedImg = `https://via.placeholder.com/248x152?text=Photo+${
      photos.length + 1
    }`;
    const newPhotos = [...photos, capturedImg];
    setPhotos(newPhotos);
    setCount(10);

    // 4장 촬영 완료 시 서버에 전송
    if (newPhotos.length === 4) {
      await uploadPhotos(newPhotos);
    }
  };

  const uploadPhotos = async (finalPhotos: string[]) => {
    console.log("전체 사진 S3 업로드 중...", finalPhotos);
    // await fetch('/api/v1/booth/photos', { method: 'POST', body: ... });
    alert("모든 촬영이 완료되었습니다!");
  };

  // 타이머 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (page === "CAMERA" && photos.length < 4) {
      if (count > 0) {
        timer = setTimeout(() => setCount(count - 1), 1000);
      } else {
        onCapture();
      }
    }
    return () => clearTimeout(timer);
  }, [count, page, photos]);

  return (
    <div className="booth-container">
      {/* 1. 로그인 페이지 */}
      {page === "LOGIN" && (
        <div className="content-center">
          <div className="logo-common main-logo">Lionism</div>
          <div className="btn-placeholder"></div>
          <button className="login-link" onClick={handleLogin}>
            login
          </button>
        </div>
      )}

      {/* 2. 시작 페이지 */}
      {page === "START" && (
        <div className="content-center">
          <div className="logo-common main-logo">Lionism</div>
          <button className="btn-shape" onClick={() => setPage("CAMERA")}>
            Start!
          </button>
        </div>
      )}

      {/* 3. 사진 촬영 페이지 (촬영 1 & 2 통합) */}
      {page === "CAMERA" && (
        <>
          <div className="logo-common top-logo-small">Lionism</div>
          <div className="timer-number">{count}</div>

          <div className="camera-viewfinder">
            <button className="shutter-btn-white" onClick={onCapture}></button>
          </div>

          <div className="photo-preview-column">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="preview-slot-box">
                {photos[i] ? (
                  <img src={photos[i]} alt="captured" className="preview-img" />
                ) : (
                  <div className="placeholder-x">✕</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LionismBooth;
