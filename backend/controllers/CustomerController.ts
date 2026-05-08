import { Request, Response } from "express";
import { db } from "../db";

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query: any = { role: "customer" };
    
    let customers = await db.find("users", query);

    // Data Repair for list view: if user has points but $0 spent, estimate based on 10 pts = $1
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      if ((c.points || 0) > 0 && (c.totalSpent || 0) <= 0) {
        const estimatedSpent = Number((c.points / 10).toFixed(2));
        const updated = await db.update("users", c.id, { totalSpent: estimatedSpent });
        if (updated) customers[i] = updated;
      }
    }
    
    if (locationId && locationId !== "all") {
      const filtered = customers.filter((c: any) => {
        const idStr = locationId.toString();
        const primaryMatch = c.locationId?.toString() === idStr;
        const historyMatch = c.locationIds?.some((id: any) => id.toString() === idStr);
        return primaryMatch || historyMatch;
      });
      return res.json(filtered);
    }
    
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await db.insert("users", {
      ...req.body,
      role: "customer",
      points: 0,
      membershipLevel: "Bronze",
    });
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await db.update("users", req.params.id, req.body);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    let customer = await db.findById("users", req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Data Repair: if user has points but $0 spent, estimate based on 10 pts = $1
    if ((customer.points || 0) > 0 && (customer.totalSpent || 0) <= 0) {
      const estimatedSpent = Number((customer.points / 10).toFixed(2));
      customer = await db.update("users", customer.id, { totalSpent: estimatedSpent });
    }

    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addPoints = async (req: Request, res: Response) => {
  try {
    const { points } = req.body;
    const customer = await db.findById("users", req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    
    const newPoints = (customer.points || 0) + points;
    let membershipLevel = customer.membershipLevel;
    
    if (newPoints >= 5000) membershipLevel = "Platinum";
    else if (newPoints >= 1500) membershipLevel = "Gold";
    else if (newPoints >= 500) membershipLevel = "Silver";
    else membershipLevel = "Bronze";
    
    const updatedCustomer = await db.update("users", req.params.id, { 
      points: newPoints,
      membershipLevel
    });
    res.json(updatedCustomer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
