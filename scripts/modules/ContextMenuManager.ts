import type { App } from "./App";

class ContextMenuManager {
    private static instance: ContextMenuManager;
    private contextMenu: HTMLElement;
    private pinItem: HTMLElement;
    private unpinItem: HTMLElement;
    private currentApp: App | null = null;

    private constructor() {
        this.contextMenu = document.getElementById("context-menu") as HTMLElement;
        this.pinItem = document.getElementById("context-menu-pin") as HTMLElement;
        this.unpinItem = document.getElementById("context-menu-unpin") as HTMLElement;
        this.setupEventListeners();
    }

    public static getInstance(): ContextMenuManager {
        if (!ContextMenuManager.instance) {
            ContextMenuManager.instance = new ContextMenuManager();
        }
        return ContextMenuManager.instance;
    }

    private setupEventListeners(): void {
        // Pin item click
        this.pinItem.addEventListener("click", () => {
            if (this.currentApp) {
                this.currentApp.pinToTaskbar();
                this.hide();
            }
        });

        // Unpin item click
        this.unpinItem.addEventListener("click", () => {
            if (this.currentApp) {
                this.currentApp.unpinFromTaskbar();
                this.hide();
            }
        });

        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.contextMenu.contains(e.target as Node)) {
                this.hide();
            }
        });

        // Close menu on right-click outside
        document.addEventListener("contextmenu", (e) => {
            if (!this.contextMenu.contains(e.target as Node) && 
                !(e.target as HTMLElement).closest('.desktop-icon') &&
                !(e.target as HTMLElement).closest('.os-taskbar-item')) {
                this.hide();
            }
        });
    }

    public show(x: number, y: number, app: App): void {
        this.currentApp = app;
        
        // If app is pinned and cannot be unpinned, don't show menu
        if (app.isPinned() && !app.canBeUnpinned()) {
            return;
        }
        
        // Show/hide appropriate menu items based on pin state
        if (app.isPinned()) {
            this.pinItem.style.display = "none";
            // Only show unpin option if the app can be unpinned
            if (app.canBeUnpinned()) {
                this.unpinItem.style.display = "block";
            } else {
                this.unpinItem.style.display = "none";
            }
        } else {
            this.pinItem.style.display = "block";
            this.unpinItem.style.display = "none";
        }

        // Position the menu
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.classList.add("active");

        // Adjust position if menu goes off-screen
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    }

    public hide(): void {
        this.contextMenu.classList.remove("active");
        this.currentApp = null;
    }
}

export { ContextMenuManager };
