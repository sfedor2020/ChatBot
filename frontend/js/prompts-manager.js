class PromptsManager {
    constructor() {
        this.promptsContainer = document.getElementById('prompts-container');
        this.toggleButton = document.getElementById('toggle-prompts');
        this.toggleIcon = document.getElementById('toggle-icon');
        this.chatMessages = document.getElementById('chat-messages');
        this.isVisible = true;
 
        console.log('Gestionnaire de prompts initialisé');
        this.setupToggle();
        this.init();
    }
 
    setupToggle() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.isVisible = !this.isVisible;
                
                // Rotation de l'icône
                this.toggleIcon.style.transform = this.isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
                
                // Basculer la visibilité avec animation
                if (this.isVisible) {
                    this.promptsContainer.style.display = 'grid';
                    this.promptsContainer.style.maxHeight = this.promptsContainer.scrollHeight + 'px';
                    this.promptsContainer.style.opacity = '1';
                    this.promptsContainer.style.marginBottom = '2rem';
                    setTimeout(() => {
                        this.promptsContainer.style.maxHeight = 'none';
                    }, 300);
                } else {
                    this.promptsContainer.style.maxHeight = this.promptsContainer.scrollHeight + 'px';
                    setTimeout(() => {
                        this.promptsContainer.style.maxHeight = '0';
                        this.promptsContainer.style.opacity = '0';
                        this.promptsContainer.style.marginBottom = '0';
                        setTimeout(() => {
                            this.promptsContainer.style.display = 'none';
                        }, 300);
                    }, 10);
                }
            });
 
            // État initial
            this.promptsContainer.style.display = 'grid';
            this.promptsContainer.style.maxHeight = 'none';
            this.promptsContainer.style.opacity = '1';
            this.promptsContainer.style.overflow = 'hidden';
            this.promptsContainer.style.transition = 'all 0.3s ease-out';
            this.promptsContainer.style.marginBottom = '2rem';
        }
    }
 
    async init() {
        try {
            console.log('Démarrage de l\'initialisation...');
            const userPrompts = await this.loadUserPrompts();
            
            // Filtrer pour obtenir uniquement les favoris
            const favoritePrompts = userPrompts.filter(prompt => prompt.isFavorite);
            
            if (favoritePrompts.length > 0) {
                // S'il y a des prompts utilisateur favoris, afficher uniquement ceux-ci
                console.log('Affichage des prompts utilisateur favoris:', favoritePrompts);
                this.displayPrompts(favoritePrompts);
            } else {
                // Si aucun prompt utilisateur favori, afficher les prompts par défaut
                console.log('Aucun prompt utilisateur favori, chargement des prompts par défaut...');
                const defaultPrompts = await this.loadDefaultPrompts();
                this.displayPrompts(defaultPrompts);
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showError();
        }
    }
 
    async loadUserPrompts() {
        try {
            const response = await fetch('/api/prompts');
            if (!response.ok) {
                throw new Error('Échec du chargement des prompts utilisateur');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des prompts utilisateur:', error);
            return [];
        }
    }
 
    async loadDefaultPrompts() {
        try {
            const response = await fetch('/resources/json/default_prompts.json');
            if (!response.ok) {
                throw new Error('Échec du chargement des prompts par défaut');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des prompts par défaut:', error);
            return [];
        }
    }
 
    displayPrompts(prompts) {
        if (!this.promptsContainer) {
            console.error('Conteneur de prompts non trouvé');
            return;
        }
        
        this.promptsContainer.innerHTML = '';
        
        if (prompts.length === 0) {
            this.showEmptyState();
            return;
        }

        prompts.forEach(prompt => {
            const promptCard = document.createElement('prompt-card');
            promptCard.data = prompt;
            this.promptsContainer.appendChild(promptCard);
        });
    }

    showEmptyState() {
        this.promptsContainer.innerHTML = `
            <div class="col-span-full text-center text-gray-500 py-8">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <p class="text-lg font-medium">Aucun prompt favori</p>
                <p class="text-sm text-gray-400">Ajoutez des prompts aux favoris pour les voir ici</p>
            </div>
        `;
    }
 
    showError() {
        this.promptsContainer.innerHTML = `
            <div class="col-span-full p-6 text-center text-red-600 bg-red-50 rounded-xl">
                <svg class="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p class="text-lg font-medium">Erreur lors du chargement des prompts</p>
                <p class="text-sm text-red-500">Veuillez réessayer plus tard</p>
            </div>
        `;
    }
}
 
// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new PromptsManager();
});