import { App } from "../modules/App";
import { IframeWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class AnnoCalculatorApp extends App {
    
    constructor() {
        super("Anno Calculator", "https://anno-calculator.org/style/anno_icon.png");
    }
    
    override launch() {
        let annoWindow = new IframeWindow(100, 100, 400, 650, "https://anno-calculator.org/", true, "Anno Calculator");
        this.windows.push(annoWindow);

        WindowManager.getInstance().registerWindow(annoWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), annoWindow.getUUID());
        console.log(`[App] Launched app: ${this.getName()} with UUID: ${this.getUUID()}`);
    }
}

export default AnnoCalculatorApp;