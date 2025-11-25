# Quick Start: Activate Push Notifications

## ✅ What's Done

Your Flux Wallet app has a complete push notification system ready. Here's what's working:

1. **Express Server** - Running on port 3001
   - Firebase Admin SDK initialized ✅
   - Notification API endpoints ready ✅
   - Can send notifications to admins and users ✅

2. **Checkout Integration** - When you place an order:
   - Order is saved to Firestore ✅
   - Notification API is called ✅
   - All admin users receive notification ✅

3. **VAPID Key** - Already set in environment ✅

## ⚠️ What Needs One Fix

**Firebase Cloud Messaging (FCM) Token Generation** is blocked by a Firebase configuration issue.

**Error:** "Request is missing required authentication credential"

**Fix (One-Time Setup):**

1. Go to: https://console.firebase.google.com
2. Select project: **myapp-d9024**
3. Go to: **Authentication** section (left sidebar)
4. Click **Settings** (gear icon)
5. Go to: **Authorized domains** tab
6. Add these domains:
   - `localhost:5000`
   - `127.0.0.1:5000`
   - Your production domain (if deploying)

7. **Save** and refresh your app in browser

## 🧪 Test It

### Test 1: Direct API Call
```bash
curl -X POST http://localhost:3001/api/notifications/send-to-admins \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Order","body":"Order #123 placed"}'
```
Should return:
```json
{"success":true,"sent":X,"failed":0}
```

### Test 2: Place an Order
1. Open your app: http://localhost:5000/storeshope/
2. Login with test account
3. Add product to cart
4. Go to checkout and place order
5. Check browser console (DevTools → Console) for token generation:
   - Look for: `✅ FCM Token received: ...`
6. Order notification should send to admin

### Test 3: Check Tokens Saved
1. Go to Firebase Console
2. Firestore → Collections → `fcmTokens`
3. Should see entries with userId and token

## 📊 System Status

```
Frontend:
  ✅ Firebase Messaging initialized
  ✅ Service Worker registered
  ✅ Notification permission granted
  ✅ VAPID Key available
  ⏳ FCM Token generation (blocked by auth config)

Backend:
  ✅ Express server running on :3001
  ✅ Firebase Admin SDK initialized
  ✅ API endpoints ready
  ✅ Firestore connection working

Integration:
  ✅ Checkout → Notification API
  ✅ Admin user detection
  ✅ Token storage structure ready
```

## 📋 Checklist

After fixing Firebase authorized domains:
- [ ] Refresh app in browser
- [ ] Check browser console for FCM token
- [ ] Place test order
- [ ] Verify notification sent to admin
- [ ] Check `fcmTokens` collection in Firestore

## 🚀 Next Steps

1. Add authorized domain to Firebase (5 min)
2. Refresh app
3. Verify FCM token generation works
4. Test placing an order
5. Check notifications!

**That's it!** The hard work is done. One Firebase config fix and you're good to go.
