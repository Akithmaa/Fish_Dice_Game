class UnderseaGame {
    constructor() {
        this.grid = document.getElementById("grid");
        this.position = document.getElementById("pos");
        this.timerDisplay = document.getElementById("timer");
        this.timerProgressBar = document.getElementById("timerProgressBar");
        this.lastRoll = document.getElementById("last-roll");
        this.diceDisplay = document.getElementById("diceDisplay");
        this.playerScoreDisplay = document.getElementById("playerScore");
        this.scoreBreakdown = document.getElementById("scoreBreakdown");
        this.logElement = document.getElementById("log");
        
        if (!this.grid) {
            console.error("Grid element not found!");
            return;
        }

        this.level = Number(localStorage.getItem("selectedLevel") || 1);

        this.boardSize = LEVEL_CONFIG[this.level].boardSize;

        this.currentPos = 1;
        this.timeLeft = 60;
        this.initialTime = 60;
        this.score = 0;
        this.scoreBreakdownData = {
            base: 0,
            timeBonus: 0,
            challengeBonus: 0
        };
        this.gameActive = false;
        this.isMoving = false;
        this.startTime = null;
        this.scoreSaved = false; // Flag to prevent duplicate saves
        this.scoreSaveInProgress = null; // Promise lock to prevent concurrent saves
        this.autoSaveInterval = null; // Store auto-save interval ID

        this.heartGame = heartGameAPI;

        this.restoreGameState();

        this.init();
    }

    async init() {
        this.loadPlayer();
        this.createBoard();
        this.setupUI();
        this.updateUI();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
    }

    restoreGameState() {
        if (typeof gameState !== 'undefined') {
            const saved = gameState.load();
            if (saved && confirm("Found a saved game. Would you like to continue?")) {
                this.level = saved.level || this.level;
                this.currentPos = saved.currentPos || 1;
                this.timeLeft = saved.timeLeft || 60;
                this.score = saved.score || 0;
                this.gameActive = saved.gameActive || false;
                this.initialTime = 60;
                
                if (this.gameActive) {
                    setTimeout(() => {
                        if (this.gameActive) {
                            this.startTimer();
                        }
                    }, 100);
                }
            }
        }
    }

    setupAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        this.autoSaveInterval = setInterval(() => {
            if (this.gameActive && typeof gameState !== 'undefined') {
                gameState.save(this);
            }
        }, 5000);
    }
    
    //keypress
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    if (this.gameActive) {
                        this.rollDice();
                    } else {
                        this.startGame();
                    }
                    break;
                case 'Enter':
                    if (!this.gameActive) {
                        this.startGame();
                    }
                    break;
                case 'Escape':
                    document.querySelectorAll('.modal.active').forEach(modal => {
                        modal.classList.remove('active');
                        document.body.classList.remove('modal-open');
                    });
                    break;
            }
        });
    }

    isAuthenticated() {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const user = localStorage.getItem("user");
        return isLoggedIn && user;
    }

    loadPlayer() {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            if (typeof navigateTo === 'function') {
                navigateTo('login');
            } else {
                window.location.href = "index.html#login";
            }
            return;
        }

        const playerNameEl = document.getElementById("playerName");
        const playerEmailEl = document.getElementById("playerEmail");
        if (playerNameEl) playerNameEl.textContent = user.username;
        if (playerEmailEl) playerEmailEl.textContent = user.email;

        if (user.profile?.avatar) {
            let avatarPath = user.profile.avatar;
            const characterMatch = avatarPath.match(/assets\/([A-Za-z]+)\.png$/);
            if (characterMatch) {
                const characterName = characterMatch[1].toLowerCase();
                const validCharacters = ['dolphin', 'jellyfish', 'octopus', 'seahorse', 'shark', 'whale'];
                if (validCharacters.includes(characterName)) {
                    avatarPath = `assets/characters/${characterName}.png`;
                    user.profile.avatar = avatarPath;
                    localStorage.setItem("user", JSON.stringify(user));
                }
            }
            
            const avatarImg = document.getElementById("avatarImg");
            const profileAvatar = document.getElementById("profileAvatar");
            if (avatarImg) avatarImg.src = avatarPath;
            if (profileAvatar) profileAvatar.src = avatarPath;
        }

        const profileNameInput = document.getElementById("profileName");
        const profileEmailInput = document.getElementById("profileEmail");
        const profileNameModalInput = document.getElementById("profileNameModal");
        const profileEmailModalInput = document.getElementById("profileEmailModal");

        if (profileNameInput) profileNameInput.value = user.username;
        if (profileEmailInput) profileEmailInput.value = user.email;
        if (profileNameModalInput) profileNameModalInput.value = user.username;
        if (profileEmailModalInput) profileEmailModalInput.value = user.email;
    }

    createBoard() {
        if (!this.grid) {
            console.error("Grid element not found! Cannot create board.");
            return;
        }
        
        const config = LEVEL_CONFIG[this.level];

        this.grid.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
        this.grid.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;

        this.boardSize = config.boardSize;

        this.grid.innerHTML = "";

        for (let i = 1; i <= this.boardSize; i++) {
            const div = document.createElement("div");
            div.className = "cell";
            div.dataset.position = i;
            div.innerHTML = `<span class="label">${i}</span>`;

            if (config.hearts.includes(i)) {
                div.classList.add("heart", "glow-cell", "glow-heart");
                div.innerHTML += `<img src="assets/icons/heart_ingame.png" class="icon" style="width:50px; height:50px;">`;
            }

            if (config.snakes.includes(i)) {
                div.classList.add("snake", "glow-cell", "glow-snake");
                div.innerHTML += `<img src="assets/icons/snake_ingame.png" class="icon">`;
            }

            this.grid.appendChild(div);
        }

        this.placeToken();
        this.updateUI();
    }

    placeToken() {
        const token = document.createElement("img");
        token.className = "token";
        token.id = "playerToken";

        const user = JSON.parse(localStorage.getItem("user"));
        let avatar = user?.profile?.avatar || "assets/icons/user.png";
        
        const characterMatch = avatar.match(/assets\/([A-Za-z]+)\.png$/);
        if (characterMatch) {
            const characterName = characterMatch[1].toLowerCase();
            const validCharacters = ['dolphin', 'jellyfish', 'octopus', 'seahorse', 'shark', 'whale'];
            if (validCharacters.includes(characterName)) {
                avatar = `assets/characters/${characterName}.png`;
            }
        }

        token.src = avatar;

        token.style.width = "45px";
        token.style.height = "45px";
        token.style.position = "absolute";
        token.style.transform = "translate(-50%, -50%)";
        token.style.pointerEvents = "none";

        this.grid.appendChild(token);
        this.updateToken();
    }


    updateToken(animate = true) {
        if (!this.grid) return;
        
        const token = document.querySelector(".token");
        const target = this.grid.children[this.currentPos - 1];

        if (!target || !token) return;

        const rect = target.getBoundingClientRect();
        const gridRect = this.grid.getBoundingClientRect();

        const newLeft = rect.left - gridRect.left + rect.width / 2;
        const newTop = rect.top - gridRect.top + rect.height / 2;

        const showAnimations = typeof settings !== 'undefined' ? settings.get('showAnimations') : true;
        if (animate && showAnimations) {
            token.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy easing
            token.style.left = `${newLeft}px`;
            token.style.top = `${newTop}px`;
            
            setTimeout(() => {
                token.style.transition = 'transform 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                token.style.transform = 'translate(-50%, -50%) scale(1.15)';
                setTimeout(() => {
                    token.style.transform = 'translate(-50%, -50%) scale(1)';
                }, 150);
            }, 400);
        } else {
            token.style.transition = 'none';
            token.style.left = `${newLeft}px`;
            token.style.top = `${newTop}px`;
            token.style.transform = 'translate(-50%, -50%)';
        }
    }

    //button events
    setupUI() {
        document.getElementById("rollBtn").onclick = () => this.rollDice();
        document.getElementById("startBtn").onclick = () => this.startGame();
        document.getElementById("resetBtn").onclick = () => this.resetGame();

        const settingsBtn = document.getElementById("settingsBtn");
        if (settingsBtn) {
            settingsBtn.onclick = () => {
                if (typeof navigateTo === 'function') {
                    navigateTo('settings');
                } else {
                    window.location.href = "index.html#settings";
                }
            };
        }

        const statsBtn = document.getElementById("statsBtn");
        if (statsBtn) {
            statsBtn.onclick = () => {
                this.openStatisticsModal();
            };
        }

        document.getElementById("instructionsBtn").onclick = (e) => {
            e.preventDefault();
            this.openModal("instructionsModal");
        };
        
        document.getElementById("closeInstructions").onclick = () => {
            this.closeModal("instructionsModal");
        };

        const gameBackBtn = document.getElementById("gameBackBtn");
        if (gameBackBtn) {
            gameBackBtn.onclick = (e) => {
                e.preventDefault();
                if (typeof navigateTo === 'function') {
                    navigateTo('levels');
                } else {
                    window.location.href = "index.html#levels";
                }
            };
        }

        document.getElementById("profileBtn").onclick = () => {
            this.openModal("profileModal");
        };
        document.getElementById("closeProfile").onclick = () => {
            this.closeModal("profileModal");
        };

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add("active");
            document.body.classList.add("modal-open");
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove("active");
            document.body.classList.remove("modal-open");
            
            if (modalId === 'settingsModal') {
                const soundBtn = document.getElementById('btn-sound-login');
                if (soundBtn) {
                    soundBtn.style.display = '';
                }
            }
        }
    }

    startGame() {
        this.gameActive = true;
        this.startTime = Date.now();
        this.level = Number(localStorage.getItem("selectedLevel") || 1);

        this.startLevel();
        this.addLog(`🎮 Game Started! (Level ${this.level})`);
        this.updateUI();
        
        if (typeof toast !== 'undefined') {
            toast.success(`Level ${this.level} started! Good luck!`);
        }
    }

    async startLevel() {
        this.currentPos = 1;
        this.timeLeft = 60;
        this.initialTime = 60;
        this.scoreSaved = false; // Reset flag when starting a new level
        this.scoreSaveInProgress = null; // Reset save lock when starting new level
        this.isMoving = false; // Reset moving flag
        this.scoreBreakdownData = {
            base: 0,
            timeBonus: 0,
            challengeBonus: 0
        };

        this.createBoard();
        this.updateUI();
        this.updateToken(false);
        
        this.updateTimer();
        this.startTimer();

        this.addLog(`🟦 Level ${this.level} started!`);
        
        await this.checkPositionEffects();
    }

   resetGame() {
    this.gameActive = false;
    this.isMoving = false; // Reset moving flag
    
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
    
    if (this.heartGame && typeof this.heartGame.closeHeartChallengeModal === 'function') {
        this.heartGame.closeHeartChallengeModal();
    }
    
    if (typeof gameState !== 'undefined') {
        gameState.clear();
    }

    this.level = Number(localStorage.getItem("selectedLevel") || 1);
    this.currentPos = 1;
    this.timeLeft = 60;
    this.initialTime = 60;
    this.score = 0;
    this.scoreSaved = false; // Reset flag when game is reset
    this.scoreSaveInProgress = null; // Reset save lock
    this.scoreBreakdownData = {
        base: 0,
        timeBonus: 0,
        challengeBonus: 0
    };

    if (this.logElement) this.logElement.innerHTML = "";

    this.createBoard();

    this.updateTimer();
    
    if (this.lastRoll) this.lastRoll.textContent = "–";
    if (this.diceDisplay) this.diceDisplay.innerHTML = "";

    this.updateUI();
    this.updateToken(false);

    this.addLog("🔄 Game Reset to Level " + this.level);
    
    if (typeof toast !== 'undefined') {
        toast.info("Game reset");
    }
   }

    //roll dice
    async rollDice() {
        if (!this.gameActive) {
            if (typeof toast !== 'undefined') {
                toast.warning("Start the game first!");
            } else {
                this.addLog("Start the game first!");
            }
            return;
        }

        if (this.isMoving) {
            return; // Prevent rolling while moving
        }

        //wait for dice animation finishing
        const roll = await this.animateDiceRoll();
        
        if (this.lastRoll) this.lastRoll.textContent = roll;
        if (this.diceDisplay) {
            this.diceDisplay.innerHTML = `<div class="dice-face dice-${roll}">${roll}</div>`;
        }

        this.addLog(`Dice Rolled ${roll}`);
        this.move(roll);
    }

    async animateDiceRoll() {
        return new Promise((resolve) => {
            const showAnimations = typeof settings !== 'undefined' ? settings.get('showAnimations') : true;
            
            let soundCleanup = null;
            if (typeof SoundManager !== 'undefined' && SoundManager.playDiceRollLoop) {
                soundCleanup = SoundManager.playDiceRollLoop(500); // 500ms = 10 frames * 50ms
            }
            
            if (this.diceDisplay && showAnimations) {
                this.diceDisplay.innerHTML = '<div class="dice-rolling">🎲</div>';
                const diceEl = this.diceDisplay.querySelector('.dice-rolling');
                
                let frames = 0;
                const rollInterval = setInterval(() => {
                    const randomNum = Math.floor(Math.random() * 6) + 1;
                    diceEl.textContent = randomNum;
                    frames++;
                    
                    if (frames >= 10) {
                        clearInterval(rollInterval);
                        
                        if (soundCleanup) {
                            soundCleanup();
                        }
                        
                        if (typeof SoundManager !== 'undefined' && SoundManager.playDiceRollSound) {
                            SoundManager.playDiceRollSound();
                        }
                        
                        const finalRoll = Math.floor(Math.random() * 6) + 1;
                        resolve(finalRoll);
                    }
                }, 50);
            } else {
                if (typeof SoundManager !== 'undefined' && SoundManager.playDiceRollSound) {
                    SoundManager.playDiceRollSound();
                }
                
                setTimeout(() => {
                    if (soundCleanup) {
                        soundCleanup();
                    }
                    resolve(Math.floor(Math.random() * 6) + 1);
                }, 100);
            }
        });
    }

    async handleHeartChallenge(fromPos, depth = 0) {
        const config = LEVEL_CONFIG[this.level];
        if (!config.hearts.includes(this.currentPos)) return false;

        this.createParticles(this.currentPos, 'heart');
        try {
            const bonus = await this.heartGame.openTransmission();
            const expectedSolution = this.heartGame?.currentHeartSolution;
            const resultStatus = this.heartGame?.lastResultStatus;

            if (expectedSolution === 0 && bonus === 0 && (resultStatus === 'correctZero' || resultStatus === 'correct')) {
                if (typeof statistics !== 'undefined') {
                    statistics.recordChallenge(true);
                }

                if (typeof SoundManager !== 'undefined' && SoundManager.playHeartSuccessSound) {
                    SoundManager.playHeartSuccessSound();
                }

                if (typeof toast !== 'undefined') {
                    toast.success("Correct! No hearts here, so 0 bonus points.");
                }

                this.createParticles(this.currentPos, 'success');
                this.createSparkles(this.currentPos);
                return true;
            }

            if (bonus > 0 && (resultStatus === 'correct' || resultStatus === 'correctZero')) {
                const challengeBonus = bonus * 10;
                this.scoreBreakdownData.challengeBonus += challengeBonus;
                this.score += challengeBonus;
                this.updateScoreDisplay();
                
                if (typeof statistics !== 'undefined') {
                    statistics.recordChallenge(true);
                }
                
                if (typeof SoundManager !== 'undefined' && SoundManager.playHeartSuccessSound) {
                    SoundManager.playHeartSuccessSound();
                }
                
                if (typeof toast !== 'undefined') {
                    toast.success(`Correct! +${challengeBonus} points!`);
                }
                
                this.createParticles(this.currentPos, 'success');
                this.createSparkles(this.currentPos);
        
                const newPos = Math.min(this.boardSize, this.currentPos + bonus);
                const showAnimations = typeof settings !== 'undefined' ? settings.get('showAnimations') : true;
                if (showAnimations && fromPos !== newPos) {
                    await this.animateMovement(this.currentPos, newPos);
                }
                this.currentPos = newPos;
                this.updateToken();
                this.updateUI();
                
                await this.checkPositionEffects(depth + 1);
                return true;
            } else if (resultStatus === 'wrong') {
                if (typeof statistics !== 'undefined') {
                    statistics.recordChallenge(false);
                }
                
                if (typeof SoundManager !== 'undefined' && SoundManager.playHeartFailureSound) {
                    SoundManager.playHeartFailureSound();
                }
                
                const heartCell = document.querySelector(`.cell[data-position="${this.currentPos}"]`);
                if (heartCell) {
                    heartCell.classList.add("heart-wrong");
                    setTimeout(() => heartCell.classList.remove("heart-wrong"), 800);
                }
                
                if (typeof toast !== 'undefined') {
                    toast.error("Wrong answer!");
                }
                return false;
            } else {
                if (resultStatus === 'timeout' && typeof toast !== 'undefined') {
                    toast.info("Heart challenge timed out.");
                }
                return false;
            }
        } catch (err) {
            console.error("Error in heart challenge:", err);
            return false;
        }
    }

    //snake encounter
    async handleSnakeEncounter(depth = 0) {
        const config = LEVEL_CONFIG[this.level];
        if (!config.snakes.includes(this.currentPos)) return false;

            if (typeof statistics !== 'undefined') {
                statistics.recordSnake();
            }
            
            const snakeHead = this.currentPos;
            const snakeTail = Math.max(1, snakeHead - 3);

            const showAnimations = typeof settings !== 'undefined' ? settings.get('showAnimations') : true;
            if (showAnimations) {
                document.body.classList.add('shake');
                setTimeout(() => document.body.classList.remove('shake'), 500);
            }

            const cell = document.querySelector(`.cell[data-position="${snakeHead}"]`);
            if (cell) {
                cell.classList.add("snake-hit");
                this.createParticles(this.currentPos, 'snake');
                
                if (typeof SoundManager !== 'undefined' && SoundManager.playSnakeHitSound) {
                    SoundManager.playSnakeHitSound();
                }
            }

            if (typeof toast !== 'undefined') {
                toast.warning("Snake! Moving back...");
            }

        return new Promise((resolve) => {
            setTimeout(async () => {
                    try {
                if (cell) cell.classList.remove("snake-hit");
                if (showAnimations) {
                    await this.animateMovement(snakeHead, snakeTail);
                }
                this.currentPos = snakeTail;
                this.updateToken();
                    this.updateUI();
                    
                    await this.checkPositionEffects(depth + 1);
                    resolve(true);
                    } catch (err) {
                        console.error("Error in snake movement:", err);
                    resolve(false);
                    }
            }, 600);
        });
    }

    async checkPositionEffects(depth = 0) {
        if (depth > 10) {
            console.warn("Maximum depth reached in checkPositionEffects");
            return;
        }
        
        const config = LEVEL_CONFIG[this.level];
        
        if (config.hearts.includes(this.currentPos)) {
            await this.handleHeartChallenge(this.currentPos, depth);
            return; // handleHeartChallenge will call checkPositionEffects again if needed
        }
        
        if (config.snakes.includes(this.currentPos)) {
            await this.handleSnakeEncounter(depth);
            return; // handleSnakeEncounter will call checkPositionEffects again if needed
        }
    }

    async move(steps) {
        if (!this.gameActive || this.isMoving) return;
        this.isMoving = true;

        try {
        const oldPos = this.currentPos;
        const targetPos = Math.min(this.boardSize, this.currentPos + steps);
        
        const showAnimations = typeof settings !== 'undefined' ? settings.get('showAnimations') : true;
        if (showAnimations) {
            await this.animateMovement(oldPos, targetPos);
        }
        
        this.currentPos = targetPos;
        this.updateToken();
        this.updateUI();

        await this.checkPositionEffects();

        this.isMoving = false;

        if (this.currentPos === this.boardSize) {
            this.finishLevel();
            }
        } catch (err) {
            console.error("Error in move function:", err);
            this.isMoving = false; // Always reset flag on error
        }
    }

    async animateMovement(from, to) {
        const showAnimations = typeof settings !== 'undefined' ? settings.get('showAnimations') : true;
        if (!showAnimations) {
            this.currentPos = to;
            this.updateToken(false);
            return;
        }

        const steps = to - from;
        const direction = steps > 0 ? 1 : -1;
        const absSteps = Math.abs(steps);
        
        const playMovementSound = () => {
            if (typeof SoundManager !== 'undefined' && SoundManager.playMovementSound) {
                SoundManager.playMovementSound();
            }
        };
        
        const stepDelay = 60; // Reduced from 100ms for smoother animation
        
        for (let i = 1; i <= absSteps; i++) {
            const intermediatePos = from + (i * direction);
            if (intermediatePos < 1 || intermediatePos > this.boardSize) break;
            
            this.currentPos = intermediatePos;
            
            if (i === 1 || i % 2 === 0) {
                playMovementSound();
            }
            
            this.updateToken(true);
            
            const progress = i / absSteps;
            const easedDelay = stepDelay * (1 - progress * 0.3); // Faster at end
            
            await new Promise(resolve => setTimeout(resolve, easedDelay));
        }
        
        this.currentPos = to;
        this.updateToken(true);
    }

    createParticles(position, type) {
        const showParticles = typeof settings !== 'undefined' ? settings.get('showParticles') : true;
        if (!showParticles) return;
        
        const cell = document.querySelector(`.cell[data-position="${position}"]`);
        if (!cell) return;

        const particleContainer = document.createElement('div');
        particleContainer.className = `particles particles-${type}`;
        cell.style.position = 'relative';
        cell.appendChild(particleContainer);

        const particleCount = type === 'success' ? 15 : type === 'snake' ? 12 : 10;
        const colors = {
            'success': ['#32e6ff', '#7ae582', '#ffd93d', '#ff6b6b'],
            'snake': ['#ff6b6b', '#ffa500', '#ff4757'],
            'heart': ['#ff6b9d', '#ff8fab', '#ffb3c1']
        };
        const typeColors = colors[type] || ['#32e6ff', '#8a7cff'];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `particle particle-${type}`;
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 30 + Math.random() * 30;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.animationDelay = `${i * 0.03}s`;
            particle.style.backgroundColor = typeColors[Math.floor(Math.random() * typeColors.length)];
            
            const size = 4 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            const keyframes = [
                { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
                { transform: `translate(${x}px, ${y}px) scale(0) rotate(360deg)`, opacity: 0 }
            ];
            const options = {
                duration: 800 + Math.random() * 400,
                easing: 'ease-out',
                fill: 'forwards'
            };
            
            if (particle.animate) {
                particle.animate(keyframes, options);
            } else {
                particle.style.transform = `translate(${x}px, ${y}px)`;
                particle.style.transition = 'all 1s ease-out';
                setTimeout(() => {
                    particle.style.opacity = '0';
                    particle.style.transform = `translate(${x}px, ${y}px) scale(0)`;
                }, i * 30);
            }
            
            particleContainer.appendChild(particle);
        }

        setTimeout(() => {
            particleContainer.remove();
        }, 1200);
    }
    
    createSparkles(position) {
        const showParticles = typeof settings !== 'undefined' ? settings.get('showParticles') : true;
        if (!showParticles) return;
        
        const cell = document.querySelector(`.cell[data-position="${position}"]`);
        if (!cell) return;

        const sparkleContainer = document.createElement('div');
        sparkleContainer.className = 'sparkles';
        sparkleContainer.style.position = 'absolute';
        sparkleContainer.style.top = '0';
        sparkleContainer.style.left = '0';
        sparkleContainer.style.width = '100%';
        sparkleContainer.style.height = '100%';
        sparkleContainer.style.pointerEvents = 'none';
        sparkleContainer.style.zIndex = '10';
        cell.style.position = 'relative';
        cell.appendChild(sparkleContainer);

        for (let i = 0; i < 8; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 20 + Math.random() * 15;
            const x = 50 + Math.cos(angle) * (distance / 2);
            const y = 50 + Math.sin(angle) * (distance / 2);
            
            sparkle.style.left = `${x}%`;
            sparkle.style.top = `${y}%`;
            sparkle.style.animationDelay = `${i * 0.1}s`;
            
            sparkleContainer.appendChild(sparkle);
        }

        setTimeout(() => {
            sparkleContainer.remove();
        }, 1500);
    }


    startTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();

            if (this.timeLeft <= 0) {
                this.finishLevel(true);
            } else if (this.timeLeft <= 5 && typeof settings !== 'undefined' && settings.get('soundEffectsEnabled')) {
                this.playSound('warning');
            }
        }, 1000);
    }

    updateTimer() {
        if (this.timerDisplay) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            this.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }

        if (this.timerProgressBar) {
            const percentage = Math.max(0, (this.timeLeft / this.initialTime) * 100);
            this.timerProgressBar.style.width = `${percentage}%`;
            
            if (this.timeLeft <= 10) {
                this.timerProgressBar.className = 'timer-progress timer-critical';
            } else if (this.timeLeft <= 30) {
                this.timerProgressBar.className = 'timer-progress timer-warning';
            } else {
                this.timerProgressBar.className = 'timer-progress timer-normal';
            }
        }

        if (this.timerDisplay) {
            if (this.timeLeft <= 10) {
                this.timerDisplay.classList.add('timer-critical');
                this.timerDisplay.classList.remove('timer-warning');
            } else if (this.timeLeft <= 30) {
                this.timerDisplay.classList.add('timer-warning');
                this.timerDisplay.classList.remove('timer-critical');
            } else {
                this.timerDisplay.classList.remove('timer-warning', 'timer-critical');
            }
        }
    }

    playSound(type) {
        const soundEnabled = typeof settings !== 'undefined' ? settings.get('soundEffectsEnabled') : true;
        if (soundEnabled) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                if (type === 'warning') {
                    oscillator.frequency.value = 800;
                    const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
                    gainNode.gain.value = 0.1 * soundVolume;
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                }
            } catch (e) {
                console.log('Audio not available');
            }
        }
    }

    async finishLevel(isTimeout = false) {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        if (this.heartGame && typeof this.heartGame.closeHeartChallengeModal === 'function') {
            this.heartGame.closeHeartChallengeModal();
        }
        
        this.gameActive = false;
        this.isMoving = false; // Reset moving flag when level finishes
        
        if (typeof gameState !== 'undefined') {
            gameState.clear();
        }

        const playTime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

        if (isTimeout) {
            if (typeof toast !== 'undefined') {
                if (this.score > 0) {
                    toast.error("Time's up! Your progress has been saved.");
                } else {
                    toast.error("Time's up! Try again.");
                }
            } else {
                alert("⏳ Time's up! Try again.");
            }
            
            if (typeof statistics !== 'undefined') {
                statistics.recordGame({
                    won: false,
                    score: this.score,
                    level: this.level,
                    playTime: playTime
                });
            }
            
            if (this.score > 0 && !this.scoreSaved) {
                await this.saveScore();
            }
            
            navigateTo("levels");
            return;
        }

        const timeBonus = this.timeLeft * 5;
        this.scoreBreakdownData.timeBonus = timeBonus;
        this.score += timeBonus;
        this.updateScoreDisplay();

        if (typeof SoundManager !== 'undefined' && SoundManager.playLevelCompleteSound) {
            SoundManager.playLevelCompleteSound();
        }
        
        this.createParticles(this.currentPos, 'success');
        const showParticles = typeof settings !== 'undefined' ? settings.get('showParticles') : true;
        if (showParticles) {
            this.createConfetti();
            this.createSparkles(this.currentPos);
        }

        if (typeof statistics !== 'undefined') {
            statistics.recordGame({
                won: true,
                score: this.score,
                level: this.level,
                playTime: playTime
            });
        }

        if (this.score > 0 && !this.scoreSaved) {
            await this.saveScore();
        } else if (this.score <= 0) {
            console.log("ℹ️ Skipping score save: Score is 0 or negative");
        }

        if (this.level < 3) {
            const modal = document.getElementById("levelCompleteModal");
            const scoreDisplay = document.getElementById("levelCompleteScore");
            const nextLevelBtn = document.getElementById("nextLevelBtn");
            const stayBtn = document.getElementById("stayBtn");
            
            if (scoreDisplay) {
                this.animateScoreCounter(scoreDisplay, 0, this.score, 1000);
            }
            
            if (nextLevelBtn) {
                const newNextBtn = nextLevelBtn.cloneNode(true);
                nextLevelBtn.parentNode.replaceChild(newNextBtn, nextLevelBtn);
                const freshNextBtn = document.getElementById("nextLevelBtn");
                freshNextBtn.onclick = () => {
                    this.closeModal("levelCompleteModal");
                    this.level++;
                    this.gameActive = true;
                    this.scoreSaved = false; // Reset flag for next level
                    this.startLevel();
                };
            }

            if (stayBtn) {
                const newStayBtn = stayBtn.cloneNode(true);
                stayBtn.parentNode.replaceChild(newStayBtn, stayBtn);
                const freshStayBtn = document.getElementById("stayBtn");
                freshStayBtn.onclick = () => {
                    this.closeModal("levelCompleteModal");
                };
            }
            
            this.openModal("levelCompleteModal");
            return;
        }
        
        if (typeof toast !== 'undefined') {
            toast.success(`Congratulations! All levels completed. Final score: ${this.score.toLocaleString()} points`);
        } else {
            alert("You finished the final level! Your score has been saved.");
        }
        navigateTo("levels");
    }

    async saveScore() {
        if (this.score <= 0) {
            console.log("ℹ️ Skipping score save: Score is 0 or negative", this.score);
            return false;
        }

        if (this.scoreSaved) {
            console.log("⚠️ Score already saved, skipping duplicate save");
            return true;
        }

        if (this.scoreSaveInProgress) {
            console.log("⚠️ Score save already in progress, waiting for completion...");
            try {
                return await this.scoreSaveInProgress;
            } catch (err) {
                console.error("❌ Error waiting for previous save:", err);
            }
        }

        console.log("Attempting to save score:", { 
            score: this.score, 
            authenticated: this.isAuthenticated(),
            scoreType: typeof this.score 
        });

        if (!this.isAuthenticated()) {
            console.warn("⚠️ Cannot save score: User not authenticated locally");
            return false;
        }

        try {
            if (typeof getCurrentUser === 'function') {
                const user = await getCurrentUser();
                if (!user) {
                    console.warn("⚠️ Session expired - cannot save score");
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("user");
                    if (typeof toast !== 'undefined') {
                        toast.error("Session expired. Please log in again to save your score.");
                    }
                    return false;
                }
            }
        } catch (err) {
            console.error("❌ Error checking session:", err);
        }

        this.scoreSaveInProgress = (async () => {
        try {
            if (typeof loading !== 'undefined') {
                loading.show('levelCompleteModal .modal-body', 'Saving score...');
            }
            
            const result = await apiSaveScore(this.score);
            
            if (typeof loading !== 'undefined') {
                loading.hide('levelCompleteModal .modal-body');
            }
            
            if (result.success) {
                const addedScore = result.added || this.score;
                const totalScore = result.score || this.score;
                console.log("Score saved successfully:", { addedScore, totalScore });
                
                this.scoreSaved = true;
                
                this.updateUserScoreInStorage(totalScore);
                
                if (typeof toast !== 'undefined') {
                    toast.success(`Score added: ${addedScore.toLocaleString()} points. Total: ${totalScore.toLocaleString()} points`);
                }
                
                this.refreshLeaderboardIfOpen();
                
                return true;
            } else {
                console.error("Score save failed:", result.msg);
                
                if (result.status === 401) {
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("user");
                    if (typeof toast !== 'undefined') {
                        toast.error("Session expired. Please log in again to save your score.");
                    }
                    if (typeof navigateTo === 'function') {
                        setTimeout(() => navigateTo('login'), 2000);
                    }
                } else {
                if (typeof toast !== 'undefined') {
                    toast.warning(`Unable to save score: ${result.msg || 'Please try again later'}`);
                    }
                }
                return false;
            }
        } catch (err) {
            console.error("Score save error:", err);
            if (typeof loading !== 'undefined') {
                loading.hide('levelCompleteModal .modal-body');
            }
            if (typeof toast !== 'undefined') {
                toast.error("Failed to save score. Please check your connection and try again.");
            }
                throw err; // Re-throw to be caught by caller
            } finally {
                this.scoreSaveInProgress = null;
            }
        })();

        try {
            return await this.scoreSaveInProgress;
        } catch (err) {
            return false;
        }
    }

    async updateUserScoreInStorage(newTotalScore) {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                user.score = newTotalScore;
                localStorage.setItem("user", JSON.stringify(user));
                console.log("Updated user score in localStorage:", newTotalScore);
                
                const profileScoreField = document.getElementById("profileScoreModal");
                if (profileScoreField) {
                    profileScoreField.value = newTotalScore;
                }
                
                if (typeof getCurrentUser === 'function') {
                    const updatedUser = await getCurrentUser();
                    if (updatedUser && updatedUser.score) {
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                        console.log("Refreshed user data from server:", updatedUser.score);
                    }
                }
            }
        } catch (err) {
            console.error("Error updating user score in localStorage:", err);
        }
    }

    refreshLeaderboardIfOpen() {
        const leaderboardPage = document.getElementById("page-leaderboard");
        if (leaderboardPage && leaderboardPage.style.display !== 'none') {
            if (typeof loadLeaderboardPage === 'function') {
                loadLeaderboardPage();
            }
        }
    }

    async loadLeaderboard(page = 1, itemsPerPage = 5, filter = 'all') {
        const list = document.getElementById("leaderboardList");
        const pagination = document.getElementById("leaderboardPagination");
        
        if (typeof loading !== 'undefined') {
            loading.show(list, 'Loading leaderboard...');
        } else {
            list.innerHTML = "<div>Loading...</div>";
        }
        if (pagination) pagination.innerHTML = "";

        try {
            const data = await apiFetchLeaderboard();
            
            if (typeof loading !== 'undefined') {
                loading.hide(list);
            }
            
            list.innerHTML = "";

            if (data.length === 0) {
                list.innerHTML = "<p>No scores yet.</p>";
                return;
            }

            let filteredData = data;
            if (filter === 'daily') {
                const today = new Date().toDateString();
                filteredData = data.filter(item => {
                    return true; // Placeholder
                });
            } else if (filter === 'weekly') {
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                filteredData = data.filter(item => {
                    return true; // Placeholder
                });
            }

            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);

            pageData.forEach((u, i) => {
                const globalIndex = startIndex + i;
                const avatar = u.avatar ? `<img src="${u.avatar}" alt="${u.username}" class="leaderboard-avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">` : '';
                list.innerHTML += `
                    <div class="leaderboard-item">
                        <div class="leaderboard-rank">${globalIndex + 1}</div>
                        <div class="leaderboard-info" style="display: flex; align-items: center;">
                            ${avatar}
                            <strong>${u.username || "Unknown"}</strong>
                        </div>
                        <div class="leaderboard-score">${u.score || 0}</div>
                    </div>
                `;
            });

            if (pagination && totalPages > 1) {
                let paginationHTML = '<div class="pagination-controls">';
                
                if (page > 1) {
                    paginationHTML += `<button class="pagination-btn" data-page="${page - 1}" aria-label="Previous page">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>`;
                } else {
                    paginationHTML += '<button class="pagination-btn disabled" disabled aria-label="Previous page"><i class="fa-solid fa-chevron-left"></i></button>';
                }
                
                const maxVisiblePages = 5;
                let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                if (startPage > 1) {
                    paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
                    if (startPage > 2) {
                        paginationHTML += '<span class="pagination-ellipsis">...</span>';
                    }
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    if (i === page) {
                        paginationHTML += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
                    } else {
                        paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
                    }
                }
                
                if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                        paginationHTML += '<span class="pagination-ellipsis">...</span>';
                    }
                    paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
                }
                
                if (page < totalPages) {
                    paginationHTML += `<button class="pagination-btn" data-page="${page + 1}" aria-label="Next page">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>`;
                } else {
                    paginationHTML += '<button class="pagination-btn disabled" disabled aria-label="Next page"><i class="fa-solid fa-chevron-right"></i></button>';
                }
                
                paginationHTML += '</div>';
                pagination.innerHTML = paginationHTML;
                
                pagination.querySelectorAll('.pagination-btn:not(.disabled)').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const newPage = parseInt(btn.getAttribute('data-page'));
                        this.loadLeaderboard(newPage, itemsPerPage);
                    });
                });
            }
        } catch (err) {
            if (typeof loading !== 'undefined') {
                loading.hide(list);
            }
            if (typeof toast !== 'undefined') {
                toast.error("Failed to load leaderboard. Please try again.");
            }
            list.innerHTML = "<p>Error loading leaderboard.</p>";
            console.error("Leaderboard fetch failed:", err);
        }
    }

    cleanup() {
        const wasActive = this.gameActive;
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        if (this.heartGame && typeof this.heartGame.closeHeartChallengeModal === 'function') {
            this.heartGame.closeHeartChallengeModal();
        }
        
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('modal-open');
        
        this.gameActive = false;
        this.isMoving = false;
        
        if (wasActive && this.score > 0 && this.isAuthenticated() && !this.scoreSaved) {
            console.log("💾 Saving score on cleanup (game interrupted)");
            this.saveScore().catch(err => {
                console.error("Error saving score on cleanup:", err);
            });
        } else if (wasActive && this.score <= 0) {
            console.log("ℹ️ Skipping score save on cleanup: Score is 0 or negative");
        }
        
        if (typeof gameState !== 'undefined') {
            gameState.clear();
        }
    }

    animateScoreCounter(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOutCubic);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end.toLocaleString();
            }
        };
        requestAnimationFrame(animate);
    }

    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);

        const colors = ['#32e6ff', '#8a7cff', '#7ae582', '#ff6b6b', '#ffd93d', '#ff8fab', '#ffb3c1', '#7ef9ff'];
        
        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const size = 8 + Math.random() * 8;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            confettiContainer.appendChild(confetti);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 4000);
    }

    addLog(message) {
        if (!this.logElement) {
            console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
            return;
        }
        const div = document.createElement("div");
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logElement.appendChild(div);
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }


    updateUI() {
        if (this.position) this.position.textContent = this.currentPos;
        this.updateScoreDisplay();

        const levelEl = document.getElementById("playerLevel");
        if (levelEl) levelEl.textContent = this.level;

        const totalCells = document.getElementById("totalCells");
        if (totalCells) totalCells.textContent = this.boardSize;
    }

    updateScoreDisplay() {
        if (this.playerScoreDisplay) {
            const oldScore = parseInt(this.playerScoreDisplay.textContent) || 0;
            const newScore = this.score;
            
            if (oldScore !== newScore && settings.get('showAnimations')) {
                this.animateScore(oldScore, newScore);
            } else {
                this.playerScoreDisplay.textContent = newScore;
            }
        }

        if (this.scoreBreakdown) {
            const breakdown = this.scoreBreakdownData;
            this.scoreBreakdown.innerHTML = `
                <div class="score-breakdown-item">
                    <span>Base:</span>
                    <span>${breakdown.base}</span>
                </div>
                <div class="score-breakdown-item">
                    <span>Challenges:</span>
                    <span>+${breakdown.challengeBonus}</span>
                </div>
                <div class="score-breakdown-item">
                    <span>Time Bonus:</span>
                    <span>+${breakdown.timeBonus}</span>
                </div>
            `;
        }
    }

    animateScore(from, to) {
        const duration = 500;
        const startTime = Date.now();
        const difference = to - from;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(from + (difference * easeOut));
            
            this.playerScoreDisplay.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.playerScoreDisplay.textContent = to;
            }
        };

        animate();
    }

    openSettingsModal() {
        if (typeof navigateTo === 'function') {
            navigateTo('settings');
        } else {
            window.location.href = "index.html#settings";
        }
    }

    populateSettings() {
        if (typeof settings === 'undefined') return;

        const musicToggle = document.getElementById("settingMusic");
        const soundToggle = document.getElementById("settingSound");
        const musicVolume = document.getElementById("settingMusicVolume");
        const soundVolume = document.getElementById("settingSoundVolume");
        const musicVolumeValue = document.getElementById("musicVolumeValue");
        const soundVolumeValue = document.getElementById("soundVolumeValue");
        const animationSpeed = document.getElementById("settingAnimationSpeed");
        const showParticles = document.getElementById("settingShowParticles");
        const showAnimations = document.getElementById("settingShowAnimations");

        if (musicToggle) musicToggle.checked = settings.get('musicEnabled');
        if (soundToggle) soundToggle.checked = settings.get('soundEffectsEnabled');
        if (musicVolume) {
            const musicEnabled = settings.get('musicEnabled');
            const musicVol = musicEnabled ? settings.get('musicVolume') * 100 : 0;
            musicVolume.value = musicVol;
            if (musicVolumeValue) musicVolumeValue.textContent = Math.round(musicVol) + '%';
        }
        if (soundVolume) {
            const soundVol = settings.get('soundVolume') * 100;
            soundVolume.value = soundVol;
            if (soundVolumeValue) soundVolumeValue.textContent = Math.round(soundVol) + '%';
        }
        if (animationSpeed) animationSpeed.value = settings.get('animationSpeed');
        if (showParticles) showParticles.checked = settings.get('showParticles');
        if (showAnimations) showAnimations.checked = settings.get('showAnimations');
    }

    openStatisticsModal() {
        const modal = document.getElementById("statisticsModal");
        if (!modal) {
            this.createStatisticsModal();
        }
        this.openModal("statisticsModal");
        this.populateStatistics();
    }

    populateStatistics() {
        if (typeof statistics === 'undefined') return;

        const stats = statistics.getAll();
        const statsContainer = document.getElementById("statisticsContent");
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Games</div>
                    <div class="stat-value">${stats.totalGames}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Games Won</div>
                    <div class="stat-value">${stats.gamesWon}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Win Rate</div>
                    <div class="stat-value">${statistics.getWinRate()}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Best Score</div>
                    <div class="stat-value">${stats.bestScore}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Average Score</div>
                    <div class="stat-value">${stats.averageScore}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Play Time</div>
                    <div class="stat-value">${statistics.getFormattedPlayTime()}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Challenges Completed</div>
                    <div class="stat-value">${stats.challengesCompleted}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Challenge Success Rate</div>
                    <div class="stat-value">${statistics.getChallengeSuccessRate()}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Snakes Encountered</div>
                    <div class="stat-value">${stats.snakesEncountered}</div>
                </div>
            </div>
            <div class="stats-level-breakdown">
                <h4>Best Scores by Level</h4>
                <div class="level-scores">
                    <div>Level 1: ${stats.bestScores[1] || 0}</div>
                    <div>Level 2: ${stats.bestScores[2] || 0}</div>
                    <div>Level 3: ${stats.bestScores[3] || 0}</div>
                </div>
            </div>
        `;
    }

    createSettingsModal() {
        console.log("Settings modal should be in HTML");
    }

    createStatisticsModal() {
        console.log("Statistics modal should be in HTML");
    }
}


