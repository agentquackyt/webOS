import { WebosWindow } from "./Window";

type Coords = { x: number, y: number };

class WindowManager {
    private static instance: WindowManager;
    private windows: Map<string, WebosWindow>;
    private windowGroupElement: HTMLElement | null = null;
    private lastBasePosition: Coords = { x: 100, y: 100 };
    private nextWindowPosition: Coords = { x: 100, y: 100 };
    private positionOffset: Coords = { x: 30, y: 30 };

    private constructor() {
        this.windows = new Map();
    }

    public static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager();
            WindowManager.instance.windowGroupElement = document.getElementById("os-windows");
            WindowManager.instance.setupEventListeners();
        }
        return WindowManager.instance;
    }

    private setupEventListeners(): void {
        window.addEventListener("webos-window", (event: Event) => {
            const customEvent = event as CustomEvent;
            const { uuid, action } = customEvent.detail;
            const targetWindow = this.windows.get(uuid);
            if (!targetWindow) return;

            switch (action) {
                case "close":
                    targetWindow.close();
                    this.windows.delete(uuid);
                    break;
                case "minimize":
                    targetWindow.minimize();
                    break;
                // Future actions like maximize can be handled here
            }
        });
    }

    public registerWindow(window: WebosWindow): void {
        console.log(`[WindowManager] Registering window with UUID: ${window.getUUID()}`);
        console.info(`[WindowManager] Current windows before registration: ${Array.from(this.windows.keys()).join(", ")}`);
        this.windows.set(window.getUUID(), window);
        if (this.windowGroupElement) {
            window.updatePosition(this.nextWindowPosition.x, this.nextWindowPosition.y);
            this.windowGroupElement.appendChild(window.render());
        }
        
        this.nextWindowPosition.x += this.positionOffset.x;
        this.nextWindowPosition.y += this.positionOffset.y;
        if(this.nextWindowPosition.y > 500) {
            this.lastBasePosition.y += this.positionOffset.y;
            this.nextWindowPosition.y = this.lastBasePosition.y;
            this.nextWindowPosition.x = this.lastBasePosition.x;
        }
    }

    public getWindowByUUID(uuid: string): WebosWindow | undefined {
        return this.windows.get(uuid);
    }
}

export { WindowManager };