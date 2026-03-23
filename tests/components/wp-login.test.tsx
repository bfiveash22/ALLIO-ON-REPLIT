import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
  useMutation: vi.fn((opts: any) => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/login", vi.fn()],
  Link: ({ href, children }: any) => React.createElement("a", { href }, children),
}));

vi.mock("@/components/ff-logo", () => ({
  FFLogoFull: () => React.createElement("div", { "data-testid": "ff-logo" }, "FF Logo"),
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: () => React.createElement("hr"),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => React.createElement("div", { className }, children),
  CardContent: ({ children, className }: any) => React.createElement("div", { className }, children),
  CardDescription: ({ children }: any) => React.createElement("p", null, children),
  CardFooter: ({ children }: any) => React.createElement("div", null, children),
  CardHeader: ({ children, className }: any) => React.createElement("div", { className }, children),
  CardTitle: (props: any) => React.createElement("h2", props, props.children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) =>
    React.createElement("button", { onClick, disabled, type, ...props }, children),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ id, value, onChange, disabled, type, placeholder, ...props }: any) =>
    React.createElement("input", { id, value, onChange, disabled, type, placeholder, ...props }),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => React.createElement("label", { htmlFor }, children),
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children, ...props }: any) => React.createElement("div", { role: "alert", ...props }, children),
  AlertDescription: ({ children }: any) => React.createElement("span", null, children),
}));

import WPLoginPage from "../../artifacts/ffpma/src/pages/wp-login";

describe("WPLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders the login title", () => {
    render(React.createElement(WPLoginPage));
    expect(screen.getByTestId("text-login-title")).toBeInTheDocument();
    expect(screen.getByTestId("text-login-title")).toHaveTextContent("Member Login");
  });

  it("renders username and password inputs", () => {
    render(React.createElement(WPLoginPage));
    expect(screen.getByTestId("input-username")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
  });

  it("renders the login submit button", () => {
    render(React.createElement(WPLoginPage));
    expect(screen.getByTestId("button-login")).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    render(React.createElement(WPLoginPage));
    fireEvent.click(screen.getByTestId("button-login"));
    await waitFor(() => {
      expect(screen.getByText(/Please enter your username/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when only password is filled", async () => {
    render(React.createElement(WPLoginPage));
    const passwordInput = screen.getByTestId("input-password");
    fireEvent.change(passwordInput, { target: { value: "somepassword" } });
    fireEvent.click(screen.getByTestId("button-login"));
    await waitFor(() => {
      expect(screen.getByText(/Please enter your username/i)).toBeInTheDocument();
    });
  });

  it("shows validation error when only username is filled", async () => {
    render(React.createElement(WPLoginPage));
    const usernameInput = screen.getByTestId("input-username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByTestId("button-login"));
    await waitFor(() => {
      expect(screen.getByText(/Please enter your username/i)).toBeInTheDocument();
    });
  });

  it("calls fetch with correct endpoint when form is valid", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, user: { id: "1" }, redirectTo: "/member" }),
    });
    global.fetch = mockFetch;

    render(React.createElement(WPLoginPage));
    fireEvent.change(screen.getByTestId("input-username"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("shows error message on failed login response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    render(React.createElement(WPLoginPage));
    fireEvent.change(screen.getByTestId("input-username"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows connection error when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    render(React.createElement(WPLoginPage));
    fireEvent.change(screen.getByTestId("input-username"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByTestId("input-password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("button-login"));

    await waitFor(() => {
      expect(screen.getByText(/Connection error/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility when toggle button is clicked", () => {
    render(React.createElement(WPLoginPage));
    const passwordInput = screen.getByTestId("input-password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByTestId("button-toggle-password");
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("renders the back home button", () => {
    render(React.createElement(WPLoginPage));
    expect(screen.getByTestId("button-back-home")).toBeInTheDocument();
  });
});
