import React, { useState, useEffect } from "react";

import "./Lionism.css";

const LionismBooth: React.FC = () => {
  const [page, setPage] = useState<"LOGIN" | "START" | "CAMERA">("LOGIN");

  const [count, setCount] = useState(10);

  const [photos, setPhotos] = useState<number[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (page === "CAMERA" && photos.length < 5) {
      if (count > 0) {
        timer = setTimeout(() => setCount(count - 1), 1000);
      } else {
        onCapture();
      }
    }

    return () => clearTimeout(timer);
  }, [count, page, photos]);

  const onCapture = () => {
    if (photos.length >= 5) return;

    setPhotos([...photos, Date.now()]);

    setCount(10);
  };

  return (
    <div className="booth-container">
      {/* 1. 로그인 페이지 */}

      {page === "LOGIN" && (
        <>
          <div className="logo-common main-logo">Lionism</div>

          <div className="btn-shape"></div>

          <button className="login-link" onClick={() => setPage("START")}>
            login
          </button>
        </>
      )}

      {/* 2. 시작 페이지 */}

      {page === "START" && (
        <>
          <div className="logo-common main-logo">Lionism</div>

          <button className="btn-shape" onClick={() => setPage("CAMERA")}>
            Start!
          </button>
        </>
      )}

      {/* 3. 사진 촬영 페이지 */}

      {page === "CAMERA" && (
        <>
          <div className="logo-common top-logo-small">Lionism</div>

          <div className="timer-number">{count}</div>

          <div className="camera-viewfinder">
            <button className="shutter-btn-white" onClick={onCapture}></button>
          </div>

          {/* 우측 미리보기 (사진 촬영2 시안 반영) */}

          <div className="photo-preview-column">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="preview-slot-box">
                {photos[i] ? "📸" : "X"}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LionismBooth;
