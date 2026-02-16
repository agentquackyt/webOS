import { App } from "../modules/App";
import { TaskbarManager } from "../modules/TaskbarManager";
import { BasicWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";

class BrowserWindow extends BasicWindow {
    private iframe: HTMLIFrameElement | null = null;
    private input: HTMLInputElement | null = null;
    private backButton: HTMLButtonElement | null = null;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height, "Web Browser", true, { maximize: true, minimize: false });
    }

    private navigate(url: string) {
        if (!this.iframe || !this.input) return;

        let formattedUrl = url;
        // Basic protocol handler
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
            formattedUrl = "https://" + formattedUrl;
        }

        this.iframe.src = formattedUrl;
        // We update the input immediately to show what we are trying to load
        this.input.value = formattedUrl;
    }

    addEventListeners(goButton: HTMLButtonElement,  input: HTMLInputElement) {
        // --- Navigation ---
        goButton.addEventListener("click", () => {
            this.navigate(input.value);
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.navigate(input.value);
            }
        });

        // --- URL Bar Updates ---
        // Note: This often triggers "SecurityError: Blocked a frame with origin..." 
        // if the iframe is on a different domain (like Wikipedia) due to SOP.
        if (this.iframe) {
            this.iframe.addEventListener("load", () => {
                try {
                    // Check if contentWindow exists and isn't about:blank
                    if (this.iframe?.contentWindow && this.iframe.contentWindow.location.href !== "about:blank") {
                        const currentUrl = this.iframe.contentWindow.location.href;
                        this.input!.value = currentUrl;
                        console.log("Navigated to:", currentUrl);
                    }
                } catch (e) {
                    // 99% of external sites will trigger this.
                    // We can't read the URL, so we leave the user's input as is.
                    console.warn("Security restriction: Cannot read URL from external domain.");
                }
            });
        }
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }

        // 1. Navigation Bar
        const navRow = document.createElement("div");
        navRow.classList.add("row");
        navRow.style.flexGrow = "0"; // Keep height fixed

        // URL Input
        this.input = document.createElement("input");
        this.input.type = "text";
        this.input.classList.add("card", "flex-grow");
        this.input.style.border = "none";
        this.input.style.outline = "none";
        this.input.style.padding = "0.75rem";
        this.input.placeholder = "https://example.com";

        // Go Button
        const goButton = document.createElement("button");
        goButton.textContent = "Go";
        goButton.style.width = "auto";
        goButton.style.minWidth = "50px";

        navRow.appendChild(this.input);
        navRow.appendChild(goButton);

        // 2. Iframe Area
        const iframeContainer = document.createElement("div");
        iframeContainer.classList.add("card", "flex-grow");
        iframeContainer.style.padding = "0";
        iframeContainer.style.overflow = "hidden";
        iframeContainer.style.position = "relative"; // Ensure relative positioning for absolute children

        this.iframe = document.createElement("iframe");
        this.iframe.classList.add("full");
        this.iframe.style.border = "none";
        // Switched default to Wikipedia (Google blocks iframes via X-Frame-Options)
        this.iframe.src = "https://www.wikipedia.org";
        this.input.value = this.iframe.src;

        iframeContainer.appendChild(this.iframe);

        baseElement.appendChild(navRow);
        baseElement.appendChild(iframeContainer);

        this.addEventListeners(goButton, this.input);

        return baseElement;
    }
}

class BrowserApp extends App {
    constructor() {
        super("Browser", "./icons/browser.png");
    }

    override launch() {
        // Create a reasonably sized window for browsing
        const browserWindow = new BrowserWindow(150, 50, 800, 600);
        WindowManager.getInstance().registerWindow(browserWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), browserWindow.getUUID());

        this.windows.push(browserWindow);
    }
}

export default BrowserApp;