import { App } from "../modules/App";
import { BasicWindow } from "../modules/Window";
import { SettingsManager } from "../modules/Settings";

interface PixabayImage {
    id: number;
    previewURL: string;
    webformatURL: string;
    largeImageURL: string;
    tags: string;
}

interface PixabayResponse {
    total: number;
    totalHits: number;
    hits: PixabayImage[];
}

class SettingsWindow extends BasicWindow {
    private static readonly PIXABAY_API_KEY = "20464197-9c980b731a3beda7659c5954a";
    private static readonly RATE_LIMIT = 5; // requests per minute
    private static requestTimes: number[] = [];

    constructor(width: number, height: number) {
        super(100, 100, width, height, "Settings", true, { maximize: true, minimize: true });
    }

    private static canMakeRequest(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove old timestamps
        this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
        
        return this.requestTimes.length < this.RATE_LIMIT;
    }

    private static recordRequest(): void {
        this.requestTimes.push(Date.now());
    }

    private async searchPixabay(query: string): Promise<PixabayImage[]> {
        if (!SettingsWindow.canMakeRequest()) {
            throw new Error("Rate limit exceeded. Please wait a minute before searching again.");
        }

        const url = `https://pixabay.com/api/?key=${SettingsWindow.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20`;
        
        SettingsWindow.recordRequest();
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`[SettingsWindow] Pixabay API error: ${response.status} ${response.statusText}`);
            throw new Error("Failed to fetch images from Pixabay");
        }

        const data: PixabayResponse = await response.json();
        return data.hits;
    }

    private createBackgroundSection(): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("column", "gap-md", "full");

        // Title
        const title = document.createElement("h2");
        title.textContent = "Background";
        container.appendChild(title);

        // Current Background Preview & Actions
        const currentBg = SettingsManager.getInstance().getSettings().background;
        const previewSection = document.createElement("div");
        previewSection.classList.add("card", "column", "gap-sm");
        
        const previewLabel = document.createElement("h3");
        previewLabel.textContent = "Current Wallpaper";
        previewSection.appendChild(previewLabel);

        const previewContainer = document.createElement("div");
        previewContainer.style.width = "100%";
        previewContainer.style.height = "200px";
        previewContainer.style.borderRadius = "8px";
        previewContainer.style.backgroundColor = "#333"; // Fallback color
        previewContainer.style.backgroundSize = "cover";
        previewContainer.style.backgroundPosition = "center";
        previewContainer.style.border = "1px solid var(--os-window-border-color)";
        
        if (currentBg) {
             previewContainer.style.backgroundImage = `url(${currentBg})`;
        } else {
            previewContainer.style.display = "flex";
            previewContainer.style.alignItems = "center";
            previewContainer.style.justifyContent = "center";
            previewContainer.textContent = "No Wallpaper Set";
            previewContainer.style.opacity = "0.5";
        }
        previewSection.appendChild(previewContainer);

        // Action Buttons Row
        const actionButtons = document.createElement("div");
        actionButtons.classList.add("row", "gap-sm");
        
        const setNewButton = document.createElement("button");
        setNewButton.textContent = "Set New Wallpaper";
        setNewButton.classList.add("flex-grow");

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.classList.add("flex-grow");
        removeButton.disabled = !currentBg;

        const defaultButton = document.createElement("button");
        defaultButton.textContent = "Reset";
        defaultButton.classList.add("flex-grow");

        actionButtons.appendChild(setNewButton);
        actionButtons.appendChild(removeButton);
        actionButtons.appendChild(defaultButton);
        previewSection.appendChild(actionButtons);
        container.appendChild(previewSection);

        // --- Hidden Selection Area ---
        const selectionArea = document.createElement("div");
        selectionArea.classList.add("column", "gap-sm");
        selectionArea.style.display = "none";
        selectionArea.style.borderTop = "1px solid var(--os-window-border-color)";
        selectionArea.style.paddingTop = "0.75rem";
        selectionArea.style.marginTop = "0.25rem";

        // URL + Search in one row
        const inputsRow = document.createElement("div");
        inputsRow.classList.add("row", "gap-md");
        inputsRow.style.alignItems = "flex-end";

        // URL column
        const urlSection = document.createElement("div");
        urlSection.classList.add("column", "gap-sm");
        urlSection.style.flex = "1";

        const urlLabel = document.createElement("p");
        urlLabel.textContent = "Paste URL";
        urlLabel.style.fontSize = "0.8rem";
        urlLabel.style.opacity = "0.7";
        urlLabel.style.margin = "0";
        urlSection.appendChild(urlLabel);

        const urlInputRow = document.createElement("div");
        urlInputRow.classList.add("row", "gap-sm");

        const urlInput = document.createElement("input");
        urlInput.type = "text";
        urlInput.placeholder = "https://example.com/image.jpg";
        urlInput.classList.add("flex-grow");
        urlInputRow.appendChild(urlInput);

        const applyUrlButton = document.createElement("button");
        applyUrlButton.textContent = "Apply";
        applyUrlButton.addEventListener("click", () => {
            const url = urlInput.value.trim();
            if (url) {
                this.applyBackground(url);
                this.refreshPreview(previewContainer, removeButton);
                urlInput.value = "";
            }
        });
        urlInputRow.appendChild(applyUrlButton);
        urlSection.appendChild(urlInputRow);

        // Search column
        const searchSection = document.createElement("div");
        searchSection.classList.add("column", "gap-sm");
        searchSection.style.flex = "1";

        const searchLabel = document.createElement("p");
        searchLabel.textContent = "Search Pixabay";
        searchLabel.style.fontSize = "0.8rem";
        searchLabel.style.opacity = "0.7";
        searchLabel.style.margin = "0";
        searchSection.appendChild(searchLabel);

        const searchRow = document.createElement("div");
        searchRow.classList.add("row", "gap-sm");

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Nature, space, abstract...";
        searchInput.classList.add("flex-grow");
        searchRow.appendChild(searchInput);

        const searchButton = document.createElement("button");
        searchButton.textContent = "Search";
        searchRow.appendChild(searchButton);
        searchSection.appendChild(searchRow);

        inputsRow.appendChild(urlSection);
        inputsRow.appendChild(searchSection);
        selectionArea.appendChild(inputsRow);

        // Status message (below the row)
        const statusMessage = document.createElement("p");
        statusMessage.style.fontSize = "0.8rem";
        statusMessage.style.opacity = "0.7";
        statusMessage.style.margin = "0";
        selectionArea.appendChild(statusMessage);

        // Results container (full width, below inputs)
        const resultsContainer = document.createElement("div");
        resultsContainer.classList.add("column", "gap-sm");
        selectionArea.appendChild(resultsContainer);

        previewSection.appendChild(selectionArea);


        // --- Event Listeners ---

        setNewButton.addEventListener("click", () => {
            if (selectionArea.style.display === "none") {
                selectionArea.style.display = "flex";
                setNewButton.classList.add("active"); // Optional styling
            } else {
                selectionArea.style.display = "none";
                setNewButton.classList.remove("active");
            }
        });

        removeButton.addEventListener("click", () => {
            this.applyBackground("");
            this.refreshPreview(previewContainer, removeButton);
        });

        defaultButton.addEventListener("click", () => {
            this.applyBackground(""); 
            this.refreshPreview(previewContainer, removeButton);
        });

        // Search event listeners
        const performSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) return;

            statusMessage.textContent = "Searching...";
            statusMessage.style.color = "inherit";
            resultsContainer.innerHTML = "";
            searchButton.disabled = true;

            try {
                const images = await this.searchPixabay(query);
                
                if (images.length === 0) {
                    statusMessage.textContent = "No images found.";
                    searchButton.disabled = false;
                    return;
                }

                statusMessage.textContent = `Found ${images.length} images`;
                
                // Create grid of images
                const grid = document.createElement("div");
                grid.style.display = "grid";
                grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(100px, 1fr))"; // Smaller grid
                grid.style.gap = "0.5rem";
                
                images.forEach(image => {
                    const imageCard = document.createElement("div");
                    imageCard.classList.add("card");
                    imageCard.style.cursor = "pointer";
                    imageCard.style.padding = "0";
                    imageCard.style.overflow = "hidden";
                    imageCard.style.position = "relative";
                    imageCard.style.transition = "transform 0.2s";
                
                    const img = document.createElement("img");
                    img.src = image.previewURL;
                    img.alt = image.tags;
                    img.style.width = "100%";
                    img.style.height = "80px"; // Smaller height
                    img.style.objectFit = "cover";
                    img.style.display = "block";
                    
                    imageCard.appendChild(img);
                    
                    imageCard.addEventListener("mouseenter", () => {
                        imageCard.style.transform = "scale(1.05)";
                        imageCard.style.zIndex = "1";
                    });
                    
                    imageCard.addEventListener("mouseleave", () => {
                        imageCard.style.transform = "scale(1)";
                        imageCard.style.zIndex = "0";
                    });
                    
                    imageCard.addEventListener("click", () => {
                        this.applyBackground(image.largeImageURL);
                        this.refreshPreview(previewContainer, removeButton);
                        statusMessage.textContent = `Applied: ${image.tags}`;
                        statusMessage.style.opacity = "1";
                        // Do NOT close — user may want to pick another image
                    });
                    
                    grid.appendChild(imageCard);
                });
                
                resultsContainer.appendChild(grid);
                searchButton.disabled = false;
                
            } catch (error) {
                statusMessage.textContent = error instanceof Error ? error.message : "An error occurred";
                statusMessage.style.color = "var(--os-error-color)";
                searchButton.disabled = false;
            }
        };

        searchButton.addEventListener("click", performSearch);
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                performSearch();
            }
        });

        return container;
    }

    private refreshPreview(container: HTMLElement, removeInfo: HTMLButtonElement): void {
        const currentBg = SettingsManager.getInstance().getSettings().background;
        if (currentBg) {
             container.style.backgroundImage = `url(${currentBg})`;
             container.textContent = "";
             removeInfo.disabled = false;
        } else {
            container.style.backgroundImage = "";
            container.style.display = "flex";
            container.style.alignItems = "center";
            container.style.justifyContent = "center";
            container.textContent = "No Wallpaper Set";
            container.style.opacity = "0.5";
            removeInfo.disabled = true;
        }
    }

    private createThemeSection(): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("column", "gap-md");

        const title = document.createElement("h2");
        title.textContent = "Theme Settings";
        container.appendChild(title);

        const description = document.createElement("p");
        description.textContent = "Customize the appearance of your desktop.";
        description.style.opacity = "0.8";
        container.appendChild(description);

        const placeholder = document.createElement("div");
        placeholder.classList.add("card");
        placeholder.textContent = "More theme options (colors, icon packs) coming soon.";
        container.appendChild(placeholder);

        return container;
    }

    private applyBackground(url: string): void {
        // updateSetting calls applyCssSettings which correctly wraps in url() and handles removal
        SettingsManager.getInstance().updateSetting("background", url);
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }

        const wrapper = document.createElement("div");
        wrapper.classList.add("row", "full", "gap-md");

        // Sidebar navigation
        const sidebar = document.createElement("section");
        sidebar.classList.add("card", "column");
        sidebar.style.minWidth = "120px";

        const main = document.createElement("section");
        main.classList.add("full", "column");
        main.style.overflowY = "auto";

        // Settings sections
        const sections = [
            { name: "Background", content: this.createBackgroundSection() },
            { name: "Theme", content: this.createThemeSection() }
        ];

        let first = true;
        for (const section of sections) {
            const sidebarButton = document.createElement("button");
            sidebarButton.textContent = section.name;
            sidebar.appendChild(sidebarButton);

            first ? first = false : section.content.style.display = "none";
            
            sidebarButton.addEventListener("click", () => {
                main.querySelectorAll("div.column.gap-md, div.column.full").forEach(div => {
                    if (div.parentElement === main) {
                        (div as HTMLElement).style.display = "none";
                    }
                });
                section.content.style.display = "flex";
            });
            
            main.appendChild(section.content);
        }

        wrapper.appendChild(sidebar);
        wrapper.appendChild(main);
        baseElement?.appendChild(wrapper);
        
        return baseElement!;
    }
}


export class SettingsApp extends App {
    constructor() {
        super("Settings", "./icons/settings.png");
    }

    override launch() {
        const settingsWindow = new SettingsWindow(800, 600);
        this.pushWindow(settingsWindow);
    }
}