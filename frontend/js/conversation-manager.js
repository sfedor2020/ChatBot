class ConversationManager {
    constructor() {
        this.historyContainer = document.getElementById('history-container');
        this.clearHistoryButton = document.getElementById('clear-history');
        this.conversations = [];

        this.setupEventListeners();
        this.loadConversations();
    }

    setupEventListeners() {
        if (this.clearHistoryButton) {
            this.clearHistoryButton.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
                    this.clearHistory();
                }
            });
        }
    }

    async loadConversations() {
        try {
            // Récupérer les conversations depuis le serveur au lieu du localStorage
            const response = await fetch('/api/conversations');
            if (!response.ok) {
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }
            
            this.conversations = await response.json();
            this.conversations.sort((a, b) => b.timestamp - a.timestamp); // Trier par date, plus récent d'abord
            this.displayConversations();
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
            this.showError();
        }
    }

    displayConversations() {
        if (!this.historyContainer) return;

        if (this.conversations.length === 0) {
            this.historyContainer.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    Aucune conversation enregistrée
                </div>
            `;
            return;
        }

        // Grouper les conversations par date
        const grouped = this.groupByDate(this.conversations);
        
        let html = '';
        for (const [date, convs] of Object.entries(grouped)) {
            html += `
                <div class="mb-8">
                    <h3 class="text-sm font-medium text-gray-500 mb-3">${date}</h3>
                    <div class="space-y-3">
                        ${convs.map(conv => this.createConversationCard(conv)).join('')}
                    </div>
                </div>
            `;
        }

        this.historyContainer.innerHTML = html;
        this.setupCardListeners();
    }

    groupByDate(conversations) {
        const groups = {};
        const today = new Date().toLocaleDateString('fr-FR');
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('fr-FR');

        conversations.forEach(conv => {
            const date = new Date(conv.timestamp);
            let dateStr = date.toLocaleDateString('fr-FR');
            
            if (dateStr === today) dateStr = 'Aujourd\'hui';
            else if (dateStr === yesterday) dateStr = 'Hier';
            
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(conv);
        });

        return groups;
    }

    getConversationPreview(conversation) {
        // Récupérer jusqu'à 5 premiers messages utilisateur pour l'aperçu
        return conversation.messages
            .filter(msg => msg.isUser)
            .slice(0, 5)
            .map(msg => msg.text)
            .join(' • ');
    }

    createConversationCard(conversation) {
        const date = new Date(conversation.timestamp);
        const time = date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        return `
            <div class="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow" 
                 data-conversation-id="${conversation.timestamp}">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-medium text-gray-900">${conversation.title || "Sans titre"}</p>
                        <p class="text-sm text-gray-500">${time}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="copy-btn text-gray-400 hover:text-gray-500" title="Copier la conversation">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                        </button>
                        <button class="delete-btn text-gray-400 hover:text-red-500" title="Supprimer la conversation">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="text-sm text-gray-600 line-clamp-2">
                    ${this.getConversationPreview(conversation)}
                </div>
            </div>
        `;
    }

    setupCardListeners() {
        const cards = this.historyContainer.querySelectorAll('[data-conversation-id]');
        cards.forEach(card => {
            const id = card.dataset.conversationId;
            
            card.querySelector('.copy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyConversation(id);
            });
            
            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteConversation(id);
            });

            card.addEventListener('click', () => {
                this.openConversation(id);
            });
        });
    }

    async copyConversation(id) {
        const conversation = this.conversations.find(c => c.timestamp.toString() === id.toString());
        if (!conversation) return;

        const text = conversation.messages
            .map(msg => `${msg.isUser ? 'Vous' : 'IA'}: ${msg.text}`)
            .join('\n');

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Conversation copiée');
        } catch (error) {
            console.error('Erreur lors de la copie dans le presse-papiers:', error);
            this.showToast('Erreur lors de la copie', true);
        }
    }

    async deleteConversation(id) {
        if (confirm('Voulez-vous supprimer cette conversation ?')) {
            try {
                const response = await fetch(`/api/conversations/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`Erreur HTTP! statut: ${response.status}`);
                }

                await this.loadConversations(); // Recharger la liste depuis le serveur
                this.showToast('Conversation supprimée');
            } catch (error) {
                console.error('Erreur lors de la suppression de la conversation:', error);
                this.showToast('Erreur lors de la suppression', true);
            }
        }
    }

    openConversation(id) {
        // Rediriger vers la page de chat avec l'ID de la conversation
        window.location.href = `/chat?conversation=${id}`;
    }

    async clearHistory() {
        try {
            const response = await fetch('/api/conversations/clear', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP! statut: ${response.status}`);
            }

            await this.loadConversations(); // Recharger la liste vide
            this.showToast('Historique effacé');
        } catch (error) {
            console.error('Erreur lors de l\'effacement de l\'historique:', error);
            this.showToast('Erreur lors de l\'effacement de l\'historique', true);
        }
    }

    showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white ${
            isError ? 'bg-red-500' : 'bg-green-500'
        } transition-opacity duration-300 z-50`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    showError() {
        if (!this.historyContainer) return;
        
        this.historyContainer.innerHTML = `
            <div class="text-center text-red-600 bg-red-50 rounded-xl p-6">
                Une erreur est survenue lors du chargement de l'historique.
            </div>
        `;
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new ConversationManager();
});