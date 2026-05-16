"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import LionismLogo from "../Lionism.svg";
import "./admin.css";

type Status = "진행 전" | "진행 중" | "완료";
type FilterStatus = "전체" | Status;

interface Order {
  id: number;
  uniqueCode: string;
  phoneNumber: string;
  receivedAt: string;
  status: Status;
  // 사용자가 선택한 출력용 사진 2장 (동일 사진 2장일 수도 있음)
  // TODO: 실제 서버 연동 시 API 응답의 selectedPhotoUrls 필드로 교체
  photos: [string, string];
}

// TODO: 실제 서버 연동 시 API polling 또는 WebSocket으로 교체
// ex) GET ${process.env.NEXT_PUBLIC_API_URL}/admin/orders
const MOCK_ORDERS: Order[] = [
  { id: 1,  uniqueCode: "1A1A1", phoneNumber: "010-1234-5678", receivedAt: "2026.05.18 14:23:12", status: "진행 전",  photos: ["https://picsum.photos/seed/a/1600/900", "https://picsum.photos/seed/a/1600/900"] },
  { id: 2,  uniqueCode: "2B3C4", phoneNumber: "010-2345-6789", receivedAt: "2026.05.18 14:31:05", status: "진행 중",  photos: ["https://picsum.photos/seed/b/1600/900", "https://picsum.photos/seed/c/1600/900"] },
  { id: 3,  uniqueCode: "3D5E6", phoneNumber: "010-3456-7890", receivedAt: "2026.05.18 14:45:22", status: "완료",     photos: ["https://picsum.photos/seed/d/1600/900", "https://picsum.photos/seed/e/1600/900"] },
  { id: 4,  uniqueCode: "4F7G8", phoneNumber: "010-4567-8901", receivedAt: "2026.05.18 15:02:47", status: "진행 전",  photos: ["https://picsum.photos/seed/f/1600/900", "https://picsum.photos/seed/g/1600/900"] },
  { id: 5,  uniqueCode: "5H9I0", phoneNumber: "010-5678-9012", receivedAt: "2026.05.18 15:11:33", status: "진행 전",  photos: ["https://picsum.photos/seed/h/1600/900", "https://picsum.photos/seed/i/1600/900"] },
  { id: 6,  uniqueCode: "6J1K2", phoneNumber: "010-6789-0123", receivedAt: "2026.05.18 15:24:58", status: "진행 중",  photos: ["https://picsum.photos/seed/j/1600/900", "https://picsum.photos/seed/k/1600/900"] },
  { id: 7,  uniqueCode: "7L3M4", phoneNumber: "010-7890-1234", receivedAt: "2026.05.18 15:38:14", status: "진행 전",  photos: ["https://picsum.photos/seed/l/1600/900", "https://picsum.photos/seed/m/1600/900"] },
  { id: 8,  uniqueCode: "8N5O6", phoneNumber: "010-8901-2345", receivedAt: "2026.05.18 15:52:09", status: "완료",     photos: ["https://picsum.photos/seed/n/1600/900", "https://picsum.photos/seed/o/1600/900"] },
  { id: 9,  uniqueCode: "9P7Q8", phoneNumber: "010-9012-3456", receivedAt: "2026.05.18 16:05:41", status: "진행 전",  photos: ["https://picsum.photos/seed/p/1600/900", "https://picsum.photos/seed/q/1600/900"] },
  { id: 10, uniqueCode: "0R9S1", phoneNumber: "010-0123-4567", receivedAt: "2026.05.18 16:17:28", status: "진행 중",  photos: ["https://picsum.photos/seed/r/1600/900", "https://picsum.photos/seed/s/1600/900"] },
  { id: 11, uniqueCode: "1T2U3", phoneNumber: "010-1234-5670", receivedAt: "2026.05.18 16:29:55", status: "진행 전",  photos: ["https://picsum.photos/seed/t/1600/900", "https://picsum.photos/seed/u/1600/900"] },
  { id: 12, uniqueCode: "2V4W5", phoneNumber: "010-2345-6780", receivedAt: "2026.05.18 16:44:03", status: "완료",     photos: ["https://picsum.photos/seed/v/1600/900", "https://picsum.photos/seed/w/1600/900"] },
];

const STATUS_OPTIONS: Status[] = ["진행 전", "진행 중", "완료"];
const FILTER_OPTIONS: FilterStatus[] = ["전체", "진행 전", "진행 중", "완료"];
const PAGE_SIZE = 10;

function statusClass(status: Status) {
  if (status === "진행 전") return "before";
  if (status === "진행 중") return "ongoing";
  return "done";
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  
  useEffect(() => {
    const fetchAdminOrders = async () => {
      try {
        const res = await fetch('/api/v1/admin/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      }
      catch (error) {
        console.error("어드민 데이터 로드 실패:", error);
      }
    };
    fetchAdminOrders();

    const interval = setInterval(fetchAdminOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: number, status: Status) => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
      });

      if (res.ok) {
        // 백엔드 반영 성공 시 화면 상태 업데이트
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status } : o))
        );
      } else {
        alert("상태 변경 반영에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 변경 통신 에러:", error);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        q === "" ||
        o.uniqueCode.toLowerCase().includes(q) ||
        o.phoneNumber.replace(/-/g, "").includes(q.replace(/-/g, ""));
      const matchFilter =
        filterStatus === "전체" || o.status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [orders, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleDownload = async (photos: [string, string]) => {
    for (let i = 0; i < photos.length; i++) {
      const res = await fetch(photos[i]);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photo-${i + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <Image src={LionismLogo} alt="Lionism" className="admin-logo" loading="eager" />
      </header>

      <main className="admin-main">
        <div className="admin-toolbar">
          <div className="admin-filters">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                className={`admin-filter-btn ${filterStatus === f ? "active" : ""} ${f !== "전체" ? `filter-${statusClass(f as Status)}` : ""}`}
                onClick={() => handleFilterChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            className="admin-search"
            type="text"
            placeholder="고유번호 또는 전화번호 검색"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>순번</th>
                <th>고유번호</th>
                <th>전화번호</th>
                <th>접수일시</th>
                <th>진행상태</th>
                <th>사진저장</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">검색 결과가 없습니다.</td>
                </tr>
              ) : (
                pageOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.uniqueCode}</td>
                    <td>{order.phoneNumber}</td>
                    <td>{order.receivedAt}</td>
                    <td>
                      <select
                        className={`admin-status-select admin-status-${statusClass(order.status)}`}
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as Status)
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="admin-download-btn"
                        onClick={() => handleDownload(order.photos)}
                      >
                        <span className="admin-download-icon">↓</span> download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`admin-page-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          {currentPage < totalPages && (
            <button
              className="admin-page-next"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &gt;
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
