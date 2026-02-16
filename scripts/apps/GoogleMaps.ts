import { App } from "../modules/App";
import { IframeWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class GoogleMapsApp extends App {
    
    constructor() {
        super("Google Maps", "https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282015-2020%29.svg");
    }
    
    override launch() {
        let youtubeWindow = new IframeWindow(100, 100, 800, 600, "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10720.803723093837!2d2.291587104788591!3d48.857385744409974!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sEiffel%20Tower!5e0!3m2!1sen!2sde!4v1771251366784!5m2!1sen!2sde", true, "Google Maps");
        this.windows.push(youtubeWindow);

        WindowManager.getInstance().registerWindow(youtubeWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), youtubeWindow.getUUID());
        console.log(`[App] Launched app: ${this.getName()} with UUID: ${this.getUUID()}`);
    }
}

export default GoogleMapsApp;