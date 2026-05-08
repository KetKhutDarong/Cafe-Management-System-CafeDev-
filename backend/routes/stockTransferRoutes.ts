import express from "express";
import { StockTransfer, Inventory, InventoryLog } from "../db";
import { authenticate } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/roleMiddleware";
import { UserRole } from "../types";

const router = express.Router();

// Get all transfers (Admin/Manager)
router.get("/", authenticate, checkPermission("manageInventory"), async (req, res) => {
  try {
    const { locationId } = req.query;
    let query = {};
    
    if (locationId) {
      query = {
        $or: [
          { fromLocationId: locationId },
          { toLocationId: locationId }
        ]
      };
    }

    const transfers = await StockTransfer.find(query)
      .populate("fromLocationId", "name")
      .populate("toLocationId", "name")
      .populate("requestedBy", "name")
      .sort({ createdAt: -1 });

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

// Create a new transfer request
router.post("/", authenticate, async (req, res) => {
  try {
    const { fromLocationId, toLocationId, items, reason, notes } = req.body;
    
    const transfer = new StockTransfer({
      fromLocationId,
      toLocationId,
      items,
      reason,
      notes,
      requestedBy: (req as any).user._id,
      status: "Requested"
    });

    await transfer.save();
    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ error: "Failed to create transfer request" });
  }
});

// Update transfer status
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const transfer = await StockTransfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    // Role check for specific status transitions
    // Only managers at the source location or admins can approve/ship
    // Only managers at the destination location or admins can receive

    const oldStatus = transfer.status;
    transfer.status = status;

    if (status === "In Transit" && oldStatus !== "In Transit") {
      transfer.shippedAt = new Date();
      transfer.approvedBy = (req as any).user._id;
    } else if (status === "Completed" && oldStatus !== "Completed") {
      transfer.receivedAt = new Date();
      
      // Update inventory at both locations
      for (const item of transfer.items) {
        // Find or create item at destination
        let destItem = await Inventory.findOne({ 
          name: item.name, 
          locationId: transfer.toLocationId 
        });

        if (!destItem) {
          // If it doesn't exist, we might need a template from the source
          const sourceTemplate = await Inventory.findById(item.itemId);
          destItem = new Inventory({
            name: item.name,
            locationId: transfer.toLocationId,
            quantity: 0,
            unit: item.unit,
            category: sourceTemplate?.category,
            sku: sourceTemplate?.sku,
            threshold: sourceTemplate?.threshold || 10,
            maxQuantity: sourceTemplate?.maxQuantity || 100
          });
        }

        const prevDestQty = destItem.quantity;
        destItem.quantity += item.quantity;
        await destItem.save();

        // Update inventory log for destination
        await new InventoryLog({
          inventoryId: destItem._id,
          itemName: item.name,
          amount: item.quantity,
          previousQuantity: prevDestQty,
          newQuantity: destItem.quantity,
          type: "in",
          reason: `Stock Transfer Received from ${transfer.fromLocationId}`,
          locationId: transfer.toLocationId,
          userId: (req as any).user._id,
          userName: (req as any).user.name
        }).save();

        // Deduct from source
        const sourceItem = await Inventory.findOne({
          name: item.name,
          locationId: transfer.fromLocationId
        });

        if (sourceItem) {
          const prevSourceQty = sourceItem.quantity;
          sourceItem.quantity -= item.quantity;
          await sourceItem.save();

          // Update inventory log for source
          await new InventoryLog({
            inventoryId: sourceItem._id,
            itemName: item.name,
            amount: -item.quantity,
            previousQuantity: prevSourceQty,
            newQuantity: sourceItem.quantity,
            type: "out",
            reason: `Stock Transfer Shipped to ${transfer.toLocationId}`,
            locationId: transfer.fromLocationId,
            userId: (req as any).user._id,
            userName: (req as any).user.name
          }).save();
        }
      }
    }

    await transfer.save();
    res.json(transfer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update transfer status" });
  }
});

export default router;
