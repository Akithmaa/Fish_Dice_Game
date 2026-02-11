class LoadingManager {
    constructor() {
        this.loaders = new Map();
    }
    show(element, message = 'Loading...') {
        if (typeof element === 'string') {
    
            element = document.getElementById(element) || document.querySelector(element);
        }
        if (!element) return;
        if (!this.loaders.has(element)) {
            this.loaders.set(element, {
                originalContent: element.innerHTML,
                originalDisplay: element.style.display
            });
        }

        element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        element.classList.add('loading-state');
    }
    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element) || document.querySelector(element);
        }

        if (!element) return;
        const saved = this.loaders.get(element);
        if (saved) {
            element.innerHTML = saved.originalContent;
            element.style.display = saved.originalDisplay;
            element.classList.remove('loading-state');
            this.loaders.delete(element);
        }

    }
    createButtonLoader(button, text = 'Loading...') {

        if (typeof button === 'string') {
            button = document.getElementById(button) || document.querySelector(button);
        }
        if (!button) return null;
        const originalText = button.textContent;
        const originalDisabled = button.disabled;
        button.disabled = true;
        button.dataset.originalText = originalText;
        button.innerHTML = `
            <span class="button-spinner"></span>
            <span>${text}</span>
        `;
        return {
            restore: () => {
                button.disabled = originalDisabled;
                button.textContent = originalText;
                delete button.dataset.originalText;
            }

        };
    }
}
const loading = new LoadingManager();
