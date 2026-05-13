"use client";

import { useState } from "react";
import "PhotoBooth.css";

type PageType = "phone" | "agree" | "save" | "done";

export default function PhotoBooth() {
  const [page, setPage] = useState<PageType>("phone");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

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

  return (
    <main className="booth-container">
      <div className="booth-screen">
        <div className="booth-logo">Lionism</div>

        {page === "phone" && (
          <section className="phone-page">
            <h1 className="notice-message">
              사진 출력이 완료되면 문자로 알려드릴게요!
            </h1>

            <div className="phone-input">
              {formatPhoneNumber(phoneNumber) || "010-1234-1234"}
            </div>

            <div className="keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => pressNumber(String(num))}
                >
                  {num}
                </button>
              ))}

              <div></div>

              <button type="button" onClick={() => pressNumber("0")}>
                0
              </button>

              <button
                type="button"
                className="delete-btn"
                onClick={deleteNumber}
              >
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
                <b>수집하는 개인정보 항목</b>
                <br />
                개인식별정보 : 휴대전화번호
              </p>

              <p>
                <b>개인정보의 수집 및 이용목적</b>
                <br />
                제공하신 정보는 완료 문자 전송과 사용자가 고유번호를
                분실하였을 경우 2차 식별용으로 사용됩니다.
              </p>

              <p>
                <b>개인정보의 보유 및 이용기간</b>
                <br />
                수집된 개인정보는 부스 종료 후 즉시 파기합니다.
              </p>

              <p>
                * 사용자는 이에 대한 동의를 거부할 수 있으며, 동의가 없을 경우
                이후 고유번호 분실 시 2차 식별이 불가능하고 이에 대해 책임지지
                않습니다.
              </p>
            </div>

            <button
              type="button"
              className="blue-btn"
              onClick={() => setPage("save")}
            >
              동의함
            </button>

            <button
              type="button"
              className="gray-btn"
              onClick={() => setPage("phone")}
            >
              동의하지않음
            </button>
          </section>
        )}

        {page === "save" && (
          <section className="save-page">
            <div className="save-card">
              <div className="save-text-box">
                <h2>QR Code</h2>
                <p>QR Code를 스캔하고 사진을 다운받으세요</p>
              </div>

              <div className="qr-box">
                <div className="qr-dummy"></div>
              </div>

              <h3>1R4C6</h3>
            </div>

            <div className="photo-list">
              {[1, 2, 3, 4, 5].map((item) => (
                <div className="photo-placeholder" key={item}></div>
              ))}
            </div>

            <button
              type="button"
              className="hidden-done-btn"
              onClick={() => setPage("done")}
            >
              완료
            </button>
          </section>
        )}

        {page === "done" && (
          <section className="done-page">
            <button
              type="button"
              className="done-btn"
              onClick={() => setPage("phone")}
            >
              Done!
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
