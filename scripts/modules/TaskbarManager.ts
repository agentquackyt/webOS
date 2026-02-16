import type { App } from "./App";
import { DesktopManager } from "./DesktopManager";
import { WindowManager } from "./WindowManager";

class TaskbarManager {
    private static instance: TaskbarManager;
    private taskbar: HTMLElement;
    private taskbarItems: Map<string, HTMLElement>; // Maps app UUID to taskbar item
    private appWindows: Map<string, Set<string>>; // Maps app UUID to set of window UUIDs
    private windowToApp: Map<string, string>; // Maps window UUID to app UUID

    private constructor() {
        this.taskbar = document.getElementById("os-taskbar") as HTMLElement;
        this.taskbarItems = new Map();
        this.appWindows = new Map();
        this.windowToApp = new Map();
        this.registerEventListeners();
    }

    public static getInstance(): TaskbarManager {
        if (!TaskbarManager.instance) {
            TaskbarManager.instance = new TaskbarManager();
        }
        return TaskbarManager.instance;
    }

    private registerEventListeners(): void {
        // Listen for app launches
        window.addEventListener("webos-desktop", (event: Event) => {
            const customEvent = event as CustomEvent;
            const { uuid, action } = customEvent.detail;

            if (action === "launch") {
                const app = DesktopManager.getInstance().getApp(uuid);
                if (app) {
                    console.log(`[TaskbarManager] App launched: ${app.getName()}`);
                    this.addTaskbarItem(app);
                }
            }
        });

        // Listen for window events
        window.addEventListener("webos-window", (event: Event) => {
            const customEvent = event as CustomEvent;
            const { uuid, action } = customEvent.detail;

            if (action === "close") {
                const appUUID = this.windowToApp.get(uuid);
                if (appUUID) {
                    // Remove this window from app's window set
                    const windows = this.appWindows.get(appUUID);
                    if (windows) {
                        windows.delete(uuid);
                        
                        // If no more windows, remove taskbar item
                        if (windows.size === 0) {
                            this.removeTaskbarItem(appUUID);
                            this.appWindows.delete(appUUID);
                        }
                    }
                    this.windowToApp.delete(uuid);
                }
            } else if (action === "minimize") {
                // Update taskbar item visual state if needed
                const appUUID = this.windowToApp.get(uuid);
                if (appUUID) {
                    const item = this.taskbarItems.get(appUUID);
                    if (item) {
                        item.classList.remove("active");
                    }
                }
            }
        });
    }

    public registerWindow(appUUID: string, windowUUID: string): void {
        // Track which windows belong to which app
        if (!this.appWindows.has(appUUID)) {
            this.appWindows.set(appUUID, new Set());
        }
        this.appWindows.get(appUUID)!.add(windowUUID);
        this.windowToApp.set(windowUUID, appUUID);
    }

    /*
        <div class="os-taskbar-item" data-tooltip="Messages">
            <img src="https://placehold.co/48" alt="Messages">
        </div>
     */

    private addTaskbarItem(app: App) {
        // Don't add duplicate items
        if (this.taskbarItems.has(app.getUUID())) {
            return;
        }

        const item = document.createElement("div");
        item.classList.add("os-taskbar-item", "active");
        item.dataset.tooltip = app.getName();
        item.dataset.appUuid = app.getUUID();
        
        const img = document.createElement("img");
        img.src = app.getAppIcon() || "https://placehold.co/48";
        img.alt = app.getName();
        item.appendChild(img);

        // Add click handler to restore/focus windows
        item.addEventListener("click", () => {
            this.handleTaskbarItemClick(app.getUUID());
        });

        this.taskbar.appendChild(item);
        this.taskbarItems.set(app.getUUID(), item);
        console.log(`[TaskbarManager] Added taskbar item for ${app.getName()}`);
    }

    private removeTaskbarItem(uuid: string) {
        const item = this.taskbarItems.get(uuid);
        if (item) {
            item.remove();
            this.taskbarItems.delete(uuid);
            console.log(`[TaskbarManager] Removed taskbar item for app ${uuid}`);
        }
    }

    private handleTaskbarItemClick(appUUID: string): void {
        const windows = this.appWindows.get(appUUID);
        if (!windows || windows.size === 0) return;

        const windowManager = WindowManager.getInstance();
        
        // Check if any window is hidden (minimized)
        let hasHiddenWindow = false;
        for (const windowUUID of windows) {
            const window = windowManager.getWindowByUUID(windowUUID);
            if (window && window.isWindowHidden()) {
                hasHiddenWindow = true;
                break;
            }
        }

        // If any window is hidden, restore all windows
        // Otherwise, minimize all windows
        for (const windowUUID of windows) {
            const window = windowManager.getWindowByUUID(windowUUID);
            if (window) {
                if (hasHiddenWindow) {
                    window.restore();
                } else {
                    window.minimize();
                }
            }
        }

        // Update taskbar item state
        const item = this.taskbarItems.get(appUUID);
        if (item) {
            if (hasHiddenWindow) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        }
    }
}

export { TaskbarManager };