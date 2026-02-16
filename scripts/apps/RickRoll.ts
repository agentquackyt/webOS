import { App } from "../modules/App";
import { IframeWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class RickRollApp extends App {
    
    constructor() {
        //super("Rick Roll App", "https://www.rw-designer.com/icon-image/22109-256x256x32.png");
        super("Rick Roll App", "./icons/star.png");
    }
    
    override launch() {
        let youtubeWindow = new IframeWindow(100, 100, 800, 600, "https://www.youtube.com/embed/dQw4w9WgXcQ", true, "Rick Roll");
        this.pushWindow(youtubeWindow);
    }
}

export default RickRollApp;