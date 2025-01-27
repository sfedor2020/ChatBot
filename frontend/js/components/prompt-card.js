class PromptCard extends HTMLElement {
    constructor() {
        super();
    }

    set data(promptData) {
        this.render(promptData);
    }

    render(data) {
        const isFavorite = data.isFavorite || false;
        const isDefault = data.id.startsWith('example_'); // Vérifier s'il s'agit d'un prompt par défaut

        this.innerHTML = `
            <div class="bg-white bg-opacity-80 p-6 rounded-xl shadow-sm hover:shadow transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        ${isDefault ? `
                            <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 aria-label="Prompt par défaut">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                            </svg>
                        ` : ''}
                        <h3 class="font-medium text-gray-900">${data.title}</h3>
                    </div>
                    <button class="favorite-btn text-gray-400 hover:text-yellow-500 transition-colors ${isFavorite ? 'text-yellow-500' : ''}"
                            data-prompt-id="${data.id}"
                            aria-label="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
                            aria-pressed="${isFavorite}">
                        <svg class="w-5 h-5" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                    </button>
                </div>
                <p class="text-gray-700">${data.text}</p>
                ${data.category ? `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                        ${data.category}
                    </span>
                ` : ''}
                <div class="mt-3 flex justify-end">
                    <button class="use-prompt-btn text-blue-600 hover:text-blue-700 text-sm font-medium 
                                 transition-colors duration-200 flex items-center gap-1"
                            aria-label="Utiliser ce prompt">
                        Utiliser ce prompt
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Configuration des écouteurs d'événements
        this.setupEventListeners(data);
    }

    setupEventListeners(data) {
        // Écouteur pour le bouton favori
        this.querySelector('.favorite-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(data);
        });

        // Écouteur pour le bouton d'utilisation
        this.querySelector('.use-prompt-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.usePrompt(data.text);
        });
    }

    async toggleFavorite(promptData) {
        try {
            // Détection mobile
            const isMobile = window.innerWidth < 768;
            
            const response = await fetch('/api/prompts/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Mobile': isMobile
                },
                body: JSON.stringify({
                    promptId: promptData.id,
                    action: promptData.isFavorite ? 'remove' : 'add'
                })
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.error === 'FAVORITES_LIMIT_REACHED') {
                    alert(`Limite de favoris atteinte (${isMobile ? '3' : '6'} maximum). Retirez un favori avant d'en ajouter un nouveau.`);
                    return;
                }
                throw new Error(data.error);
            }

            // Mise à jour locale du statut favori
            promptData.isFavorite = !promptData.isFavorite;
            this.render(promptData);

            // Émission d'un événement pour notifier les composants parents
            this.dispatchEvent(new CustomEvent('favoriteToggled', {
                bubbles: true,
                detail: { 
                    promptId: promptData.id, 
                    isFavorite: promptData.isFavorite 
                }
            }));

            // Afficher le retour utilisateur
            this.showFeedback(promptData.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');

        } catch (error) {
            console.error('Erreur lors de la modification des favoris:', error);
            this.showFeedback('Erreur lors de la modification des favoris', true);
        }
    }

    usePrompt(promptText) {
        // Vérifier si nous sommes sur la page d'accueil ou la page des prompts
        const isIndexPage = window.location.pathname === '/' || window.location.pathname === '/chat';
        
        if (isIndexPage) {
            // Émission d'un événement pour utilisation directe dans le chat
            this.dispatchEvent(new CustomEvent('usePrompt', {
                bubbles: true,
                detail: { promptText }
            }));
        } else {
            // Redirection vers le chat avec le paramètre prompt
            window.location.href = `/?prompt=${encodeURIComponent(promptText)}`;
        }
    }

    showFeedback(message, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-opacity duration-300 ${
            isError ? 'bg-red-500' : 'bg-green-500'
        }`;
        feedback.textContent = message;
        feedback.setAttribute('role', 'alert');
        document.body.appendChild(feedback);

        // Animation de disparition
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }
}

// Enregistrement du composant personnalisé
customElements.define('prompt-card', PromptCard);