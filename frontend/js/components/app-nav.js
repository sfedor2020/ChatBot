class AppNav extends HTMLElement {
    constructor() {
        super();
        this.render();
    }

    render() {
        const currentPath = window.location.pathname;
        const routes = [
            { path: '/', text: 'Chat', class: 'nav-item-1' },
            { path: '/prompts', text: 'Prompts', class: 'nav-item-2' },
            { path: '/history', text: 'Historique', class: 'nav-item-3' },
            { path: '/settings', text: 'Paramètres', class: 'nav-item-4' },
            { path: '/about', text: 'À propos', class: 'nav-item-5' }
        ];

        this.innerHTML = `
            <header class="w-full border-b bg-white">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <!-- Logo et bouton menu mobile -->
                        <div class="flex items-center">
                            <button class="p-2 hover:bg-gray-100 rounded-full lg:hidden" 
                                    id="mobile-menu-button"
                                    aria-label="Ouvrir le menu mobile">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                            </button>
                            <span class="text-xl font-medium ml-2 lg:ml-0 nav-brand">Chat IA</span>
                        </div>

                        <!-- Navigation bureau -->
                        <nav class="hidden lg:flex lg:space-x-8">
                            ${routes.map(route => `
                                <a href="${route.path}" 
                                   class="px-3 py-2 text-sm font-medium rounded-md ${
                                       currentPath === route.path
                                       ? 'nav-item-active'
                                       : route.class + ' hover:text-gray-900 hover:bg-gray-50'
                                   }"
                                   aria-current="${currentPath === route.path ? 'page' : 'false'}">
                                    ${route.text}
                                </a>
                            `).join('')}
                        </nav>
                    </div>
                </div>

                <!-- Menu mobile -->
                <div class="lg:hidden hidden" id="mobile-menu">
                    <div class="px-2 pt-2 pb-3 space-y-1">
                        ${routes.map(route => `
                            <a href="${route.path}" 
                               class="block px-3 py-2 rounded-md text-base font-medium ${
                                   currentPath === route.path
                                   ? 'nav-item-active'
                                   : route.class + ' hover:text-gray-900 hover:bg-gray-50'
                               }"
                               aria-current="${currentPath === route.path ? 'page' : 'false'}">
                                ${route.text}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </header>
        `;

        // Configuration du menu mobile
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        const button = this.querySelector('#mobile-menu-button');
        const menu = this.querySelector('#mobile-menu');
        
        button?.addEventListener('click', () => {
            menu?.classList.toggle('hidden');
            
            // Mise à jour de l'attribut aria-expanded
            const isExpanded = !menu?.classList.contains('hidden');
            button.setAttribute('aria-expanded', isExpanded.toString());
        });

        // Fermer le menu lors du clic en dehors
        document.addEventListener('click', (event) => {
            const isClickInside = button?.contains(event.target) || menu?.contains(event.target);
            if (!isClickInside && !menu?.classList.contains('hidden')) {
                menu?.classList.add('hidden');
                button?.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Enregistrement du composant personnalisé
customElements.define('app-nav', AppNav);