let oneSignalReady = false;

export const initializeOneSignal = async () => {
  if (typeof window === 'undefined') return;

  // Wait for OneSignal to be available
  if (!(window as any).OneSignalDeferred) {
    (window as any).OneSignalDeferred = [];
  }

  (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.init({
        appId: "93a6fd35-e795-4201-a5a0-0c31336979be",
      });
      oneSignalReady = true;
    } catch (error) {
      // Silently handle initialization errors
    }
  });
};

// Wait for OneSignal to be ready
const waitForOneSignal = async (timeout = 5000) => {
  const startTime = Date.now();
  
  while (!oneSignalReady && Date.now() - startTime < timeout) {
    if ((window as any).OneSignal) {
      oneSignalReady = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return (window as any).OneSignal || null;
};

export const requestNotificationPermission = async () => {
  try {
    const OneSignal = await waitForOneSignal();
    if (!OneSignal) return false;

    // Request permission from browser
    const permission = await OneSignal.Notifications.requestPermission();
    
    return permission;
  } catch (error) {
    // Silently handle errors
    return false;
  }
};

export const sendNotification = async (title: string, message: string, data?: any) => {
  try {
    const OneSignal = await waitForOneSignal();
    if (!OneSignal) return;

    // Ensure user has opted in
    await OneSignal.User.pushSubscription.optIn();
    
    // Send notification
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
    const OneSignal = await waitForOneSignal();
    if (!OneSignal) return;

    await OneSignal.login(userId);
  } catch (error) {
    // Silently handle errors
  }
};

export const setUserEmail = async (email: string) => {
  try {
    const OneSignal = await waitForOneSignal();
    if (!OneSignal) return;

    OneSignal.User.addEmail(email);
  } catch (error) {
    // Silently handle errors
  }
};
