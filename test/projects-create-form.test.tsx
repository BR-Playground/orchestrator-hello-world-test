import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateProjectForm } from "@/app/(app)/projects/new/form";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

vi.mock("@/app/(app)/projects/actions", () => ({
  createProject: vi.fn(),
}));

describe("CreateProjectForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("renders the name, description, and status fields", () => {
    render(<CreateProjectForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /status/i }),
    ).toBeInTheDocument();
  });

  it("starts with an empty name and description (uncontrolled defaults)", () => {
    render(<CreateProjectForm />);
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
  });

  it("renders the Create project submit button", () => {
    render(<CreateProjectForm />);
    expect(
      screen.getByRole("button", { name: /create project/i }),
    ).toBeInTheDocument();
  });

  it("links the Cancel button back to the projects list", () => {
    render(<CreateProjectForm />);
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("includes a hidden status input mirroring the Select for FormData submission", () => {
    const { container } = render(<CreateProjectForm />);
    const hiddenStatus = container.querySelector(
      'input[type="hidden"][name="status"]',
    );
    expect(hiddenStatus).toHaveAttribute("value", "draft");
  });

  it("displays an error message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "error=Name+is+required",
    );
    render(<CreateProjectForm />);
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });
});
