import { App } from "../modules/App";
import {  NotificationWindow } from "../modules/Window";

class AboutMeApp extends App {
    constructor() {
        super("About Me", "./icons/home.png");
    }
    
    override launch() {
        const text = `
            This is a webOS project created by me. 
            The project is open source and can be found on GitHub. The project was created for the Hackclub Flavortown event in just one day.
        `;

        let aboutMeWindow = new NotificationWindow(3, 3, this.getName(), text);
        aboutMeWindow.applyResize(300, 250);
        this.pushWindow(aboutMeWindow);
    }
}

export { AboutMeApp };