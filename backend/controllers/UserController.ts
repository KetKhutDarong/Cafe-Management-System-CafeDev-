import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const query = locationId ? { locationId } : {};
    const users = await db.find("users", query);
    const usersWithoutPassword = users.map(({ password, ...user }: any) => user);
    res.json(usersWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    const email = rest.email?.toLowerCase().trim();
    if (email) rest.email = email;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await db.insert("users", { ...rest, password: hashedPassword });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    const updateData: any = { ...rest };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    const user = await db.update("users", req.params.id, updateData);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const success = await db.delete("users", req.params.id);
    if (!success) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
