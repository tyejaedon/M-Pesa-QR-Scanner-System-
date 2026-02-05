import { db } from './firebase.js'; // Your portable config

async function seedDatabase() {
  console.log("🌱 Seeding database...");
  try {
    // Create a dummy merchant
    await db.collection('merchants').doc('system_init').set({
      name: "System Initialize",
      status: "active",
      createdAt: new Date()
    });

    // Create a dummy transaction
    await db.collection('transactions').doc('init_tx').set({
      amount: 0,
      status: "system",
      merchantId: "system_init",
      createdAt: new Date()
    });

    console.log("✅ Collections initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();