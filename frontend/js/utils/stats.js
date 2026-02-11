class StatisticsManager {

    constructor() {
        this.storageKey = 'undersea_statistics';
        this.stats = this.load();
    }
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : this.getDefaultStats();
        } catch (e) {
            console.error('Failed to load statistics:', e);
            return this.getDefaultStats();
        }
    }
    getDefaultStats() {

        return {
            totalGames: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalScore: 0,
            bestScore: 0,
            averageScore: 0,
            totalPlayTime: 0, // in seconds
            challengesCompleted: 0,
            challengesFailed: 0,
            snakesEncountered: 0,
            levelsCompleted: {
                1: 0,
                2: 0,
                3: 0
            },

            bestScores: {
                1: 0,
                2: 0,
                3: 0
            },
            lastPlayed: null
        };
    }
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
            return true;
        } catch (e) {

            console.error('Failed to save statistics:', e);
            return false;
        }
    }
    recordGame(result) {
        this.stats.totalGames++;
        this.stats.lastPlayed = new Date().toISOString();
        if (result.won) {
            this.stats.gamesWon++;
        } else {
            this.stats.gamesLost++;
        }
        if (result.score) {
            this.stats.totalScore += result.score;
            this.stats.bestScore = Math.max(this.stats.bestScore, result.score);
            this.stats.averageScore = Math.round(this.stats.totalScore / this.stats.totalGames);
            if (result.level) {
                this.stats.bestScores[result.level] = Math.max(
                    this.stats.bestScores[result.level] || 0,
                      result.score

                );
            }
        }
        if (result.playTime) {
            this.stats.totalPlayTime += result.playTime;
        }
        if (result.level) {
            this.stats.levelsCompleted[result.level] = (this.stats.levelsCompleted[result.level] || 0) + 1;
        }
        this.save();
    }

    recordChallenge(success) {
        if (success) {
            this.stats.challengesCompleted++;
        } else {

            this.stats.challengesFailed++;
        }
        this.save();

    }
    recordSnake() {
        this.stats.snakesEncountered++;
        this.save();
    }

    getWinRate() {

        if (this.stats.totalGames === 0) return 0;
        return Math.round((this.stats.gamesWon / this.stats.totalGames) * 100);
    }



    getChallengeSuccessRate() {

        const total = this.stats.challengesCompleted + this.stats.challengesFailed;

        if (total === 0) return 0;

        return Math.round((this.stats.challengesCompleted / total) * 100);

    }
    getFormattedPlayTime() {

        const hours = Math.floor(this.stats.totalPlayTime / 3600);
        const minutes = Math.floor((this.stats.totalPlayTime % 3600) / 60);

        if (hours > 0) {

            return `${hours}h ${minutes}m`;

        }

        return `${minutes}m`;
    }
    getAll() {
        return { ...this.stats };
    }
    reset() {
        this.stats = this.getDefaultStats();
        this.save();
    }
}
const statistics = new StatisticsManager();

