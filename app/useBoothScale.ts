"use client";

import { useEffect } from "react";

// 부스 화면 디자인 기준 크기 (아이패드 프로 11인치 가로 해상도)
const DESIGN_WIDTH = 1194;
const DESIGN_HEIGHT = 834;

/**
 * 1194x834 고정 디자인을 현재 화면 크기에 맞춰 중앙에 꽉 차게 스케일한다.
 * CSS 변수 --booth-scale 를 갱신하며, .booth-container 가 이 값을 transform 에 사용한다.
 */
export function useBoothScale() {
  useEffect(() => {
    const apply = () => {
      const scale = Math.min(
        window.innerWidth / DESIGN_WIDTH,
        window.innerHeight / DESIGN_HEIGHT,
      );
      document.documentElement.style.setProperty(
        "--booth-scale",
        String(scale),
      );
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);
}
