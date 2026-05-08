import { Request, Response } from "express";
import { db } from "../db";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await db.getCollection("categories");
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await db.insert("categories", req.body);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const DEFAULT_MODIFIERS: Record<string, any[]> = {
  'Coffee': [
    { id: 'm1', name: 'Extra Shot', price: 0.5 },
    { id: 'm2', name: 'Oat Milk', price: 0.75 },
    { id: 'm3', name: 'Vanilla Syrup', price: 0.5 },
    { id: 'm4', name: 'Caramel Drizzle', price: 0.5 },
    { id: 'm5', name: 'Whipped Cream', price: 0.5 }
  ],
  'Tea': [
    { id: 't1', name: 'Honey', price: 0.5 },
    { id: 't2', name: 'Lemon Slice', price: 0.25 },
    { id: 't3', name: 'Chia Seeds', price: 0.75 },
    { id: 't4', name: 'Oat Milk', price: 0.75 }
  ],
  'Smoothie': [
    { id: 's1', name: 'Protein Powder', price: 1.0 },
    { id: 's2', name: 'Chia Seeds', price: 0.75 },
    { id: 's3', name: 'Extra Fruit', price: 1.0 },
    { id: 's4', name: 'Honey', price: 0.5 }
  ],
  'Bakery': [
    { id: 'b1', name: 'Extra Butter', price: 0.25 },
    { id: 'b2', name: 'Jam', price: 0.5 },
    { id: 'b3', name: 'Cream Cheese', price: 0.75 },
    { id: 'b4', name: 'Warm Up', price: 0.0 }
  ]
};

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query = locationId ? { locationId } : {};
    const items = await db.find("menuItems", query);
    const categories = await db.getCollection("categories");
    
    const itemsWithCategory = items.map((item: any) => {
      let categoryName = item.category;
      if (item.categoryId) {
        const categoryObj = categories.find((c: any) => c.id === item.categoryId || c._id?.toString() === item.categoryId.toString());
        if (categoryObj) {
          categoryName = categoryObj.name;
        }
      }

      // Inject modifiers if missing or empty
      const modifiers = (item.modifiers && item.modifiers.length > 0) 
        ? item.modifiers 
        : (DEFAULT_MODIFIERS[categoryName] || []);

      return { 
        ...item, 
        category: categoryName,
        modifiers: modifiers.map((m: any, idx: number) => ({
          ...m,
          id: m.id || `mod-${item.id}-${idx}`
        }))
      };
    });
    
    res.json(itemsWithCategory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const item = await db.insert("menuItems", req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const item = await db.update("menuItems", req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const success = await db.delete("menuItems", req.params.id);
    if (!success) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Menu item deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
