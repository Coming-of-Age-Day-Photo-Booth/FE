import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBoothScale } from "../useBoothScale";
import "./Lionism.css";

// 백엔드 팀원분이 제공한 실제 배포 도메인 적용
const API_BASE_URL = "https://hellofriend-eulji.site";

// 부스에서 촬영하는 사진 장수 (선택/QR/다운로드 페이지가 모두 5장 기준으로 동작)
const TOTAL_PHOTOS = 5;

// public/shutter_sound.mp3 — 사진 촬영 시 재생할 셔터음
const SHUTTER_SOUND_SRC = "/shutter_sound.mp3";

const LionismBooth: React.FC = () => {
  useBoothScale();
  const router = useRouter();
  const [page, setPage] = useState<"LOGIN" | "START" | "CAMERA">("LOGIN");
  const [count, setCount] = useState(10);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sessionUuid, setSessionUuid] = useState<string>("");

  // 관리자 비밀번호 입력을 위한 상태 (초기 테스트 값: likelion)
  const [password, setPassword] = useState<string>("");

  // 카메라 구동을 위한 Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 셔터음(mp3) 재생용 Audio 엘리먼트
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);

  // 사용자 제스처(Start/셔터 버튼)에서 호출한다. iOS 는 제스처로 한 번
  // 재생을 트리거해 둔 오디오만 이후 자동(타이머) 재생이 허용되므로,
  // 음소거 상태로 재생→정지하여 오디오를 '잠금 해제' 해 둔다.
  const unlockAudio = () => {
    if (!shutterAudioRef.current) {
      shutterAudioRef.current = new Audio(SHUTTER_SOUND_SRC);
    }
    const audio = shutterAudioRef.current;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  };

  // 셔터음 재생 (촬영 순간 호출)
  const playShutterSound = () => {
    const audio = shutterAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch((err) => console.warn("셔터음 재생 실패:", err));
  };

  // 1. [로그인] 부스 입장 인증 API 호출 (명세: POST /api/v1/booth/auth)
  const handleLogin = async () => {
    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      // 실제 API 통신 시도
      const res = await fetch(`${API_BASE_URL}/api/v1/booth/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password }),
      });

      if (!res.ok) {
        throw new Error("인증에 실패했습니다. 비밀번호를 확인하세요.");
      }

      const data = await res.json();

      if (data.sessionUuid) {
        setSessionUuid(data.sessionUuid);
        localStorage.setItem("booth_session", data.sessionUuid);
        setPage("START");
      } else {
        alert("세션 발급에 실패했습니다.");
      }
    } catch (err) {
      console.error("인증 실패, 개발용 오프라인 모드 검사 진행:", err);

      // [비상 우회 로직] 서버가 닫혀있어도 'likelion'을 치면 통과하도록 설정
      if (password === "likelion") {
        console.warn("서버 오프라인 상태: 가상 세션으로 부스를 시작합니다.");
        const dummyUuid = "offline-dummy-session-uuid-1234";
        setSessionUuid(dummyUuid);
        localStorage.setItem("booth_session", dummyUuid);
        setPage("START");
      } else {
        alert(
          err instanceof Error ? err.message : "서버 연결 오류 (CORS 확인 필요)"
        );
      }
    }
  };

  // 2. [카메라 켜기] CAMERA 페이지 진입 시 전면 카메라 가동 (기존 유지)
  useEffect(() => {
    if (page === "CAMERA") {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: "user", width: 820, height: 668 },
          audio: false,
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
        })
        .catch((err) => {
          console.error("카메라 구동 실패: ", err);
          alert("카메라를 켤 수 없습니다. 권한 설정을 확인해주세요.");
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [page]);

  // 3. [촬영] 비디오 화면 캡처 및 좌우반전 (기존 유지)
  const onCapture = async () => {
    if (photos.length >= TOTAL_PHOTOS) return;

    // 촬영 순간 셔터음 재생
    playShutterSound();

    let capturedImg = "";

    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 820;
      canvas.height = 668;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        capturedImg = canvas.toDataURL("image/png");
      }
    }

    if (!capturedImg) {
      capturedImg = `https://via.placeholder.com/248x152?text=Fallback+${
        photos.length + 1
      }`;
    }

    const newPhotos = [...photos, capturedImg];
    setPhotos(newPhotos);
    setCount(10);

    if (newPhotos.length === TOTAL_PHOTOS) {
      await uploadPhotos(newPhotos);
    }
  };

  // 4. [업로드] 사진 촬영본 S3 업로드 (명세: POST /api/v1/booth/photos)
  const uploadPhotos = async (finalPhotos: string[]) => {
    console.log("전체 사진 S3 업로드 중...", finalPhotos);

    try {
      const formData = new FormData();
      formData.append("sessionUuid", sessionUuid);

      for (let i = 0; i < finalPhotos.length; i++) {
        const response = await fetch(finalPhotos[i]);
        const blob = await response.blob();
        formData.append("files", blob, `photo_${i + 1}.png`);
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/booth/photos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("사진 업로드 실패");
      }

      // 업로드 성공 시 사진 선택 페이지로 이동
      router.push(`/lim?sessionUuid=${sessionUuid}`);
    } catch (err) {
      console.error("업로드 에러:", err);
      // 서버가 닫혀있을 때를 대비해 업로드 실패 시에도 사용자에게 안내만 하고 멈추도록 예외 처리
      alert(
        "현재 백엔드 서버가 닫혀있어 사진 전송이 생략되었습니다. (로컬 촬영 완료)"
      );
    }
  };

  // 타이머 로직 (기존 유지)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (page === "CAMERA" && photos.length < TOTAL_PHOTOS) {
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="btn-shape"
            style={{
              textAlign: "center",
              background: "#222",
              border: "1px solid #444",
              marginBottom: "10px",
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
          <button
            className="btn-shape"
            onClick={() => {
              unlockAudio();
              setPage("CAMERA");
            }}
          >
            Start!
          </button>
        </div>
      )}

      {/* 3. 사진 촬영 페이지 */}
      {page === "CAMERA" && (
        <>
          <div className="logo-common top-logo-small">Lionism</div>
          <div className="timer-number">{count}</div>

          <div
            className="camera-viewfinder"
            style={{ overflow: "hidden", paddingBottom: 0 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
                transform: "scaleX(-1)",
              }}
            />
            <button
              className="shutter-btn-white"
              onClick={onCapture}
              style={{ zIndex: 10, marginBottom: "30px" }}
            ></button>
          </div>

          <div className="photo-preview-column">
            {[...Array(TOTAL_PHOTOS)].map((_, i) => (
              <div key={i} className="preview-slot-box">
                {photos[i] && (
                  <img src={photos[i]} alt="captured" className="preview-img" />
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
