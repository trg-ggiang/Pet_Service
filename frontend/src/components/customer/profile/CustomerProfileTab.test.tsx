import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CustomerProfileTab } from "./CustomerProfileTab";
import type { CustomerProfile } from "../../../services/customer/customerProfileApi";

const profile: CustomerProfile = {
  id: 10,
  userId: 1,
  fullName: "Nguyen Van Minh",
  email: "customer@example.test",
  phone: "0901000001",
  address: "Hanoi",
  dateOfBirth: "2000-01-02",
  age: 26,
  gender: "MALE",
};

describe("CustomerProfileTab", () => {
  test("renders profile data without exposing an editable email field", () => {
    // Arrange & Act
    render(
      <CustomerProfileTab
        profile={profile}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getAllByText(profile.fullName).length).toBeGreaterThan(0);
    expect(screen.getAllByText(profile.email).length).toBeGreaterThan(0);
    expect(screen.queryByDisplayValue(profile.email)).not.toBeInTheDocument();
  });

  test("submits trimmed editable fields while keeping email read-only", async () => {
    // Arrange
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <CustomerProfileTab
        profile={profile}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSave={onSave}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button"));
    const nameInput = screen.getByDisplayValue(profile.fullName);
    fireEvent.change(nameInput, { target: { value: "  Minh Updated  " } });
    const emailInput = screen.getByDisplayValue(profile.email);
    expect(emailInput).toBeDisabled();
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);

    // Assert
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        fullName: "Minh Updated",
        phone: profile.phone,
        address: profile.address,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
      });
    });
    expect(screen.queryByDisplayValue(profile.email)).not.toBeInTheDocument();
  });

  test("keeps edit mode open and shows an error when saving fails", async () => {
    // Arrange
    const onSave = vi.fn().mockRejectedValue(new Error("Profile update failed"));
    render(
      <CustomerProfileTab
        profile={profile}
        loading={false}
        error=""
        onRefresh={vi.fn()}
        onSave={onSave}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button"));
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]);

    // Assert
    expect(await screen.findByText("Profile update failed")).toBeInTheDocument();
    expect(screen.getByDisplayValue(profile.email)).toBeDisabled();
  });
});
