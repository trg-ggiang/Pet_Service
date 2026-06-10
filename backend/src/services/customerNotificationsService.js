const { supabase } = require("../lib/supabaseClient");

function assertUserId(userId) {
  const effectiveUserId = Number(userId);
  if (!Number.isFinite(effectiveUserId)) {
    const error = new Error("Thiếu thông tin người dùng");
    error.statusCode = 401;
    throw error;
  }
  return effectiveUserId;
}

async function listCustomerNotifications(userId) {
  const effectiveUserId = assertUserId(userId);

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, content, type, is_read, created_at")
    .eq("user_id", effectiveUserId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const notifications = data ?? [];
  return {
    notifications,
    summary: {
      total: notifications.length,
      unreadCount: notifications.filter((notification) => !notification.is_read).length,
    },
  };
}

async function markCustomerNotificationRead(userId, notificationId) {
  const effectiveUserId = assertUserId(userId);
  const effectiveNotificationId = Number(notificationId);

  if (!Number.isFinite(effectiveNotificationId)) {
    const error = new Error("Mã thông báo không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", effectiveNotificationId)
    .eq("user_id", effectiveUserId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    const errorNotFound = new Error("Không tìm thấy thông báo");
    errorNotFound.statusCode = 404;
    throw errorNotFound;
  }

  return data;
}

async function markAllCustomerNotificationsRead(userId) {
  const effectiveUserId = assertUserId(userId);

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", effectiveUserId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
}

async function dismissCustomerNotification(userId, notificationId) {
  const effectiveUserId = assertUserId(userId);
  const effectiveNotificationId = Number(notificationId);

  if (!Number.isFinite(effectiveNotificationId)) {
    const error = new Error("Mã thông báo không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", effectiveNotificationId)
    .eq("user_id", effectiveUserId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    const errorNotFound = new Error("Không tìm thấy thông báo");
    errorNotFound.statusCode = 404;
    throw errorNotFound;
  }

  return data;
}

module.exports = {
  dismissCustomerNotification,
  listCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
};
