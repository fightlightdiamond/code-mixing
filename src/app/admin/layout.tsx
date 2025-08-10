import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Panel - Edtech",
  description: "Quản lý hệ thống học tiếng Anh",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Admin Header */}
      <header
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link
            href="/admin"
            style={{
              textDecoration: "none",
              color: "#1e293b",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "#1e293b",
              }}
            >
              🎓 Edtech Admin
            </h1>
          </Link>

          <nav style={{ display: "flex", gap: 16 }}>
            <Link
              href="/admin/dashboard"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              📊 Tổng quan
            </Link>
            <Link
              href="/admin/users"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              👥 Người dùng
            </Link>
            <Link
              href="/admin/lessons"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              📚 Bài học
            </Link>
            <Link
              href="/admin/stories"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              📖 Stories
            </Link>
            <Link
              href="/admin/vocabularies"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              📝 Từ vựng
            </Link>
            <Link
              href="/admin/quizzes"
              style={{
                textDecoration: "none",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              🧩 Quizzes
            </Link>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>Admin User</span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            A
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
