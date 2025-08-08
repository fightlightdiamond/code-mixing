import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Edtech",
  description: "Bảng điều khiển quản trị hệ thống học tiếng Anh",
};

export default function AdminDashboard() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#1e293b",
            margin: 0,
            marginBottom: 8,
          }}
        >
          🎓 Admin Dashboard
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: 18,
            margin: 0,
          }}
        >
          Quản lý hệ thống học tiếng Anh phong cách Do Thái
        </p>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginBottom: 40,
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              👥
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Người dùng
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                Học viên, giảng viên, admin
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#2563eb",
              marginBottom: 8,
            }}
          >
            1,234
          </div>
          <div style={{ fontSize: 14, color: "#10b981" }}>
            +12% so với tháng trước
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              📚
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Bài học
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                Nội dung học tập
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#16a34a",
              marginBottom: 8,
            }}
          >
            89
          </div>
          <div style={{ fontSize: 14, color: "#10b981" }}>
            +5 bài học mới tuần này
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              📖
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Truyện chêm
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                Phương pháp Do Thái
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#d97706",
              marginBottom: 8,
            }}
          >
            156
          </div>
          <div style={{ fontSize: 14, color: "#10b981" }}>+8 truyện mới</div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: "#f3e8ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              📊
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              >
                Hoạt động
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
                Người dùng đang học
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#7c3aed",
              marginBottom: 8,
            }}
          >
            892
          </div>
          <div style={{ fontSize: 14, color: "#10b981" }}>
            +18% hoạt động hôm nay
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div
        style={{
          backgroundColor: "white",
          padding: 32,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#1e293b",
            margin: 0,
            marginBottom: 24,
          }}
        >
          Quản lý hệ thống
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          <a
            href="/admin/users"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#1e293b",
              backgroundColor: "#fafafa",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32 }}>👥</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Quản lý người dùng
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Thêm, sửa, xóa tài khoản học viên và giảng viên
              </div>
            </div>
          </a>

          <a
            href="/admin/lessons"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#1e293b",
              backgroundColor: "#fafafa",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32 }}>📚</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Quản lý bài học
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Tạo và chỉnh sửa nội dung bài học
              </div>
            </div>
          </a>

          <a
            href="/admin/stories"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#1e293b",
              backgroundColor: "#fafafa",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32 }}>📖</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Quản lý truyện chêm
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Tạo truyện với từ tiếng Anh được chêm vào
              </div>
            </div>
          </a>

          <a
            href="/admin/vocabularies"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#1e293b",
              backgroundColor: "#fafafa",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32 }}>📝</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Quản lý từ vựng
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Thêm và quản lý từ vựng IT tiếng Anh
              </div>
            </div>
          </a>

          <a
            href="/admin/quizzes"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#1e293b",
              backgroundColor: "#fafafa",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32 }}>❓</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Quản lý bài kiểm tra
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Tạo và quản lý câu hỏi kiểm tra
              </div>
            </div>
          </a>

          <a
            href="/admin/analytics"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              textDecoration: "none",
              color: "#1e293b",
              backgroundColor: "#fafafa",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ fontSize: 32 }}>📊</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Thống kê & Báo cáo
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                Xem báo cáo chi tiết về hoạt động học tập
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
