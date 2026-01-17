import { setItem, getItem } from "./storage.js";
import { uid } from "./ui.js";

const ONESIGNAL_APP_ID = "2d86bc3b-c723-4b2a-a414-7724e0018c27"; 

export const initOneSignal = async () => {
    try {
        console.log("🚀 Starting OneSignal Init..."); 
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator['standalone'];

        console.log(`📱 Device Check: iOS=${isIOS}, Standalone=${isStandalone}`);

        if (isIOS && !isStandalone) {
            console.log("� iOS detected but not standalone: Skipping OneSignal init");
            return;
        }

        OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: "web.onesignal.auto.147da6f8-95e8-4f3e-9e77-8dc52e1c58f0",
                notifyButton: {
                    enable: true, 
                },
                allowLocalhostAsSecureOrigin: true,
            }).then(() => {
            }).catch(err => {
                console.error("❌ OneSignal Init Failed:", err);
            });

            if (OneSignal.Notifications) {
                OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
                    console.log("🔕 Suppressing foreground notification from OneSignal (App.js handles it)");
                    event.preventDefault();
                });
            }

            let deviceId = localStorage.getItem("planning_device_id");
            if (!deviceId) {
                deviceId = uid("dev_");
                localStorage.setItem("planning_device_id", deviceId);
            }

            OneSignal.User.PushSubscription.addEventListener("change", async (event) => {
                await updateSubscription(deviceId);
            });

            await updateSubscription(deviceId);
        });
    } catch (e) {
        console.error("OneSignal init error:", e);
    }
};

const updateSubscription = async (deviceId) => {
    const OneSignal = window.OneSignal;
    if (!OneSignal) {
        console.error("❌ OneSignal global object not found in updateSubscription");
        return;
    }

    const id = OneSignal.User.PushSubscription.id;
    const token = OneSignal.User.PushSubscription.token;
    const optedIn = OneSignal.User.PushSubscription.optedIn;

    console.log(`🔔 OneSignal Subscription State Check:
    - ID: ${id}
    - Token: ${token ? 'Present' : 'Missing'}
    - OptedIn: ${optedIn}
    - Local Device ID: ${deviceId}`);

    if (optedIn && id) {
        const deviceData = {
            playerId: id,
            token: token,
            lastActive: Date.now(),
            platform: navigator.platform,
            userAgent: navigator.userAgent
        };

        console.log("💾 Attempting to save device to Supabase...", deviceData);
        const ok = await setItem(`device:${deviceId}`, deviceData, true);
        console.log(`✅ setItem result: ${ok ? 'Success' : 'Failed'}`);
    } else {
        console.warn("⚠️ Skipping Supabase registration: User not opted in or ID missing.");
    }
};
