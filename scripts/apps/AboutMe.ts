import { App } from "../modules/App";
import { DesktopManager } from "../modules/DesktopManager";
import { BasicWindow, NotificationWindow } from "../modules/Window";


interface DataItem {
    name: string;
    title: string;
    text: string;
}

class DataWindow extends BasicWindow {
    private data: any;

    constructor( title: string, data: DataItem[]) {
        super(100, 100, 750, 530, title, true, {maximize: true, minimize: true});
        this.data = data;
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }
        const wrapper = document.createElement("div");
        wrapper.classList.add("row", "full", "gap-md");

        const sidebar = document.createElement("section");
        sidebar.classList.add("card", "column");
        sidebar.style.minWidth = "100px";

        const main = document.createElement("section");
        main.classList.add("full");

        let first = true;
        for (const item of this.data) {
            const sidebarButton = document.createElement("button");
            sidebarButton.textContent = item.name;
            sidebar.appendChild(sidebarButton);

            const container = document.createElement("div");
            container.classList.add("column");
            const titleElement = document.createElement("h2");
            titleElement.textContent = item.title;
            container.appendChild(titleElement);

            const textElement = document.createElement("p");
            textElement.innerHTML = item.text;
            container.appendChild(textElement);

            first ? first = false : container.style.display = "none";
            sidebarButton.addEventListener("click", () => {
                main.querySelectorAll("div").forEach(div => div.style.display = "none");
                container.style.display = "flex";
            });
            main.appendChild(container);
        }

        wrapper.appendChild(sidebar);
        wrapper.appendChild(main);
        baseElement?.appendChild(wrapper);
        return baseElement!;
    }
}
class AboutMeApp extends App {
    constructor() {
        super("Home", "./icons/home.png");
    }
    
    override launch() {
        const apps = "<ul><li>" + DesktopManager.getInstance().getApps().join("</li><li>") + "</li></ul>";

        const data: DataItem[] = [
            { name: "About", title: "About this project", text: "QuackOS is a desktop-in-the-browser that turns a web page into a small operating system. It includes a window manager, taskbar, and a set of built-in apps that run in draggable windows. The project is written in TypeScript and built with Bun, keeping the codebase fast and hackable. Apps are modular, so you can add new ones by creating an app module and registering it at startup. This app was created for the Hackclub Flavortown event. The app is a demonstration of a webOS-like interface built with TypeScript and CSS." },
            { name: "Source Code", title: "Source Code", text: "The source code for this app can be found on GitHub: <a href='https://github.com/agentquackyt/webOS'>https://github.com/agentquackyt/webOS</a>" },
            { name: 'Desktop', title: "Desktop", text: "The desktop is the main area where you can see your app icons and launch them. You can drag icons around to rearrange them, and the positions will be saved for the next time you visit. Double-click an app icon to launch it." },
            { name: 'Taskbar', title: "Taskbar", text: "The taskbar at the bottom shows your currently open apps and allows you to switch between them. You can pin your favorite apps to the taskbar for easy access, and they will stay there even after you close them." },
            { name: 'Apps', title: "Apps", text: "Apps are the programs that run in windows on your desktop. You can open multiple windows for the same app, and they will be grouped together in the taskbar. <br><br> These apps are currently installed: " + apps }
        ];

        let aboutMeWindow = new DataWindow(this.getName(), data);
        this.pushWindow(aboutMeWindow);
    }
}

export { AboutMeApp };