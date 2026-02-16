import { App } from "../modules/App";
import { TaskbarManager } from "../modules/TaskbarManager";
import { BasicWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";

class DrawingWindow extends BasicWindow {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isDrawing: boolean = false;
    private currentColor: string = "#000000";
    private lastX: number = 0;
    private lastY: number = 0;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height, "Paint", true, { maximize: false, minimize: false });
    }

    private setupCanvas() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        
        // Handle High DPI displays
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        if (this.ctx) {
            this.ctx.lineJoin = "round";
            this.ctx.lineCap = "round";
            this.ctx.lineWidth = 5;
        }
    }

    private draw(e: MouseEvent) {
        if (!this.isDrawing || !this.ctx || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.strokeStyle = this.currentColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        [this.lastX, this.lastY] = [x, y];
    }

    addEventListeners(baseElement: HTMLElement) {
        if (!this.canvas) return;

        this.canvas.addEventListener("mousedown", (e) => {
            this.isDrawing = true;
            const rect = this.canvas!.getBoundingClientRect();
            [this.lastX, this.lastY] = [e.clientX - rect.left, e.clientY - rect.top];
        });

        this.canvas.addEventListener("mousemove", (e) => this.draw(e));
        window.addEventListener("mouseup", () => this.isDrawing = false);

        // Handle Resize - Canvas needs to re-calculate its internal dimensions
        const observer = new ResizeObserver(() => {
            if (this.canvas) {
                const tempImage = this.ctx?.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.canvas.width = this.canvas.clientWidth;
                this.canvas.height = this.canvas.clientHeight;
                if (tempImage) this.ctx?.putImageData(tempImage, 0, 0);
                if (this.ctx) {
                    this.ctx.lineJoin = "round";
                    this.ctx.lineCap = "round";
                    this.ctx.lineWidth = 5;
                }
            }
        });
        observer.observe(baseElement);
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }

        // Toolbar
        const toolbar = document.createElement("div");
        toolbar.classList.add("row");
        toolbar.style.flexGrow = "0";

        const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#ffffff"];
        
        colors.forEach(color => {
            const colorBtn = document.createElement("button");
            colorBtn.classList.add("square");
            colorBtn.style.backgroundColor = color;
            colorBtn.style.border = "2px solid var(--os-window-border-color)";
            colorBtn.style.padding = "0";
            colorBtn.style.width = "30px";
            
            colorBtn.addEventListener("click", () => {
                this.currentColor = color;
            });
            toolbar.appendChild(colorBtn);
        });

        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.style.width = "auto";
        clearBtn.style.marginLeft = "auto";
        clearBtn.addEventListener("click", () => {
            if (this.ctx && this.canvas) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        });
        toolbar.appendChild(clearBtn);

        // Canvas Container
        const canvasCard = document.createElement("div");
        canvasCard.classList.add("card", "flex-grow");
        canvasCard.style.padding = "0";
        canvasCard.style.background = "#ffffff";
        canvasCard.style.cursor = "crosshair";

        this.canvas = document.createElement("canvas");
        this.canvas.classList.add("full");
        
        canvasCard.appendChild(this.canvas);
        baseElement.appendChild(toolbar);
        baseElement.appendChild(canvasCard);

        // We need to wait for the element to be in DOM to get correct size
        setTimeout(() => this.setupCanvas(), 0);
        this.addEventListeners(baseElement);

        return baseElement;
    }
}

class PaintApp extends App {
    constructor() {
        super("Paint", "https://upload.wikimedia.org/wikipedia/commons/c/c4/Pain.net_logo.jpg");
    }

    override launch() {
        const paintWindow = new DrawingWindow(200, 100, 600, 500);
        WindowManager.getInstance().registerWindow(paintWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), paintWindow.getUUID());
        this.windows.push(paintWindow);
    }
}

export default PaintApp;