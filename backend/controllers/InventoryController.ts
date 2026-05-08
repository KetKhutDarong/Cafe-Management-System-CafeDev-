import { Request, Response } from "express";
import { db } from "../db";

export const getInventory = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query = locationId ? { locationId } : {};
    const items = await db.find("inventory", query);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const itemData = req.body;
    if (itemData.quantity !== undefined && itemData.threshold !== undefined) {
      if (itemData.quantity <= 0) itemData.status = "Out of Stock";
      else if (itemData.quantity <= itemData.threshold) itemData.status = "Low Stock";
      else itemData.status = "In Stock";
    }
    const item = await db.insert("inventory", itemData);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const itemData = req.body;
    const existing = await db.findById("inventory", req.params.id);
    if (existing && itemData.quantity !== undefined) {
      const q = itemData.quantity;
      const t = itemData.threshold !== undefined ? itemData.threshold : existing.threshold;
      if (q <= 0) itemData.status = "Out of Stock";
      else if (q <= t) itemData.status = "Low Stock";
      else itemData.status = "In Stock";
    }
    const item = await db.update("inventory", req.params.id, itemData);
    if (!item) return res.status(404).json({ error: "Inventory item not found" });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const success = await db.delete("inventory", req.params.id);
    if (!success) return res.status(404).json({ error: "Inventory item not found" });
    res.json({ message: "Inventory item deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const adjustStock = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, type, reason, orderId } = req.body; // type: 'in' or 'out'
    
    const item = await db.findById("inventory", id);
    if (!item) return res.status(404).json({ error: "Inventory item not found" });

    const adjustment = type === 'in' ? Number(amount) : -Number(amount);
    const newQuantity = Math.max(0, (item.quantity || 0) + adjustment);
    
    let newStatus = "In Stock";
    if (newQuantity <= 0) newStatus = "Out of Stock";
    else if (newQuantity <= (item.threshold || 0)) newStatus = "Low Stock";

    const updatedItem = await db.update("inventory", id, { 
      quantity: newQuantity,
      status: newStatus
    });

    // Log the adjustment
    await db.insert("inventoryLogs", {
      inventoryId: id,
      itemName: item.name,
      amount: adjustment,
      previousQuantity: item.quantity || 0,
      newQuantity,
      type,
      reason,
      locationId: item.locationId,
      orderId,
      userId: req.user?.id,
      userName: req.user?.name || "System",
      createdAt: new Date().toISOString()
    });

    res.json(updatedItem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getInventoryLogs = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query = locationId ? { locationId } : {};
    const logs = await db.find("inventoryLogs", query);
    res.json(logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
