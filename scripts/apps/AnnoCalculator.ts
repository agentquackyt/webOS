import { App } from "../modules/App";
import { IframeWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class AnnoApp extends App {
    
    constructor() {
        super("Anno Calculator", "./icons/anno.png");
    }
    
    override launch() {
        let youtubeWindow = new IframeWindow(100, 100, 400, 600, "https://anno-calculator.org/", true, "Anno Calculator (another project of mine)");
        this.pushWindow(youtubeWindow);
    }
}

export default AnnoApp;