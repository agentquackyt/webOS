import { App } from "../modules/App";
import { TaskbarManager } from "../modules/TaskbarManager";
import { BasicWindow, WebosWindow } from "../modules/Window";
import { WindowManager } from "../modules/WindowManager";

class CalculatorWindow extends BasicWindow {


    constructor(x: number, y: number, width: number, height: number, resizable: boolean = true) {
        super(x, y, width, height, "Calculator" ,resizable);
    }

    addEventListeners(baseElement: HTMLElement) {
        const buttons = baseElement.querySelectorAll("button");
        const output = baseElement.querySelector(".card") as HTMLElement;

        let currentInput = "";
        let operator: string | null = null;
        let operand1: number | null = null;
        let tokens: string[] = [];
        let lastWasResult = false;

        buttons.forEach(button => {
            button.addEventListener("click", () => {
                const value = button.textContent;
                if (!value) return;

                if (/\d/.test(value) || value === ".") {
                    if (lastWasResult) {
                        currentInput = value === "." ? "0." : value;
                        lastWasResult = false;
                    } else {
                        currentInput += value;
                    }
                    if (tokens.length) {
                        output.textContent = tokens.join(" ") + " " + currentInput;
                    } else {
                        output.textContent = currentInput;
                    }
                } else if (["+", "-", "*", "/"].includes(value)) {
                    if (currentInput) {
                        tokens.push(currentInput);
                        tokens.push(value);
                        output.textContent = tokens.join(" ");
                        currentInput = "";
                        lastWasResult = false;
                    } else if (tokens.length) {
                        const last = tokens[tokens.length - 1];
                        if (["+", "-", "*", "/"].includes(last as string)) {
                            tokens[tokens.length - 1] = value;
                        } else {
                            tokens.push(value);
                        }
                        output.textContent = tokens.join(" ");
                    }
                } else if (value === "=") {
                    if (currentInput) tokens.push(currentInput);
                    if (tokens.length) {
                        const expr = tokens.join(" ");
                        try {
                            // evaluate using JS to respect operator precedence
                            // tokens only come from button input so this is safe here
                            // eslint-disable-next-line no-new-func
                            const result = Function('"use strict"; return (' + expr + ')')();
                            output.textContent = result.toString();
                            currentInput = result.toString();
                            tokens = [];
                            operator = null;
                            operand1 = null;
                            lastWasResult = true;
                        } catch (e) {
                            output.textContent = "Error";
                            currentInput = "";
                            tokens = [];
                        }
                    }
                }
            });
        });
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }
        const calculatorOutput = document.createElement("div");
        calculatorOutput.classList.add("card", "flex-grow");
        calculatorOutput.textContent = "0";
        baseElement.appendChild(calculatorOutput);

        // add 4 rows of buttons
        const buttons = [
            ["7", "8", "9", "/"],
            ["4", "5", "6", "*"],
            ["1", "2", "3", "-"],
            ["0", ".", "=", "+"]
        ];

        buttons.forEach(row => {
            const rowElement = document.createElement("div");
            rowElement.classList.add("row", "flex-grow");

            row.forEach(buttonText => {
                const button = document.createElement("button");
                button.classList.add("full");
                button.textContent = buttonText;
                rowElement.appendChild(button);
            });

            baseElement.appendChild(rowElement);
        });
        this.addEventListeners(baseElement);
        return baseElement;
    }
}

class CalculatorApp extends App {
    constructor() {
        super("Calculator", "https://upload.wikimedia.org/wikipedia/commons/3/30/Calculator_Image.png");
    }

    override launch() {
        const calculatorWindow = new CalculatorWindow(100, 100, 300, 400);
        WindowManager.getInstance().registerWindow(calculatorWindow);
        TaskbarManager.getInstance().registerWindow(this.getUUID(), calculatorWindow.getUUID());
        this.windows.push(calculatorWindow);
    }
}

export default CalculatorApp;