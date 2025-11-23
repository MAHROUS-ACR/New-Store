import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeNotifications, setupOnMessageListener } from "./lib/notificationUtils";

// Initialize notifications on app startup
async function setupNotifications() {
  try {
    // Get Firebase config from server
    const configResponse = await fetch("/api/firebase/config");
    if (configResponse.ok) {
      const config = await configResponse.json();
      
      // Initialize notifications with config
      await initializeNotifications({
        apiKey: config.firebaseApiKey,
        authDomain: config.firebaseAuthDomain,
        projectId: config.firebaseProjectId,
        storageBucket: config.firebaseStorageBucket,
        messagingSenderId: config.firebaseMessagingSenderId,
        appId: config.firebaseAppId,
        measurementId: config.firebaseMeasurementId,
      });

      // Setup message listener
      setupOnMessageListener((payload) => {
        console.log("Notification received in foreground:", payload);
      });

      // Request permission after a short delay to not block app startup
      setTimeout(() => {
        import("./lib/notificationUtils").then(({ requestNotificationPermission }) => {
          requestNotificationPermission().catch(err => {
            console.log("Notification permission setup deferred");
          });
        });
      }, 2000);
    }
  } catch (error) {
    console.log("Notification setup skipped:", error);
  }
}

setupNotifications();

createRoot(document.getElementById("root")!).render(<App />);
