import mongoose from "mongoose";
import { MONGODB_URI } from "./config";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  addressUrl: String,
  phone: String,
  hours: String,
  image: String,
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
}, { timestamps: true });

// Define Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "manager", "cashier", "barista", "customer"], default: "customer" },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  image: String,
  phone: String,
  bio: String,
  status: { type: String, enum: ["Active", "On Break", "Inactive"], default: "Active" },
  hourlyRate: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  schedule: [{
    day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
    startTime: String,
    endTime: String,
    enabled: { type: Boolean, default: false }
  }],
  permissions: {
    manageOrders: { type: Boolean },
    manageInventory: { type: Boolean },
    manageEmployees: { type: Boolean },
    viewReports: { type: Boolean },
    manageMenu: { type: Boolean },
    manageTables: { type: Boolean },
    manageSupport: { type: Boolean },
  },
  locationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  points: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: Date,
  membershipLevel: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum"], default: "Bronze" },
  notificationPreferences: {
    orderAlerts: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    staffMessages: { type: Boolean, default: false },
    dailyReports: { type: Boolean, default: true },
  },
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: String,
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" }, // Optional: if menu items are location-specific
  status: { type: String, enum: ["Active", "Sold Out"], default: "Active" },
  variants: [{ name: String, price: Number }],
  modifiers: [{ name: String, price: Number }],
  ingredients: [{ 
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
    name: String, 
    quantity: Number 
  }],
  isPromotion: { type: Boolean, default: false },
  promotionPrice: Number,
  promotionLabel: String,
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  customerName: String,
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: String,
    quantity: Number,
    price: Number,
    category: String,
    image: String,
    selectedVariant: { name: String, price: Number },
    selectedModifiers: [{ name: String, price: Number }],
    customizations: Map,
  }],
  subtotal: Number,
  tax: Number,
  discount: { type: Number, default: 0 },
  promoCode: String,
  total: Number,
  status: { type: String, enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"], default: "Pending" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed", "Refunded"], default: "Pending" },
  paymentMethod: { type: String, enum: ["Cash", "Card", "KHQR", "Gift Card"], default: "Cash" },
  type: { type: String, enum: ["Dine-in", "Takeaway"], default: "Dine-in" },
  table: String,
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  baristaId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  inventoryDeducted: { type: Boolean, default: false },
}, { timestamps: true });

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  threshold: { type: Number, default: 10 },
  maxQuantity: { type: Number, default: 100 },
  sku: String,
  status: { type: String, enum: ["In Stock", "Low Stock", "Out of Stock"], default: "In Stock" },
  category: String,
  lastRestocked: Date,
  supplier: String,
}, { timestamps: true });

const inventoryLogSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
  itemName: String,
  amount: Number,
  previousQuantity: Number,
  newQuantity: Number,
  type: { type: String, enum: ["in", "out"] },
  reason: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: String,
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  locationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
  points: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastVisit: Date,
  membershipLevel: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum"], default: "Bronze" },
}, { timestamps: true });

const tableSchema = new mongoose.Schema({
  number: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  capacity: { type: Number, required: true },
  status: { type: String, enum: ["Available", "Occupied", "Reserved", "Cleaning"], default: "Available" },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
}, { timestamps: true });

// Ensure table numbers are unique within a location
tableSchema.index({ number: 1, locationId: 1 }, { unique: true });

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  rewardName: { type: String, required: true },
  cost: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Claimed", "Cancelled"], default: "Pending" },
  redeemedAt: { type: Date, default: Date.now },
  claimedAt: Date,
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["info", "success", "warning", "error"], default: "info" },
  category: { type: String, enum: ["order", "inventory", "message", "report", "system"], default: "system" },
  read: { type: Boolean, default: false },
  link: String,
}, { timestamps: true });

const giftCardSchema = new mongoose.Schema({
  cardNumber: { type: String, required: true, unique: true },
  pin: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ["Active", "Inactive", "Expired"], default: "Active" },
  expiryDate: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional: link to a user
}, { timestamps: true });

const supportRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: "order" },
  status: { type: String, enum: ["Open", "Pending", "Resolved", "Closed"], default: "Open" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  orderNumber: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  status: { type: String, enum: ["New", "Reviewed", "Archived"], default: "New" },
}, { timestamps: true });

