// Initialize OneSignal when available
let OneSignalInstance: any = null;

const getOneSignal = async (timeout = 3000) => {
  if (OneSignalInstance) return OneSignalInstance;
  
  const start = Date.now();
  while (!OneSignalInstance && Date.now() - start < timeout) {
    OneSignalInstance = (window as any).OneSignal;
    if (OneSignalInstance) break;
    await new Promise(r => setTimeout(r, 100));
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
    // Silently handle
  }
};

export const setUserId = async (userId: string) => {
  try {
    if (!userId) return;
    const OneSignal = await getOneSignal();
    if (!OneSignal) return;

    await OneSignal.login(userId);
  } catch (error) {
    // Silently handle
  }
};

export const setUserEmail = async (email: string) => {
  try {
    if (!email) return;
    const OneSignal = await getOneSignal();
    if (!OneSignal) return;

    OneSignal.User.addEmail(email);
  } catch (error) {
    // Silently handle
  }
};

// Setup subscription listener for when user subscribes via OneSignal permission popup
export const setupSubscriptionListener = async () => {
  try {
    const OneSignal = await getOneSignal(5000);
    if (!OneSignal) return;

    // Listen for subscription changes
    OneSignal.User.PushSubscription.addEventListener('change', async (change: any) => {
      const isSubscribed = OneSignal.User.PushSubscription.isSubscribed;
      
      if (isSubscribed) {
        // User subscribed - register them in OneSignal
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        if (authUser?.id) {
          await setUserId(authUser.id);
          if (authUser?.email) {
            await setUserEmail(authUser.email);
          }
        }
      }
    });
  } catch (error) {
    // Silently handle
  }
};
