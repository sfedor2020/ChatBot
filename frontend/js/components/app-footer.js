class AppFooter extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    render() {
        // Rendu du pied de page avec les liens de navigation et le copyright
        this.innerHTML = `
            <footer class="bg-white border-t mt-auto">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <!-- Mention de copyright -->
                        <div class="text-gray-500 text-sm">
                            Interface de Chat IA by FS - ${new Date().getFullYear()}
                        </div>
                        
                        <!-- Liens de navigation -->
                        <div class="flex space-x-6">
                            <a href="/about" class="text-gray-400 hover:text-gray-500" title="En savoir plus sur l'application">
                                À propos
                            </a>
                            <a href="/settings" class="text-gray-400 hover:text-gray-500" title="Configurer l'application">
                                Paramètres
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }
}

// Enregistrement du composant personnalisé
customElements.define('app-footer', AppFooter);