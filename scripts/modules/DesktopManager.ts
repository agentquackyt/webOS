import { App } from "./App";

class DesktopManager {
    private static instance: DesktopManager;
    private desktopGroupElement: HTMLElement | null = null;
    private apps: Map<string, App> = new Map();

    private constructor() {
        this.desktopGroupElement = document.getElementById("os-desktop");
    }

    public static getInstance(): DesktopManager {
        if (!DesktopManager.instance) {
            DesktopManager.instance = new DesktopManager();
            DesktopManager.instance.setupEventListeners();
        }
        return DesktopManager.instance;
    }

    private setupEventListeners(): void {
        window.addEventListener("webos-desktop", (event: Event) => {
            const { uuid, action } = (event as CustomEvent).detail;
            console.log(`[DesktopManager] Received desktop event: ${action} for app ${uuid}`);

            switch (action) {
                case "launch":
                    const app = this.apps.get(uuid);
                    if (app) {
                        app.launch();
                    }
                    break;
                case "close":
                    // Handle app close if needed
                    break;
                default:
                    console.warn(`[DesktopManager] Unknown desktop action: ${action}`);
            }
        });
    }

    public registerApp(app: App): void {
        console.log(`[DesktopManager] Registering app: ${app.getUUID()}`);
        if (this.desktopGroupElement) {
            let icon = app.getDesktopIcon();
            this.apps.set(app.getUUID(), app);
            this.desktopGroupElement.appendChild(icon);
        }
    }

    public unregisterApp(app: App): void {
        console.log(`[DesktopManager] Unregistering app: ${app.getUUID()}`);
        const icon = this.apps.get(app.getUUID());
        
        app.removeDesktopIcon();
        this.apps.delete(app.getUUID());
    }

    public getApp(uuid: string): App | undefined {
        return this.apps.get(uuid);
    }
}

export { DesktopManager };