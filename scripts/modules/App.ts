import { IframeWindow, NotificationWindow, WebosWindow } from "./Window";
import { WindowManager } from "./WindowManager";
import { TaskbarManager } from "./TaskbarManager";

class App {
    private name: string;
    private uuid: string;
    private appIcon: string | null = null;
    public windows: WebosWindow[] = [];
    private desktopIcon: HTMLElement | null = null;

    constructor(name: string, appIcon?: string) {
        this.name = name;
        this.uuid = crypto.randomUUID();
        this.appIcon = appIcon || null;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener("webos-window", (event: Event) => {
            const customEvent = event as CustomEvent;
            const { uuid, action } = customEvent.detail;
            
            if (action === "close") {
                // Find and remove the window from this app's window list
                const windowIndex = this.windows.findIndex(w => w.getUUID() === uuid);
                if (windowIndex !== -1) {
                    this.windows.splice(windowIndex, 1);
                    console.log(`[App] Removed window ${uuid} from ${this.name}. Remaining windows: ${this.windows.length}`);
                }
            }
        });
    }

    public getDesktopIcon(): HTMLElement {
        if(this.desktopIcon) {
            return this.desktopIcon;
        }
        this.desktopIcon = document.createElement("div");
        this.desktopIcon.addEventListener("dblclick", () => {
            const event = new CustomEvent("webos-desktop", { detail: { uuid: this.uuid, action: "launch" } });
            window.dispatchEvent(event);
        });
        this.desktopIcon.className = "desktop-icon";
        const img = document.createElement("img");
        img.src = this.appIcon || "https://placehold.co/64";
        img.alt = this.name;
        const label = document.createElement("span");
        label.textContent = this.name;
        this.desktopIcon.appendChild(img);
        this.desktopIcon.appendChild(label);
        return this.desktopIcon;
    }

    public removeDesktopIcon(): void {
        if (this.desktopIcon && this.desktopIcon.parentNode) {
            this.desktopIcon.remove();
        }
    }

    public launch() {
        let newWindow = new NotificationWindow(500, 500, `${this.name} Notification`, `This is a notification from ${this.name}.`);
        this.windows.push(newWindow);

        WindowManager.getInstance().registerWindow(newWindow);
        
        // Register window with TaskbarManager
        TaskbarManager.getInstance().registerWindow(this.uuid, newWindow.getUUID());
        
        console.log(`[App] Launched app: ${this.name} with UUID: ${this.uuid}`);
    }

    getName(): string {
        return this.name;
    }
    
    getUUID(): string {
        return this.uuid;
    }

    getAppIcon(): string | null {
        return this.appIcon;
    }

    hasOpenWindows(): boolean {
        return this.windows.length > 0;
    }
}

export { App };