import { Request, Response } from "express";
import { db } from "../db";

export const getGiftCards = async (req: Request, res: Response) => {
  try {
    const giftCards = await db.getCollection("giftCards");
    res.json(giftCards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const checkGiftCardBalance = async (req: Request, res: Response) => {
  try {
    const { cardNumber, pin } = req.body;
    const giftCard = await db.findOne("giftCards", { cardNumber, pin });

    if (!giftCard) {
      return res.status(404).json({ error: "Invalid Gift Card number or PIN" });
    }

    if (giftCard.status !== "Active") {
      return res.status(400).json({ error: `Gift Card is ${giftCard.status.toLowerCase()}` });
    }

    if (giftCard.expiryDate && new Date(giftCard.expiryDate) < new Date()) {
      return res.status(400).json({ error: "Gift Card has expired" });
    }

    res.json({ balance: giftCard.balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createGiftCard = async (req: Request, res: Response) => {
  try {
    const giftCard = await db.insert("giftCards", req.body);
    res.status(201).json(giftCard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateGiftCard = async (req: Request, res: Response) => {
  try {
    const giftCard = await db.update("giftCards", req.params.id, req.body);
    if (!giftCard) return res.status(404).json({ error: "Gift Card not found" });
    res.json(giftCard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteGiftCard = async (req: Request, res: Response) => {
  try {
    const success = await db.delete("giftCards", req.params.id);
    if (!success) return res.status(404).json({ error: "Gift Card not found" });
    res.json({ message: "Gift Card deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
