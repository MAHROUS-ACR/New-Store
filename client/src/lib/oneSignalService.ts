export const initializeOneSignal = async () => {
  if (typeof window === 'undefined') return;

  // Wait for OneSignal to be available
  if (!(window as any).OneSignalDeferred) {
    (window as any).OneSignalDeferred = [];
  }

  (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: "93a6fd35-e795-4201-a5a0-0c31336979be",
    });
  });
};

export const sendNotification = async (title: string, message: string, data?: any) => {
  try {
    if (!(window as any).OneSignal) return;

    const OneSignal = (window as any).OneSignal;
    
    // Get user's subscription status
    const subscription = await OneSignal.User.pushSubscription.optIn();
    
    if (subscription) {
      // Send notification using OneSignal Messaging API
      await OneSignal.Notifications.sendNotification({
        title: title,
        body: message,
        ...(data && { data: data }),
      });
    }
  } catch (error) {
    // Silently handle errors
  }
};

export const setUserId = async (userId: string) => {
  try {
    if (!(window as any).OneSignal) return;

    const OneSignal = (window as any).OneSignal;
    await OneSignal.login(userId);
  } catch (error) {
    // Silently handle errors
  }
};

export const setUserEmail = async (email: string) => {
  try {
    if (!(window as any).OneSignal) return;

    const OneSignal = (window as any).OneSignal;
    OneSignal.User.addEmail(email);
  } catch (error) {
    // Silently handle errors
  }
};
