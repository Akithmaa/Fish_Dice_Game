//loads when webpages has loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing SoundManager');
  SoundManager.init();
  
  document.addEventListener('click', function(e) {
    const soundButton = e.target.closest('[id^="btn-sound"]');
    if (soundButton) {
      e.preventDefault();
      e.stopPropagation();
      SoundManager.toggle();
      return;
    }

    SoundManager.startMusic();
  }, true); // Use capture phase to ensure this runs before other listeners
});

document.addEventListener('keydown', function() {
  SoundManager.startMusic();
});


class SoundManager {
  static backgroundMusic = null;
  static enabled = true;
  static wasPlayingBeforeHidden = false;
  static clickSoundContext = null;
  static clickSoundEnabled = true;

  
  static async init() {
    console.log('SoundManager initializing...');

    // Get Freesound music 
    const bgmUrl = await getBackgroundMusicFromAPI();

    if (bgmUrl) {
      console.log("Loaded Freesound BGM:", bgmUrl);
      this.backgroundMusic = new Audio(bgmUrl);
    } else {
      console.warn("API BGM failed — using local fallback");
      this.backgroundMusic = new Audio("assets/sounds/background-music.mp3");
    }

    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.5;

    this.backgroundMusic.addEventListener('error', function (e) {
      console.error('Error loading background music:', e);
    });

    this.backgroundMusic.addEventListener('canplay', function () {
      console.log('Background music loaded and ready to play');
    });
    this.initClickSound();
    
    this.syncWithSettings();
    
    console.log('SoundManager initialized - Music:', this.enabled ? 'ON' : 'OFF', 'Effects:', this.clickSoundEnabled ? 'ON' : 'OFF');
    
    this.updateButtonStates();
    this.updateMusic();
    this.setupVisibilityHandler();
    
    this.setupClickSounds();
    
}
  
  static initClickSound() {
    try {
      this.clickSoundContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported for click sounds:', e);
      this.clickSoundContext = null;
    }
  }
  
