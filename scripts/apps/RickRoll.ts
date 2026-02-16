import { App } from "../modules/App";
import { IframeWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class RickRollApp extends App {
    
    constructor() {
        super("Rick Roll App", "https://www.rw-designer.com/icon-image/22109-256x256x32.png");
    }
    
    override launch() {
        let youtubeWindow = new IframeWindow(100, 100, 800, 600, "https://www.youtube.com/embed/dQw4w9WgXcQ", true, "Rick Roll");
        this.windows.push(youtubeWindow);

        WindowManager.getInstance().registerWindow(youtubeWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), youtubeWindow.getUUID());
        console.log(`[App] Launched app: ${this.getName()} with UUID: ${this.getUUID()}`);
    }
}

export default RickRollApp;