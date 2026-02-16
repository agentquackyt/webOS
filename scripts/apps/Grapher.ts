import { App } from "../modules/App";
import { BasicWindow } from "../modules/Window";

class GrapherWindow extends BasicWindow {
    private canvas: HTMLCanvasElement | undefined;
    private ctx: CanvasRenderingContext2D | undefined;
    private input: HTMLInputElement | undefined;
    
    // Viewport state
    private scale: number = 40; // Pixels per unit
    private offsetX: number = 0;
    private offsetY: number = 0;
    
    // Renamed to avoid conflict with BasicWindow's 'isDragging'
    private isGraphDragging: boolean = false; 
    
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    constructor(x: number, y: number, width: number, height: number, resizable: boolean = true) {
        super(x, y, width, height, "Graphing Calculator", resizable);
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }

        // 1. Create the Input Area
        const inputContainer = document.createElement("div");
        inputContainer.classList.add("row");

        const label = document.createElement("span");
        label.textContent = "y = ";
        label.style.width = "50px";
        label.classList.add("center");

        this.input = document.createElement("input");
        this.input.type = "text";
        this.input.value = "sin(x)"; // Default demo equation
        this.input.style.fontFamily = "monospace";
        this.input.placeholder = "Enter equation (e.g., x * x)";

        const plotBtn = document.createElement("button");
        plotBtn.textContent = "Plot";

        inputContainer.appendChild(label);
        inputContainer.appendChild(this.input);
        inputContainer.appendChild(plotBtn);
        baseElement.appendChild(inputContainer);

        // 2. Create the Canvas Area
        const canvasContainer = document.createElement("div");
        canvasContainer.style.flexGrow = "1";
        canvasContainer.style.position = "relative";
        canvasContainer.style.overflow = "hidden";
        canvasContainer.style.height = "100%"; 

        this.canvas = document.createElement("canvas");
        this.canvas.style.display = "block";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        
        canvasContainer.appendChild(this.canvas);
        baseElement.appendChild(canvasContainer);

        // Initialize Context
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        // 3. Attach Listeners
        this.addEventListeners(plotBtn);
        
        // Initial Draw using a ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
            this.draw();
        });
        resizeObserver.observe(canvasContainer);

        return baseElement;
    }

    private resizeCanvas() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }
    }

    private addEventListeners(plotBtn: HTMLButtonElement) {
        if (!this.input || !this.canvas) return;
        
        // Redraw on input change
        const triggerDraw = () => this.draw();
        plotBtn.addEventListener("click", triggerDraw);
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") triggerDraw();
        });

        // Mouse Controls for Panning
        this.canvas.addEventListener("mousedown", (e) => {
            this.isGraphDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas!.style.cursor = "grabbing";
            // Stop propagation so the window itself doesn't start dragging
            e.stopPropagation(); 
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.isGraphDragging) return;
            
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.draw();
        });

        window.addEventListener("mouseup", () => {
            this.isGraphDragging = false;
            if (this.canvas) this.canvas.style.cursor = "default";
        });

        // Zoom Control
        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent scrolling parent containers
            
            const zoomIntensity = 0.1;
            const wheel = e.deltaY < 0 ? 1 : -1;
            const zoomFactor = Math.exp(wheel * zoomIntensity);
            
            this.scale *= zoomFactor;
            this.draw();
        });
    }

    private draw() {
        if (!this.ctx || !this.canvas || !this.input) return;

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Calculate center based on offsets
        const cx = width / 2 + this.offsetX;
        const cy = height / 2 + this.offsetY;

        // Clear background
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0, width, height);

        // Draw Grid
        this.drawGrid(width, height, cx, cy);

        // Draw Axes
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = 2;
        // X Axis
        this.ctx.moveTo(0, cy);
        this.ctx.lineTo(width, cy);
        // Y Axis
        this.ctx.moveTo(cx, 0);
        this.ctx.lineTo(cx, height);
        this.ctx.stroke();

        // Draw Function
        this.ctx.beginPath();
        this.ctx.strokeStyle = "blue";
        this.ctx.lineWidth = 2;

        let firstPoint = true;
        const expression = this.input.value;

        // Create function logic
        let func: Function | null = null;
        try {
            const mathKeys = Object.getOwnPropertyNames(Math);
            const args = ["x", ...mathKeys, "return " + expression + ";"];
            // eslint-disable-next-line
            const factory = Function.constructor.apply(null, args);
            // Apply Math constants to the factory
            const mathValues = mathKeys.map(k => (Math as any)[k]);
            func = (x: number) => factory.apply(null, [x, ...mathValues]);
        } catch (e) {
            return; 
        }

        if (func) {
            // Iterate over pixels across the screen width
            for (let px = 0; px < width; px++) {
                // Convert Pixel X -> Math X
                const x = (px - cx) / this.scale;
                
                try {
                    const y = func(x);
                    if (typeof y === 'number' && isFinite(y)) {
                        // Convert Math Y -> Pixel Y (Inverted Y axis)
                        const py = cy - (y * this.scale);
                        
                        if (firstPoint) {
                            this.ctx.moveTo(px, py);
                            firstPoint = false;
                        } else {
                            this.ctx.lineTo(px, py);
                        }
                    } else {
                        firstPoint = true; // Handle discontinuities
                    }
                } catch (e) {
                    // Ignore runtime math errors
                }
            }
        }
        this.ctx.stroke();
    }

    private drawGrid(w: number, h: number, cx: number, cy: number) {
        if (!this.ctx) return;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#e7e6e6";
        this.ctx.lineWidth = 1;

        const startX = cx % this.scale;
        for (let x = startX; x < w; x += this.scale) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
        }

        const startY = cy % this.scale;
        for (let y = startY; y < h; y += this.scale) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
        }
        this.ctx.stroke();
    }
}

class GrapherApp extends App {
    constructor() {
        super("Graphing Calculator", "./icons/calculator.png");
    }

    override launch() {
        const grapherWindow = new GrapherWindow(100, 100, 600, 450);
        this.pushWindow(grapherWindow);
    }
}

export default GrapherApp;