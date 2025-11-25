import admin from "firebase-admin";
import { Router } from "express";

const router = Router();

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
}

// Send notification to specific users or all admins
export async function sendNotifications(
  userIds: string[],
  payload: NotificationPayload
) {
  try {
    const db = admin.firestore();
    const messaging = admin.messaging();

    // Get FCM tokens for users
    const tokensSnapshot = await db
      .collection("fcmTokens")
      .where("userId", "in", userIds.slice(0, 10))
      .get();

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      tokens.push(doc.data().token);
    });

    if (tokens.length === 0) {
      console.log("No FCM tokens found for users:", userIds);
      return { success: true, sent: 0, message: "No tokens found" };
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/storeshope/favicon.png",
          badge: payload.badge || "/storeshope/favicon.png",
        },
      },
    };

    const response = await messaging.sendMulticast({
      ...message,
      tokens,
    });

    console.log(`✅ Sent notifications to ${response.successCount} users`);
    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
    return { success: false, error: String(error) };
  }
}

// Get all admin users
async function getAdminUsers() {
  try {
    const db = admin.firestore();
    const adminSnapshot = await db
      .collection("users")
      .where("role", "==", "admin")
      .get();

    return adminSnapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

// Send manual notification
router.post("/send", async (req, res) => {
  try {
    const { userIds, title, body, icon, badge } = req.body;

    if (!title || !body || !userIds || userIds.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: title, body, userIds",
      });
    }

    const result = await sendNotifications(userIds, {
      title,
      body,
      icon,
      badge,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in /send:", error);
    res.status(500).json({ error: String(error) });
  }
});

// Send to all admins
router.post("/send-to-admins", async (req, res) => {
  try {
    const { title, body, icon, badge } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: "Missing required fields: title, body",
      });
    }

    const adminIds = await getAdminUsers();
    if (adminIds.length === 0) {
      return res.status(400).json({ error: "No admin users found" });
    }

    const result = await sendNotifications(adminIds, {
      title,
      body,
      icon,
      badge,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in /send-to-admins:", error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;
