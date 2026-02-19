
# M-Pesa QR Scanner & Merchant Dashboard

An end-to-end payment solution designed for the Kenyan market that bridges the gap between physical QR codes and M-Pesa STK Push technology. This application allows merchants to generate dynamic or static QR codes that customers can scan to trigger instant M-Pesa payment prompts on their mobile devices.

## 🚀 Application Overview

* **QR-Driven Payments**: Customers scan a merchant's QR code via the application, which automatically extracts merchant details and triggers an STK Push.
* **Dynamic Amount Support**: Supports both fixed-price QR codes and "Dynamic Amount" codes where the customer enters the value manually.
* **Merchant Analytics**: A comprehensive dashboard for merchants to track revenue trends, success rates, and transaction volume.
* **Resilient Architecture**: Implements a robust backend with fallback query logic to ensure the dashboard remains functional even during database index propagation.
* **Secure Transactions**: Leverages Firebase Authentication and Firestore Security Rules to ensure merchants only access their own financial data.

---

## 🛠 Technical Stack

* **Frontend**: React.js, Tailwind CSS, Recharts (Analytics), Lucide-React (Icons).
* **Backend**: Node.js, Express.js, Axios.
* **Database & Auth**: Firebase Firestore, Firebase Admin SDK.
* **Payment Gateway**: Safaricom Daraja API (M-Pesa Express/STK Push).
* **Tunneling**: Ngrok (for local development and M-Pesa callbacks).

---

## 📋 Setup Requirements

### 1. Environment Variables (`.env`)

You must configure the following keys in your backend directory to establish connectivity with M-Pesa and Firebase:

```env
# Server Config
PORT=5000
NODE_ENV=development
SERVER_URL=https://your-ngrok-url.ngrok-free.dev
FRONTEND_URL=http://10.200.223.10:3000

# M-Pesa Daraja Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_SHORTCODE=174379
MPESA_BASE_URL=https://sandbox.safaricom.co.ke

# Firebase Config
FIREBASE_PROJECT_ID=your-project-id
# (Service Account Key path should be correctly mapped in firebase.js)

```

### 2. Ngrok Configuration

To receive M-Pesa callbacks locally, run:

```bash
ngrok http 5000

```

**Important**: Update the `SERVER_URL` in your `.env` every time the ngrok URL changes.

---

## 🔧 Technical Documentation & Recommendations

### Architecture Recommendation: ID Uniformity

While the system currently uses `merchantId` for transactions and `uid` for profiles, it is recommended to eventually unify these identifiers to `uid` to simplify Firestore Security Rules and cross-collection joins.

### Database Indexing

The dashboard uses complex filtering (Period + Status). To avoid 400/500 errors during data fetching, ensure the following composite indexes are created in Firestore:

1. **Collection**: `transactions` | **Fields**: `merchantId` (Asc), `createdAt` (Desc).
2. **Collection**: `transactions` | **Fields**: `merchantId` (Asc), `status` (Asc), `createdAt` (Desc).

### Ngrok "Abuse Interstitial" Bypass

For automated API testing between the frontend and backend over ngrok, all axios requests must include the following header to avoid being blocked by the ngrok landing page:

```javascript
headers: { 'ngrok-skip-browser-warning': 'true' }

```

### Security Considerations

* **Admin SDK**: The backend utilizes the Firebase Admin SDK, which bypasses security rules. Ensure the server-side logic strictly validates the `req.user.uid` from the JWT token before returning data.
* **Phone Validation**: The system strictly enforces the `254XXXXXXXXX` format for M-Pesa compatibility.

