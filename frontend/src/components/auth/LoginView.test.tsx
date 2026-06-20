import { fireEvent, render, screen } from "@testing-library/react";
import { LoginView } from "./LoginView";

function renderLogin(overrides: Partial<React.ComponentProps<typeof LoginView>> = {}) {
  const props: React.ComponentProps<typeof LoginView> = {
    email: "",
    password: "",
    remember: false,
    showPassword: false,
    loading: false,
    error: "",
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onRememberToggle: vi.fn(),
    onShowPasswordToggle: vi.fn(),
    onSubmit: vi.fn((event) => event.preventDefault()),
    onRegister: vi.fn(),
    onForgotPassword: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<LoginView {...props} />) };
}

describe("LoginView", () => {
  test("forwards credential changes and form submission", () => {
    // Arrange
    const { props, container } = renderLogin();
    const emailInput = screen.getByPlaceholderText("admin@petcare.vn");
    const passwordInput = container.querySelector('input[type="password"]');

    // Act
    fireEvent.change(emailInput, { target: { value: "customer@example.test" } });
    fireEvent.change(passwordInput!, { target: { value: "test-password" } });
    fireEvent.submit(emailInput.closest("form")!);

    // Assert
    expect(props.onEmailChange).toHaveBeenCalledWith("customer@example.test");
    expect(props.onPasswordChange).toHaveBeenCalledWith("test-password");
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  test("exposes forgot-password, register, remember and password visibility actions", () => {
    // Arrange
    const { props } = renderLogin();
    const buttons = screen.getAllByRole("button");

    // Act
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[buttons.length - 1]);

    // Assert
    expect(props.onForgotPassword).toHaveBeenCalledTimes(1);
    expect(props.onShowPasswordToggle).toHaveBeenCalledTimes(1);
    expect(props.onRememberToggle).toHaveBeenCalledTimes(1);
    expect(props.onRegister).toHaveBeenCalledTimes(1);
  });

  test("renders an authentication error and disables submission while loading", () => {
    // Arrange & Act
    renderLogin({ loading: true, error: "Invalid credentials" });

    // Assert
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    const submitButton = screen.getAllByRole("button").find((button) => button.getAttribute("type") === "submit");
    expect(submitButton).toBeDisabled();
  });
});
