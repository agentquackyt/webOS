import { App } from "../modules/App";
import { TaskbarManager } from "../modules/TaskbarManager";
import { BasicWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";

class DrawingWindow extends BasicWindow {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isDrawing: boolean = false;
    private currentColor: string = "#000000";
    private currentSize: number = 5;
    private isEraser: boolean = false;
    private lastX: number = 0;
    private lastY: number = 0;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height, "Paint", true, { maximize: true, minimize: true });
    }

    private setupCanvas() {
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");

        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        if (this.ctx) {
            this.ctx.lineJoin = "round";
            this.ctx.lineCap = "round";
            this.ctx.lineWidth = this.currentSize;
            // White background so download looks clean
            this.ctx.fillStyle = "#ffffff";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    private applyCtxSettings() {
        if (!this.ctx) return;
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";
        this.ctx.lineWidth = this.currentSize;
        this.ctx.strokeStyle = this.isEraser ? "#ffffff" : this.currentColor;
        this.ctx.globalCompositeOperation = this.isEraser ? "source-over" : "source-over";
    }

    private draw(e: MouseEvent) {
        if (!this.isDrawing || !this.ctx || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.applyCtxSettings();
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
        this.canvas.addEventListener("mouseenter", (e) => {
            if (e.buttons === 1 && this.isDrawing) {
                // Re-anchor to entry point so no jump line is drawn
                const rect = this.canvas!.getBoundingClientRect();
                [this.lastX, this.lastY] = [e.clientX - rect.left, e.clientY - rect.top];
            }
        });
        window.addEventListener("mouseup", () => this.isDrawing = false);

        const observer = new ResizeObserver(() => {
            if (this.canvas && this.ctx && !this.isWindowHidden()) {
                const tempImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.canvas.width = this.canvas.clientWidth < 100 ? 100 : this.canvas.clientWidth;
                this.canvas.height = this.canvas.clientHeight < 100 ? 100 : this.canvas.clientHeight;
                this.ctx.putImageData(tempImage, 0, 0);
                this.applyCtxSettings();
            }
        });
        observer.observe(baseElement);
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }

        // ── Toolbar ──────────────────────────────────────────────────
        const toolbar = document.createElement("div");
        toolbar.classList.add("column");
        toolbar.style.alignItems = "center";
        toolbar.style.flexShrink = "0";
        toolbar.style.flexWrap = "wrap";

        // Color palette
        const paletteGroup = document.createElement("div");
        paletteGroup.classList.add("row", "gap-sm");
        paletteGroup.style.alignItems = "center";
        paletteGroup.style.flexWrap = "wrap";

        const colors = [
            "#000000", "#ffffff", "#e63946", "#f4a261",
            "#f9c74f", "#2dc653", "#4361ee", "#9b5de5",
            "#a8dadc", "#457b9d", "#6d4c41", "#808080",
        ];

        // Active color swatch (preview)
        const activeColorSwatch = document.createElement("div");
        activeColorSwatch.style.width = "28px";
        activeColorSwatch.style.height = "28px";
        activeColorSwatch.style.borderRadius = "50%";
        activeColorSwatch.style.backgroundColor = this.currentColor;
        activeColorSwatch.style.border = "2px solid var(--os-window-border-color)";
        activeColorSwatch.style.flexShrink = "0";
        activeColorSwatch.title = "Active color";
        paletteGroup.appendChild(activeColorSwatch);

        colors.forEach(color => {
            const colorBtn = document.createElement("button");
            colorBtn.style.backgroundColor = color;
            colorBtn.style.width = "22px";
            colorBtn.style.height = "22px";
            colorBtn.style.minWidth = "22px";
            colorBtn.style.padding = "0";
            colorBtn.style.borderRadius = "4px";
            colorBtn.style.border = "1px solid var(--os-window-border-color)";
            colorBtn.title = color;

            colorBtn.addEventListener("click", () => {
                this.currentColor = color;
                this.isEraser = false;
                activeColorSwatch.style.backgroundColor = color;
                eraserBtn.style.outline = "none";
            });
            paletteGroup.appendChild(colorBtn);
        });

        // Custom color picker
        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = this.currentColor;
        colorPicker.style.width = "22px";
        colorPicker.style.height = "22px";
        colorPicker.style.padding = "0";
        colorPicker.style.border = "1px solid var(--os-window-border-color)";
        colorPicker.style.borderRadius = "4px";
        colorPicker.style.cursor = "pointer";
        colorPicker.style.background = "none";
        colorPicker.title = "Custom color";
        colorPicker.addEventListener("input", () => {
            this.currentColor = colorPicker.value;
            this.isEraser = false;
            activeColorSwatch.style.backgroundColor = colorPicker.value;
            eraserBtn.style.outline = "none";
        });
        paletteGroup.appendChild(colorPicker);

        toolbar.appendChild(paletteGroup);

        // Brush size group

        const sizeLabel = document.createElement("span");
        sizeLabel.textContent = "Size";
        sizeLabel.style.fontSize = "0.8rem";
        sizeLabel.style.opacity = "0.7";
        sizeLabel.style.whiteSpace = "nowrap";

        const sizeSlider = document.createElement("input");
        sizeSlider.type = "range";
        sizeSlider.min = "1";
        sizeSlider.max = "50";
        sizeSlider.value = String(this.currentSize);
        sizeSlider.style.width = "80px";
        sizeSlider.style.cursor = "pointer";
        sizeSlider.style.accentColor = "var(--os-accent-color)";

        const sizeValue = document.createElement("span");
        sizeValue.textContent = String(this.currentSize);
        sizeValue.style.fontSize = "0.8rem";
        sizeValue.style.minWidth = "20px";
        sizeValue.style.opacity = "0.7";

        sizeSlider.addEventListener("input", () => {
            this.currentSize = Number(sizeSlider.value);
            sizeValue.textContent = sizeSlider.value;
            if (this.ctx) this.ctx.lineWidth = this.currentSize;
        });

    
        // Tool buttons
        const toolGroup = document.createElement("div");
        toolGroup.classList.add("row", "gap-sm", "center");

        toolGroup.appendChild(sizeLabel);
        toolGroup.appendChild(sizeSlider);
        toolGroup.appendChild(sizeValue);

        const eraserBtn = document.createElement("button");
        eraserBtn.textContent = "Eraser";
        eraserBtn.title = "Eraser";
        eraserBtn.addEventListener("click", () => {
            this.isEraser = !this.isEraser;
            eraserBtn.style.outline = this.isEraser ? "2px solid var(--os-accent-color)" : "none";
        });
        toolGroup.appendChild(eraserBtn);

        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.title = "Clear canvas";
        clearBtn.addEventListener("click", () => {
            if (this.ctx && this.canvas) {
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        });
        toolGroup.appendChild(clearBtn);

        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "Save";
        downloadBtn.title = "Download as PNG";
        downloadBtn.addEventListener("click", () => {
            if (this.canvas) {
                const link = document.createElement("a");
                link.download = "drawing.png";
                link.href = this.canvas.toDataURL();
                link.click();
            }
        });
        toolGroup.appendChild(downloadBtn);

        toolbar.appendChild(toolGroup);

        // ── Canvas ────────────────────────────────────────────────────
        const canvasCard = document.createElement("div");
        canvasCard.classList.add("flex-grow");
        canvasCard.style.padding = "0";
        canvasCard.style.background = "#ffffff";
        canvasCard.style.cursor = "crosshair";
        canvasCard.style.borderRadius = "calc(var(--os-window-border-radius) / 2)";
        canvasCard.style.overflow = "hidden";

        this.canvas = document.createElement("canvas");
        this.canvas.classList.add("full");

        canvasCard.appendChild(this.canvas);
        baseElement.appendChild(toolbar);
        baseElement.appendChild(canvasCard);

        setTimeout(() => this.setupCanvas(), 0);
        this.addEventListeners(baseElement);

        return baseElement;
    }
}

class PaintApp extends App {
    constructor() {
        super("Paint", "./icons/paint.png");
    }

    override launch() {
        const paintWindow = new DrawingWindow(200, 100, 600, 500);
        WindowManager.getInstance().registerWindow(paintWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), paintWindow.getUUID());
        this.windows.push(paintWindow);
    }
}

export default PaintApp;