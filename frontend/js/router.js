class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.initialized = false;
        this.init();
    }

    init() {
        window.addEventListener('popstate', (e) => {
            const route = e.state?.route || 'login';
            this.navigate(route, false);
        });

      window.addEventListener('hashchange', () => {
          const hashRoute = window.location.hash.slice(1) || 'login';
          this.navigate(hashRoute, false);
      });

      this.initialized = true;
    }

    initializeRoute(route) {
        if (!this.initialized) return;
        const initialRoute = route || window.location.hash.slice(1) || 'login';
        this.navigate(initialRoute, false);
    }

    register(route, callback) {
        this.routes[route] = callback;
    }

    navigate(route, pushState = true) {
        if (this.currentRoute === route) return;

        if (this.currentRoute === 'game' && window.gameInstance && typeof window.gameInstance.cleanup === 'function') {
            window.gameInstance.cleanup();
        }

        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('modal-open');

        if (this.currentRoute) {
            sessionStorage.setItem('previousRoute', this.currentRoute);
        }

        document.querySelectorAll('.page-section').forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(`page-${route}`);
        if (targetSection) {
            targetSection.style.display = (route === 'levels' || route === 'home' || route === 'instructions' || route === 'leaderboard' || route === 'login' || route === 'signup' || route === 'settings') ? 'flex' : 'block';
            this.currentRoute = route;

            if (pushState) {
                window.history.pushState({ route }, '', `#${route}`);
            }

            if (this.routes[route]) {
                this.routes[route]();
            }

            window.scrollTo(0, 0);
        } else {
            console.warn(`Route ${route} not found, redirecting to login`);
            this.navigate('login', pushState);
        }
    }

    getCurrentRoute() {
        return this.currentRoute || 'login';
    }
}

const router = new Router();

function navigateTo(route) {
    router.navigate(route);
}


