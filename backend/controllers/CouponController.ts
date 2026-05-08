import { Request, Response } from "express";
import { db, Order } from "../db";

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, amount, customerId, locationId, items } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Coupon code is required" });
    }

    const coupon = await db.findOne("coupons", { 
      code: code.toUpperCase(), 
      active: true 
    });

    if (!coupon) {
      return res.status(404).json({ error: "Invalid or expired coupon code" });
    }

    // Check date validity
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return res.status(400).json({ error: "Coupon is not yet active" });
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: "Coupon usage limit reached" });
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
      return res.status(400).json({ error: `Minimum order amount for this coupon is $${coupon.minOrderAmount}` });
    }

    // Check location
    if (coupon.locationId && coupon.locationId.toString() !== locationId) {
      return res.status(400).json({ error: "Coupon is not valid for this location" });
    }

    let discount = 0;
    let message = "";

    switch (coupon.type) {
      case "percentage":
        discount = (amount * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
        break;
      case "fixed":
        discount = coupon.value;
        break;
      case "first_order":
        if (!customerId) {
          return res.status(400).json({ error: "Customer ID is required for first order discount" });
        }
        const previousOrders = await Order.countDocuments({ customerId });
        if (previousOrders > 0) {
          return res.status(400).json({ error: "This coupon is only for first-time customers" });
        }
        discount = (amount * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
        break;
      case "bogo":
        // Buy 1 Get 1 Free logic: Free lowest price item
        if (!items || items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }
        const totalQuantity = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
        if (totalQuantity < 2) {
            return res.status(400).json({ error: "Buy 1 Get 1 Free requires at least 2 items in cart" });
        }
        
        // Find the lowest price among all items
        const prices = items.map((i: any) => i.price);
        discount = Math.min(...prices);
        break;
    }

    res.json({
      coupon,
      discount: parseFloat(discount.toFixed(2)),
      message: message || `Coupon "${code}" applied successfully`
    });

  } catch (error: any) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query = locationId ? { locationId } : {};
    const coupons = await db.find("coupons", query);
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body, code: req.body.code.toUpperCase() };
    const coupon = await db.insert("coupons", data);
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await db.update("coupons", req.params.id, req.body);
    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    await db.delete("coupons", req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
