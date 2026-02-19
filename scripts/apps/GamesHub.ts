import { App } from "../modules/App";
import { BasicWindow, NotificationWindow, WebosWindow } from "../modules/Window";

const games = [
    {
        id: 1,
        name: "TikTakToe",
        description: "Play a game of TikTakToe against a friend. Try to get three in a row before your opponent does!",
    },
    {
        id: 2,
        name: "Dice Roller",
        description: "Roll a virtual die and see what number you get. Perfect for board games or just for fun!",
    },
    {
        id: 3,
        name: "Blackjack",
        description: "Beat the dealer to 21 without going bust. Classic casino card game!",
    }
];

class GameSelectWindow extends BasicWindow {
    private ref: GamesHubApp;

    constructor(x: number, y: number, width: number, height: number, ref: GamesHubApp) {
        super(x, y, width, height, "Select a Game", false, { maximize: false, minimize: true });
        this.ref = ref as GamesHubApp;
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }
        baseElement.classList.add('no-padding'); // Add padding to the base element for better spacing
        const container = document.createElement('div');
        container.classList.add('full', 'column', 'card', 'gap-sm');

        for (const game of games) {
            const gameCard = document.createElement('div');
            // Applying both 'row' and 'card' for layout and styling
            gameCard.classList.add('row', 'card', 'contrast');
            gameCard.style.cursor = 'pointer';
            gameCard.style.padding = '1rem';

            const img = document.createElement('img');
            img.src = `./icons/game_${game.id}.png`;
            img.alt = `${game.name} Icon`;
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.marginRight = '1rem';
            gameCard.appendChild(img);
            
            const info = document.createElement('div');
            info.classList.add('flex-grow'); // Allows text to take up available space
            info.innerHTML = `
                <h3>${game.name}</h3>
                <p style="opacity: 0.8; font-size: 0.9rem;">${game.description}</p>
            `;

            gameCard.appendChild(info);

            gameCard.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents double-triggering if the card also has a listener
                this.ref.triggerLaunchWithArgs(game.id);
            });

            container.appendChild(gameCard);
        }

        baseElement?.appendChild(container);
        return baseElement!;
    }
}

class TikTakToeWindow extends BasicWindow {
    private board: string[][];
    private currentPlayer: 'X' | 'O';
    private callbackOnMatchEnd?: (result: string) => void;

