import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock the auth context
jest.mock("@/contexts/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("AppHeader Navigation", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("shows learning link for authenticated users", () => {
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

    render(<AppHeader />);

    expect(screen.getByText("Học tập")).toBeInTheDocument();
    expect(screen.getByText("Stories")).toBeInTheDocument();
  });

  it("does not show learning link for unauthenticated users", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    render(<AppHeader />);

    expect(screen.queryByText("Học tập")).not.toBeInTheDocument();
    expect(screen.getByText("Stories")).toBeInTheDocument();
  });

  it("highlights learning link when on learning page", () => {
    mockUsePathname.mockReturnValue("/learning");
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

    render(<AppHeader />);

    const learningLink = screen.getByText("Học tập").closest("a");
    expect(learningLink).toHaveClass("border-indigo-500", "text-gray-900");
  });
});
