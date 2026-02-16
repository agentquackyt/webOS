
abstract class WebosWindow {
    protected x: number;
    protected y: number;
    protected width: number | undefined;
    protected height: number | undefined;
    protected mainElement: HTMLElement;
    protected isHidden: boolean = false;
    protected UUID: string = crypto.randomUUID();
    protected resizable: boolean = false;
    private isDragging: boolean = false;
    private dragOffsetX: number = 0;
    private dragOffsetY: number = 0;
    private isResizing: boolean = false;
    private resizeStartX: number = 0;
    private resizeStartY: number = 0;
    private resizeStartWidth: number = 0;
    private resizeStartHeight: number = 0;

    constructor(x: number, y: number, width?: number, height?: number, resizable: boolean = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.resizable = resizable;
        this.mainElement = document.createElement("section");
        this.mainElement.classList.add("window");
    }

    abstract render(): HTMLElement;

    getUUID(): string { return this.UUID; }
    getElement(): HTMLElement { return this.mainElement; }
    isWindowHidden(): boolean { return this.isHidden; }

    close(): void {
        this.mainElement.remove();
    }

    minimize(): void {
        this.isHidden = true;
        this.mainElement.style.display = "none";
    }

    restore(): void {
        this.isHidden = false;
        this.mainElement.style.display = "block";
    }

    updatePosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.mainElement.style.left = `${x}px`;
        this.mainElement.style.top = `${y}px`;
    }

    protected enableDragging(header: HTMLElement): void {
        header.style.cursor = "move";

        const onMouseDown = (e: MouseEvent) => {
            // Don't start drag if clicking on buttons
            if ((e.target as HTMLElement).classList.contains("window-btn")) {
                return;
            }

            // Bring window to front
            const focusEvent = new CustomEvent("webos-window", {
                detail: { uuid: this.UUID, action: "focus" }
            });
            window.dispatchEvent(focusEvent);

            this.isDragging = true;
            this.dragOffsetX = e.clientX - this.x;
            this.dragOffsetY = e.clientY - this.y;

            // Prevent text selection during drag
            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!this.isDragging) return;

            const newX = e.clientX - this.dragOffsetX;
            const newY = e.clientY - this.dragOffsetY;

            this.updatePosition(newX, newY);
        };

        const onMouseUp = () => {
            this.isDragging = false;
        };

        header.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    protected enableResizing(): void {
        if (!this.resizable) return;

        const resizeHandle = document.createElement("div");
        resizeHandle.classList.add("window-resize-handle");
        this.mainElement.appendChild(resizeHandle);

        const onMouseDown = (e: MouseEvent) => {
            this.isResizing = true;
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeStartWidth = this.width || this.mainElement.offsetWidth;
            this.resizeStartHeight = this.height || this.mainElement.offsetHeight;
            e.preventDefault();
            e.stopPropagation();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!this.isResizing) return;

            const deltaX = e.clientX - this.resizeStartX;
            const deltaY = e.clientY - this.resizeStartY;

            const newWidth = Math.max(200, this.resizeStartWidth + deltaX);
            const newHeight = Math.max(150, this.resizeStartHeight + deltaY);

            this.width = newWidth;
            this.height = newHeight;
            this.mainElement.style.width = `${newWidth}px`;
            this.mainElement.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
            this.isResizing = false;
        };

        resizeHandle.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    static generateHeader(uuid: string, title: string, options = { maximize: true, minimize: true }): HTMLElement {
        const header = document.createElement("div");
        header.classList.add("window-header");
        header.dataset.uuid = uuid;

        const headerTitle = document.createElement("h3");
        headerTitle.textContent = title;
        header.appendChild(headerTitle);
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("window-btn-container");
        header.appendChild(buttonContainer);
        let closeButton = document.createElement("button"), minimizeButton = document.createElement("button"), maximizeButton = document.createElement("button");
        closeButton.classList.add("window-btn", "window-close");
        minimizeButton.classList.add("window-btn", "window-minimize");
        maximizeButton.classList.add("window-btn", "window-maximize");
        maximizeButton.disabled = true; // Placeholder for future functionality
        minimizeButton.disabled = !options.minimize;
        // Append actions to buttons
        closeButton.addEventListener("click", () => {
            const event = new CustomEvent("webos-window", { detail: { uuid, action: "close" } });
            window.dispatchEvent(event);
        });

        minimizeButton.addEventListener("click", () => {
            const event = new CustomEvent("webos-window", { detail: { uuid, action: "minimize" } });
            window.dispatchEvent(event);
        });

        buttonContainer.appendChild(closeButton);
        buttonContainer.appendChild(minimizeButton);
        buttonContainer.appendChild(maximizeButton);

        return header;
    }
}

