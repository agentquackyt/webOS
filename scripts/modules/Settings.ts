
interface Settings {
    theme: 'device' | 'light' | 'dark';
    background: string;
    iconPack: 'default' | 'glass' | 'colorful';
}

const defaultSettings: Settings = {
    theme: 'device',
    background: '',
    iconPack: 'default'
};

class SettingsManager {
    private static instance: SettingsManager;
    private settings: Settings;


    constructor() {
        // Initialize settings here
        this.settings = defaultSettings;
        this.loadSettings();
        this.applyCssSettings(this.settings);
    }

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    private loadSettings(): void {
        const stored = localStorage.getItem('webos-settings');
        if (stored) {
            try {
                const settings = JSON.parse(stored);
                // Apply settings to the system
                this.settings = settings;
                this.applyCssSettings(this.settings);
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
    }

    public getSettings(): Settings {
        return this.settings;
    }

    public updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
        this.settings[key] = value
        localStorage.setItem('webos-settings', JSON.stringify(this.settings));
        this.applyCssSettings(this.settings);
    }

    private applyCssSettings(settings: Settings): void {
        // Apply settings to the system if not device theme or if background/icon pack is set
        if(settings.background !== '') document.documentElement.style.setProperty('--os-background', settings.background);
    }
}

export { SettingsManager };