class HeartGameAPI {
    constructor() {
        this.heartPublicBase = "https://marcconrad.com/uob/heart/";
        this.heartPuzzleActive = false;
        this.heartTimerId = null;
        this.heartRemainingTime = 10;
        this.currentHeartSolution = null;
        this.lastResultStatus = null; // 'correct', 'wrong', 'timeout', 'skipped', 'error'
        this.resolvePromise = null;
        this.currentImageUrl = null;
    }

    async fetchHeartPuzzle() {
        const res = await fetch("https://marcconrad.com/uob/heart/api.php", {
            cache: "no-store",
            mode: "cors",
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return res.json();
        const txt = await res.text();
        try {
            return JSON.parse(txt);
        } catch {
            return { question: "https://marcconrad.com/uob/heart/heart.php" };
        }
    }

    async loadHeartPuzzle() {
        try {
            const res = await fetch("https://marcconrad.com/uob/heart/api.php?out=json");
            const data = await res.json();
            if (!data.question || data.solution === undefined) {
                throw new Error("Invalid API response");
            }
            const solution = (data.solution === null || data.solution === '') ? 0 : Number(data.solution);
            if (isNaN(solution) || solution < 0) {
                console.warn("Invalid solution value, defaulting to 0:", data.solution);
                this.currentHeartSolution = 0;
            } else {
                this.currentHeartSolution = solution;
            }
            this.currentImageUrl = data.question;
            console.log("Heart puzzle loaded - Solution:", this.currentHeartSolution);
            return { imageUrl: data.question, solution: this.currentHeartSolution };
        } catch (err) {
            console.error("Heart puzzle load failed:", err);
            this.currentHeartSolution = null;
            this.currentImageUrl = null;
            return null;
        }
    }

    async openTransmission() {
        try {
            const puzzle = await this.loadHeartPuzzle();
            if (!puzzle) {
                this.lastResultStatus = 'error';
                return 0;
            }

            return new Promise((resolve) => {
                this.resolvePromise = (value) => {
                    if (!this.lastResultStatus) {
                        this.lastResultStatus = 'error';
                    }
                    this.resolvePromise = null;
                    resolve(value);
                };
                
                try {
                    this.showHeartChallengeModal(puzzle.imageUrl);
                    setTimeout(() => {
                        if (this.resolvePromise) {
                            const resolveFn = this.resolvePromise;
                            this.resolvePromise = null;
                            this.lastResultStatus = 'timeout';
                            resolveFn(0);
                        }
                    }, 12000);
                } catch (err) {
                    console.error("Error showing heart challenge modal:", err);
                    if (this.resolvePromise) {
                        const resolveFn = this.resolvePromise;
                        this.resolvePromise = null;
                        this.lastResultStatus = 'error';
                        resolveFn(0);
                    }
                }
            });
        } catch (err) {
            console.error("Error in openTransmission:", err);
            this.lastResultStatus = 'error';
            return 0;
        }
    }

    showHeartChallengeModal(imageUrl) {
        const modal = document.getElementById('heartChallengeModal');
        const image = document.getElementById('heartChallengeImage');
        const timer = document.getElementById('heartTimer');
        const answerInput = document.getElementById('heartAnswer');
        
        if (!modal || !image || !timer || !answerInput) {
            console.error("Heart challenge modal elements not found!");
            if (this.resolvePromise) {
                this.resolvePromise(0);
                this.resolvePromise = null;
            }
            return;
        }
        
        answerInput.value = '';
        timer.textContent = '10';
        this.lastResultStatus = null;
        
        image.src = '';
        image.onerror = () => {
            console.error("Failed to load heart challenge image:", imageUrl);
            if (this.resolvePromise) {
                this.lastResultStatus = 'error';
                this.resolvePromise(0);
                this.resolvePromise = null;
            }
            this.closeHeartChallengeModal();
        };
        
        image.onload = () => {
        };
        
        image.src = imageUrl;
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                e.stopPropagation();
                e.preventDefault();
            }
        };
        
        setTimeout(() => {
            answerInput.focus();
        }, 100);
        
        this.heartRemainingTime = 10;
        this.heartPuzzleActive = true;
        
        //interval event
        this.heartTimerId = setInterval(() => {
            this.heartRemainingTime--;
            timer.textContent = this.heartRemainingTime;
            
            if (this.heartRemainingTime <= 0) {
                const resolveFn = this.resolvePromise;
                if (resolveFn) {
                this.lastResultStatus = 'timeout';
                    this.resolvePromise = null; // Clear before resolving
                    resolveFn(0);
                }
                this.closeHeartChallengeModal();
            }
        }, 1000);
        
        this.setupHeartChallengeEvents();
    }