class NotificationWindow extends WebosWindow {
    private title: string;
    private message: string;

    constructor(x: number, y: number, title: string, message: string, resizable: boolean = false) {
        super(x, y, undefined, undefined, resizable);
        this.title = title;
        this.message = message;
    }

    render(): HTMLElement {
        this.mainElement.style.position = "absolute";
        this.mainElement.style.left = `${this.x}px`;
        this.mainElement.style.top = `${this.y}px`;
        if (this.width !== undefined && this.height !== undefined) {
            this.mainElement.style.width = `${this.width}px`;
            this.mainElement.style.height = `${this.height}px`;
        }

        const header = WebosWindow.generateHeader(this.UUID, this.title, { maximize: false, minimize: false });
        this.mainElement.appendChild(header);

        // Enable dragging on the header
        this.enableDragging(header);

        const content = document.createElement("div");
        content.classList.add("window-content", "notification-content");
        content.textContent = this.message;
        this.mainElement.appendChild(content);
        this.enableResizing();


        return this.mainElement;
    }
}

class IframeWindow extends WebosWindow {
    private url: string;
    private title: string;

    constructor(x: number, y: number, width: number, height: number, url: string, resizable: boolean = true, title?: string) {
        super(x, y, width, height, resizable);
        this.url = url;
        this.title = title || url;
    }

    render(): HTMLElement {
        this.mainElement.style.position = "absolute";
        this.mainElement.style.left = `${this.x}px`;
        this.mainElement.style.top = `${this.y}px`;
        if (this.width !== undefined && this.height !== undefined) {
            this.mainElement.style.width = `${this.width}px`;
            this.mainElement.style.height = `${this.height}px`;
        }

        const iframe = document.createElement("iframe");
        iframe.src = this.url;
        iframe.style.width = "100%";
        iframe.style.height = "calc(100% - 30px)"; // Adjust for header height

        const header = WebosWindow.generateHeader(this.UUID, this.title);
        this.enableDragging(header);
        this.mainElement.appendChild(header);

        this.mainElement.appendChild(iframe);

        // Enable resizing if flag is set
        this.enableResizing();

        return this.mainElement;
    }
}

class BasicWindow extends WebosWindow {
    private title: string;
    private contentElement: HTMLElement | undefined;
    protected config: { maximize: boolean, minimize: boolean } = { maximize: true, minimize: true };

    constructor(x: number, y: number, width: number, height: number, title: string, resizable: boolean = true, config?: { maximize: boolean, minimize: boolean }) {
        super(x, y, width, height, resizable);
        this.title = title;
        if (config) {
            this.config = config;
        }
    }

    render(): HTMLElement {
        this.mainElement.style.position = "absolute";
        this.mainElement.style.left = `${this.x}px`;
        this.mainElement.style.top = `${this.y}px`;
        if (this.width !== undefined && this.height !== undefined) {
            this.mainElement.style.width = `${this.width}px`;
            this.mainElement.style.height = `${this.height}px`;
        }

        const header = WebosWindow.generateHeader(this.UUID, this.title, this.config);
        this.mainElement.appendChild(header);

        // Enable dragging on the header
        this.enableDragging(header);

        this.contentElement = this.createContentElement();
        this.contentElement = this.content(this.contentElement);
        this.mainElement.appendChild(this.contentElement);
        this.enableResizing();


        return this.mainElement;
    }

    createContentElement(): HTMLElement {
        const content = document.createElement("div");
        content.classList.add("window-content", "basic");
        return content;
    }

    /**
     * OVERRIDE THIS METHOD TO PROVIDE CONTENT FOR THE WINDOW. BY DEFAULT, IT RETURNS AN EMPTY DIV WITH THE "window-content" CLASS.
     * @returns HTMLElement
     */
    content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }
        return baseElement;
    }
}


export { WebosWindow, NotificationWindow, IframeWindow, BasicWindow };