  static syncWithSettings() {
    if (typeof settings !== 'undefined') {
      this.enabled = settings.get('musicEnabled');
      this.clickSoundEnabled = settings.get('soundEffectsEnabled');
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = settings.get('musicVolume');
      }
    }
  }
  
  static playClickSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      
      const oscillator = this.clickSoundContext.createOscillator();
      const gainNode = this.clickSoundContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // Higher pitch for click
      
      gainNode.gain.setValueAtTime(0, this.clickSoundContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15 * soundVolume, this.clickSoundContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.clickSoundContext.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.clickSoundContext.destination);
      
      oscillator.start(this.clickSoundContext.currentTime);
      oscillator.stop(this.clickSoundContext.currentTime + 0.1);
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playDiceRollSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      
      for (let i = 0; i < 3; i++) {
        const oscillator = this.clickSoundContext.createOscillator();
        const gainNode = this.clickSoundContext.createGain();
        
        oscillator.type = 'square'; // Square wave for a more percussive sound
        oscillator.frequency.value = 200 + (i * 50) + Math.random() * 100; // Varying frequencies
        
        const startTime = now + (i * 0.05);
        const duration = 0.08;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2 * soundVolume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.clickSoundContext.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      }
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playMovementSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      
      const oscillator = this.clickSoundContext.createOscillator();
      const gainNode = this.clickSoundContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300, now);
      oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08 * soundVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.clickSoundContext.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playSnakeHitSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      
      const oscillator = this.clickSoundContext.createOscillator();
      const gainNode = this.clickSoundContext.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.3);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2 * soundVolume, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.clickSoundContext.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playLevelCompleteSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (C major chord)
      
      notes.forEach((freq, index) => {
        const oscillator = this.clickSoundContext.createOscillator();
        const gainNode = this.clickSoundContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.1);
        const duration = 0.3;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15 * soundVolume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.clickSoundContext.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playHeartSuccessSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      
      const notes = [523.25, 659.25]; // C, E
      
      notes.forEach((freq, index) => {
        const oscillator = this.clickSoundContext.createOscillator();
        const gainNode = this.clickSoundContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.08);
        const duration = 0.2;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.12 * soundVolume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.clickSoundContext.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playHeartFailureSound() {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      
      const oscillator = this.clickSoundContext.createOscillator();
      const gainNode = this.clickSoundContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, now);
      oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1 * soundVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.clickSoundContext.destination);
      
      oscillator.start(now);
      oscillator.stop(now + 0.2);
      
      if (this.clickSoundContext.state === 'suspended') {
        this.clickSoundContext.resume();
      }
    } catch (e) {
    }
  }
  
  static playDiceRollLoop(duration = 500) {
    if (!this.clickSoundEnabled || !this.clickSoundContext) {
      return null;
    }
    
    try {
      const soundVolume = typeof settings !== 'undefined' ? settings.get('soundVolume') : 0.7;
      const now = this.clickSoundContext.currentTime;
      const intervals = [];
      
      const intervalTime = 50; // Match the animation frame rate
      const numIntervals = Math.floor(duration / intervalTime);
      
      for (let i = 0; i < numIntervals; i++) {
        const intervalId = setTimeout(() => {
          for (let j = 0; j < 2; j++) {
            const oscillator = this.clickSoundContext.createOscillator();
            const gainNode = this.clickSoundContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.value = 150 + Math.random() * 200;
            
            const startTime = this.clickSoundContext.currentTime;
            const soundDuration = 0.03;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15 * soundVolume, startTime + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + soundDuration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.clickSoundContext.destination);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + soundDuration);
          }
          
          if (this.clickSoundContext.state === 'suspended') {
            this.clickSoundContext.resume();
          }
        }, i * intervalTime);
        
        intervals.push(intervalId);
      }
      
      return () => {
        intervals.forEach(id => clearTimeout(id));
      };
    } catch (e) {
      return null;
    }
  }
  
  static setupClickSounds() {
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.closest('[id^="btn-sound"]')) {
        return;
      }
      
      if (target.tagName === 'BUTTON' || 
          target.closest('button') || 
          target.closest('.btn') ||
          target.closest('label.switch') ||
          target.closest('input[type="checkbox"]') ||
          target.closest('input[type="radio"]') ||
          target.closest('.modal .btn') ||
          (target.closest('a[href]') && !target.closest('a[href="#"]'))) {
        
        this.playClickSound();
      }
    }, true); // Use capture phase to catch events early
  }
  
  static setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (!this.backgroundMusic.paused) {
          this.wasPlayingBeforeHidden = true;
          this.backgroundMusic.pause();
          console.log('Tab hidden - music paused');
        } else {
          this.wasPlayingBeforeHidden = false;
        }
      } else {
        if (this.wasPlayingBeforeHidden && this.enabled) {
          this.backgroundMusic.play().catch(function(error) {
            console.log('Could not resume music after tab became visible:', error);
          });
          console.log('Tab visible - music resumed');
        }
      }
    });
  }

  static toggle() {
    const wasEnabled = this.enabled;
    const wasSoundEnabled = this.clickSoundEnabled;
    
    this.enabled = !this.enabled;
    this.clickSoundEnabled = !this.clickSoundEnabled;
    
    console.log('Sound toggled - Music:', this.enabled ? 'ON' : 'OFF', 'Effects:', this.clickSoundEnabled ? 'ON' : 'OFF');
    
    if (typeof settings !== 'undefined') {
      if (!wasEnabled && this.enabled) {
        const currentVolume = settings.get('musicVolume');
        if (currentVolume === 0) {
          settings.set('musicVolume', 0.5);
        }
      }
      
      settings.set('musicEnabled', this.enabled);
      settings.set('soundEffectsEnabled', this.clickSoundEnabled);
      
      if (this.backgroundMusic) {
        if (this.enabled) {
          const volume = settings.get('musicVolume');
          if (volume === 0) {
            settings.set('musicVolume', 0.5);
            this.backgroundMusic.volume = 0.5;
          } else {
            this.backgroundMusic.volume = volume;
          }
        } else {
          this.backgroundMusic.volume = settings.get('musicVolume');
        }
      }
    } else {
      localStorage.setItem('musicEnabled', this.enabled.toString());
      localStorage.setItem('soundEffectsEnabled', this.clickSoundEnabled.toString());
    }
    
    this.updateMusic();
    this.updateButtonStates();
    this.updateSettingsUI();
  }
  
  static updateSettingsUI() {
    if (typeof settings !== 'undefined') {
      const musicToggle = document.getElementById('settingMusic');
      const soundToggle = document.getElementById('settingSound');
      const musicVolume = document.getElementById('settingMusicVolume');
      const musicVolumeValue = document.getElementById('musicVolumeValue');
      
      if (musicToggle) {
        musicToggle.checked = this.enabled;
      }
      if (soundToggle) {
        soundToggle.checked = this.clickSoundEnabled;
      }
      
      if (musicVolume) {
        const volume = this.enabled ? settings.get('musicVolume') * 100 : 0;
        musicVolume.value = volume;
        if (musicVolumeValue) {
          musicVolumeValue.textContent = Math.round(volume) + '%';
        }
      }
    }
  }
  
  static updateButtonStates() {
    const buttons = document.querySelectorAll('[id^="btn-sound"]');
    const isMuted = !this.enabled || !this.clickSoundEnabled;
    buttons.forEach(btn => {
      btn.textContent = isMuted ? "🔇" : "🔈";
      btn.setAttribute('aria-label', isMuted ? 'Sound is off - Click to enable' : 'Sound is on - Click to disable');
    });
  }

  static updateMusic() {
    const volume = typeof settings !== 'undefined' ? settings.get('musicVolume') : 0.5;
    const shouldPlay = this.enabled && volume > 0;
    
    if (shouldPlay) {
      console.log('Attempting to play music...');
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = volume;
        this.backgroundMusic.play().catch(function(error) {
          console.log('Auto-play prevented, need user interaction:', error);
        });
      }
    } else {
      console.log('Pausing music...');
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
      }
    }
  }

  static startMusic() {
    if (this.enabled) {
      console.log('Starting music after user interaction');
      this.backgroundMusic.play().catch(function(error) {
        console.error('Error playing music:', error);
      });
    }
  }
}
