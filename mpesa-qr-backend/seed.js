import { db, admin } from './src/config/firebase.js';

const targetUID = "QuH2tp7vT8Nvf9uFnjMzTZ9zPAE2";
const name = "BACSI";

const generateBulkData = () => {
  const transactions = [];
  const now = new Date();

  // Generate 20 transactions over the last 5 days
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 5);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const statusOptions = ['success', 'success', 'success', 'failed', 'cancelled', 'pending'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const amount = Math.floor(Math.random() * 4500) + 50;

    transactions.push({
      merchantId: targetUID,
      phoneNumber: "254708374149",
      amount: amount,
      status: status,
      description: "QR Payment",
      transactionRef: `Tx_${Date.now()}_${i}`,
      createdAt: admin.firestore.Timestamp.fromDate(date),
      updatedAt: admin.firestore.Timestamp.fromDate(date),
      mpesaResponse: {
        ResponseCode: status === 'success' ? "0" : "1",
        ResponseDescription: status === 'success' ? "Success" : "Insufficient Funds",
        MerchantRequestID: `MID_${Math.random().toString(36).substr(2, 7)}`,
        CheckoutRequestID: `CHk_${Math.random().toString(36).substr(2, 7)}`,
        CustomerMessage: "Success. Request accepted for processing"
      },
      // Only add paymentDetails for successful transactions per your schema
      ...(status === 'success' && {
        paymentDetails: {
          amount: amount,
          mpesaReceiptNumber: `R${Math.random().toString(36).toUpperCase().substr(2, 8)}`,
          transactionDate: date.toISOString(),
          phoneNumber: "254708374149"
        }
      }),
      // Add guest info to some to test your guest/direct filters
      guestMerchantInfo: {
        originalMerchantId: targetUID,
        isGuest: i % 4 === 0 // Every 4th transaction is a 'guest' one
      }
    });
  }
  return transactions;
};

async function seed() {
  try {
    const data = generateBulkData();
    const batch = db.batch();

    data.forEach(tx => {
      const docRef = db.collection('transactions').doc();
      batch.set(docRef, tx);
    });

    await batch.commit();
    console.log(`✅ Successfully seeded 20 transactions for ${name}`);
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    process.exit();
  }
}

seed();