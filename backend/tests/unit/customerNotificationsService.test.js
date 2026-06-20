const { createSupabaseQuery } = require("../helpers/supabaseQuery");
const { notifications } = require("../mocks/customerCore.mock");

jest.mock("../../src/lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require("../../src/lib/supabaseClient");
const {
  dismissCustomerNotification,
  listCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} = require("../../src/services/customerNotificationsService");

describe("customerNotificationsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("lists notifications and calculates unread summary for the current user", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(
      createSupabaseQuery({ data: notifications, error: null }, { resolveMethods: ["order"] }),
    );

    // Act
    const result = await listCustomerNotifications(1);

    // Assert
    expect(result.notifications).toEqual(notifications);
    expect(result.summary).toEqual({ total: 2, unreadCount: 1 });
  });

  test("marks a notification read only when it belongs to the user", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: { id: 1 }, error: null });
    supabase.from.mockReturnValueOnce(updateQuery);

    // Act
    const result = await markCustomerNotificationRead(1, 1);

    // Assert
    expect(result).toEqual({ id: 1 });
    expect(updateQuery.update).toHaveBeenCalledWith({ is_read: true });
    expect(updateQuery.eq).toHaveBeenCalledWith("id", 1);
    expect(updateQuery.eq).toHaveBeenCalledWith("user_id", 1);
  });

  test("returns 404 when a notification does not belong to the user", async () => {
    // Arrange
    supabase.from.mockReturnValueOnce(createSupabaseQuery({ data: null, error: null }));

    // Act
    const action = () => markCustomerNotificationRead(1, 999);

    // Assert
    await expect(action()).rejects.toMatchObject({ statusCode: 404 });
  });

  test("marks all unread notifications for the user", async () => {
    // Arrange
    const updateQuery = createSupabaseQuery({ data: null, error: null });
    supabase.from.mockReturnValueOnce(updateQuery);

    // Act
    await markAllCustomerNotificationsRead(1);

    // Assert
    expect(updateQuery.update).toHaveBeenCalledWith({ is_read: true });
    expect(updateQuery.eq).toHaveBeenCalledWith("user_id", 1);
    expect(updateQuery.eq).toHaveBeenCalledWith("is_read", false);
  });

  test("dismisses a notification only for the owning user", async () => {
    // Arrange
    const deleteQuery = createSupabaseQuery({ data: { id: 1 }, error: null });
    supabase.from.mockReturnValueOnce(deleteQuery);

    // Act
    const result = await dismissCustomerNotification(1, 1);

    // Assert
    expect(result).toEqual({ id: 1 });
    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith("id", 1);
    expect(deleteQuery.eq).toHaveBeenCalledWith("user_id", 1);
  });
});
