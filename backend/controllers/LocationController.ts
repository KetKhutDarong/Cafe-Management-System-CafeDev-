import { Request, Response } from "express";
import { db } from "../db";

export const getLocations = async (req: Request, res: Response) => {
  try {
    const locations = await db.getCollection("locations");
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const location = await db.findById("locations", req.params.id);
    if (!location) return res.status(404).json({ error: "Location not found" });
    res.json(location);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const location = await db.insert("locations", req.body);
    res.status(201).json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const location = await db.update("locations", req.params.id, req.body);
    if (!location) return res.status(404).json({ error: "Location not found" });
    res.json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const success = await db.delete("locations", req.params.id);
    if (!success) return res.status(404).json({ error: "Location not found" });
    res.json({ message: "Location deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
