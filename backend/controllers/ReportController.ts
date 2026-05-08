import { Request, Response } from "express";
import { db, Order, Feedback, SupportRequest, Notification, InventoryLog, Redemption, StockTransfer, User, Customer } from "../db";

const filterOrders = (orders: any[], query: any) => {
  const { locationId, timeRange, startDate, endDate } = query;
  
  let filtered = locationId 
    ? orders.filter((o: any) => o.locationId?.toString() === locationId.toString())
    : orders;

  const now = new Date();
  if (timeRange === 'thisMonth') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = filtered.filter((o: any) => new Date(o.createdAt) >= startOfMonth);
  } else if (timeRange === 'lastMonth') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    filtered = filtered.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    });
  } else if (timeRange === 'custom' && startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });
  } else if (timeRange === 'last7Days' || !timeRange) {
    const last7DaysDate = new Date();
    last7DaysDate.setDate(now.getDate() - 7);
    filtered = filtered.filter((o: any) => new Date(o.createdAt) >= last7DaysDate);
  }

  return filtered;
};

export const clearAllData = async (req: Request, res: Response) => {
  try {
    console.log("CLEAR DATA: starting transactional data wipe...");
    
    // 1. Delete all transactional collections
    const deleteResults = await Promise.all([
      Order.deleteMany({}),
      Feedback.deleteMany({}),
      SupportRequest.deleteMany({}),
      Notification.deleteMany({}),
      InventoryLog.deleteMany({}),
      Redemption.deleteMany({}),
      StockTransfer.deleteMany({})
    ]);

    console.log("CLEAR DATA: transactional collections deleted", {
      orders: deleteResults[0].deletedCount,
      feedback: deleteResults[1].deletedCount,
      support: deleteResults[2].deletedCount,
      notifications: deleteResults[3].deletedCount,
      inventoryLogs: deleteResults[4].deletedCount,
      redemptions: deleteResults[5].deletedCount,
      stockTransfers: deleteResults[6].deletedCount
    });

    // 2. Reset customer and user stats
    const userReset = await User.updateMany({}, { 
      $set: { 
        points: 0, 
        totalSpent: 0,
        lastVisit: null 
      } 
    });
    const customerReset = await Customer.updateMany({}, { 
      $set: { 
        points: 0, 
        totalSpent: 0,
        lastVisit: null 
      } 
    });

    console.log("CLEAR DATA: user and customer stats reset", {
      usersUpdated: userReset.modifiedCount,
      customersUpdated: customerReset.modifiedCount
    });

    res.json({ 
      message: "All transactional data cleared and statistics reset successfully",
      summary: {
        ordersCleared: deleteResults[0].deletedCount,
        usersReset: userReset.modifiedCount
      }
    });
  } catch (error: any) {
    console.error("Clear Data Error:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    let orders = await db.getCollection("orders");
    
    // Filter out demo/seeded data if requested (default to real data only)
    const showDemo = req.query.showDemo === 'true';
    if (!showDemo) {
      orders = orders.filter((o: any) => o.isDemo !== true);
    }

    const { timeRange, startDate: startQuery, endDate: endQuery, locationId } = req.query;

    // Helper to get total of completed orders for a range
    const getStatsInRange = (rangeOrders: any[]) => {
      const completed = rangeOrders.filter((o: any) => o.status === "Completed");
      const revenue = completed.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      return {
        revenue,
        orders: completed.length,
        avgValue: completed.length > 0 ? revenue / completed.length : 0
      };
    };

    const filteredOrders = filterOrders(orders, req.query);
    const currentStats = getStatsInRange(filteredOrders);

    // Calculate Previous Period for Comparison
    let prevPeriodOrders: any[] = [];
    const now = new Date();
    
    if (timeRange === 'thisMonth') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      prevPeriodOrders = orders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    } else if (timeRange === 'lastMonth') {
      const startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const endOfPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      prevPeriodOrders = orders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d >= startOfPeriod && d <= endOfPeriod;
      });
    } else if (timeRange === 'last7Days' || !timeRange) {
      const startOfPrev7 = new Date();
      startOfPrev7.setDate(now.getDate() - 14);
      const endOfPrev7 = new Date();
      endOfPrev7.setDate(now.getDate() - 7);
      prevPeriodOrders = orders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d >= startOfPrev7 && d <= endOfPrev7;
      });
    } else if (timeRange === 'custom' && startQuery && endQuery) {
      const start = new Date(startQuery as string);
      const end = new Date(endQuery as string);
      const diff = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - diff - 1);
      const prevEnd = new Date(start.getTime() - 1);
      prevPeriodOrders = orders.filter((o: any) => {
        const d = new Date(o.createdAt);
        return d >= prevStart && d <= prevEnd;
      });
    }

    if (locationId) {
      prevPeriodOrders = prevPeriodOrders.filter((o: any) => o.locationId?.toString() === locationId.toString());
    }
    const prevStats = getStatsInRange(prevPeriodOrders);

    // Group by day based on time range
    const toYYYYMMDD = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    
    let trendDays = 7;
    let startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 6);

    if (timeRange === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startDateObj = startOfMonth;
      trendDays = now.getDate();
    } else if (timeRange === 'lastMonth') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      startDateObj = startOfLastMonth;
      trendDays = endOfLastMonth.getDate();
    } else if (timeRange === 'custom' && startQuery && endQuery) {
      const start = new Date(startQuery as string);
      const end = new Date(endQuery as string);
      startDateObj = start;
      trendDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const completedOrdersCurrent = filteredOrders.filter((o: any) => o.status === "Completed");
    const activeOrders = filteredOrders.filter((o: any) => o.status !== "Completed" && o.status !== "Cancelled");

    const revenueTrends = [...Array(trendDays)].map((_, i) => {
      const d = new Date(startDateObj);
      d.setDate(d.getDate() + i);
      const dateStr = toYYYYMMDD(d);
      
      const dayOrders = completedOrdersCurrent.filter((o: any) => {
        try {
          const orderDate = toYYYYMMDD(new Date(o.createdAt));
          return orderDate === dateStr;
        } catch (e) {
          return false;
        }
      });
      
      const revenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      return { 
        name: trendDays > 14 
          ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), 
        current: Math.round(revenue * 100) / 100, 
      };
    });

    // Category Sales
    const categoryCounts: { [key: string]: number } = {};
    let totalItems = 0;
    
    // Create a map for faster lookup if needed, but we'll try to use order items first
    completedOrdersCurrent.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          let cat = item.category;
          
          // If category is missing, we could try to look it up from MenuItem if needed
          // but for now let's just use the default "Other" or try to find it in the name
          if (!cat) {
            const itemName = (item.name || "").toLowerCase();
            if (itemName.includes('coffee') || itemName.includes('latte') || itemName.includes('espresso')) cat = "Coffee";
            else if (itemName.includes('tea') || itemName.includes('matcha')) cat = "Tea";
            else if (itemName.includes('smoothie')) cat = "Smoothie";
            else if (itemName.includes('croissant') || itemName.includes('muffin') || itemName.includes('cake')) cat = "Bakery";
            else if (itemName.includes('sandwich') || itemName.includes('bagel') || itemName.includes('quiche') || itemName.includes('eggs')) cat = "Savory";
            else cat = "Other";
          }
          
          const qty = item.quantity || 1;
          categoryCounts[cat] = (categoryCounts[cat] || 0) + qty;
          totalItems += qty;
        });
      }
    });
    
    const colors = ['#C47C2B', '#E8A84C', '#F5E6C8', '#7A5C3A', '#9E7A55', '#B8A090'];
    const categoryData = totalItems > 0 
      ? Object.entries(categoryCounts).map(([name, count], index) => ({
          name,
          value: Math.round((count / totalItems) * 100),
          color: colors[index % colors.length]
        }))
      : [];

    // Peak Hours
    const peakHours = [...Array(15)].map((_, i) => {
      const hour = i + 8;
      const hourOrders = completedOrdersCurrent.filter((o: any) => {
        if (!o.createdAt) return false;
        try {
          const date = new Date(o.createdAt);
          const h = date.getHours(); // Local hour
          return h === hour;
        } catch (e) {
          return false;
        }
      });
      
      const percentage = currentStats.orders > 0 ? Math.round((hourOrders.length / currentStats.orders) * 100) : 0;
      return {
        hour: hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`,
        value: percentage,
        count: hourOrders.length
      };
    });

    res.json({
      totalRevenue: currentStats.revenue,
      totalOrders: currentStats.orders,
      avgOrderValue: currentStats.avgValue,
      netProfit: currentStats.revenue * 0.35,
      activeOrders: activeOrders.length,
      revenueTrends: revenueTrends,
      categorySales: categoryData,
      peakHours: peakHours,
      previous: {
        totalRevenue: prevStats.revenue,
        totalOrders: prevStats.orders,
        avgOrderValue: prevStats.avgValue,
      }
    });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getPopularItems = async (req: Request, res: Response) => {
  try {
    let orders = await db.getCollection("orders");
    
    // Filter out demo/seeded data
    const showDemo = req.query.showDemo === 'true';
    if (!showDemo) {
      orders = orders.filter((o: any) => o.isDemo !== true);
    }

    const filteredOrders = filterOrders(orders, req.query);
    const completedOrders = filteredOrders.filter((o: any) => o.status === "Completed");
    
    const itemCounts: { [key: string]: { name: string, sold: number, revenue: number, image: string } } = {};
    
    completedOrders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemId = item.menuItem?.toString() || item.id?.toString() || item.name;
          if (!itemCounts[itemId]) {
            itemCounts[itemId] = { name: item.name, sold: 0, revenue: 0, image: item.image || "https://picsum.photos/seed/coffee/100/100" };
          }
          itemCounts[itemId].sold += item.quantity || 1;
          itemCounts[itemId].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });
    
    const popularItems = Object.values(itemCounts).sort((a, b) => b.sold - a.sold).slice(0, 5);
    res.json(popularItems);
  } catch (error: any) {
    console.error("Popular Items Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getInventoryUsage = async (req: Request, res: Response) => {
  try {
    const inventory = await db.getCollection("inventory");
    const usage = inventory.map((item: any) => ({
      name: item.name,
      usage: Math.floor(Math.random() * 50) + 10, // Mock usage for now
      remaining: item.quantity,
    }));
    res.json(usage);
  } catch (error: any) {
    console.error("Inventory Usage Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getStaffPerformance = async (req: Request, res: Response) => {
  try {
    let orders = await db.getCollection("orders");
    
    // Filter out demo/seeded data
    const showDemo = req.query.showDemo === 'true';
    if (!showDemo) {
      orders = orders.filter((o: any) => o.isDemo !== true);
    }

    const users = await db.getCollection("users");
    const filteredOrders = filterOrders(orders, req.query);
    const completedOrders = filteredOrders.filter((o: any) => o.status === "Completed");
    
    const staffStats: { [key: string]: { name: string, orders: number, revenue: number, image: string } } = {};
    
    completedOrders.forEach((order: any) => {
      try {
        const staffId = order.cashierId?.toString();
        if (!staffId) return;
        
        const staff = users.find((u: any) => u.id === staffId || u._id?.toString() === staffId);
        if (staff) {
          if (!staffStats[staffId]) {
            staffStats[staffId] = { name: staff.name, orders: 0, revenue: 0, image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staff.name || 'Staff')}` };
          }
          staffStats[staffId].orders += 1;
          staffStats[staffId].revenue += (order.total || 0);
        }
      } catch (err) {
        console.warn("Error processing staff performance for order:", order._id, err);
      }
    });
    
    res.json(Object.values(staffStats).sort((a, b) => b.revenue - a.revenue));
  } catch (error: any) {
    console.error("Staff Performance Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const seedSampleData = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    // This is a simplified version of seed.ts for quick data generation
    const allMenuItems = await db.getCollection("menuItems");
    const allUsers = await db.getCollection("users");
    const staff = allUsers.find((u: any) => u.role === "cashier");
    const customer = allUsers.find((u: any) => u.role === "customer");

    if (!allMenuItems.length) {
      return res.status(400).json({ error: "Please seed menu items first using the seed script." });
    }

    const statuses = ["Completed"];
    const paymentMethods = ["Cash", "Card", "KHQR"];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const orderDate = new Date();
      orderDate.setDate(now.getDate() - Math.floor(Math.random() * 7));
      orderDate.setHours(8 + Math.floor(Math.random() * 14));
      
      const orderItems = [];
      const numItems = Math.floor(Math.random() * 3) + 1;
      let total = 0;
      
      for (let j = 0; j < numItems; j++) {
        const item = allMenuItems[Math.floor(Math.random() * allMenuItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        orderItems.push({
          menuItem: item.id,
          name: item.name,
          price: item.price,
          quantity,
          category: item.category,
          image: item.image
        });
        total += item.price * quantity;
      }

      await db.insert("orders", {
        items: orderItems,
        total,
        subtotal: total,
        tax: total * 0.07,
        status: "Completed",
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        cashierId: staff?.id,
        customerId: customer?.id,
        locationId: locationId || undefined,
        createdAt: orderDate.toISOString(),
        orderNumber: `ORD-SEED-${Date.now()}-${i}`,
        type: "Dine-in",
        isDemo: true
      });
    }

    // Also ensure inventory is seeded if it's sparse
    const inventory = await db.getCollection("inventory");
    const locations = await db.getCollection("locations");
    
    // Essential items to ensure are present in every location
    const essentialItems = [
      { name: "Paper Cups", category: "Supplies", quantity: 500, unit: "pcs", threshold: 50, supplier: "CupWorld Inc.", status: "In Stock" },
      { name: "Espresso Beans", category: "Coffee", quantity: 10, unit: "kg", threshold: 2, supplier: "Artisan Roasters", status: "In Stock" },
      { name: "Fresh Milk", category: "Dairy", quantity: 20, unit: "L", threshold: 5, supplier: "Local Dairy Farm", status: "In Stock" },
      { name: "Caramel Syrup", category: "Syrups", quantity: 5, unit: "bottles", threshold: 1, supplier: "Monin", status: "In Stock" },
      { name: "Vanilla Syrup", category: "Syrups", quantity: 5, unit: "bottles", threshold: 1, supplier: "Monin", status: "In Stock" },
    ];

    for (const loc of locations) {
      for (const essential of essentialItems) {
        const key = loc.id || loc._id?.toString();
        const exists = inventory.find((i: any) => 
          i.name === essential.name && 
          (i.locationId === key)
        );

        if (!exists) {
          await db.insert("inventory", {
            ...essential,
            locationId: key
          });
        }
      }
    }

    res.json({ message: "Sample data seeded successfully" });
  } catch (error: any) {
    console.error("Seed Error:", error);
    res.status(500).json({ error: error.message });
  }
};
