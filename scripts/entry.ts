import MarsIncApp from "./apps/MarsIncApp";
import BrowserApp from "./apps/Browser";
import CalculatorApp from "./apps/Calculator";
import PaintApp from "./apps/Drawing";
import { AboutMeApp } from "./apps/AboutMe";
import RickRollApp from "./apps/RickRoll";
import { DesktopManager } from "./modules/DesktopManager";
import { TaskbarManager } from "./modules/TaskbarManager";
import { ContextMenuManager } from "./modules/ContextMenuManager";
import GrapherApp from "./apps/Grapher";
import { SettingsManager } from "./modules/Settings";
import { GamesHubApp } from "./apps/GamesHub";
import { SettingsApp } from "./apps/SettingsApp";
import AnnoApp from "./apps/AnnoCalculator";

const lockScreenElement = document.getElementById("os-lock-screen");
const lockTimeElement = document.getElementById("lock-time");
const lockDateElement = document.getElementById("lock-date");
let isLocked = true;

function setupWindows() {
    // Initialize TaskbarManager and ContextMenuManager
    SettingsManager.getInstance();
    TaskbarManager.getInstance();
    ContextMenuManager.getInstance();

    DesktopManager.getInstance().registerApp(new AboutMeApp());
    DesktopManager.getInstance().registerApp(new SettingsApp());
    DesktopManager.getInstance().registerApp(new RickRollApp());
    DesktopManager.getInstance().registerApp(new AnnoApp());
    DesktopManager.getInstance().registerApp(new BrowserApp());
    DesktopManager.getInstance().registerApp(new PaintApp());
    DesktopManager.getInstance().registerApp(new CalculatorApp());
    DesktopManager.getInstance().registerApp(new GrapherApp());
    DesktopManager.getInstance().registerApp(new MarsIncApp());
    DesktopManager.getInstance().registerApp(new GamesHubApp());

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