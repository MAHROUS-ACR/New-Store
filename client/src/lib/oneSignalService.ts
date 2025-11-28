// Initialize OneSignal when available
let OneSignalInstance: any = null;

const getOneSignal = async (timeout = 3000) => {
  if (OneSignalInstance) return OneSignalInstance;

  const start = Date.now();
  while (!OneSignalInstance && Date.now() - start < timeout) {
    OneSignalInstance = (window as any).OneSignal;
    if (OneSignalInstance) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  return OneSignalInstance;
};

export const sendNotification = async (title: string, message: string, data?: any) => {
  try {
    const OneSignal = await getOneSignal();
    if (!OneSignal) return;

    await OneSignal.Notifications.sendNotification({
      title: title,
      body: message,
      ...(data && { data: data }),
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const requestPushPermission = async () => {
  try {
    const OneSignal = await getOneSignal(5000);
    if (!OneSignal) {
      console.warn("OneSignal not available");
      return;
    }

    console.log("📲 Requesting push notification permission...");
    await OneSignal.Notifications.requestPermission();
    console.log("📱 Permission popup shown");
  } catch (error) {
    console.error("Error requesting permission:", error);
  }
};

export const setUserId = async (userId: string) => {
  try {
    if (!userId) return;
    const OneSignal = await getOneSignal(5000);
    if (!OneSignal) {
      console.warn("OneSignal not available");
      return;
    }

    console.log("🔐 Logging in user to OneSignal:", userId);
    await OneSignal.login(userId);
    console.log("✅ User logged in successfully");
  } catch (error) {
    console.error("Error logging in user:", error);
  }
};

export const enableNotifications = async (userId: string) => {
  try {
    console.log("🔔 Starting notification setup...");
    
    // Request permission first (shows popup)
    await requestPushPermission();
    
    // Wait a moment for the popup to process
    await new Promise(r => setTimeout(r, 1000));
    
    // Then login the user
    await setUserId(userId);
    
    console.log("✅ Notification setup complete!");
    return true;
  } catch (error) {
    console.error("❌ Error in notification setup:", error);
    return false;
  }
};

// Setup subscription listener for when user subscribes via OneSignal permission popup
export const setupSubscriptionListener = async () => {
  try {
    const OneSignal = await getOneSignal(5000);
    if (!OneSignal) return;

    console.log("🎧 Setting up subscription listener...");
    // Listen for subscription changes
    OneSignal.User.PushSubscription.addEventListener("change", async (change: any) => {
      console.log("📢 Push subscription changed:", change);
      
      const isSubscribed = OneSignal.User.PushSubscription.isSubscribed;
      console.log("✅ Is subscribed now:", isSubscribed);

      if (isSubscribed) {
        // User just subscribed to push notifications
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        if (authUser?.id) {
          console.log("🔄 Auto-registering user from listener:", authUser.id);
          await setUserId(authUser.id);
        }
      }
    });
  } catch (error) {
    console.error("Error setting up subscription listener:", error);
  }
};
