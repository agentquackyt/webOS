import { App } from "./App";
import { TaskbarManager } from "./TaskbarManager";

interface IconPosition {
    x: number;
    y: number;
}

class DesktopManager {
    private static instance: DesktopManager;
    private desktopGroupElement: HTMLElement | null = null;
    private apps: Map<string, App> = new Map();
    private iconPositions: Map<string, IconPosition> = new Map();
    private readonly GRID_SIZE = 120; // Size of each grid cell
    private draggedIcon: HTMLElement | null = null;
    private draggedAppName: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;

    private constructor() {
        this.desktopGroupElement = document.getElementById("os-desktop");
        this.loadIconPositions();
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

            // Set up dragging for this icon
            this.setupIconDragging(icon, app.getName());

            // Position the icon
            this.positionIcon(icon, app.getName());

            // Check if this app should be pinned based on localStorage
            TaskbarManager.getInstance().restorePinnedApp(app);

            // If it is the first app, pin the app to the taskbar and prevent unpinning
            if (this.apps.size === 1) {
                app.setCanUnpin(false);
                app.pinToTaskbar();
            }
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

    private setupIconDragging(icon: HTMLElement, appName: string): void {
        let isDragging = false;
        let hasMoved = false;
        let originPos: IconPosition | null = null;

        const onMouseDown = (e: MouseEvent) => {
            // Only drag on left click and not on double click
            if (e.button !== 0) return;
            
            isDragging = true;
            hasMoved = false;
            this.draggedIcon = icon;
            this.draggedAppName = appName;
            originPos = this.iconPositions.get(appName) ?? null;

            const rect = icon.getBoundingClientRect();
            this.dragOffsetX = e.clientX - rect.left;
            this.dragOffsetY = e.clientY - rect.top;

            icon.classList.add('dragging');
            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging || !this.draggedIcon) return;
            hasMoved = true;

            const desktopRect = this.desktopGroupElement!.getBoundingClientRect();
            const x = e.clientX - desktopRect.left - this.dragOffsetX;
            const y = e.clientY - desktopRect.top - this.dragOffsetY;

            this.draggedIcon.style.left = `${x}px`;
            this.draggedIcon.style.top = `${y}px`;
        };

        const onMouseUp = (e: MouseEvent) => {
            if (!isDragging || !this.draggedIcon || !this.draggedAppName) return;

            isDragging = false;
            this.draggedIcon.classList.remove('dragging');

            if (hasMoved) {
                // Snap to grid
                const desktopRect = this.desktopGroupElement!.getBoundingClientRect();
                const x = e.clientX - desktopRect.left - this.dragOffsetX;
                const y = e.clientY - desktopRect.top - this.dragOffsetY;

                const snappedPos = this.snapToGrid(x, y);

                // Check if the target cell is already occupied by another icon
                const occupied = [...this.iconPositions.entries()].some(
                    ([name, pos]) => name !== this.draggedAppName &&
                        pos.x === snappedPos.x && pos.y === snappedPos.y
                );

                if (occupied && originPos) {
                    // Snap back to original position
                    this.draggedIcon.style.left = `${originPos.x}px`;
                    this.draggedIcon.style.top  = `${originPos.y}px`;
                } else {
                    this.draggedIcon.style.left = `${snappedPos.x}px`;
                    this.draggedIcon.style.top  = `${snappedPos.y}px`;
                    this.iconPositions.set(this.draggedAppName, snappedPos);
                    this.saveIconPositions();
                }
            }

            this.draggedIcon = null;
            this.draggedAppName = null;
            originPos = null;
        };

        icon.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    private snapToGrid(x: number, y: number): IconPosition {
        const snappedX = Math.round(x / this.GRID_SIZE) * this.GRID_SIZE;
        const snappedY = Math.round(y / this.GRID_SIZE) * this.GRID_SIZE;
        
        // Ensure icons stay within bounds
        const maxX = (this.desktopGroupElement?.clientWidth || 0) - 100;
        const maxY = (this.desktopGroupElement?.clientHeight || 0) - 100;
        
        return {
            x: Math.max(0, Math.min(snappedX, maxX)),
            y: Math.max(0, Math.min(snappedY, maxY))
        };
    }

    private positionIcon(icon: HTMLElement, appName: string): void {
        const savedPos = this.iconPositions.get(appName);
        
        if (savedPos) {
            // Use saved position
            icon.style.left = `${savedPos.x}px`;
            icon.style.top = `${savedPos.y}px`;
        } else {
            // Auto-position in grid
            const index = this.apps.size - 1;
            const cols = Math.floor((this.desktopGroupElement?.clientWidth || 0) / this.GRID_SIZE);
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const pos = {
                x: col * this.GRID_SIZE,
                y: row * this.GRID_SIZE
            };
            
            icon.style.left = `${pos.x}px`;
            icon.style.top = `${pos.y}px`;
            
            this.iconPositions.set(appName, pos);
            this.saveIconPositions();
        }
    }

    private saveIconPositions(): void {
        const positionsObj: { [key: string]: IconPosition } = {};
        this.iconPositions.forEach((pos, name) => {
            positionsObj[name] = pos;
        });
        localStorage.setItem('webos-icon-positions', JSON.stringify(positionsObj));
        console.log('[DesktopManager] Saved icon positions');
    }

    private loadIconPositions(): void {
        const stored = localStorage.getItem('webos-icon-positions');
        if (stored) {
            try {
                const positionsObj = JSON.parse(stored);
                Object.keys(positionsObj).forEach(name => {
                    this.iconPositions.set(name, positionsObj[name]);
                });
                console.log('[DesktopManager] Loaded icon positions');
            } catch (e) {
                console.error('[DesktopManager] Failed to load icon positions:', e);
            }
        }
    }

    public getApps(): string[] {
        // Names of registered apps
        return [...this.apps.values()].map(app => app.getName());
    }
}

export { DesktopManager };