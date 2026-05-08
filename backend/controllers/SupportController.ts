import { Request, Response } from "express";
import { SupportRequest } from "../db";

export const createSupportRequest = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, category, userId } = req.body;
    
    const newRequest = new SupportRequest({
      name,
      email,
      subject,
      message,
      category,
      userId
    });
    
    await newRequest.save();
    
    res.status(201).json(newRequest);
  } catch (error: any) {
    console.error("Error creating support request:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSupportRequests = async (req: Request, res: Response) => {
  try {
    const requests = await SupportRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error: any) {
    console.error("Error fetching support requests:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateSupportRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updated = await SupportRequest.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Support request not found" });
    }
    
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating support request status:", error);
    res.status(500).json({ error: error.message });
  }
};
