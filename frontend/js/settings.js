class SettingsManager {
    constructor() {
        this.form = document.getElementById('settings-form');
        this.temperatureInput = document.getElementById('temperature');
        this.tempValue = document.getElementById('temp-value');
        this.resetBtn = document.getElementById('reset-btn');

        // Paramètres par défaut
        this.defaultSettings = {
            model: 'mistral',
            temperature: 0.7,
            maxLength: 500,
            systemPrompt: 'Vous êtes un assistant IA serviable.',
            theme: 'light',
            saveHistory: true
        };

        this.setupEventListeners();
        this.loadSettings();
    }

    async loadSettings() {
        try {
            // Charger les paramètres du serveur
            const response = await fetch('/api/settings');
            const serverSettings = await response.json();

            // Charger les paramètres locaux
            const localSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');

            // Fusionner les paramètres, en privilégiant les paramètres locaux pour les préférences UI
            const settings = {
                ...this.defaultSettings,
                ...serverSettings,
                ...localSettings
            };

            this.applySettings(settings);
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            // Utiliser les paramètres par défaut en cas d'erreur
            this.applySettings(this.defaultSettings);
        }
    }

    applySettings(settings) {
        // Appliquer aux champs du formulaire
        document.getElementById('model-select').value = settings.model;
        this.temperatureInput.value = settings.temperature;
        this.tempValue.textContent = settings.temperature;
        document.getElementById('max-length').value = settings.maxLength;
        document.getElementById('system-prompt').value = settings.systemPrompt;
        document.getElementById('theme').value = settings.theme;
        document.getElementById('save-history').checked = settings.saveHistory;

        // Appliquer le thème
        this.applyTheme(settings.theme);
    }

    applyTheme(theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
    }

    setupEventListeners() {
        // Curseur de température
        this.temperatureInput.addEventListener('input', (e) => {
            this.tempValue.textContent = e.target.value;
        });

        // Changements de thème
        document.getElementById('theme').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });

        // Bouton de réinitialisation
        this.resetBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous réinitialiser tous les paramètres ?')) {
                localStorage.removeItem('userSettings');
                this.applySettings(this.defaultSettings);
            }
        });

        // Soumission du formulaire
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSettings();
        });
    }

    async saveSettings() {
        try {
            const formData = new FormData(this.form);
            
            // Préparer les objets de paramètres
            const serverSettings = {
                model: formData.get('model'),
                temperature: parseFloat(formData.get('temperature')),
                max_length: parseInt(formData.get('maxLength')),
                system_prompt: formData.get('systemPrompt')
            };

            const userSettings = {
                theme: formData.get('theme'),
                saveHistory: formData.get('saveHistory') === 'on'
            };

            // Sauvegarder sur le serveur
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverSettings)
            });

            if (!response.ok) {
                throw new Error('Échec de la sauvegarde des paramètres serveur');
            }

            // Sauvegarder dans le localStorage
            localStorage.setItem('userSettings', JSON.stringify(userSettings));

            // Afficher le message de succès
            alert('Paramètres sauvegardés avec succès');

        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            alert('Erreur lors de la sauvegarde des paramètres');
        }
    }

    // Fonction utilitaire pour valider les paramètres
    validateSettings(settings) {
        if (settings.temperature < 0 || settings.temperature > 1) {
            throw new Error('La température doit être comprise entre 0 et 1');
        }
        if (settings.maxLength < 100 || settings.maxLength > 2000) {
            throw new Error('La longueur maximale doit être comprise entre 100 et 2000');
        }
        return true;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});