import Notification from "./notification.model.js";

export const createNotification =
  async ({
    userId,
    title,
    message,
    type,
  }) => {
    return Notification.create({
      userId,
      title,
      message,
      type,
    });
  };

export const getNotifications =
  async (userId) => {
    return Notification.find({
      userId,
    }).sort({
      createdAt: -1,
    });
  };

export const markAsRead =
  async (id, userId) => {
    return Notification.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );
  };

export const clearNotifications =
  async (userId) => {
    return Notification.deleteMany({ userId });
  };