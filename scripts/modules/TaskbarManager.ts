import type { App } from "./App";
import { DesktopManager } from "./DesktopManager";
import { WindowManager } from "./WindowManager";
import { ContextMenuManager } from "./ContextMenuManager";

class TaskbarManager {
    private static instance: TaskbarManager;
    private taskbar: HTMLElement;
    private taskbarItems: Map<string, HTMLElement>; // Maps app UUID to taskbar item
    private appWindows: Map<string, Set<string>>; // Maps app UUID to set of window UUIDs
    private windowToApp: Map<string, string>; // Maps window UUID to app UUID
    private pinnedApps: Map<string, App>; // Maps app UUID to App for pinned apps

    private constructor() {
        this.taskbar = document.getElementById("os-taskbar") as HTMLElement;
        this.taskbarItems = new Map();
        this.appWindows = new Map();
        this.windowToApp = new Map();
        this.pinnedApps = new Map();
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
                // Do not toggle taskbar "active" on minimize —
                // an app with open windows should remain shown as active
                // even when all its windows are minimized.
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

        // Ensure the taskbar item exists and is marked active while any
        // windows for the app are present (including minimized windows).
        const item = this.taskbarItems.get(appUUID);
        if (item) {
            item.classList.add("active");
        } else {
            const app = DesktopManager.getInstance().getApp(appUUID);
            if (app) {
                this.addTaskbarItem(app, true);
            }
        }
    }

    /*
        <div class="os-taskbar-item" data-tooltip="Messages">
            <img src="https://placehold.co/48" alt="Messages">
        </div>
     */

    private addTaskbarItem(app: App, isActive: boolean = true): void {
        // Don't add duplicate items
        if (this.taskbarItems.has(app.getUUID())) {
            return;
        }

        const item = document.createElement("div");
        item.classList.add("os-taskbar-item");
        if (isActive) {
            item.classList.add("active");
        }
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

        // Add right-click context menu
        item.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            ContextMenuManager.getInstance().show(e.pageX, e.pageY, app);
        });

        this.taskbar.appendChild(item);
        this.taskbarItems.set(app.getUUID(), item);
        console.log(`[TaskbarManager] Added taskbar item for ${app.getName()}`);
    }

    private removeTaskbarItem(uuid: string) {
        const item = this.taskbarItems.get(uuid);
        if (item) {
            // If app is pinned, just mark it as inactive instead of removing
            if (this.pinnedApps.has(uuid)) {
                item.classList.remove("active");
                console.log(`[TaskbarManager] Marked pinned app ${uuid} as inactive`);
            } else {
                item.remove();
                this.taskbarItems.delete(uuid);
                console.log(`[TaskbarManager] Removed taskbar item for app ${uuid}`);
            }
        }
    }

    private handleTaskbarItemClick(appUUID: string): void {
        const windows = this.appWindows.get(appUUID);
        
        // If app is pinned but not running, launch it
        if ((!windows || windows.size === 0) && this.pinnedApps.has(appUUID)) {
            const app = this.pinnedApps.get(appUUID);
            if (app) {
                const event = new CustomEvent("webos-desktop", { detail: { uuid: appUUID, action: "launch" } });
                window.dispatchEvent(event);
            }
            return;
        }
        
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
            const windows = this.appWindows.get(appUUID);
            if (windows && windows.size > 0) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        }
    }

    public pinApp(app: App): void {
        this.pinnedApps.set(app.getUUID(), app);
        
        // Add taskbar item if not already present
        if (!this.taskbarItems.has(app.getUUID())) {
            this.addTaskbarItem(app, false);
        }
        
        // Save pinned apps to localStorage
        this.savePinnedApps();
        console.log(`[TaskbarManager] Pinned app: ${app.getName()}`);
    }

    public unpinApp(uuid: string): void {
        this.pinnedApps.delete(uuid);
        
        // If app has no open windows, remove taskbar item
        const windows = this.appWindows.get(uuid);
        if (!windows || windows.size === 0) {
            const item = this.taskbarItems.get(uuid);
            if (item) {
                item.remove();
                this.taskbarItems.delete(uuid);
            }
        }
        
        // Save pinned apps to localStorage
        this.savePinnedApps();
        console.log(`[TaskbarManager] Unpinned app: ${uuid}`);
    }

    private savePinnedApps(): void {
        const pinnedData = Array.from(this.pinnedApps.values()).map(app => ({
            name: app.getName(),
            icon: app.getAppIcon()
        }));
        localStorage.setItem('webos-pinned-apps', JSON.stringify(pinnedData));
    }

    public loadPinnedApps(): void {
        const stored = localStorage.getItem('webos-pinned-apps');
        if (stored) {
            try {
                const pinnedData = JSON.parse(stored);
                // Note: We need to get the actual App instances from DesktopManager
                // This will be called after apps are registered
                console.log(`[TaskbarManager] Found ${pinnedData.length} pinned apps in storage`);
            } catch (e) {
                console.error('[TaskbarManager] Failed to load pinned apps:', e);
            }
        }
    }

    public getPinnedAppNames(): string[] {
        const stored = localStorage.getItem('webos-pinned-apps');
        if (stored) {
            try {
                const pinnedData = JSON.parse(stored);
                return pinnedData.map((data: any) => data.name);
            } catch (e) {
                console.error('[TaskbarManager] Failed to get pinned app names:', e);
            }
        }
        return [];
    }

    public restorePinnedApp(app: App): void {
        const pinnedNames = this.getPinnedAppNames();
        if (pinnedNames.includes(app.getName())) {
            app.setPinned(true);
            this.pinnedApps.set(app.getUUID(), app);
            // Restored pinned apps should start inactive until they have windows
            this.addTaskbarItem(app, false);
            console.log(`[TaskbarManager] Restored pinned app: ${app.getName()}`);
        }
    }
}

export { TaskbarManager };