const stockTransferSchema = new mongoose.Schema({
  fromLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
  toLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
    name: String,
    quantity: { type: Number, required: true },
    unit: String,
  }],
  status: { type: String, enum: ["Requested", "Pending", "In Transit", "Completed", "Cancelled"], default: "Requested" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shippedAt: Date,
  receivedAt: Date,
  reason: String,
  notes: String,
}, { timestamps: true });

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["percentage", "fixed", "bogo"], required: true },
  value: { type: Number, default: 0 },
  targetType: { type: String, enum: ["category", "item", "all"], required: true },
  targetIds: [String],
  daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
  startTime: String, // "HH:mm" format
  endTime: String, // "HH:mm" format
  isActive: { type: Boolean, default: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: String,
  type: { type: String, enum: ["percentage", "fixed", "bogo", "first_order"], required: true },
  value: { type: Number, default: 0 }, // percentage or fixed amount
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number,
  startDate: Date,
  endDate: Date,
  active: { type: Boolean, default: true },
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
}, { timestamps: true });

// Export Models
export const Location = mongoose.model("Location", locationSchema);
export const User = mongoose.model("User", userSchema);
export const Category = mongoose.model("Category", categorySchema);
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export const Order = mongoose.model("Order", orderSchema);
export const Inventory = mongoose.model("Inventory", inventorySchema);
export const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);
export const Customer = mongoose.model("Customer", customerSchema);
export const Table = mongoose.model("Table", tableSchema);
export const Settings = mongoose.model("Settings", settingsSchema);
export const Redemption = mongoose.model("Redemption", redemptionSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const GiftCard = mongoose.model("GiftCard", giftCardSchema);
export const SupportRequest = mongoose.model("SupportRequest", supportRequestSchema);
export const Feedback = mongoose.model("Feedback", feedbackSchema);
export const StockTransfer = mongoose.model("StockTransfer", stockTransferSchema);
export const Promotion = mongoose.model("Promotion", promotionSchema);
export const Coupon = mongoose.model("Coupon", couponSchema);

// Legacy Database class wrapper for compatibility
class Database {
  async getCollection(name: string): Promise<any[]> {
    const model = this.getModel(name);
    const items = await model.find().lean();
    return items.map((item: any) => ({ ...item, id: item._id.toString() }));
  }

  async setCollection(name: string, collection: any[]) {
    // Not recommended for Mongoose, but for compatibility:
    const model = this.getModel(name);
    await model.deleteMany({});
    await model.insertMany(collection);
  }

  async find(name: string, query: any): Promise<any[]> {
    const model = this.getModel(name);
    const items = await model.find(query).lean();
    return items.map((item: any) => ({ ...item, id: item._id.toString() }));
  }

  async findOne(name: string, query: any): Promise<any> {
    const model = this.getModel(name);
    const item = await model.findOne(query).lean();
    if (!item) return null;
    return { ...item, id: item._id.toString() };
  }

  async findById(name: string, id: any): Promise<any> {
    const model = this.getModel(name);
    const searchId = mongoose.Types.ObjectId.isValid(id) ? id : null;
    if (!searchId) return null;
    const item = await model.findById(searchId).lean();
    if (!item) return null;
    return { ...item, id: item._id.toString() };
  }

  async insert(name: string, item: any): Promise<any> {
    const model = this.getModel(name);
    const newItem = new model(item);
    await newItem.save();
    const result = newItem.toObject();
    return { ...result, id: result._id.toString() };
  }

  async update(name: string, id: any, update: any): Promise<any> {
    const model = this.getModel(name);
    const searchId = mongoose.Types.ObjectId.isValid(id) ? id : null;
    if (!searchId) return null;
    const item = await model.findByIdAndUpdate(searchId, update, { new: true }).lean();
    if (!item) return null;
    return { ...item, id: item._id.toString() };
  }

  async delete(name: string, id: any): Promise<boolean> {
    const model = this.getModel(name);
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await model.findByIdAndDelete(id);
    return !!result;
  }

  private getModel(name: string): mongoose.Model<any> {
    switch (name) {
      case "locations": return Location;
      case "users": return User;
      case "categories": return Category;
      case "menuItems": return MenuItem;
      case "orders": return Order;
      case "inventory": return Inventory;
      case "inventoryLogs": return InventoryLog;
      case "customers": return Customer;
      case "tables": return Table;
      case "settings": return Settings;
      case "redemptions": return Redemption;
      case "notifications": return Notification;
      case "giftCards": return GiftCard;
      case "supportRequests": return SupportRequest;
      case "feedback": return Feedback;
      case "stockTransfers": return StockTransfer;
      case "promotions": return Promotion;
      case "coupons": return Coupon;
      default: throw new Error(`Unknown collection: ${name}`);
    }
  }
}

export const db = new Database();
