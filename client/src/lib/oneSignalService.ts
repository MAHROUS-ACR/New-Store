export const requestNotificationPermission = async () => {
  try {
    if (typeof window === 'undefined') return false;

    // Check if OneSignal is available
    if (!(window as any).OneSignal) {
      // Wait for it to load
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return false;

    // Show the notification prompt
    await OneSignal.Notifications.requestPermission();
    
    return true;
  } catch (error) {
    return false;
  }
};

export const sendNotification = async (title: string, message: string, data?: any) => {
  try {
    if (typeof window === 'undefined') return;

    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;

    await OneSignal.Notifications.sendNotification({
      title: title,
      body: message,
      ...(data && { data: data }),
    });
  } catch (error) {
    // Silently handle errors
  }
};

export const setUserId = async (userId: string) => {
  try {
    if (typeof window === 'undefined') return;

    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;

    await OneSignal.login(userId);
  } catch (error) {
    // Silently handle errors
  }
};

export const setUserEmail = async (email: string) => {
  try {
    if (typeof window === 'undefined') return;

    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;

    OneSignal.User.addEmail(email);
  } catch (error) {
    // Silently handle errors
  }
};

export const initializeOneSignal = async () => {
  // OneSignal initializes automatically via script tag in HTML
  // This function is here for consistency
};
