import { Request, Response } from "express";
import { db } from "../db";

export class PromotionController {
  static async getAll(req: any, res: Response) {
    try {
      const { locationId } = req.query;
      const query: any = {};
      if (locationId) query.locationId = locationId;
      
      const promotions = await db.find("promotions", query);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  }

  static async create(req: any, res: Response) {
    try {
      const promotion = await db.insert("promotions", { ...req.body });
      res.status(201).json(promotion);
    } catch (error) {
      res.status(500).json({ error: "Failed to create promotion" });
    }
  }

  static async update(req: any, res: Response) {
    try {
      const promotion = await db.update("promotions", req.params.id, req.body);
      if (!promotion) return res.status(404).json({ error: "Promotion not found" });
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ error: "Failed to update promotion" });
    }
  }

  static async delete(req: any, res: Response) {
    try {
      const success = await db.delete("promotions", req.params.id);
      if (!success) return res.status(404).json({ error: "Promotion not found" });
      res.json({ message: "Promotion deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete promotion" });
    }
  }
}
