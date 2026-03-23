import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: any) => React.createElement("div", { className, ...props }, children),
  CardContent: ({ children }: any) => React.createElement("div", null, children),
  CardHeader: ({ children }: any) => React.createElement("div", null, children),
  CardTitle: ({ children }: any) => React.createElement("h3", null, children),
  CardDescription: ({ children }: any) => React.createElement("p", null, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, ...props }: any) =>
    React.createElement("button", { onClick, "data-variant": variant, ...props }, children),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => React.createElement("span", { className }, children),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) =>
    React.createElement("div", { "data-current-tab": value }, children),
  TabsContent: ({ children, value }: any) =>
    React.createElement("div", { "data-tab-content": value }, children),
  TabsList: ({ children }: any) => React.createElement("div", { role: "tablist" }, children),
  TabsTrigger: ({ children, value, onClick, ...props }: any) =>
    React.createElement("button", { role: "tab", value, onClick, ...props }, children),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) =>
    React.createElement("input", { value, onChange, placeholder, ...props }),
}));

vi.mock("@/components/ui/accordion", () => ({
  Accordion: ({ children, ...props }: any) => React.createElement("div", props, children),
  AccordionContent: ({ children }: any) => React.createElement("div", null, children),
  AccordionItem: ({ children, value }: any) =>
    React.createElement("div", { "data-accordion-item": value }, children),
  AccordionTrigger: ({ children }: any) => React.createElement("button", null, children),
}));

import ProtocolsPage from "../../artifacts/ffpma/src/pages/protocols";

describe("ProtocolsPage", () => {
  it("renders the page title", () => {
    render(React.createElement(ProtocolsPage));
    expect(screen.getByTestId("text-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("text-page-title")).toHaveTextContent("Exosome Protocols");
  });

  it("renders the search input", () => {
    render(React.createElement(ProtocolsPage));
    expect(screen.getByTestId("input-search-protocols")).toBeInTheDocument();
  });

  it("search input has a placeholder attribute", () => {
    render(React.createElement(ProtocolsPage));
    const searchInput = screen.getByTestId("input-search-protocols");
    expect(searchInput).toHaveAttribute("placeholder");
  });

  it("renders the 'All' tab", () => {
    render(React.createElement(ProtocolsPage));
    expect(screen.getByTestId("tab-all")).toBeInTheDocument();
  });

  it("renders the injection category tab", () => {
    render(React.createElement(ProtocolsPage));
    expect(screen.getByTestId("tab-injection")).toBeInTheDocument();
  });

  it("renders the butterfly-push protocol card", () => {
    render(React.createElement(ProtocolsPage));
    expect(screen.getByTestId("card-protocol-butterfly-push")).toBeInTheDocument();
  });

  it("renders multiple protocol cards by default", () => {
    render(React.createElement(ProtocolsPage));
    const cards = screen.getAllByTestId(/^card-protocol-/);
    expect(cards.length).toBeGreaterThan(1);
  });

  it("print/download buttons are not shown before protocol is expanded", () => {
    render(React.createElement(ProtocolsPage));
    expect(screen.queryAllByTestId(/^button-print-/).length).toBe(0);
    expect(screen.queryAllByTestId(/^button-download-/).length).toBe(0);
  });

  it("filters out protocols when searching for non-existent term", () => {
    render(React.createElement(ProtocolsPage));
    const searchInput = screen.getByTestId("input-search-protocols");
    fireEvent.change(searchInput, { target: { value: "xyznonexistent99999" } });
    const cards = screen.queryAllByTestId(/^card-protocol-/);
    expect(cards.length).toBe(0);
  });

  it("shows butterfly-push card when searching 'butterfly'", () => {
    render(React.createElement(ProtocolsPage));
    const searchInput = screen.getByTestId("input-search-protocols");
    fireEvent.change(searchInput, { target: { value: "butterfly" } });
    expect(screen.getByTestId("card-protocol-butterfly-push")).toBeInTheDocument();
  });
});
