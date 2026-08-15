import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";

function ToastTrigger() {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success("Admin created")}>
        Trigger success
      </button>
      <button type="button" onClick={() => toast.error("Something went wrong")}>
        Trigger error
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useToast", () => {
  test("throws when used outside a ToastProvider", () => {
    // Swallow the expected React error-boundary console noise for this one.
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ToastTrigger />)).toThrow("useToast must be used within a ToastProvider");
  });
});

describe("ToastProvider", () => {
  test("renders children", () => {
    render(
      <ToastProvider>
        <p>protected content</p>
      </ToastProvider>
    );
    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  test("shows a success toast in a live region when triggered", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText("Trigger success"));
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Admin created");
  });

  test("shows an error toast when triggered", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText("Trigger error"));
    expect(screen.getByRole("status")).toHaveTextContent("Something went wrong");
  });

  test("auto-dismisses a toast after a few seconds", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText("Trigger success"));
    expect(screen.getByRole("status")).toHaveTextContent("Admin created");

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole("status")).not.toHaveTextContent("Admin created");
  });

  test("dismisses a toast immediately when its close control is clicked", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText("Trigger success"));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.getByRole("status")).not.toHaveTextContent("Admin created");
  });

  test("stacks multiple toasts independently", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText("Trigger success"));
    fireEvent.click(screen.getByText("Trigger error"));
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Admin created");
    expect(region).toHaveTextContent("Something went wrong");
  });
});