    constructor(x: number, y: number, width: number, height: number, callbackOnMatchEnd?: (result: string) => void) {
        super(x, y, width, height, "TikTakToe", false, { maximize: false, minimize: true });
        this.callbackOnMatchEnd = callbackOnMatchEnd;
        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.currentPlayer = 'X';
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        const table = document.createElement('div');
        table.style.display = 'grid';
        table.style.gridTemplateColumns = 'repeat(3, 1fr)';
        table.style.gridTemplateRows = 'repeat(3, 1fr)';
        table.style.gap = '5px';
        table.style.width = '100%';
        table.style.height = '100%';

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cell = document.createElement('div');
                cell.style.cursor = 'pointer';
                cell.style.fontSize = '2em';
                cell.style.fontWeight = 'bold';
                cell.classList.add('card', 'center');
                cell.addEventListener('click', () => this.makeMove(i, j, cell));
                table.appendChild(cell);
            }
        }

        baseElement?.appendChild(table);
        return baseElement!;
    }

    private makeMove(row: number, col: number, cell: HTMLElement): void {
        // @ts-ignore
        if (this.board[row][col] !== '') return;
        // @ts-ignore
        this.board[row][col] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer === 'X' ? 'text-red' : 'text-blue');

        if (this.checkWin()) {
            setTimeout(() => {
                this.callbackOnMatchEnd?.(`${this.currentPlayer} wins!`);
                WebosWindow.closeWindow(this.getUUID());
            }, 100);
        } else if (this.checkDraw()) {
            setTimeout(() => {
                this.callbackOnMatchEnd?.("It's a draw!");
                WebosWindow.closeWindow(this.getUUID());
            }, 100);
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        }
    }

    private checkWin(): boolean {
        const b = this.board as any;
        for (let i = 0; i < 3; i++) {
            if (b[i][0] && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return true;
            if (b[0][i] && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return true;
        }
        if (b[0][0] && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return true;
        if (b[0][2] && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return true;

        return false;
    }

    private checkDraw(): boolean {
        return this.board.every(row => row.every(cell => cell !== ''));
    }

}


interface Card {
    suit: string;
    value: string;
}

class BlackjackWindow extends BasicWindow {
    private deck: Card[] = [];
    private playerHand: Card[] = [];
    private dealerHand: Card[] = [];
    private gameOver = false;

    private dealerArea!: HTMLElement;
    private playerArea!: HTMLElement;
    private statusEl!: HTMLElement;
    private hitBtn!: HTMLButtonElement;
    private standBtn!: HTMLButtonElement;
    private dealBtn!: HTMLButtonElement;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height, "Blackjack", false, { maximize: false, minimize: true });
    }

    private buildDeck(): void {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];

        for (const suit of suits) {
            for (const value of values) {
                this.deck.push({ suit, value });
            }
        }

        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.deck[i];
            // @ts-ignore
            this.deck[i] = this.deck[j];
            // @ts-ignore
            this.deck[j] = temp;
        }
    }

    private handTotal(hand: Card[]): number {
        let total = 0;
        let aces = 0;
        for (const card of hand) {
            if (card.value === 'A') {
                aces++;
                total += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                total += 10;
            } else {
                total += parseInt(card.value);
            }
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }

    private drawCard(): Card {
        return this.deck.pop()!;
    }

    private renderCard(card: Card, hidden = false): HTMLElement {
        const isRed = ['♥', '♦'].includes(card.suit);
        const el = document.createElement('div');

        // Base card styling using element properties
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.justifyContent = 'space-between';
        el.style.width = '60px';
        el.style.height = '90px';
        el.style.borderRadius = '6px';
        el.style.padding = '4px 5px';
        el.style.fontSize = '12px';
        el.style.fontWeight = 'bold';
        el.style.border = '1px solid rgba(128, 128, 128, 0.4)';
        el.style.background = 'var(--os-header-background, #6e6e6e)';
        el.style.userSelect = 'none';

        if (hidden) {
            el.style.background = 'repeating-linear-gradient(45deg, #3a6, #3a6, #2a5 , #2a5)';
        } else {
            el.style.border = isRed ? '2px solid rgba(255, 0, 0, 0.63)' : '1px solid rgba(128, 128, 128, 0.4)';

            const top = document.createElement('span');
            top.style.color = isRed ? 'red' : 'var(--os-text-color)';

            top.textContent = `${card.value}${card.suit}`;

            const mid = document.createElement('span');
            mid.textContent = card.suit;
            mid.style.color = isRed ? 'red' : 'var(--os-text-color)';

            mid.style.textAlign = 'center';
            mid.style.fontSize = '1.2rem';

            const bot = document.createElement('span');
            bot.textContent = `${card.value}${card.suit}`;
            bot.style.color = isRed ? 'red' : 'var(--os-text-color)';
            bot.style.transform = 'rotate(180deg)';

            el.appendChild(top);
            el.appendChild(mid);
            el.appendChild(bot);
        }
        return el;
    }

    private renderHands(hideDealer: boolean): void {
        this.dealerArea.innerHTML = '';
        this.playerArea.innerHTML = '';

        this.dealerHand.forEach((card, i) => {
            this.dealerArea.appendChild(this.renderCard(card, hideDealer && i === 0));
        });

        this.playerHand.forEach(card => {
            this.playerArea.appendChild(this.renderCard(card));
        });
    }

    private dealGame(): void {
        this.buildDeck();
        this.playerHand = [this.drawCard(), this.drawCard()];
        this.dealerHand = [this.drawCard(), this.drawCard()];
        this.gameOver = false;

        this.hitBtn.disabled = false;
        this.standBtn.disabled = false;
        this.hitBtn.style.display = '';
        this.standBtn.style.display = '';
        this.dealBtn.style.display = 'none';

        this.renderHands(true);
        const total = this.handTotal(this.playerHand);

        if (total === 21) {
            this.endGame('Blackjack! You win!');
        } else {
            this.statusEl.textContent = `Your total: ${total}`;
        }
    }

    private hit(): void {
        if (this.gameOver) return;
        this.playerHand.push(this.drawCard());
        const total = this.handTotal(this.playerHand);
        this.renderHands(true);

        if (total > 21) {
            this.endGame(`Bust! You went over 21. Dealer wins. (Total: ${total})`);
        } else {
            this.statusEl.textContent = `Your total: ${total}`;
        }
    }

    private stand(): void {
        if (this.gameOver) return;
        while (this.handTotal(this.dealerHand) < 17) {
            this.dealerHand.push(this.drawCard());
        }

        this.renderHands(false);
        const p = this.handTotal(this.playerHand);
        const d = this.handTotal(this.dealerHand);

        if (d > 21) this.endGame(`Dealer busts! You win! (Dealer: ${d}, You: ${p})`);
        else if (d > p) this.endGame(`Dealer wins. (Dealer: ${d}, You: ${p})`);
        else if (p > d) this.endGame(`You win! (You: ${p}, Dealer: ${d})`);
        else this.endGame(`Push — it's a tie! (Both: ${p})`);
    }

    private endGame(message: string): void {
        this.gameOver = true;
        this.hitBtn.style.display = 'none';
        this.standBtn.style.display = 'none';
        this.dealBtn.style.display = 'block';
        this.renderHands(false);
        this.statusEl.textContent = message;
    }

    override content(baseElement?: HTMLElement): HTMLElement {
        if (!baseElement) {
            baseElement = this.createContentElement();
        }

        const gameArea = document.createElement('div');
        gameArea.classList.add('full', 'column');

        const dealerLabel = document.createElement('h3');
        dealerLabel.textContent = 'Dealer';

        this.dealerArea = document.createElement('div');
        this.dealerArea.classList.add('row');
        this.dealerArea.style.minHeight = '90px';
        this.dealerArea.style.alignItems = 'center';

        const playerLabel = document.createElement('h3');
        playerLabel.textContent = 'You';

        this.playerArea = document.createElement('div');
        this.playerArea.classList.add('row');
        this.playerArea.style.minHeight = '90px';
        this.playerArea.style.alignItems = 'center';

        this.statusEl = document.createElement('div');
        this.statusEl.style.minHeight = '2.4em';
        this.statusEl.style.fontWeight = 'bold';

        const btnRow = document.createElement('div');
        btnRow.classList.add('row', 'full');

        this.hitBtn = document.createElement('button');
        this.hitBtn.classList.add('width-full');
        this.hitBtn.textContent = 'Hit';
        this.hitBtn.addEventListener('click', () => this.hit());

        this.standBtn = document.createElement('button');
        this.standBtn.classList.add('width-full');
        this.standBtn.textContent = 'Stand';
        this.standBtn.addEventListener('click', () => this.stand());

        this.dealBtn = document.createElement('button');
        this.dealBtn.classList.add('width-full');
        this.dealBtn.textContent = 'Deal Again';
        this.dealBtn.style.display = 'none';
        this.dealBtn.addEventListener('click', () => this.dealGame());

        btnRow.appendChild(this.hitBtn);
        btnRow.appendChild(this.standBtn);
        btnRow.appendChild(this.dealBtn);

        gameArea.appendChild(dealerLabel);
        gameArea.appendChild(this.dealerArea);
        gameArea.appendChild(playerLabel);
        gameArea.appendChild(this.playerArea);
        gameArea.appendChild(this.statusEl);

        baseElement?.appendChild(gameArea);
        baseElement?.appendChild(btnRow);

        this.dealGame();
        return baseElement;
    }
}

