"use client";

import React, { useState, useEffect } from "react";
import "./Lionism.css";
import { useRouter } from "next/navigation";

interface LionismBoothProps {
  initialPage?: "LOGIN" | "START" | "CAMERA";
}

const LionismBooth: React.FC<LionismBoothProps> = ({ initialPage = "LOGIN"}) => {
  const router = useRouter();

  const [page, setPage] = useState<"LOGIN" | "START" | "CAMERA">(initialPage);
  const [count, setCount] = useState(10);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sessionUuid, setSessionUuid] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // 1. [로그인] 부스 입장 인증 API 호출 (명세: POST /api/v1/booth/auth)
  const handleLogin = async () => {
    
    try {
      const res = await fetch('https://hellofriend-eulji.site/api/v1/booth/auth', { 
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          password: password,
        }),
      });
    
      if (res.ok) {
        const data = await res.json();
        if (data.sessionUuid) {
          setSessionUuid(data.sessionUuid);
        }
      
        setPage("START");
      } 
      else {
       alert("비밀번호가 올바르지 않습니다.");
      }
    }  catch (error) {
      console.error("인증 실패", error);
      alert("서버 연결에 실패했습니다.");
    }
  
    //if(password == 'likelion'){
      //setPage("START");
    //}else{
      //alert("비밀번호가 올바르지 않습니다.");
    //}
    
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
    try {
      const res = await fetch('https://hellofriend-eulji.site/api/v1/booth/photos', {
        method: 'POST', 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionUuid: sessionUuid,
          photos: finalPhotos
        })
      });

      if (res.ok) {
        alert("모든 촬영이 완료되었습니다!");

        const targetUuid = sessionUuid || "550e8400-e29b-41d4-a716-446655440000";
        router.push(`/lim?sessionUuid=${targetUuid}`);
      }
      else {
        alert("사진 업로드에 실패했습니다.");
      }
    }
    catch (error) {
      console.error("업로드 통신 에러:", error);
      alert("서버 통신 에러가 발생했습니다.");
    }  
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
          <input
            type="password"
            placeholder=""
            className="btn-placeholder"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              border: "none",
              textAlign: "center",
              fontSize: "18px",
              outline: "none",
              color: "#333333"
            }}
          />

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
