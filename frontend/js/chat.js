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
        // Retirer la position fixe existante et ajouter près de la zone de saisie
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'new-chat-btn-container';
        buttonContainer.innerHTML = `
            <button class="new-chat-btn" title="Nouvelle conversation">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span class="new-chat-label">Nouvelle conversation</span>
            </button>
        `;
        
        // Insérer le bouton avant le conteneur de messages
        const messageContainer = document.getElementById('chat-messages');
        messageContainer.parentNode.insertBefore(buttonContainer, messageContainer);

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

    cleanupExplanatorySections(text) {
        // Reconnaissance de motifs plus robuste pour les sections explicatives
        const patterns = [
            /\*\*Why it works[\s\S]*$/i,
            /\*\*Why this [\s\S]*$/i,
            /\*\*Sense of[\s\S]*$/i,
            /\*\*Dark[\s\S]*$/i,
            /\*\*Existential[\s\S]*$/i,
            /\*\*Specific[\s\S]*$/i,
            /\*\*Sisyphus[\s\S]*$/i,
            /\*\*PHP Specifics[\s\S]*$/i,
            /\*\*Irony[\s\S]*$/i,
            /Would you like me to[\s\S]*$/i,
            /Do you want me to[\s\S]*$/i,
            /BUT THOSE AER[\s\S]*$/i,
            /BUT THOSE ARE[\s\S]*$/i
        ];

        let cleanedText = text;
        for (const pattern of patterns) {
            cleanedText = cleanedText.replace(pattern, '');
        }
        
        // Supprimer les "---" à la fin des messages
        cleanedText = cleanedText.replace(/\s*---\s*$/, '');
        
        return cleanedText.trim();
    }

    formatModelName(model) {
        if (!model) return 'IA';
        
        // Extraire le nom du modèle et ajouter l'indication de taille
        if (model.toLowerCase().includes('gemma')) {
            return 'Gemma3: 4B';
        } else if (model.toLowerCase().includes('mistral')) {
            return 'Mistral: 7B';
        } else if (model.toLowerCase().includes('llama')) {
            return 'Llama3: 8B';
        }
        
        return model;
    }

    getFormattedTime() {
        const now = new Date();
        return now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderWithoutMarkdown(text) {
        // Gérer manuellement les cas spéciaux de markdown pour éviter le double formatage
        // Remplacer *texte* par <em>texte</em> mais laisser ** pour le gras tel quel
        let displayText = text;
        
        // Remplacer les astérisques isolés par un cas spécial (pas à l'intérieur des mots)
        displayText = displayText.replace(/(\s|^)\*([^\*]+)\*(\s|$|\.|\,|\;|\:|\!|\?)/g, '$1<em>$2</em>$3');
        
        return displayText;
    }

    addMessage(text, isUser = false, saveToConversation = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`;
        
        // Si ce n'est pas un message utilisateur, nettoyer les sections explicatives
        let displayText = text;
        let modelName = '';
        let messageTime = this.getFormattedTime();
        
        if (!isUser) {
            // Récupérer le nom du modèle depuis la conversation
            modelName = this.formatModelName(this.currentConversation.model);
            displayText = this.cleanupExplanatorySections(displayText);
            
            // Ne pas ajouter de "---" à la fin
        }
        
        // Traiter le texte pour l'affichage
        let processedText = isUser 
            ? displayText 
            : (typeof marked !== 'undefined' ? this.renderWithoutMarkdown(displayText) : displayText);
        
        messageDiv.innerHTML = `
            <div class="${isUser ? 
                'bg-blue-600 text-white' : 
                'bg-gray-100 text-gray-800'} 
                rounded-2xl px-5 py-3 max-w-[75%] break-words shadow-sm ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}">
                <div class="text-sm ${isUser ? 'text-blue-200' : 'text-gray-500'} mb-1">
                    ${isUser ? 'Vous' : modelName}
                </div>
                <div class="prose prose-sm">
                    ${processedText}
                </div>
                ${!isUser ? `
                <div class="flex items-center justify-between text-xs text-gray-400 mt-3 pt-2 border-t border-gray-200">
                    <span>${messageTime}</span>
                    <button class="copy-message p-1 hover:text-gray-600" title="Copier le message">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        this.chatContainer.appendChild(messageDiv);

        // Ajouter la fonctionnalité de copie pour les messages IA
        if (!isUser) {
            const copyButton = messageDiv.querySelector('.copy-message');
            if (copyButton) {
                copyButton.addEventListener('click', () => {
                    navigator.clipboard.writeText(displayText)
                        .then(() => {
                            // Afficher une infobulle temporaire
                            const tooltip = document.createElement('div');
                            tooltip.className = 'copy-tooltip';
                            tooltip.textContent = 'Copié!';
                            copyButton.appendChild(tooltip);
                            setTimeout(() => tooltip.remove(), 1500);
                        })
                        .catch(err => console.error('Erreur lors de la copie:', err));
                });
            }
        }

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
                    prompt: `Crée UN SEUL titre concis (2-7 mots) qui résume cette conversation.
                    IMPORTANT:
                    - N'utilise PAS de caractères spéciaux comme les astérisques (**) ou autres symboles
                    - Produis un titre complet, jamais de fragment comme "(ou..."
                    - Si la conversation porte sur une technologie spécifique, tu peux utiliser cette technologie comme préfixe
                    
                    Basé sur ces messages: "${userMessages.join(' | ')}"`,
                    isTitle: true
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }

            const data = await response.json();
            if (!data.error) {
                // Nettoyer seulement les caractères spéciaux problématiques
                let title = data.response || "Nouvelle conversation";
                
                // Supprimer les caractères spéciaux, mais pas les deux-points ou les tirets
                title = title.replace(/[*"'\[\](){}]/g, '');
                
                // Supprimer les fragments comme "(ou" en fin de titre
                title = title.replace(/\s*\([^)]*$/, '');
                
                // Supprimer les astérisques et symboles spéciaux
                title = title.replace(/\*+/g, '');
                
                // Nettoyer les espaces multiples et espaces en début/fin
                title = title.replace(/\s+/g, ' ').trim();
                
                // Si le titre est vide après nettoyage, utiliser un titre par défaut
                if (!title || title.length < 3) {
                    title = "Nouvelle conversation";
                }
                
                // Limiter à 7 mots maximum
                const words = title.split(/\s+/);
                if (words.length > 7) {
                    title = words.slice(0, 7).join(' ');
                }
                
                this.currentConversation.title = title;
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
        loadingDiv.className = 'flex justify-start mb-6';
        
        const modelName = this.formatModelName(this.currentConversation.model);
        
        loadingDiv.innerHTML = `
            <div class="bg-gray-100 text-gray-800 rounded-2xl px-5 py-3 shadow-sm rounded-tl-sm">
                <div class="flex items-center">
                    <div class="text-sm text-gray-500 model-name-loading">${modelName}</div>
                    <div class="loading-animation ml-3">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
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
                // Stocker les informations du modèle
                if (data.model) {
                    this.currentConversation.model = data.model;
                }
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