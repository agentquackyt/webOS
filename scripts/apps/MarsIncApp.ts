import { App } from "../modules/App";
import { IframeWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class MarsIncApp extends App {
    
    constructor() {
        super("Mars Inc.", "./icons/rocket.png");
    }
    
    override launch() {
        let annoWindow = new IframeWindow(100, 100, 800, 650, "https://agentquackyt.github.io/Mars-Inc/", true, "Mars Inc. (My other flavortown project)");
        this.windows.push(annoWindow);

        WindowManager.getInstance().registerWindow(annoWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), annoWindow.getUUID());
        console.log(`[App] Launched app: ${this.getName()} with UUID: ${this.getUUID()}`);
    }
}

export default MarsIncApp;