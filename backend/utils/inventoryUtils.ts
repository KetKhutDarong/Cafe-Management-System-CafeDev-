import { db } from "../db";
import { createNotification } from "../controllers/NotificationController";

export const deductInventoryFromOrder = async (orderId: string, userId?: string, userName?: string) => {
  try {
    const order = await db.findById("orders", orderId);
    if (!order) return;
    
    // Prevent double deduction
    if (order.inventoryDeducted) return;

    const locationId = order.locationId?.toString();
    const inventory = await db.find("inventory", { locationId });
    const menuItems = await db.getCollection("menuItems");

    if (!order.items || order.items.length === 0) return;

    for (const item of order.items) {
      const menuItemId = item.menuItem?.toString();
      const menuItem = menuItems.find((m: any) => 
        m.id === menuItemId || 
        m._id?.toString() === menuItemId
      );

      if (menuItem) {
        // Deduct from Ingredients if applicable
        if (menuItem.ingredients && menuItem.ingredients.length > 0) {
          for (const ingredient of menuItem.ingredients) {
            const invId = ingredient.inventoryId?.toString();
            const inventoryItem = inventory.find((i: any) => 
              (invId && (i.id === invId || i._id?.toString() === invId)) ||
              (i.name.toLowerCase() === ingredient.name.toLowerCase())
            );

            if (inventoryItem) {
              const amount = Number(ingredient.quantity) * (Number(item.quantity) || 1);
              const previousQuantity = Number(inventoryItem.quantity) || 0;
              const newQuantity = Math.max(0, previousQuantity - amount);
              
              let newStatus = "In Stock";
              if (newQuantity <= 0) newStatus = "Out of Stock";
              else if (newQuantity <= (inventoryItem.threshold || 0)) newStatus = "Low Stock";
              
              await db.update("inventory", inventoryItem.id, { 
                quantity: newQuantity,
                status: newStatus
              });

              // Notify if stock is low
              if (newStatus === "Low Stock" || newStatus === "Out of Stock") {
                await createNotification({
                  title: newStatus === "Low Stock" ? "Low Stock Alert" : "Out of Stock Alert",
                  message: `${inventoryItem.name} is ${newStatus.toLowerCase()} (${newQuantity} ${inventoryItem.unit || 'units'}).`,
                  type: newStatus === "Low Stock" ? "warning" : "error",
                  category: "inventory",
                  link: "/admin/inventory",
                  locationId
                });
              }

              // Log the deduction
              await db.insert("inventoryLogs", {
                inventoryId: inventoryItem.id,
                itemName: inventoryItem.name,
                amount: -amount,
                previousQuantity,
                newQuantity,
                type: 'out',
                reason: `Order #${order.orderNumber || order.id}`,
                locationId: order.locationId,
                orderId: order.id,
                userId: userId,
                userName: userName || "System",
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }
    }

    // Mark as deducted
    await db.update("orders", orderId, { inventoryDeducted: true });
    
  } catch (error) {
    console.error("Inventory deduction error:", error);
  }
};
