export interface MenuItem {
  id: string;
  name: string;
  nameKm?: string;
  description: string;
  descriptionKm?: string;
  price: number;
  category: string;
  categoryId?: string;
  locationId?: string;
  image: string;
  status: 'Active' | 'Sold Out';
  modifiers?: Modifier[];
  variants?: MenuItemVariant[];
  isNew?: boolean;
  isSugarFree?: boolean;
  isGlutenFree?: boolean;
  isPromotion?: boolean;
  promotionPrice?: number;
  promotionLabel?: string;
  ingredients?: Ingredient[];
}

export interface Ingredient {
  inventoryId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  nameKm?: string;
  price: number;
}

export interface Modifier {
  id: string;
  name: string;
  nameKm?: string;
  price: number;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: MenuItemVariant;
  selectedModifiers: Modifier[];
  customizations?: Record<string, string>;
  name?: string;
  price?: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'On Break' | 'Inactive';
  image: string;
  hiredDate: string;
  email: string;
  phone: string;
  hourlyRate: number;
  totalHours: number;
  password?: string;
  createdAt?: string;
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }[];
  permissions?: {
    manageOrders: boolean;
    manageInventory: boolean;
    manageEmployees: boolean;
    viewReports: boolean;
    manageMenu: boolean;
    manageTables: boolean;
    manageSupport: boolean;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  maxQuantity: number;
  threshold: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  sku: string;
  supplier?: string;
}

export interface InventoryLog {
  id: string;
  inventoryId: string;
  itemName: string;
  amount: number;
  previousQuantity: number;
  newQuantity: number;
  type: 'in' | 'out';
  reason: string;
  orderId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerName: string;
  items: CartItem[];
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Overdue';
  timestamp: string;
  createdAt?: string;
  table?: string;
  type: 'Dine-in' | 'Takeaway';
  total: number;
  subtotal?: number;
  tax?: number;
  priority?: 'Normal' | 'High' | 'Urgent';
  paymentStatus?: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod?: 'Cash' | 'Card' | 'KHQR' | 'Gift Card';
  giftCardNumber?: string;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  currentOrderId?: string;
}

export interface StockTransfer {
  id: string;
  _id?: string;
  fromLocationId: string;
  toLocationId: string;
  fromLocation?: { name: string };
  toLocation?: { name: string };
  items: {
    itemId: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  status: 'Requested' | 'Pending' | 'In Transit' | 'Completed' | 'Cancelled';
  requestedBy: string;
  approvedBy?: string;
  shippedAt?: string;
  receivedAt?: string;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
