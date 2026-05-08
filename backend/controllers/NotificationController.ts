import { Request, Response } from "express";
import { Notification } from "../db";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const userId = user.id;
    const userLocationId = user.locationId;
    const queryLocationId = req.query.locationId;
    
    const activeLocationId = queryLocationId || userLocationId;
    
    // Fetch notifications for the user, or for their active location, or global ones
    const query: any = {
      $or: [
        { userId }, // Directly addressed to user
        { 
          userId: null, 
          $or: [
            { locationId: activeLocationId }, // Addressed to specific location
            { locationId: null } // Global
          ]
        }
      ]
    };

    let notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);

    // Filter by preferences if user has them defined
    if (user.notificationPreferences) {
      notifications = notifications.filter(notif => {
        const category = notif.category || 'system';
        if (category === 'order' && user.notificationPreferences.orderAlerts === false) return false;
        if (category === 'inventory' && user.notificationPreferences.inventoryAlerts === false) return false;
        if (category === 'message' && user.notificationPreferences.staffMessages === false) return false;
        if (category === 'report' && user.notificationPreferences.dailyReports === false) return false;
        return true;
      });
    }
    
    res.json(notifications.slice(0, 50));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    await Notification.updateMany(
      { $or: [{ userId }, { userId: null }], read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const clearNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    await Notification.deleteMany({ $or: [{ userId }, { userId: null }] });
    res.json({ message: "Notifications cleared" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createNotification = async (data: {
  userId?: string;
  locationId?: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  category?: "order" | "inventory" | "message" | "report" | "system";
  link?: string;
}) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
