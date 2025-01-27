class PromptsHandler {
    constructor() {
        console.log('Initialisation du gestionnaire de prompts');
        this.promptsList = document.getElementById('prompts-list');
        this.form = document.getElementById('new-prompt-form');
        this.cancelButton = document.getElementById('cancel-edit');
        this.prompts = [];
        
        if (!this.promptsList) {
            console.error('Impossible de trouver l\'élément prompts-list');
            return;
        }
        
        this.loadPrompts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('Configuration des écouteurs d\'événements');
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleNewPrompt(e));
        }

        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => this.resetForm());
        }

        // Écouter les événements de basculement des favoris
        document.addEventListener('favoriteToggled', (e) => {
            this.handleFavoriteToggle(e.detail);
        });
    }

    async loadPrompts() {
        console.log('Chargement des prompts...');
        try {
            const response = await fetch('/api/prompts');
            if (!response.ok) {
                throw new Error('Échec du chargement des prompts');
            }
            
            this.prompts = await response.json();
            console.log('Prompts chargés:', this.prompts);
            
            this.promptsList.innerHTML = '';
            
            if (this.prompts.length === 0) {
                this.showEmptyState();
                return;
            }

            // Trier les prompts : favoris en premier, puis par titre
            const sortedPrompts = [...this.prompts].sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.title.localeCompare(b.title);
            });

            sortedPrompts.forEach(prompt => this.createPromptCard(prompt));

        } catch (error) {
            console.error('Échec du chargement des prompts:', error);
            this.showError();
        }
    }

    showEmptyState() {
        this.promptsList.innerHTML = `
            <div class="col-span-full text-center py-8">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <p class="text-lg font-medium text-gray-500">Aucun prompt créé</p>
                <p class="text-sm text-gray-400">Utilisez le formulaire pour créer votre premier prompt</p>
            </div>
        `;
    }

    createPromptCard(prompt) {
        const wrapper = document.createElement('div');
        wrapper.className = 'bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow';
        
        const promptCard = document.createElement('prompt-card');
        promptCard.dataset.promptId = prompt.id;
        promptCard.data = prompt;
        
        // Boutons d'action
        const actions = document.createElement('div');
        actions.className = 'flex gap-2 mt-4 border-t pt-4';
        actions.innerHTML = `
            <button class="edit-btn flex-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200">
                Modifier
            </button>
            <button class="delete-btn flex-1 text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200">
                Supprimer
            </button>
        `;

        // Ajouter les écouteurs d'événements aux boutons d'action
        actions.querySelector('.edit-btn').addEventListener('click', () => this.handleEdit(prompt));
        actions.querySelector('.delete-btn').addEventListener('click', () => this.handleDeletePrompt(prompt.id));

        wrapper.appendChild(promptCard);
        wrapper.appendChild(actions);
        this.promptsList.appendChild(wrapper);
    }

    async handleNewPrompt(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const promptId = formData.get('prompt-id');
        const promptData = {
            title: formData.get('prompt-title').trim(),
            category: formData.get('prompt-category').trim(),
            text: formData.get('prompt-text').trim()
        };

        if (!this.validatePromptData(promptData)) {
            this.showFeedback('Veuillez remplir tous les champs', true);
            return;
        }

        try {
            const url = promptId ? `/api/prompts/${promptId}` : '/api/prompts';
            const method = promptId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(promptData)
            });

            if (!response.ok) {
                throw new Error('Échec de la sauvegarde du prompt');
            }

            this.resetForm();
            await this.loadPrompts();
            this.showFeedback(promptId ? 'Prompt modifié avec succès' : 'Prompt sauvegardé avec succès');

        } catch (error) {
            console.error('Erreur lors de la sauvegarde du prompt:', error);
            this.showFeedback('Erreur lors de la sauvegarde du prompt', true);
        }
    }

    handleEdit(promptData) {
        // Remplir le formulaire avec les données du prompt
        document.getElementById('prompt-id').value = promptData.id;
        document.getElementById('prompt-title').value = promptData.title;
        document.getElementById('prompt-category').value = promptData.category;
        document.getElementById('prompt-text').value = promptData.text;
        
        // Afficher le bouton d'annulation
        this.cancelButton.classList.remove('hidden');
        
        // Faire défiler jusqu'au formulaire
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    resetForm() {
        this.form.reset();
        document.getElementById('prompt-id').value = '';
        this.cancelButton.classList.add('hidden');
    }

    async handleDeletePrompt(promptId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce prompt ?')) {
            return;
        }

        try {
            const response = await fetch(`/api/prompts/${promptId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Échec de la suppression du prompt');
            }

            await this.loadPrompts();
            this.showFeedback('Prompt supprimé avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression du prompt:', error);
            this.showFeedback('Erreur lors de la suppression du prompt', true);
        }
    }

    async handleFavoriteToggle({ promptId, isFavorite }) {
        try {
            const response = await fetch('/api/prompts/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Mobile': window.innerWidth < 768
                },
                body: JSON.stringify({
                    promptId: promptId,
                    action: isFavorite ? 'add' : 'remove'
                })
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.error === 'FAVORITES_LIMIT_REACHED') {
                    this.showFeedback(`Limite de favoris atteinte (${window.innerWidth < 768 ? '3' : '6'} maximum)`, true);
                    return;
                }
                throw new Error(data.error);
            }

            await this.loadPrompts();
            this.showFeedback(isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');

        } catch (error) {
            console.error('Erreur lors de la modification des favoris:', error);
            this.showFeedback('Erreur lors de la modification des favoris', true);
        }
    }

    validatePromptData(data) {
        return data.title && data.category && data.text;
    }

    showFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-opacity duration-300 ${
            isError ? 'bg-red-500' : 'bg-green-500'
        }`;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    showError() {
        this.promptsList.innerHTML = `
            <div class="col-span-full text-center text-red-600 bg-red-50 rounded-xl p-6">
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
    new PromptsHandler();
});