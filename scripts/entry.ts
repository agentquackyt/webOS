import AnnoCalculatorApp from "./apps/AnnoCalculator";
import BrowserApp from "./apps/Browser";
import CalculatorApp from "./apps/Calculator";
import PaintApp from "./apps/Drawing";
import { AboutMeApp } from "./apps/Misc";
import RickRollApp from "./apps/RickRoll";
import { App } from "./modules/App";
import { DesktopManager } from "./modules/DesktopManager";
import { TaskbarManager } from "./modules/TaskbarManager";
import { ContextMenuManager } from "./modules/ContextMenuManager";
import GrapherApp from "./apps/Grapher";

const lockScreenElement = document.getElementById("os-lock-screen");
const lockTimeElement = document.getElementById("lock-time");
const lockDateElement = document.getElementById("lock-date");
let isLocked = true;

function setupWindows() {
    // Initialize TaskbarManager and ContextMenuManager
    TaskbarManager.getInstance();
    ContextMenuManager.getInstance();
    
    const testApp = new App("Test App");
    const aboutMeApp = new AboutMeApp();
    const rickRollApp = new RickRollApp();
    const annoCalculatorApp = new AnnoCalculatorApp();
    const calculatorApp = new CalculatorApp();
    const browserApp = new BrowserApp();
    const paintApp = new PaintApp();
    const grapherApp = new GrapherApp();

    DesktopManager.getInstance().registerApp(aboutMeApp);
    // DesktopManager.getInstance().registerApp(testApp);
    DesktopManager.getInstance().registerApp(rickRollApp);
    DesktopManager.getInstance().registerApp(calculatorApp);
    DesktopManager.getInstance().registerApp(browserApp);
    DesktopManager.getInstance().registerApp(paintApp);
    DesktopManager.getInstance().registerApp(grapherApp);
    DesktopManager.getInstance().registerApp(annoCalculatorApp);

    // window.dispatchEvent(new CustomEvent("webos-desktop", { detail: { uuid: aboutMeApp.getUUID(), action: "launch" } }));
}

function updateTime() {
    const timeElement = document.getElementById("current-time");
    const now = new Date();

    if (timeElement) {
        const timeString = now.toLocaleTimeString('en-us', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
        });
        timeElement.textContent = timeString;
    }

    if (lockTimeElement) {
        lockTimeElement.textContent = now.toLocaleTimeString('en-us', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    if (lockDateElement) {
        lockDateElement.textContent = now.toLocaleDateString('en-us', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
    }
}

function unlockDesktop(): void {
    if (!isLocked || !lockScreenElement) {
        return;
    }

    isLocked = false;
    lockScreenElement.classList.add("hidden");

    window.setTimeout(() => {
        lockScreenElement.remove();
    }, 330);
}

function setupLockScreen(): void {
    if (!lockScreenElement) {
        isLocked = false;
        return;
    }

    lockScreenElement.addEventListener("click", unlockDesktop);
    lockScreenElement.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === "Escape" || event.key === " ") {
            event.preventDefault();
            unlockDesktop();
        }
    });
}

setupWindows();
setupLockScreen();
updateTime();
setInterval(updateTime, 2500);