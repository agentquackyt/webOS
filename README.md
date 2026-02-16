# QuackOS

webOS is a desktop-in-the-browser that treats the page like a small operating system. It focuses on giving users a full-screen environment with a taskbar, windows, and apps that feel native to the space. The goal is to make interaction feel immediate and tactile rather than like a collection of independent widgets, so the shell, window manager, and app modules all work together as one cohesive surface. This project is built with Bun and TypeScript and is designed to be fast, simple to understand, and easy to extend with new apps.

The architecture is intentionally modular. The entry script initializes desktop state, and wires in window and taskbar management. Each app is a TypeScript module that registers itself, exposes a launch routine, and relies on shared window primitives to control behavior such as sizing, focus, and z-order. Styling is layered across base library styles, OS chrome, and theme files so that visual changes can be made without touching the application logic. The docs folder contains the built output, which makes it easy to host the OS as a static site or preview it without a server.

## Building and Running

The project relies on Bun for dependency management, bundling, and serving. To get started with the development environment, first install the dependencies.

```bash
bun install
```

To start the development server, use the dev script. This will serve the application locally and watch for changes.

```bash
bun run dev
```

When you are ready to produce a production build, run the build script. This command uses Bun's bundler to compile the TypeScript entry point, minify the output, and place the resulting assets into the `docs` directory, making it ready for deployment to GitHub Pages or any static host. 

```bash
bun run build
```

## Creating a New App

Adding a new application involves creating a new module module that defines both the application logic and its window interface. The system uses a class-based structure where an `App` manages the lifecycle and launches `Window` instances.

First, create a new file in `scripts/apps/`, for example `scripts/apps/MyApp.ts`. You will need to define a window class that extends `BasicWindow` (or `WebosWindow` for more control) to handle the UI and event listeners.

```typescript
import { App } from "../modules/App";
import { BasicWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";
import { TaskbarManager } from "../modules/TaskbarManager";

class MyWindow extends BasicWindow {
    constructor() {
        // x, y, width, height, title
        super(100, 100, 400, 300, "My App");
    }

    // Override content to provide the DOM elements for the window body
    override content(): HTMLElement {
        // If content is not provided, create a container
        const container = document.createElement("div");
        container.textContent = "Hello from My App!";
        // Add your event listeners here or in a separate method
        return container;
    }
}
```

Next, define the application class itself by extending `App`. This class is responsible for the application's metadata (name, icon) and the `launch` method, which handles instantiating the window and registering it with the system managers.

```typescript
export default class MyApp extends App {
    constructor() {
        // App name and icon path
        super("My App", "./icons/my-app-icon.png");
    }

    override launch() {
        // Create the window instance
        const myWindow = new MyWindow();
        
        // Register the window with the Window Manager to handle rendering and focus
        WindowManager.getInstance().registerWindow(myWindow);
        
        // Link the window to the taskbar item for this app
        TaskbarManager.getInstance().registerWindow(this.getUUID(), myWindow.getUUID());
        
        // Track the window in the app's internal list
        this.windows.push(myWindow);
    }
}
```

Finally, register the new app in `scripts/entry.ts` so the desktop environment knows to load it during the boot sequence. Import your new class and add it to the registration list.

```typescript
// scripts/entry.ts
import MyApp from "./apps/MyApp";

// ... inside setupWindows() function
const myApp = new MyApp();
DesktopManager.getInstance().registerApp(myApp);
```

Once registered, the app will appear in the desktop environment, and clicking it will trigger the `launch()` method you defined.