class DiceRollerWindow extends BasicWindow {
    private diceCount: number = 1;
    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height, "Dice Roller", false, { maximize: false, minimize: true });
    }

    generateDiceSvg(value: number): string {
        const dotPositions = [
            [],
            [[1, 1]],
            [[0, 0], [2, 2]],
            [[0, 0], [1, 1], [2, 2]],
            [[0, 0], [0, 2], [2, 0], [2, 2]],
            [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
            [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]]
        ];

        // @ts-expect-error value is 1-6, but typescript doesn't know that
        const dots = dotPositions[value].map(pos => `<circle cx="${pos[0] * 15 + 15}" cy="${pos[1] * 15 + 15}" r="5" fill="var(--os-text-color)"/>`).join('');
        return `<svg style="border-radius: 10px; height: 80px; width: 80px;" width="80" height="80" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="60" fill="transparent" stroke="var(--os-text-color)" stroke-width="6" rx="10" ry="10" /><g>${dots}</g></svg>`;
    }

    override content(baseElement?: HTMLElement): HTMLElement {

        const wrapper = document.createElement('div');
        wrapper.classList.add('full', 'center');

        const buttonRow = document.createElement('div');
        buttonRow.classList.add('row', 'gap-sm');

        const rollButton = document.createElement('button');
        rollButton.textContent = "Roll Dice";

        const diceCountSelect = document.createElement('select');
        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i.toString();
            option.textContent = `${i} Dice`;
            diceCountSelect.appendChild(option);
        }
        diceCountSelect.addEventListener('change', () => {
            this.diceCount = parseInt(diceCountSelect.value);
        });
        rollButton.classList.add('full');

        buttonRow.appendChild(diceCountSelect);
        
        rollButton.addEventListener('click', () => {
            wrapper.innerHTML = '';
            let total = 0;
            let result = document.createElement('div');
            result.classList.add('row');
            for (let i = 0; i < this.diceCount; i++) {
                const value = Math.floor(Math.random() * 6) + 1;
                total += value;
                const diceSvg = this.generateDiceSvg(value);
                result.innerHTML += diceSvg;
                if (i == 2) {
                    wrapper.appendChild(result);
                    result = document.createElement('div');
                    result.classList.add('row');
                }
            }
            wrapper.appendChild(result);
            if(this.diceCount > 1) {
                const totalEl = document.createElement('p');
                totalEl.textContent = `Total: ${total}`;
                wrapper.appendChild(totalEl);
            }
        });
        buttonRow.appendChild(rollButton);
        baseElement?.appendChild(buttonRow);
        baseElement?.appendChild(wrapper);

        return baseElement!;
    }
}

