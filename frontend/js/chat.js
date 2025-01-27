class ChatUI {
    constructor() {
        this.messageInput = document.querySelector('textarea[placeholder="Posez votre question..."]');
        this.sendButton = document.querySelector('button.bg-blue-600');
        this.chatContainer = document.getElementById('chat-messages');
        this.isFirstMessage = true;
        
        // Initialisation de l'état de la conversation
        this.currentConversation = this.loadCurrentConversation() || {
            id: Date.now(),
            timestamp: Date.now(),
            title: "Nouvelle conversation",
            messages: [],
            lastUpdated: Date.now()
        };
        
        if (!this.messageInput || !this.sendButton || !this.chatContainer) {
            console.error('Éléments requis du chat non trouvés');
            return;
        }
        
        this.setupEventListeners();
        this.addNewChatButton();
        this.displayExistingMessages();
        this.checkUrlForPrompt();
    }

    setupEventListeners() {
        // Envoi du message lors du clic sur le bouton
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Envoi du message avec Entrée (mais pas avec Shift+Entrée)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Redimensionnement automatique de la zone de texte
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });

        // Sauvegarde de la conversation avant de quitter la page
        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });

        // Écoute des événements d'utilisation des prompts
        document.addEventListener('usePrompt', (e) => {
            this.handlePromptUse(e.detail.promptText);
        });
    }

    async handlePromptUse(promptText) {
        // Démarrer une nouvelle conversation
        await this.startNewConversation();
        
        // Définir le texte du prompt dans la zone de saisie
        this.messageInput.value = promptText;
        
        // Envoyer le message
        this.sendMessage();
    }

    checkUrlForPrompt() {
        const urlParams = new URLSearchParams(window.location.search);
        const prompt = urlParams.get('prompt');
        
        if (prompt) {
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Utiliser le prompt
            this.handlePromptUse(decodeURIComponent(prompt));
        }
    }

    addNewChatButton() {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'fixed top-20 right-4 z-40';
        buttonContainer.innerHTML = `
            <button class="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
            </button>
        `;
        document.body.appendChild(buttonContainer);

        buttonContainer.querySelector('button').addEventListener('click', () => this.startNewConversation());
    }

    async startNewConversation() {
        // Sauvegarder la conversation actuelle sur le serveur si elle contient des messages
        if (this.currentConversation.messages.length > 0) {
            try {
                // Ajouter la date et l'heure si manquantes
                if (!this.currentConversation.timestamp) {
                    this.currentConversation.timestamp = Date.now();
                }
                
                await fetch('/api/conversations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.currentConversation)
                });
            } catch (error) {
                console.error('Erreur lors de la sauvegarde de la conversation:', error);
            }
        }

        // Réinitialiser la conversation courante avec date et heure
        this.currentConversation = {
            id: Date.now(),
            timestamp: Date.now(),
            title: "Nouvelle conversation",
            messages: [],
            lastUpdated: Date.now()
        };

        // Vider le conteneur de chat et le localStorage
        this.chatContainer.innerHTML = '';
        this.isFirstMessage = true;
        this.saveToLocalStorage();

        // Réafficher le conteneur de prompts sur mobile
        if (window.innerWidth <= 768) {
            const promptsContainer = document.getElementById('prompts-container');
            if (promptsContainer) {
                promptsContainer.style.display = 'grid';
            }
        }
    }

    loadCurrentConversation() {
        const saved = localStorage.getItem('currentConversation');
        return saved ? JSON.parse(saved) : null;
    }

    saveToLocalStorage() {
        localStorage.setItem('currentConversation', JSON.stringify(this.currentConversation));
    }

    displayExistingMessages() {
        if (this.currentConversation.messages.length > 0) {
            this.currentConversation.messages.forEach(msg => {
                this.addMessage(msg.text, msg.isUser, false);
            });
            // Masquer les prompts sur mobile s'il y a des messages
            if (window.innerWidth <= 768) {
                const promptsContainer = document.getElementById('prompts-container');
                if (promptsContainer) {
                    promptsContainer.style.display = 'none';
                }
            }
        }
    }

    addMessage(text, isUser = false, saveToConversation = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
        
        messageDiv.innerHTML = `
            <div class="${isUser ? 
                'bg-blue-600 text-white' : 
                'bg-gray-200 text-gray-800'} 
                rounded-lg px-4 py-2 max-w-[70%] break-words shadow-sm">
                ${text}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);

        // Gestion du premier message sur mobile
        if (isUser && this.isFirstMessage && window.innerWidth <= 768) {
            this.isFirstMessage = false;
            const promptsContainer = document.getElementById('prompts-container');
            if (promptsContainer) {
                promptsContainer.style.display = 'none';
            }
        }

        // Défilement automatique vers le nouveau message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // Sauvegarder le message dans la conversation s'il est nouveau
        if (saveToConversation) {
            this.currentConversation.messages.push({
                text,
                isUser,
                timestamp: Date.now()
            });
            this.currentConversation.lastUpdated = Date.now();
            this.saveToLocalStorage();

            // Générer le titre après 5 messages utilisateur maximum
            const userMessages = this.currentConversation.messages.filter(m => m.isUser);
            if (isUser && userMessages.length <= 5) {
                this.generateConversationTitle();
            }
        }

        return messageDiv;
    }

    async generateConversationTitle() {
        const userMessages = this.currentConversation.messages
            .filter(m => m.isUser)
            .map(m => m.text)
            .slice(0, 5);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `Créez un titre concis (3-5 mots) qui résume le sujet principal de cette conversation, basé sur ces messages: "${userMessages.join(' | ')}"`,
                    isTitle: true
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }

            const data = await response.json();
            if (!data.error) {
                this.currentConversation.title = data.response || "Nouvelle conversation";
                this.saveToLocalStorage();
            } else {
                console.error('Erreur lors de la génération du titre:', data.error);
            }
        } catch (error) {
            console.error('Erreur lors de la génération du titre:', error);
        }
    }

    addLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'flex justify-start mb-4';
        
        loadingDiv.innerHTML = `
            <div class="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 shadow-sm">
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(loadingDiv);
        loadingDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return loadingDiv;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Effacer la zone de saisie et réinitialiser sa hauteur
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        // Ajouter le message utilisateur au chat
        this.addMessage(message, true);

        // Ajouter l'indicateur de chargement
        const loadingIndicator = this.addLoadingIndicator();

        try {
            // Envoyer au backend avec le contexte et les identifiants appropriés
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: message,
                    conversationId: this.currentConversation.id,
                    timestamp: this.currentConversation.timestamp,
                    context: this.currentConversation.messages.slice(-4) // 4 derniers messages pour le contexte
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }

            const data = await response.json();
            
            // Supprimer l'indicateur de chargement
            loadingIndicator.remove();
            
            if (data.error) {
                console.error('Erreur serveur:', data.error);
                this.addMessage(`Erreur: ${data.error}`, false);
            } else {
                this.addMessage(data.response || data.text || 'Aucune réponse reçue', false);
            }
        } catch (error) {
            // Supprimer l'indicateur de chargement
            loadingIndicator.remove();
            
            console.error('Erreur de chat:', error);
            this.addMessage('Erreur: Impossible d\'envoyer le message', false);
        }
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new ChatUI();
});