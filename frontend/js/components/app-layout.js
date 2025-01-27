class AppLayout extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Sauvegarder le contenu original
        const content = this.innerHTML;
        
        // Créer la structure de mise en page
        this.innerHTML = `
            <div class="min-h-screen flex flex-col bg-gray-50">
                <!-- Barre de navigation -->
                <app-nav></app-nav>

                <!-- Contenu principal -->
                <main class="flex-1">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div id="content-slot">${content}</div>
                    </div>
                </main>

                <!-- Pied de page -->
                <app-footer></app-footer>
            </div>
        `;

        // Initialiser les composants si nécessaire
        this.initializeComponents();
    }

    initializeComponents() {
        // Cette méthode peut être utilisée pour ajouter des initialisations 
        // supplémentaires des composants si nécessaire
    }
}

// Enregistrement du composant personnalisé
customElements.define('app-layout', AppLayout);