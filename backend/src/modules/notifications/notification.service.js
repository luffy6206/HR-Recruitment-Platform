import Notification from "./notification.model.js";
import { socketService } from "../../shared/services/socket.service.js";

export const createNotification =
  async ({
    userId,
    title,
    message,
    type,
  }) => {
    console.log(`[NotificationService] Creating ${type} notification for user ${userId}`);
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
    });
    console.log(`[NotificationService] Notification created in DB: ${notification._id}`);

    socketService.emitToUser(userId, "notification:received", notification);

    return notification;
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

export const markAllRead =
  async (userId) => {
    return Notification.updateMany(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );
  };

export const clearNotifications =
  async (userId) => {
    return Notification.deleteMany({ userId });
  };