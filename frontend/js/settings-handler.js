document.addEventListener('DOMContentLoaded', () => {
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const statisticsModal = document.getElementById('statisticsModal');
    const closeStatistics = document.getElementById('closeStatistics');
    const settingsPage = document.getElementById('page-settings');
    
    if (settingsModal) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (settingsModal.classList.contains('active')) {
                        updateSettingsUI();
                    }
                }
            });
        });
        observer.observe(settingsModal, { attributes: true });
    }
    
    if (settingsPage) {
        const pageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (settingsPage.style.display !== 'none' && settingsPage.style.display !== '') {
                        updateSettingsUI();
                    }
                }
            });
        });
        pageObserver.observe(settingsPage, { attributes: true, attributeFilter: ['style'] });
    }
    
    window.updateSettingsUI = function() {
        if (typeof settings !== 'undefined') {
            const musicToggle = document.getElementById('settingMusic');
            const soundToggle = document.getElementById('settingSound');
            const musicVolume = document.getElementById('settingMusicVolume');
            const soundVolume = document.getElementById('settingSoundVolume');
            const musicVolumeValue = document.getElementById('musicVolumeValue');
            const soundVolumeValue = document.getElementById('soundVolumeValue');
            const animationSpeed = document.getElementById('settingAnimationSpeed');
            const showParticles = document.getElementById('settingShowParticles');
            const showAnimations = document.getElementById('settingShowAnimations');
            
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
    };
    
    function updateSettingsUI() {
        window.updateSettingsUI();
    }

    if (closeSettings) {
        closeSettings.onclick = () => {
            if (typeof window.gameInstance !== 'undefined' && window.gameInstance.closeModal) {
                window.gameInstance.closeModal('settingsModal');
            } else {
                settingsModal?.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
            const soundBtn = document.getElementById('btn-sound-login');
            if (soundBtn) {
                soundBtn.style.display = '';
            }
        };
    }
    
    if (settingsModal) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const soundBtn = document.getElementById('btn-sound-login');
                    if (soundBtn) {
                        if (settingsModal.classList.contains('active')) {
                            soundBtn.style.display = 'none';
                        } else {
                            soundBtn.style.display = '';
                        }
                    }
                }
            });
        });
        observer.observe(settingsModal, { attributes: true });
    }

    if (closeStatistics) {
        closeStatistics.onclick = () => {
            if (typeof window.gameInstance !== 'undefined' && window.gameInstance.closeModal) {
                window.gameInstance.closeModal('statisticsModal');
            } else {
                statisticsModal?.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        };
    }

    if (typeof settings !== 'undefined') {
        const musicToggle = document.getElementById('settingMusic');
        const soundToggle = document.getElementById('settingSound');
        const musicVolume = document.getElementById('settingMusicVolume');
        const soundVolume = document.getElementById('settingSoundVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        const soundVolumeValue = document.getElementById('soundVolumeValue');
        const animationSpeed = document.getElementById('settingAnimationSpeed');
        const showParticles = document.getElementById('settingShowParticles');
        const showAnimations = document.getElementById('settingShowAnimations');

        if (musicToggle) {
            musicToggle.onchange = (e) => {
                const isEnabled = e.target.checked;
                settings.set('musicEnabled', isEnabled);
                
                if (!isEnabled) {
                    settings.set('musicVolume', 0);
                    if (musicVolume) {
                        musicVolume.value = 0;
                    }
                    if (musicVolumeValue) {
                        musicVolumeValue.textContent = '0%';
                    }
                } else {
                    const currentVolume = settings.get('musicVolume');
                    if (currentVolume === 0) {
                        settings.set('musicVolume', 0.5);
                        if (musicVolume) {
                            musicVolume.value = 50;
                        }
                        if (musicVolumeValue) {
                            musicVolumeValue.textContent = '50%';
                        }
                    }
                }
                
                if (typeof SoundManager !== 'undefined') {
                    SoundManager.enabled = isEnabled;
                    if (SoundManager.backgroundMusic) {
                        SoundManager.backgroundMusic.volume = settings.get('musicVolume');
                    }
                    SoundManager.updateMusic();
                    SoundManager.updateButtonStates();
                }
            };
        }

        if (soundToggle) {
            soundToggle.onchange = (e) => {
                settings.set('soundEffectsEnabled', e.target.checked);
                if (typeof SoundManager !== 'undefined') {
                    SoundManager.clickSoundEnabled = e.target.checked;
                    SoundManager.updateButtonStates();
                }
            };
        }

        if (musicVolume) {
            musicVolume.oninput = (e) => {
                const value = parseInt(e.target.value);
                const volume = value / 100;
                settings.set('musicVolume', volume);
                
                if (musicVolumeValue) {
                    musicVolumeValue.textContent = value + '%';
                }
                
                const shouldEnable = value > 0;
                const currentlyEnabled = settings.get('musicEnabled');
                
                if (shouldEnable !== currentlyEnabled) {
                    settings.set('musicEnabled', shouldEnable);
                    if (musicToggle) {
                        musicToggle.checked = shouldEnable;
                    }
                }
                
                if (typeof SoundManager !== 'undefined') {
                    SoundManager.enabled = shouldEnable;
                    if (SoundManager.backgroundMusic) {
                        SoundManager.backgroundMusic.volume = volume;
                    }
                    SoundManager.updateMusic();
                    SoundManager.updateButtonStates();
                }
            };
        }

        if (soundVolume) {
            soundVolume.oninput = (e) => {
                const value = parseInt(e.target.value);
                settings.set('soundVolume', value / 100);
                if (soundVolumeValue) {
                    soundVolumeValue.textContent = value + '%';
                }
            };
        }

        if (animationSpeed) {
            animationSpeed.onchange = (e) => {
                settings.set('animationSpeed', e.target.value);
            };
        }

        if (showParticles) {
            showParticles.onchange = (e) => {
                settings.set('showParticles', e.target.checked);
            };
        }

        if (showAnimations) {
            showAnimations.onchange = (e) => {
                settings.set('showAnimations', e.target.checked);
            };
        }
    }

});