class GamesHubApp extends App {
    private gameSelectWindow?: GameSelectWindow;
    constructor() {
        super("Games Hub", "./icons/game_3.png");
    }

    override launch() {
        const gameSelectWindow = new GameSelectWindow(100, 100, 430, 400, this);
        this.gameSelectWindow = gameSelectWindow;
        this.pushWindow(gameSelectWindow);
    }

    triggerLaunchWithArgs(gameId: number): void {
        switch (gameId) {
            case 1:
                const windowTikTakToe = new TikTakToeWindow(100, 100, 300, 330, (result) => {
                    let resultWindow = new NotificationWindow(3, 3, "TikTakToe", result);
                    resultWindow.applyResize(250, 150);
                    this.pushWindow(resultWindow);

                    // Automatically close the result window after 2 seconds
                    setTimeout(() => {
                        WebosWindow.closeWindow(resultWindow.getUUID());
                    }, 5000);
                });
                this.pushWindow(windowTikTakToe);
                break;
            case 2:
                const diceRollerWindow = new DiceRollerWindow(150, 150, 300, 330);
                this.pushWindow(diceRollerWindow);
                break;
            case 3:
                const blackjackWindow = new BlackjackWindow(150, 100, 400, 470);
                this.pushWindow(blackjackWindow);
                break;
            default:
                console.warn(`Unknown game ID: ${gameId}`);
        }

        // Close the game select window after launching a game
        if (this.gameSelectWindow) {
            WebosWindow.closeWindow(this.gameSelectWindow.getUUID());
            this.gameSelectWindow = undefined;
        }
    }
}

export { GamesHubApp };