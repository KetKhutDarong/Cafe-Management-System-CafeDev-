import { db, connectDB, Table } from "./db";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log("Starting seeding...");

    // Clear existing data - REMOVED to prevent overwriting real data
    // Only wipe if explicitly requested via environment variable or flag (not implemented for safety)
    /*
    await db.setCollection("locations", []);
    await db.setCollection("users", []);
    await db.setCollection("categories", []);
    await db.setCollection("menuItems", []);
    await db.setCollection("orders", []);
    await db.setCollection("inventory", []);
    try {
      await Table.collection.dropIndexes();
    } catch (e) {
      // Ignore if collection doesn't exist or no indexes
    }
    await db.setCollection("tables", []);
    await db.setCollection("giftCards", []);
    */

    console.log("Checking for existing data...");
    const existingLocations = await db.getCollection("locations");
    if (existingLocations.length > 0) {
      console.log("Data already exists. Skipping bulk wipe.");
    }

    // Seed Locations
    const loc1 = await db.insert("locations", {
      name: "CafeDev Main",
      address: "123 Coffee St, Phnom Penh",
      phone: "012 345 678",
      hours: "7:00 AM - 9:00 PM",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
      status: "Active"
    });

    const loc2 = await db.insert("locations", {
      name: "CafeDev Riverside",
      address: "45 River Rd, Phnom Penh",
      phone: "012 987 654",
      hours: "8:00 AM - 10:00 PM",
      image: "https://images.unsplash.com/photo-1559925393-8be0ec41b50b?q=80&w=1000&auto=format&fit=crop",
      status: "Active"
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    // Seed Admin (Global)
    const admin = await db.insert("users", {
      name: "Admin User",
      email: "admin@cafe.com",
      password: hashedPassword,
      role: "admin",
      employeeId: "EMP001",
      status: "Active",
    });
    console.log("Admin user seeded");

    // Seed Staff for Loc 1
    await db.insert("users", {
      name: "Staff Main",
      email: "staff1@cafe.com",
      password: hashedPassword,
      role: "cashier",
      locationId: loc1.id,
      employeeId: "EMP002",
      status: "Active",
    });

    // Seed Staff for Loc 2
    await db.insert("users", {
      name: "Staff Riverside",
      email: "staff2@cafe.com",
      password: hashedPassword,
      role: "cashier",
      locationId: loc2.id,
      employeeId: "EMP003",
      status: "Active",
    });
    console.log("Staff users seeded");

    // Seed Customers (Linked to Main by default)
    await db.insert("users", {
      name: "John Customer",
      email: "customer@cafe.com",
      password: hashedPassword,
      role: "customer",
      locationId: loc1.id,
      status: "Active",
      points: 150,
      totalSpent: 45.50,
      lastVisit: new Date(),
      membershipLevel: "Bronze",
    });
    console.log("Customer users seeded");

    // Seed Categories
    const cat1 = await db.insert("categories", { name: "Coffee", icon: "Coffee" });
    const cat2 = await db.insert("categories", { name: "Tea", icon: "Leaf" });
    const cat3 = await db.insert("categories", { name: "Bakery", icon: "Croissant" });
    const cat4 = await db.insert("categories", { name: "Smoothie", icon: "IceCream" });
    const cat5 = await db.insert("categories", { name: "Savory", icon: "Utensils" });
    console.log("Categories seeded");

    // Seed Menu Items (Linked to locations)
    const menuItems = [
      // --- CAFEDEV MAIN (loc1) ---
      {
        name: "Espresso",
        description: "Pure, intense double shot of our signature house blend.",
        category: "Coffee",
        price: 2.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?q=80&w=1000&auto=format&fit=crop",
        variants: [{ name: "S", price: 2.5 }, { name: "M", price: 3.0 }],
        status: "Active"
      },
      {
        name: "Latte",
        description: "Rich espresso combined with silky steamed milk and light foam.",
        category: "Coffee",
        price: 3.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=1000",
        variants: [{ name: "S", price: 3.5 }, { name: "M", price: 4.0 }, { name: "L", price: 4.5 }],
        ingredients: [
          { name: "Espresso Beans", quantity: 0.018 },
          { name: "Fresh Milk", quantity: 0.25 },
          { name: "Paper Cups", quantity: 1 }
        ],
        status: "Active"
      },
      {
        name: "V60 Hand Pour",
        description: "Single-origin beans brewed precisely using the V60 method for clarity of flavor.",
        category: "Coffee",
        price: 5.0,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Dirty Coffee",
        description: "Cold milk topped with a hot, concentrated ristretto shot. Don't stir!",
        category: "Coffee",
        price: 4.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1628153488277-28153488277c?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Americano",
        description: "Our signature espresso diluted with hot water for a classic black coffee.",
        category: "Coffee",
        price: 2.75,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=1000",
        variants: [{ name: "S", price: 2.75 }, { name: "M", price: 3.25 }, { name: "L", price: 3.75 }],
        status: "Active"
      },
      {
        name: "Flat White",
        description: "Expertly pulled ristretto shots with smooth, micro-foam milk.",
        category: "Coffee",
        price: 3.75,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Cold Brew",
        description: "Slow-steeped for 18 hours for a remarkably smooth, low-acid taste.",
        category: "Coffee",
        price: 4.0,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Matcha Latte",
        description: "Ceremonial grade Japanese matcha whisked with creamy steamed milk.",
        category: "Tea",
        price: 4.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=1000&auto=format&fit=crop",
        variants: [{ name: "Hot", price: 4.5 }, { name: "Iced", price: 4.75 }],
        status: "Active"
      },
      {
        name: "Thai Milk Tea",
        description: "Authentic Thai tea leaves brewed and mixed with condensed milk.",
        category: "Tea",
        price: 3.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Hibiscus Iced Tea",
        description: "Caffeine-free floral tea with a tart berry-like flavor and natural sweetness.",
        category: "Tea",
        price: 3.75,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Berry Blast Smoothie",
        description: "Antioxidant-rich blend of fresh strawberries, blueberries, and Greek yogurt.",
        category: "Smoothie",
        price: 5.25,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Avocado Smoothie",
        description: "Creamy fresh avocado blended with milk and a touch of sweetness.",
        category: "Smoothie",
        price: 5.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Smoothie Bowl",
        description: "Acai base topped with house-made granola, banana, and chia seeds.",
        category: "Smoothie",
        price: 6.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Butter Croissant",
        description: "Authentic French recipe, flaky layers and rich buttery flavor.",
        category: "Bakery",
        price: 2.25,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Pain au Chocolat",
        description: "Classic puff pastry filled with two sticks of dark Belgian chocolate.",
        category: "Bakery",
        price: 2.75,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Red Velvet Muffin",
        description: "Royal red velvet sponge with a creamy vanilla core.",
        category: "Bakery",
        price: 3.25,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "NY Cheesecake",
        description: "Dense, rich, and creamy cheesecake on a buttery graham cracker crust.",
        category: "Bakery",
        price: 4.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Avocado Toast",
        description: "Sourdough bread topped with smashed avocado, radish, and red pepper flakes.",
        category: "Savory",
        price: 6.95,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1000&auto=format&fit=crop",
        status: "Active"
      },
      {
        name: "Smoked Salmon Bagel",
        description: "Toasted bagel with cream cheese, smoked salmon, capers, and dill.",
        category: "Savory",
        price: 8.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Honey Lavender Latte",
        description: "A calming blend of espresso, steamed milk, and sweet lavender honey.",
        category: "Coffee",
        price: 4.75,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=1000",
        status: "Active",
        stockQuantity: 5
      },
      {
        name: "Truffle Mushroom Omelette",
        description: "Fluffy three-egg omelette with sautéed mushrooms and truffle oil.",
        category: "Savory",
        price: 9.5,
        locationId: loc1.id,
        image: "https://images.unsplash.com/photo-1510629954389-c1e0da47d414?auto=format&fit=crop&q=80&w=1000",
        status: "Active",
        stockQuantity: 0
      },

      // --- CAFEDEV RIVERSIDE (loc2) ---
      {
        name: "Cappuccino",
        description: "Bold espresso topped with a thick, velvety layer of milk foam.",
        category: "Coffee",
        price: 3.5,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1000&auto=format&fit=crop",
        variants: [{ name: "S", price: 3.5 }, { name: "M", price: 4.0 }],
        ingredients: [
          { name: "Espresso Beans", quantity: 0.018 },
          { name: "Fresh Milk", quantity: 0.2 },
          { name: "Paper Cups", quantity: 1 }
        ],
        status: "Active"
      },
      {
        name: "Mocha",
        description: "A decadent mix of espresso, premium chocolate, and steamed milk.",
        category: "Coffee",
        price: 4.25,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1520666012321-df569064c06a?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Affogato",
        description: "A scoop of vanilla gelato 'drowned' with a hot shot of espresso.",
        category: "Coffee",
        price: 4.75,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Caramel Macchiato",
        description: "Freshly steamed milk with vanilla-flavored syrup, marked with espresso.",
        category: "Coffee",
        price: 4.5,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1485808191679-5f6333fef71f?auto=format&fit=crop&q=80&w=1000",
        ingredients: [
          { name: "Espresso Beans", quantity: 0.018 },
          { name: "Fresh Milk", quantity: 0.25 },
          { name: "Caramel Syrup", quantity: 0.02 },
          { name: "Paper Cups", quantity: 1 }
        ],
        status: "Active"
      },
      {
        name: "Earl Grey",
        description: "Floral and citrusy black tea infused with premium bergamot oil.",
        category: "Tea",
        price: 3.0,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Genmaicha",
        description: "Japanese brown rice green tea with a nutty, toasted aroma.",
        category: "Tea",
        price: 3.5,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1563911891537-5fd117f354f3?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Jasmine Green Tea",
        description: "Delicate green tea scented with fresh jasmine blossoms.",
        category: "Tea",
        price: 3.0,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Tropical Green Smoothie",
        description: "Refreshing blend of mango, pineapple, and organic baby spinach.",
        category: "Smoothie",
        price: 5.5,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1623065422902-30a2ad44924b?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Mango Passion",
        description: "Sun-ripened mangoes and zesty passion fruit for a tropical kick.",
        category: "Smoothie",
        price: 5.0,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1532301141941-bc8c199890f5?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Chocolate Muffin",
        description: "Moist chocolate muffin bursting with premium chocolate chips.",
        category: "Bakery",
        price: 2.75,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Lemon Tart",
        description: "Zesty lemon curd in a crisp shortcrust pastry shell.",
        category: "Bakery",
        price: 4.25,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Cinnamon Roll",
        description: "Soft dough swirled with cinnamon sugar and topped with cream cheese icing.",
        category: "Bakery",
        price: 3.0,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Almond Croissant",
        description: "Double-baked croissant with sweet almond cream and toasted flakes.",
        category: "Bakery",
        price: 3.5,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Fudge Brownie",
        description: "Intense dark chocolate brownie with a fudgy center and crackly top.",
        category: "Bakery",
        price: 3.0,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1564355808539-22fda35bcd3c?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Ham & Cheese Panini",
        description: "Toasted panini with premium ham, melted Gruyere, and honey mustard.",
        category: "Savory",
        price: 7.5,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1520174691701-bc555a3404ca?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Beef Pastrami Panini",
        description: "Sliced beef pastrami, melted swiss, and sauerkraut on toasted rye.",
        category: "Savory",
        price: 8.95,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      },
      {
        name: "Quiche Lorraine",
        description: "Classic French tart with a rich custard of eggs, cream, and smoked bacon.",
        category: "Savory",
        price: 6.25,
        locationId: loc2.id,
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000",
        status: "Active"
      }
    ];

    for (const item of menuItems) {
      await db.insert("menuItems", item);
    }
    console.log("Menu items seeded");

    // Seed Inventory for both locations
    const inventoryItems = [
      { name: "Paper Cups", category: "Supplies", quantity: 500, unit: "pcs", locationId: loc1.id, threshold: 50, supplier: "CupWorld Inc.", status: "In Stock" },
      { name: "Paper Cups", category: "Supplies", quantity: 300, unit: "pcs", locationId: loc2.id, threshold: 50, supplier: "CupWorld Inc.", status: "In Stock" },
      { name: "Espresso Beans", category: "Coffee", quantity: 10, unit: "kg", locationId: loc1.id, threshold: 2, supplier: "Artisan Roasters", status: "In Stock" },
      { name: "Espresso Beans", category: "Coffee", quantity: 8, unit: "kg", locationId: loc2.id, threshold: 2, supplier: "Artisan Roasters", status: "In Stock" },
      { name: "Fresh Milk", category: "Dairy", quantity: 20, unit: "L", locationId: loc1.id, threshold: 5, supplier: "Local Dairy Farm", status: "In Stock" },
      { name: "Fresh Milk", category: "Dairy", quantity: 15, unit: "L", locationId: loc2.id, threshold: 5, supplier: "Local Dairy Farm", status: "In Stock" },
      { name: "Caramel Syrup", category: "Syrups", quantity: 5, unit: "bottles", locationId: loc1.id, threshold: 1, supplier: "Monin", status: "In Stock" },
      { name: "Caramel Syrup", category: "Syrups", quantity: 5, unit: "bottles", locationId: loc2.id, threshold: 1, supplier: "Monin", status: "In Stock" },
      { name: "Vanilla Syrup", category: "Syrups", quantity: 5, unit: "bottles", locationId: loc1.id, threshold: 1, supplier: "Monin", status: "In Stock" },
      { name: "Vanilla Syrup", category: "Syrups", quantity: 5, unit: "bottles", locationId: loc2.id, threshold: 1, supplier: "Monin", status: "In Stock" },
    ];

    for (const inv of inventoryItems) {
      await db.insert("inventory", inv);
    }
    console.log("Inventory seeded");

    // Seed Tables for both locations
    const tables = [
      { number: "01", capacity: 2, status: "Available", locationId: loc1.id },
      { number: "02", capacity: 2, status: "Available", locationId: loc1.id },
      { number: "01", capacity: 4, status: "Available", locationId: loc2.id },
      { number: "02", capacity: 4, status: "Available", locationId: loc2.id },
    ];
    for (const table of tables) {
      await db.insert("tables", table);
    }
    console.log("Tables seeded");

    // Seed Orders for both locations
    const allMenuItems = await db.getCollection("menuItems");
    const allUsers = await db.getCollection("users");
    const customers = allUsers.filter((u: any) => u.role === "customer");

    for (let i = 0; i < 40; i++) {
      const locationId = i % 2 === 0 ? loc1.id : loc2.id;
      const locMenuItems = allMenuItems.filter((item: any) => item.locationId === locationId);
      if (locMenuItems.length === 0) continue;

      const item = locMenuItems[Math.floor(Math.random() * locMenuItems.length)];
      const total = item.price;

      await db.insert("orders", {
        orderNumber: `ORD-${1000 + i}`,
        locationId,
        customerId: customers[0]?.id,
        items: [{
          menuItem: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category
        }],
        total,
        subtotal: total,
        tax: total * 0.1,
        status: "Completed",
        paymentStatus: "Paid",
        paymentMethod: "Cash",
        type: "Dine-in",
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    console.log("Orders seeded");

    // Seed Gift Cards
    const giftCards = [
      { cardNumber: "1234-5678-9012-3456", pin: "1234", balance: 100.00, status: "Active" },
      { cardNumber: "1111-2222-3333-4444", pin: "0000", balance: 50.00, status: "Active" },
      { cardNumber: "9999-8888-7777-6666", pin: "9999", balance: 10.00, status: "Active" },
      { cardNumber: "0000-0000-0000-0000", pin: "0000", balance: 0.00, status: "Inactive" },
    ];
    for (const gc of giftCards) {
      await db.insert("giftCards", gc);
    }
    console.log("Gift cards seeded");

    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();
