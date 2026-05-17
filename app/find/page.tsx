"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import "./find.css";

export default function FindPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("고유번호를 입력해주세요.");
      return;
    }
    // 입력한 고유번호를 다운로드 페이지(/kim) URL 에 직접 넣어 이동한다.
    // QR 스캔으로 들어가는 페이지와 동일하다.
    router.push(`/kim?shortCode=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="find-container">
      <div className="find-box">
        <h1 className="find-logo">Lionism</h1>
        <h2 className="find-title">사진 조회</h2>
        <p className="find-desc">
          사진 출력 시 받으신 고유번호를 입력하면
          <br />
          촬영한 사진을 다시 확인할 수 있어요.
        </p>

        <form className="find-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="find-input"
            placeholder="고유번호 입력"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
          />
          {error && <p className="find-error">{error}</p>}
          <button type="submit" className="find-btn">
            조회하기
          </button>
        </form>
      </div>
    </main>
  );
}
