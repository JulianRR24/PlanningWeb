import { setItem, getItem } from "./storage.js";
import { uid } from "./ui.js";

// OneSignal App ID needs to be configured here or in a config file
// Since we don't have a config file, we will use a placeholder or ask user to fill it
// The user said: "Asume que las siguientes variables de entorno YA están configuradas en Supabase" for the backend.
// For frontend, we need the App ID. 
// I will use a placeholder and strictly document it.
const ONESIGNAL_APP_ID = "YOUR-ONESIGNAL-APP-ID"; 

export const initOneSignal = async () => {
    try {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        // 🔒 iOS PWA Check: Only init if installed (Standalone)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator['standalone'];

        if (isIOS && !isStandalone) {
            console.log("📱 iOS detected but not standalone: Skipping OneSignal init");
            return;
        }

        // 1️⃣ Initialize OneSignal
        OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: "web.onesignal.auto.bf47764d-90b5-4122-8321-xxx", // Optional: for Safari legacy
                notifyButton: {
                    enable: true, // Allow user to subscribe manually if they dismissed prompt
                },
                allowLocalhostAsSecureOrigin: true, // Helpful for dev
            });

            // Prevent duplicate notifications when app is open (App.js handles it locally)
            if (OneSignal.Notifications) {
                OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
                    console.log("🔕 Suppressing foreground notification from OneSignal (App.js handles it)");
                    event.preventDefault();
                });
            }

            // 2️⃣ Get or Create Device UUID
            let deviceId = localStorage.getItem("planning_device_id");
            if (!deviceId) {
                deviceId = uid("dev_");
                localStorage.setItem("planning_device_id", deviceId);
            }

            // 3️⃣ Listen for subscription changes
            OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
                await updateSubscription(deviceId);
            });

            // Initial check
            await updateSubscription(deviceId);
        });
    } catch (e) {
        console.error("OneSignal init error:", e);
    }
};

const updateSubscription = async (deviceId) => {
    const OneSignal = window.OneSignal;
    if (!OneSignal) return;

    const id = OneSignal.User.PushSubscription.id;
    const token = OneSignal.User.PushSubscription.token;
    const optedIn = OneSignal.User.PushSubscription.optedIn;

    console.log("🔔 OneSignal State:", { id, token, optedIn });

    if (optedIn && id) {
        // Guardar dispositivo en Supabase
        // Usamos una clave única por dispositivo para evitar condiciones de carrera
        // formata: planningweb:device:<UUID>
        const deviceData = {
            playerId: id, // Subscription ID in OneSignal v16+
            token: token,
            lastActive: Date.now(),
            platform: navigator.platform,
            userAgent: navigator.userAgent
        };

        // Usamos setItem de storage.js que ya maneja la sincronización con Supabase (upsert)
        // syncRemote = true
        await setItem(`device:${deviceId}`, deviceData, true);
        console.log("✅ Dispositivo registrado en Supabase:", deviceId);
    }
};