    setupHeartChallengeEvents() {
        const modal = document.getElementById('heartChallengeModal');
        const submitBtn = document.getElementById('submitHeartAnswer');
        const skipBtn = document.getElementById('skipHeartChallenge');
        const closeBtn = document.getElementById('closeHeartChallenge');
        const answerInput = document.getElementById('heartAnswer');
        
        if (!submitBtn || !skipBtn || !closeBtn || !answerInput) {
            console.error("Heart challenge modal elements not found!");
            return;
        }
        
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const freshSubmitBtn = document.getElementById('submitHeartAnswer');
        const freshSkipBtn = document.getElementById('skipHeartChallenge');
        const freshCloseBtn = document.getElementById('closeHeartChallenge');
        const freshAnswerInput = document.getElementById('heartAnswer');
        
        const submitAnswer = () => {
            const trimmedValue = freshAnswerInput.value.trim();
            const resolveFn = this.resolvePromise;

            if (!resolveFn) {
                console.warn("No resolve promise available");
                this.closeHeartChallengeModal();
                return;
            }

            if (trimmedValue === '') {
                console.log("Heart challenge: Empty input treated as wrong answer");
                this.lastResultStatus = 'wrong';
                this.resolvePromise = null;
                resolveFn(0);
                this.closeHeartChallengeModal();
                return;
            }

            const userAnswer = Number(trimmedValue);

            if (isNaN(userAnswer) || userAnswer < 0) {
                console.log("Heart challenge: Invalid input (NaN or negative)");
                this.lastResultStatus = 'wrong';
                this.resolvePromise = null;
                resolveFn(0);
                this.closeHeartChallengeModal();
                return;
            }

            if (userAnswer === this.currentHeartSolution) {
                const bonus = this.currentHeartSolution;
                console.log("Heart challenge correct! Expected:", this.currentHeartSolution, "Got:", userAnswer, "Bonus:", bonus);
                this.lastResultStatus = (bonus === 0 ? 'correctZero' : 'correct');
                this.resolvePromise = null;
                resolveFn(bonus);
                this.closeHeartChallengeModal();
            } else {
                console.log("Heart challenge wrong. Expected:", this.currentHeartSolution, "Got:", userAnswer);
                this.lastResultStatus = 'wrong';
                this.resolvePromise = null;
                resolveFn(0);
                this.closeHeartChallengeModal();
            }
        };

        
        freshSubmitBtn.onclick = submitAnswer;
        
        freshAnswerInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                submitAnswer();
            }
        };
        
        freshSkipBtn.onclick = () => {
            const resolveFn = this.resolvePromise;
            if (resolveFn) {
                this.lastResultStatus = 'skipped';
                this.resolvePromise = null;
                resolveFn(0);
            }
            this.closeHeartChallengeModal();
        };
        
        freshCloseBtn.onclick = () => {
            const resolveFn = this.resolvePromise;
            if (resolveFn) {
                this.lastResultStatus = 'skipped';
                this.resolvePromise = null;
                resolveFn(0);
            }
            this.closeHeartChallengeModal();
        };
    }

    closeHeartChallengeModal() {
        const modal = document.getElementById('heartChallengeModal');
        const answerInput = document.getElementById('heartAnswer');
        const image = document.getElementById('heartChallengeImage');
        
        if (modal) {
            modal.classList.remove('active');
            modal.onclick = null; // Remove click handler
        }
        if (answerInput) {
            answerInput.value = '';
            answerInput.blur();
        }
        if (image) {
            image.src = '';
            image.onerror = null;
            image.onload = null;
        }
        
        this.heartPuzzleActive = false;
        
        if (this.heartTimerId) {
            clearInterval(this.heartTimerId);
            this.heartTimerId = null;
        }
        
        setTimeout(() => {
            document.body.classList.remove('modal-open');
        }, 300);
    }

    closeTransmission() {
        this.closeHeartChallengeModal();
    }
}

const heartGameAPI = new HeartGameAPI();

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('heartChallengeModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
});
