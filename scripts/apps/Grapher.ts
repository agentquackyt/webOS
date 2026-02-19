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

    private isDarkMode: boolean = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Renamed to avoid conflict with BasicWindow's 'isDragging'
    private isGraphDragging: boolean = false; 
    
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    private hoverPixelX: number | null = null;

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

        let borderColor = this.isDarkMode ? "#848484" : "#e7e6e6";
        this.canvas.style.border = `1px solid ${borderColor}`;
        this.canvas.style.borderRadius = "0.5rem";
        
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

        // Hover tracking
        this.canvas.addEventListener("mousemove", (e) => {
            const rect = this.canvas!.getBoundingClientRect();
            const scaleX = this.canvas!.width / rect.width;
            this.hoverPixelX = (e.clientX - rect.left) * scaleX;
            if (!this.isGraphDragging) this.draw();
        });

        this.canvas.addEventListener("mouseleave", () => {
            this.hoverPixelX = null;
            this.draw();
        });

        // Zoom Control
        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent scrolling parent containers
            
            const zoomIntensity = 0.1;
            const wheel = e.deltaY < 0 ? 1 : -1;
            const zoomFactor = Math.exp(wheel * zoomIntensity);
            
            this.scale = Math.min(Math.max(this.scale * zoomFactor, 0.5), 1e7);
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

        // Get color scheme from prefers-color-scheme media query
        this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Clear background
        // get background color from CSS variable
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--os-window-content-background').trim() || (this.isDarkMode ? "#1e1e1e" : "#ffffff");
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.fillStyle = "";
        this.ctx.fillRect(0, 0, width, height);

        // Draw Grid
        this.drawGrid(width, height, cx, cy);

        // Draw Function  (axes are already drawn inside drawGrid)
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.isDarkMode ? "#00c8ff" : "#0000ff";
        this.ctx.lineWidth = 3;

        let firstPoint = true;
        const expression = this.input.value;

        // Create function logic
        let func: Function | null = null;
        try {
            // Replace ^ with ** for exponentiation
            const normalizedExpression = expression.replace(/\^/g, "**");
            const mathKeys = Object.getOwnPropertyNames(Math);
            const args = ["x", ...mathKeys, "return " + normalizedExpression + ";"];
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

        // Draw hover point
        if (this.hoverPixelX !== null && func) {
            const hx = this.hoverPixelX;
            const mathX = (hx - cx) / this.scale;
            try {
                const mathY = func(mathX);
                if (typeof mathY === 'number' && isFinite(mathY)) {
                    const hy = cy - mathY * this.scale;

                    // Dot on curve
                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.isDarkMode ? "#00c8ff" : "#0040ff";
                    this.ctx.arc(hx, hy, 5, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Crosshair lines
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.moveTo(hx, 0); this.ctx.lineTo(hx, height);
                    this.ctx.moveTo(0, hy); this.ctx.lineTo(width, hy);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);

                    // Tooltip box
                    const labelX = this.fmtLabel(parseFloat(mathX.toPrecision(6)));
                    const labelY = this.fmtLabel(parseFloat(mathY.toPrecision(6)));
                    const text = `x = ${labelX}\ny = ${labelY}`;
                    const lines = text.split('\n');
                    const fSize = 12;
                    const padding = 6;
                    const lineH = fSize + 4;
                    const boxW = Math.max(...lines.map(l => l.length)) * (fSize * 0.6) + padding * 2;
                    const boxH = lines.length * lineH + padding * 2 - 4;
 
                    let tx = hx + 12;
                    let ty = hy - boxH - 12;
                    if (tx + boxW > width) tx = hx - boxW - 12;
                    if (ty < 0) ty = hy + 12;

                    this.ctx.fillStyle = this.isDarkMode ? "rgba(30,30,30,0.88)" : "rgba(255,255,255,0.88)";
                    this.ctx.strokeStyle = this.isDarkMode ? "#555" : "#ccc";
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.roundRect(tx, ty, boxW, boxH, 4);
                    this.ctx.fill();
                    this.ctx.stroke();

                    this.ctx.fillStyle = this.isDarkMode ? "#dddddd" : "#222222";
                    this.ctx.font = `${fSize}px monospace`;
                    this.ctx.textBaseline = "top";
                    this.ctx.textAlign = "left";
                    lines.forEach((line, i) => {
                        this.ctx!.fillText(line, tx + padding, ty + padding + i * lineH);
                    });
                }
            } catch (_) { /* ignore */ }
        }
    }

    /** Returns a "nice" grid interval in math units that keeps ~80px between lines. */
    private getNiceInterval(): number {
        const targetPx = 80;
        const raw = targetPx / this.scale;
        if (!isFinite(raw) || raw <= 0) return 1;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        if (!isFinite(magnitude) || magnitude <= 0) return 1;
        const normalized = raw / magnitude;
        let nice: number;
        if (normalized < 1.5)      nice = 1;
        else if (normalized < 3.5) nice = 2;
        else if (normalized < 7.5) nice = 5;
        else                       nice = 10;
        const interval = nice * magnitude;
        return interval > 0 ? interval : 1;
    }

    /** Formats a math-axis value without floating-point noise. */
    private fmtLabel(v: number): string {
        if (v === 0) return "0";
        const s = parseFloat(v.toPrecision(10)).toString();
        return s;
    }

    private drawGrid(w: number, h: number, cx: number, cy: number) {
        if (!this.ctx) return;

        const interval = this.getNiceInterval();
        const stepPx   = interval * this.scale;

        const gridColor  = this.isDarkMode ? "#2e2e2e" : "#e7e6e6";
        const labelColor = this.isDarkMode ? "#888888" : "#555555";
        const axisColor  = this.isDarkMode ? "#838383" : "#000000";

        // ── Grid lines ────────────────────────────────────────────────────────
        this.ctx.beginPath();
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        const firstColMath = Math.ceil((-cx / this.scale) / interval) * interval;
        for (let v = firstColMath; v * this.scale + cx < w + stepPx; v += interval) {
            const px = cx + v * this.scale;
            this.ctx.moveTo(px, 0);
            this.ctx.lineTo(px, h);
        }

        // Horizontal grid lines
        const firstRowMath = Math.floor(((cy - h) / this.scale) / interval) * interval;
        for (let v = firstRowMath; cy - v * this.scale > -stepPx; v += interval) {
            const py = cy - v * this.scale;
            this.ctx.moveTo(0, py);
            this.ctx.lineTo(w, py);
        }
        this.ctx.stroke();

        // ── Axes ──────────────────────────────────────────────────────────────
        this.ctx.beginPath();
        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(0, cy);  this.ctx.lineTo(w, cy);   // x-axis
        this.ctx.moveTo(cx, 0); this.ctx.lineTo(cx, h);   // y-axis
        this.ctx.stroke();

        // ── Axis labels ───────────────────────────────────────────────────────
        const fontSize = 11;
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.fillStyle = labelColor;
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "center";

        const labelMargin = 4;
        // Clamp label positions so they stay inside the canvas
        const xLabelY = Math.min(Math.max(cy + labelMargin, labelMargin), h - fontSize - labelMargin);
        const yLabelX = Math.max(Math.min(cx + labelMargin, w - 40), labelMargin);

        // X-axis tick labels
        for (let v = firstColMath; v * this.scale + cx < w + stepPx; v += interval) {
            if (Math.abs(v) < interval * 0.01) continue; // skip 0 on x-axis
            const px = cx + v * this.scale;
            if (px < 0 || px > w) continue;
            // Short tick mark
            this.ctx.beginPath();
            this.ctx.strokeStyle = axisColor;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(px, cy - 4);
            this.ctx.lineTo(px, cy + 4);
            this.ctx.stroke();
            if (Math.round(v / interval) % 2 === 0) this.ctx.fillText(this.fmtLabel(v), px, xLabelY);
        }

        // Y-axis tick labels
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        for (let v = firstRowMath; cy - v * this.scale > -stepPx; v += interval) {
            if (Math.abs(v) < interval * 0.01) continue; // skip 0 on y-axis
            const py = cy - v * this.scale;
            if (py < 0 || py > h) continue;
            // Short tick mark
            this.ctx.beginPath();
            this.ctx.strokeStyle = axisColor;
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(cx - 4, py);
            this.ctx.lineTo(cx + 4, py);
            this.ctx.stroke();
            if (Math.round(v / interval) % 2 === 0) this.ctx.fillText(this.fmtLabel(v), yLabelX, py);
        }

        // Origin label
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.fillStyle = labelColor;
        this.ctx.fillText("0", cx + labelMargin, xLabelY);
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