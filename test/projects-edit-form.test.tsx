import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditProjectForm } from "@/app/(app)/projects/[projectId]/edit/form";
import type { Project } from "@/app/(app)/projects/queries";

const searchParamsHolder = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsHolder.params,
}));

vi.mock("@/app/(app)/projects/actions", () => ({
  updateProject: vi.fn(),
}));

const baseProject: Project = {
  id: "abc-123",
  user_id: "user-1",
  name: "My Project",
  description: "Some description",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("EditProjectForm", () => {
  beforeEach(() => {
    searchParamsHolder.params = new URLSearchParams();
  });

  it("pre-fills the name and description from the project prop", () => {
    render(<EditProjectForm project={baseProject} />);
    expect(screen.getByLabelText(/name/i)).toHaveValue("My Project");
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      "Some description",
    );
  });

  it("seeds the hidden status input from the project's current status", () => {
    const { container } = render(<EditProjectForm project={baseProject} />);
    const hiddenStatus = container.querySelector(
      'input[type="hidden"][name="status"]',
    );
    expect(hiddenStatus).toHaveAttribute("value", "active");
  });

  it("includes a hidden id input so updateProject knows which row to target", () => {
    const { container } = render(<EditProjectForm project={baseProject} />);
    const hiddenId = container.querySelector(
      'input[type="hidden"][name="id"]',
    );
    expect(hiddenId).toHaveAttribute("value", "abc-123");
  });

  it("links the Cancel button back to the project's detail page", () => {
    render(<EditProjectForm project={baseProject} />);
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/projects/abc-123",
    );
  });

  it("renders the Save changes submit button", () => {
    render(<EditProjectForm project={baseProject} />);
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it("handles a null description by rendering an empty textarea", () => {
    render(
      <EditProjectForm project={{ ...baseProject, description: null }} />,
    );
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
  });

  it("displays an error message from URL search params", () => {
    searchParamsHolder.params = new URLSearchParams(
      "error=Name+must+be+100+characters+or+less",
    );
    render(<EditProjectForm project={baseProject} />);
    expect(
      screen.getByText(/name must be 100 characters or less/i),
    ).toBeInTheDocument();
  });
});
