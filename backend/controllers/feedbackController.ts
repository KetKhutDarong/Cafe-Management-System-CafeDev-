import { Request, Response } from "express";
import { Feedback, Order } from "../db";

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { orderId, rating, comment } = req.body;
    
    // Validate order exists and belongs to the user (if authenticated)
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const feedback = new Feedback({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: (req as any).user?._id || order.customerId,
      customerName: (req as any).user?.name || order.customerName,
      locationId: order.locationId,
      rating,
      comment,
      status: "New"
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query: any = {};
    if (locationId) query.locationId = locationId;

    const feedback = await Feedback.find(query).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(id, { status }, { new: true });
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    res.json({ message: "Feedback updated successfully", feedback });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFeedbackStats = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query: any = {};
    if (locationId) query.locationId = locationId;

    const feedback = await Feedback.find(query);
    
    const total = feedback.length;
    const avgRating = total > 0 
      ? feedback.reduce((acc, curr) => acc + curr.rating, 0) / total 
      : 0;
    
    const ratingDistribution = {
      1: feedback.filter(f => f.rating === 1).length,
      2: feedback.filter(f => f.rating === 2).length,
      3: feedback.filter(f => f.rating === 3).length,
      4: feedback.filter(f => f.rating === 4).length,
      5: feedback.filter(f => f.rating === 5).length,
    };

    res.json({
      total,
      avgRating: avgRating.toFixed(1),
      ratingDistribution
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
