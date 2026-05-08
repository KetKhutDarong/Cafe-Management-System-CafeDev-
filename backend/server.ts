import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";

// Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import menuRoutes from "./routes/menuRoutes";
import orderRoutes from "./routes/orderRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import customerRoutes from "./routes/customerRoutes";
import reportRoutes from "./routes/reportRoutes";
import tableRoutes from "./routes/tableRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import redemptionRoutes from "./routes/redemptionRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import giftCardRoutes from "./routes/giftCardRoutes";
import locationRoutes from "./routes/locationRoutes";
import supportRoutes from "./routes/supportRoutes";
import feedbackRoutes from "./routes/feedbackRoutes";
import stockTransferRoutes from "./routes/stockTransferRoutes";
import promotionRoutes from "./routes/promotionRoutes";
import couponRoutes from "./routes/couponRoutes";

import { connectDB } from "./db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", true);

  await connectDB();

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  console.log("Serving uploads from:", uploadsDir);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use("/uploads", express.static(uploadsDir));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/menu-items", menuRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/tables", tableRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/redemptions", redemptionRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/gift-cards", giftCardRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/support", supportRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/stock-transfers", stockTransferRoutes);
  app.use("/api/promotions", promotionRoutes);
  app.use("/api/coupons", couponRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: "frontend",
      configFile: path.resolve(__dirname, "../vite.config.ts"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
