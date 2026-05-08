import { Request, Response } from "express";
import { db } from "../db";
import { createNotification } from "./NotificationController";
import { deductInventoryFromOrder } from "../utils/inventoryUtils";

export const getOrders = async (req: any, res: Response) => {
  try {
    const { locationId } = req.query;
    const user = req.user;
    
    let query: any = {};
    
    // If a specific location is requested, use it
    if (locationId) {
      query.locationId = locationId;
    } 
    // If no location requested but user is staff (not admin), restrict to their location
    else if (user && user.role !== "admin" && user.locationId) {
      query.locationId = user.locationId;
    }
    
    const orders = await db.find("orders", query);
    res.json(orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrder = async (req: any, res: Response) => {
  try {
    const orderNumber = `ORD-${Date.now()}`;
    const { locationId, items } = req.body;

    // Optional: Re-calculate and validate prices server-side here 
    // to ensure promotions are valid and active.
    const now = new Date();
    const day = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Fetch active promotions for this location
    const promotions = await db.find("promotions", { 
      locationId: locationId, 
      isActive: true 
    });

    const activePromos = promotions.filter((p: any) => {
      const isCorrectDay = p.daysOfWeek.includes(day);
      const isCorrectTime = currentTime >= p.startTime && currentTime <= p.endTime;
      return isCorrectDay && isCorrectTime;
    });

    // Handle Gift Card Payment
    if (req.body.paymentMethod === "Gift Card") {
      const { giftCardNumber, giftCardPin } = req.body;
      const giftCard = await db.findOne("giftCards", { cardNumber: giftCardNumber, pin: giftCardPin });
      
      if (!giftCard) {
        return res.status(400).json({ error: "Invalid Gift Card number or PIN" });
      }
      
      if (giftCard.status !== "Active") {
        return res.status(400).json({ error: `Gift Card is ${giftCard.status.toLowerCase()}` });
      }

      if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
        return res.status(400).json({ error: "Gift Card has expired" });
      }
      
      if (giftCard.balance < req.body.total) {
        return res.status(400).json({ error: "Insufficient Gift Card balance" });
      }
      
      await db.update("giftCards", giftCard.id, { balance: giftCard.balance - req.body.total });
      req.body.paymentStatus = "Paid";
    }

    // Handle Coupon usage count
    if (req.body.promoCode) {
      const coupon = await db.findOne("coupons", { code: req.body.promoCode.toUpperCase() });
      if (coupon) {
        await db.update("coupons", coupon.id, { usageCount: (coupon.usageCount || 0) + 1 });
      }
    }

    const order = await db.insert("orders", {
      ...req.body,
      orderNumber,
      cashierId: req.user?.id,
      userId: req.user?.id,
    });

    if (req.body.type === "Dine-in" && req.body.table) {
      const tables = await db.find("tables", { number: req.body.table });
      if (tables.length > 0) {
        await db.update("tables", tables[0].id, { 
          status: "Occupied",
          currentOrderId: order.id
        });
      }
    }

    // Notify staff about new order
    await createNotification({
      locationId: req.body.locationId,
      title: "New Order Received",
      message: `Order ${orderNumber} has been placed.`,
      type: "info",
      category: "order",
      link: "/staff"
    });

    if (req.body.status === "Preparing" || req.body.status === "Ready" || req.body.status === "Completed") {
      await deductInventoryFromOrder(order.id, req.user?.id, req.user?.name);
    }

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req: any, res: Response) => {
  try {
    const { status, paymentStatus } = req.body;
    const updateData: any = { status };
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    const existingOrder = await db.findById("orders", req.params.id);
    if (!existingOrder) return res.status(404).json({ error: "Order not found" });

    if (status === "Preparing" || status === "preparing") {
      updateData.baristaId = req.user.id;
    }

    // Auto stock deduction if transitioning to an active state
    const deductStates = ["Preparing", "preparing", "Ready", "ready", "Completed", "completed"];
    if (deductStates.includes(status)) {
      await deductInventoryFromOrder(req.params.id, req.user?.id, req.user?.name);
    }

    // Award points if status is changed to Completed
    if (status === "Completed" && existingOrder.status !== "Completed") {
      const customerId = existingOrder.customerId || existingOrder.userId;
      if (customerId) {
        const pointsEarned = Math.round(existingOrder.total * 10); // 10 points per dollar
        const user = await db.findById("users", customerId);
        if (user) {
          const newPoints = (user.points || 0) + pointsEarned;
          const newTotalSpent = (user.totalSpent || 0) + existingOrder.total;
          let membershipLevel = user.membershipLevel || "Bronze";
          if (newPoints >= 5000) membershipLevel = "Platinum";
          else if (newPoints >= 1500) membershipLevel = "Gold";
          else if (newPoints >= 500) membershipLevel = "Silver";
          else membershipLevel = "Bronze";

          const userUpdateData: any = { 
            points: newPoints,
            totalSpent: newTotalSpent,
            lastVisit: new Date(),
            membershipLevel
          };

          // Update locationIds to include this branch
          if (existingOrder.locationId) {
            userUpdateData.$addToSet = { locationIds: existingOrder.locationId };
          }

          await db.update("users", customerId, userUpdateData);
          
          // Add a flag to the order to indicate points were awarded
          updateData.pointsAwarded = pointsEarned;
        }
      }

      // Update table status to Cleaning if it was a Dine-in order
      if (existingOrder.type === "Dine-in" && existingOrder.table) {
        const tables = await db.find("tables", { number: existingOrder.table });
        if (tables.length > 0) {
          await db.update("tables", tables[0].id, { 
            status: "Cleaning",
            currentOrderId: null
          });
        }
      }
    }

    if (status === "Cancelled" && existingOrder.status !== "Cancelled" && existingOrder.type === "Dine-in" && existingOrder.table) {
      const tables = await db.find("tables", { number: existingOrder.table });
      if (tables.length > 0) {
        await db.update("tables", tables[0].id, { 
          status: "Available",
          currentOrderId: null
        });
      }
    }

    if (status === "Ready" && existingOrder.status !== "Ready") {
      const customerId = existingOrder.customerId || existingOrder.userId;
      if (customerId) {
        await createNotification({
          userId: customerId.toString(),
          title: "Order Ready!",
          message: `Your order ${existingOrder.orderNumber} is ready for pickup.`,
          type: "success",
          category: "order",
          link: "/orders"
        });
      }
    }

    const updatedOrder = await db.update("orders", req.params.id, updateData);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req: any, res: Response) => {
  try {
    const { paymentStatus } = req.body;
    const updateData: any = { paymentStatus };
    
    const existingOrder = await db.findById("orders", req.params.id);
    if (!existingOrder) return res.status(404).json({ error: "Order not found" });

    const updatedOrder = await db.update("orders", req.params.id, updateData);
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyOrders = async (req: any, res: Response) => {
  try {
    const { locationId } = req.query;
    const orders = await db.getCollection("orders");
    let myOrders = orders.filter((o: any) => o.customerId === req.user.id || o.userId === req.user.id);
    
    if (locationId) {
      myOrders = myOrders.filter((o: any) => o.locationId?.toString() === locationId.toString());
    }
    
    res.json(myOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await db.findById("orders", req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
