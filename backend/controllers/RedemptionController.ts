import { Request, Response } from "express";
import { db } from "../db";

export const getRedemptions = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    // Include global redemptions (locationId: null) in branch-specific queries
    const query = locationId ? { $or: [{ locationId }, { locationId: null }] } : {};
    const redemptions = await db.find("redemptions", query);
    // Sort by redeemedAt descending
    redemptions.sort((a: any, b: any) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
    res.json(redemptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRedemptionStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const updateData: any = { status };
    if (status === "Claimed") {
      updateData.claimedAt = new Date();
    }

    const updatedRedemption = await db.update("redemptions", id, updateData);
    if (!updatedRedemption) {
      return res.status(404).json({ error: "Redemption not found" });
    }

    res.json(updatedRedemption);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
