import { render, screen } from "@testing-library/react";
import { useAuth } from "@/contexts/AuthContext";
import LearningPage from "@/app/learning/page";

// Mock the auth context
jest.mock("@/contexts/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the Require component to always render children
jest.mock("@/core/auth/Require", () => ({
  Require: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock FadeIn component
jest.mock("@/components/ui/fade-in", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("Learning Page", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });
  });

  it("renders the learning page with main sections", () => {
    render(<LearningPage />);

    // Check main heading
    expect(screen.getByText("Học tiếng Anh qua")).toBeInTheDocument();
    expect(screen.getByText("Truyện chêm")).toBeInTheDocument();

    // Check stats section
    expect(screen.getByText("Truyện đã đọc")).toBeInTheDocument();
    expect(screen.getByText("Từ vựng đã học")).toBeInTheDocument();
    expect(screen.getByText("Bài tập hoàn thành")).toBeInTheDocument();
    expect(screen.getByText("Cấp độ hiện tại")).toBeInTheDocument();

    // Check main sections
    expect(screen.getByText("Chọn truyện để đọc")).toBeInTheDocument();
    expect(screen.getByText("Tiếp tục học tập")).toBeInTheDocument();
    expect(screen.getByText("Theo dõi tiến độ")).toBeInTheDocument();
    expect(screen.getByText("Cài đặt học tập")).toBeInTheDocument();
  });

  it("shows beginner level content for new users", () => {
    render(<LearningPage />);

    expect(screen.getByText("Truyện cấp độ Beginner")).toBeInTheDocument();
    expect(screen.getByText("Truyện cấp độ Intermediate")).toBeInTheDocument();
    expect(screen.getByText("Chưa mở khóa")).toBeInTheDocument();
  });

  it("shows empty state for new users", () => {
    render(<LearningPage />);

    expect(screen.getByText("Chưa có truyện đang đọc")).toBeInTheDocument();
    expect(
      screen.getByText("Không có từ vựng nào cần ôn tập hôm nay")
    ).toBeInTheDocument();
  });
});
