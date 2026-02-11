class GameStateManager {

    constructor() {

        this.storageKey = 'undersea_game_state';
    }
    save(gameInstance) {

        const state = {
            level: gameInstance.level,
            currentPos: gameInstance.currentPos,
            timeLeft: gameInstance.timeLeft,
            score: gameInstance.score,
            gameActive: gameInstance.gameActive,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    }
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return null;
            const state = JSON.parse(saved);
            const maxAge = 24 * 60 * 60 * 1000;
            if (Date.now() - state.timestamp > maxAge) {
                this.clear();
                return null;
            }

            return state;

        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    }
    clear() {
        localStorage.removeItem(this.storageKey);
    }
    hasSavedState() {
        return this.load() !== null;
    }
}

const gameState = new GameStateManager();
