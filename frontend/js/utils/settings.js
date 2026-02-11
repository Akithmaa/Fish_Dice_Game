class SettingsManager {

    constructor() {

        this.defaults = {

            musicEnabled: true,
            soundEffectsEnabled: true,
            musicVolume: 0.5,
            soundVolume: 0.7,
            animationSpeed: 'normal', // fast, normal, slow
            showParticles: true,
            showAnimations: true
        };
        this.settings = { ...this.defaults };
        this.load();
    }
    load() {
        try {

            const saved = localStorage.getItem('game_settings');
            if (saved) {

                this.settings = { ...this.defaults, ...JSON.parse(saved) };
            }

        } catch (e) {

            console.error('Failed to load settings:', e);
        }
        this.apply();

    }
    save() {

        try {
            localStorage.setItem('game_settings', JSON.stringify(this.settings));
            this.apply();
            return true;

        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }
    get(key) {

        return this.settings[key] !== undefined ? this.settings[key] : this.defaults[key];
    }
    set(key, value) {

        this.settings[key] = value;
        this.save();
    }
    apply() {

        if (typeof SoundManager !== 'undefined') {
            const volume = this.settings.musicVolume;
            const shouldEnable = this.settings.musicEnabled && volume > 0;
            SoundManager.enabled = shouldEnable;
            SoundManager.clickSoundEnabled = this.settings.soundEffectsEnabled;
            if (SoundManager.backgroundMusic) {
                SoundManager.backgroundMusic.volume = volume;
            }
            SoundManager.updateMusic();
            SoundManager.updateButtonStates();
        }

        document.documentElement.style.setProperty(

            '--animation-speed',
            this.settings.animationSpeed === 'fast' ? '0.5s' :
            this.settings.animationSpeed === 'slow' ? '1.5s' : '1s'

        );
        if (this.settings.showParticles) {
            document.body.classList.remove('no-particles');

        } else {
            document.body.classList.add('no-particles');

        }
        if (this.settings.showAnimations) {

            document.body.classList.remove('no-animations');

        } else {
            document.body.classList.add('no-animations');

        }

    }
    reset() {

        this.settings = { ...this.defaults };

        this.save();
    }

}
const settings = new SettingsManager();




