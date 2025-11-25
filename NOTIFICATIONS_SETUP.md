# Flux Wallet Notifications Setup Guide

## Current Status ✅

The notification system is **FULLY IMPLEMENTED** with:
- ✅ Express Server running on port 3001 with Firebase Admin SDK
- ✅ Notification API endpoints ready to send notifications
- ✅ Checkout integration to trigger notifications on orders
- ✅ Database collection (`fcmTokens`) ready to store device tokens
- ✅ Admin user role support for targeting notifications

## Architecture

### Frontend (Client)
- **Firebase Cloud Messaging (FCM)** for receiving push notifications
- Service Worker for background notifications
- FCM token generation (when Firebase setup is complete)
- Notification permission handling

### Backend (Express Server)
- **Firebase Admin SDK** for sending notifications
- REST API endpoints:
  - `POST /api/notifications/send-to-admins` - Send to all admins
  - `POST /api/notifications/send` - Send to specific users
- Firebase Firestore integration for fetching user FCM tokens

## How Notifications Work

### 1. Frontend Setup
```
App Start
  ↓
Initialize Firebase Messaging
  ↓
Register Service Worker
  ↓
Request Notification Permission
  ↓
Generate FCM Token
  ↓
Save Token to Firestore (fcmTokens collection)
```

### 2. Order Placement
```
User places order at checkout
  ↓
Order saved to Firestore
  ↓
POST /api/notifications/send-to-admins
  ↓
Express fetches all admin FCM tokens
  ↓
Send notifications via Firebase Cloud Messaging
  ↓
Admins receive push notification
```

### 3. Notification Delivery
```
Backend (Express)
  ↓
Firebase Cloud Messaging
  ↓
Service Worker (Background)
  ↓
Browser Notification
```

## Completing the Setup

### Issue: FCM Token Generation Fails

**Error:** `"Request is missing required authentication credential"`

**Root Cause:** Firebase Cloud Messaging requires proper configuration in Firebase Console.

**Fix Steps:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `myapp-d9024`
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Under **Web Configuration**, ensure:
   - ✅ Web API Key is generated
   - ✅ VAPID Key is generated and saved (already done)
   - ✅ Application is registered in Firebase Authentication

5. In **Authentication** settings:
   - Enable Email/Password (already done)
   - Under **Settings** → **Authorized domains**, add your domain:
     - Add: `localhost:5000`
     - Add: Your production domain (e.g., `mahrous-acr.github.io`)

6. Optional: Generate new Web Push Certificate if needed:
   - Go to **Cloud Messaging** tab
   - Click "Generate Key Pair" if not already done
   - Update `VITE_FIREBASE_VAPID_KEY` env var with the key

## Testing Notifications

### Method 1: Direct API Test
```bash
# Send test notification to all admins
curl -X POST http://localhost:3001/api/notifications/send-to-admins \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test notification"}'
```

### Method 2: Place an Order
1. Login to app
2. Add products to cart
3. Go to checkout
4. Complete payment
5. Notification automatically sent to all admin users

### Method 3: Manual Notification Page
Create a notification testing interface (HTML page) to manually trigger notifications without placing orders.

## Database Collections

### `fcmTokens` Collection
Stores device tokens for push notifications:
```
{
  userId: "user123",
  token: "c9cq20bzASwvygFRtrMa...",
  createdAt: 2025-11-25T19:56:45Z,
  device: "web",
  userEmail: "user@example.com"
}
```

### `users` Collection
Extended with notification preferences:
```
{
  role: "admin",
  notificationsEnabled: true,
  ...
}
```

## Notification Endpoints

### Send to All Admins
```
POST /api/notifications/send-to-admins
Content-Type: application/json

{
  "title": "New Order",
  "body": "Order #123 placed for 250 EGP",
  "icon": "/storeshope/favicon.png"
}

Response:
{
  "success": true,
  "sent": 2,
  "failed": 0
}
```

### Send to Specific Users
```
POST /api/notifications/send
Content-Type: application/json

{
  "userIds": ["user1", "user2"],
  "title": "Order Status Update",
  "body": "Your order is being prepared",
  "icon": "/storeshope/favicon.png"
}

Response:
{
  "success": true,
  "sent": 2,
  "failed": 0
}
```

## Integration Points

### 1. Checkout Page
File: `client/src/pages/checkout.tsx`
- Lines 225-228: Send admin notification on order
- Function: `sendNotificationToAdmins()`
- Triggers: When order is successfully saved

### 2. Order Details Page
File: `client/src/pages/order-details.tsx`
- Can be extended to send customer notifications on status updates

### 3. Notification API Client
File: `client/src/lib/notificationAPI.ts`
- `sendNotification()` - Send to specific users
- `sendNotificationToAdmins()` - Send to all admins

## Environment Variables

```
VITE_FIREBASE_API_KEY=AIzaSyApvE5ujAeaVkZ2iRAiLXtiu56t7-ighoI
VITE_FIREBASE_PROJECT_ID=myapp-d9024
VITE_FIREBASE_APP_ID=1:985459317658:web:bee1f2fd2e4c16df74f823
VITE_FIREBASE_MESSAGING_SENDER_ID=985459317658
VITE_FIREBASE_VAPID_KEY=<Your VAPID Key Here>
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@myapp-d9024.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<Your Firebase Private Key>
FIREBASE_PROJECT_ID=myapp-d9024
```

## Server Configuration

The Express server runs on port **3001** with:
- ✅ Firebase Admin SDK initialized
- ✅ CORS enabled for cross-origin requests
- ✅ JSON body parsing
- ✅ Notification routes configured

Run manually:
```bash
node --import tsx server/index.ts
```

## Next Steps

1. **Configure Authorized Domains** in Firebase Console
   - Add localhost and production domains
   - This resolves the "missing authentication credential" error

2. **Test FCM Token Generation**
   - Refresh the app after adding authorized domain
   - Check browser console for token generation success

3. **Test Full Flow**
   - Log in with test account
   - Place test order
   - Check if admin receives notification

4. **Deployment**
   - Export/backup FCM tokens
   - Test on production domain (GitHub Pages)
   - Verify notifications still work

## Troubleshooting

### "Request is missing required authentication credential"
- **Solution:** Add your domain to Authorized Domains in Firebase Authentication

### "No FCM tokens found for users"
- **Solution:** Ensure users have generated tokens (app must run after FCM is properly configured)
- **Alternative:** Check `fcmTokens` collection in Firestore to see if tokens were saved

### "Messaging not initialized"
- **Solution:** Ensure Firebase config has `messagingSenderId`
- Check browser console for Firebase initialization errors

### Service Worker not registering
- **Solution:** Ensure `firebase-messaging-sw.js` exists in public folder
- Check browser DevTools → Service Workers

## Testing Checklist

- [ ] VAPID Key saved to environment variables
- [ ] Authorized Domains added in Firebase Console
- [ ] Express server running on port 3001
- [ ] FCM token generation works in browser console
- [ ] `fcmTokens` collection has user tokens
- [ ] Admin user has "admin" role in users collection
- [ ] Test notification sends successfully via API
- [ ] Order placement triggers admin notification
- [ ] Production domain added to Authorized Domains
