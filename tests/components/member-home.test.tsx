import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/member", vi.fn()],
  Link: ({ href, children, className }: any) =>
    React.createElement("a", { href, className }, children),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      return ({ children, className, ...rest }: any) =>
        React.createElement("div", { className, ...rest }, children);
    },
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "1", firstName: "Alice", wpUsername: "alice", contractSigned: true },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    isLoggingOut: false,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/MemberMessages", () => ({
  MemberMessages: () => React.createElement("div", { "data-testid": "member-messages" }, "Messages"),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: any) =>
    React.createElement("div", { className, ...props }, children),
  CardContent: ({ children, className }: any) =>
    React.createElement("div", { className }, children),
  CardHeader: ({ children, className }: any) =>
    React.createElement("div", { className }, children),
  CardTitle: ({ children, className }: any) =>
    React.createElement("h3", { className }, children),
  CardDescription: ({ children, className }: any) =>
    React.createElement("p", { className }, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild, ...props }: any) =>
    React.createElement("button", props, children),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) =>
    React.createElement("span", { className }, children),
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => React.createElement("div", { "data-progress": value }),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) =>
    React.createElement("div", { className, "data-testid": "skeleton" }),
}));

import MemberHomePage from "../../artifacts/ffpma/src/pages/member-home";
import { useAuth } from "@/hooks/use-auth";

const mockUseQuery = vi.mocked((await import("@tanstack/react-query")).useQuery);

describe("MemberHomePage — authenticated user", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", firstName: "Alice", wpUsername: "alice", contractSigned: true } as any,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
      isLoggingOut: false,
    });
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any);
  });

  it("renders the greeting with the user's first name", () => {
    render(React.createElement(MemberHomePage));
    const greeting = screen.getByTestId("text-greeting");
    expect(greeting).toBeInTheDocument();
    expect(greeting.textContent).toContain("Alice");
  });

  it("renders quick action card for Browse Products", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("card-action-browse-products")).toBeInTheDocument();
  });

  it("renders quick action card for Training Hub", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("card-action-training-hub")).toBeInTheDocument();
  });

  it("renders the training progress card", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("card-training-progress")).toBeInTheDocument();
  });

  it("renders the recent orders card", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("card-recent-orders")).toBeInTheDocument();
  });

  it("renders the payment history card", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("card-payment-history")).toBeInTheDocument();
  });

  it("renders the membership status card", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("card-membership-status")).toBeInTheDocument();
  });

  it("renders MemberMessages component", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("member-messages")).toBeInTheDocument();
  });

  it("shows Begin Training button when no training modules are loaded", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("button-start-training")).toBeInTheDocument();
  });

  it("shows Shop Now button when no orders exist", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("button-shop-now")).toBeInTheDocument();
  });

  it("shows View Training button in training card header", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("button-view-training")).toBeInTheDocument();
  });

  it("shows View All Orders button in orders card header", () => {
    render(React.createElement(MemberHomePage));
    expect(screen.getByTestId("button-view-orders")).toBeInTheDocument();
  });
});

describe("MemberHomePage — loading state", () => {
  it("shows skeletons while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      logout: vi.fn(),
      isLoggingOut: false,
    });

    render(React.createElement(MemberHomePage));
    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("MemberHomePage — unauthenticated (not loading)", () => {
  it("renders greeting showing 'Member' as fallback when user is null", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: vi.fn(),
      isLoggingOut: false,
    });
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any);

    render(React.createElement(MemberHomePage));
    const greeting = screen.getByTestId("text-greeting");
    expect(greeting).toBeInTheDocument();
    expect(greeting.textContent).toContain("Member");
  });
});

describe("MemberHomePage — contract not signed", () => {
  it("shows contract review button when user has not signed", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "2", firstName: "Bob", contractSigned: false } as any,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
      isLoggingOut: false,
    });
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any);

    render(React.createElement(MemberHomePage));
    expect(screen.getByText(/Review Agreement/i)).toBeInTheDocument();
  });

  it("does not show Review Agreement when contract is signed", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", firstName: "Alice", contractSigned: true } as any,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
      isLoggingOut: false,
    });
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false } as any);

    render(React.createElement(MemberHomePage));
    expect(screen.queryByText(/Review Agreement/i)).not.toBeInTheDocument();
  });
});
