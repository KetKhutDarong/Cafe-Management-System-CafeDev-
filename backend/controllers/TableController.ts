import { Request, Response } from "express";
import { db } from "../db";

export const getTables = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query = locationId ? { locationId } : {};
    const tables = await db.find("tables", query);
    const orders = await db.find("orders", query);
    
    const populatedTables = tables.map(table => {
      if (table.currentOrderId) {
        const order = orders.find(o => o.id === table.currentOrderId.toString() || o._id?.toString() === table.currentOrderId.toString());
        if (order) {
          return { ...table, currentOrderId: { id: order.id, orderNumber: order.orderNumber } };
        }
      }
      return table;
    });

    res.json(populatedTables.sort((a, b) => a.number.localeCompare(b.number)));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTable = async (req: Request, res: Response) => {
  try {
    const table = await db.insert("tables", req.body);
    res.status(201).json(table);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateTable = async (req: Request, res: Response) => {
  try {
    const table = await db.update("tables", req.params.id, req.body);
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTable = async (req: Request, res: Response) => {
  try {
    const success = await db.delete("tables", req.params.id);
    if (!success) return res.status(404).json({ error: "Table not found" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTableById = async (req: Request, res: Response) => {
  try {
    const table = await db.findById("tables", req.params.id);
    if (!table) return res.status(404).json({ error: "Table not found" });
    res.json(table);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
