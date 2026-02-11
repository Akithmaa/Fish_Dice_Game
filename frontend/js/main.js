window.addEventListener("unhandledrejection", function (event) {
  if (
    event.reason &&
    typeof event.reason === "string" &&
    event.reason.includes("message channel closed")
  ) {
    event.preventDefault();
    return;
  }
  console.error("Unhandled promise rejection:", event.reason);
});

//when js has error
window.addEventListener("error", function (event) {
  if (event.message && event.message.includes("message channel closed")) {
    event.preventDefault();
    return;
  }
});

function selectLevel(level) {
  localStorage.setItem("selectedLevel", level);
  navigateTo("game");
}

//when webpage structure has loaded
document.addEventListener("DOMContentLoaded", () => {
  
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) {
    homeBtn.onclick = () => navigateTo("home");
  }

  router.register("home", () => {
    document.body.classList.add("main-page");
    document.body.classList.remove("ocean-bg");

    if (window.gameInstance && typeof window.gameInstance.cleanup === 'function') {
      window.gameInstance.cleanup();
      window.gameInstance = null;
    }

    const homeLogoutBtn = document.getElementById("homeLogoutBtn");
    if (homeLogoutBtn) {
      homeLogoutBtn.onclick = async (e) => {
        e.preventDefault();
        if (typeof performLogout === "function") {
          await performLogout();
        } else {
          await apiLogout();
          localStorage.clear();
          sessionStorage.clear();
          navigateTo("login");
        }
      };
    }
  });

  router.register("login", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");
  });

  router.register("signup", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");

    if (typeof initializeCharacterSelection === "function") {
      initializeCharacterSelection();
    }
  });

  router.register("game", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");

    if (window.gameInstance && typeof window.gameInstance.cleanup === 'function') {
      window.gameInstance.cleanup();
      window.gameInstance = null;
    }

    const grid = document.getElementById("grid");
    if (grid) {
      setTimeout(() => {
        if (typeof UnderseaGame !== "undefined" && !window.gameInstance) {
          window.gameInstance = new UnderseaGame();
        }
      }, 100);
    }
  });

  router.register("levels", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");
    
    if (window.gameInstance && typeof window.gameInstance.cleanup === 'function') {
      window.gameInstance.cleanup();
      window.gameInstance = null;
    }
  });

  router.register("instructions", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");

    const instructionsBackBtn = document.getElementById("instructionsBackBtn");
    if (instructionsBackBtn) {
      instructionsBackBtn.onclick = (e) => {
        e.preventDefault();
        navigateTo("home");
      };
    }
  });

  router.register("leaderboard", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");

    const leaderboardBackBtn = document.getElementById("leaderboardBackBtn");
    if (leaderboardBackBtn) {
      leaderboardBackBtn.onclick = (e) => {
        e.preventDefault();
        navigateTo("home");
      };
    }

    loadLeaderboardPage();
  });

  router.register("profile", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");
  });

  router.register("settings", () => {
    document.body.classList.remove("main-page");
    document.body.classList.add("ocean-bg");

    const settingsBackBtn = document.getElementById("settingsBackBtn");
    if (settingsBackBtn) {
      settingsBackBtn.onclick = (e) => {
        e.preventDefault();
        navigateTo("home");
      };
    }

    if (typeof updateSettingsUI === 'function') {
      updateSettingsUI();
    } else {
      setTimeout(() => {
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
      }, 100);
    }
  });

});

async function loadLeaderboardPage(page = 1, itemsPerPage = 10) {
  const list = document.getElementById("leaderboardListPage");
  const pagination = document.getElementById("leaderboardPaginationPage");
  
  if (!list) return;
  
  list.innerHTML = "<div style='text-align: center; padding: 2rem;'>Loading...</div>";
  if (pagination) pagination.innerHTML = "";

  try {
    const data = await apiFetchLeaderboard();
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = "<div style='text-align: center; padding: 2rem;'>No scores yet. Be the first to play!</div>";
      return;
    }

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);

    pageData.forEach((u, i) => {
      const globalIndex = startIndex + i;
      
      let avatarPath = u.avatar || "";
      if (avatarPath) {
        const characterMatch = avatarPath.match(/assets\/([A-Za-z]+)\.png$/);
        if (characterMatch) {
          const characterName = characterMatch[1].toLowerCase();
          const validCharacters = ['dolphin', 'jellyfish', 'octopus', 'seahorse', 'shark', 'whale'];
          if (validCharacters.includes(characterName)) {
            avatarPath = `assets/characters/${characterName}.png`;
          }
        }
      }

      const avatar = avatarPath
        ? `<img src="${avatarPath}" alt="${u.username}" class="leaderboard-avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover;">`
        : '';
      const item = document.createElement('div');
      item.className = 'leaderboard-item-page';
      item.innerHTML = `
        <div class="leaderboard-rank-page">${globalIndex + 1}</div>
        <div class="leaderboard-info-page" style="display: flex; align-items: center; flex: 1;">
          ${avatar}
          <strong style="font-size: 1.1rem;">${u.username || "Unknown"}</strong>
        </div>
        <div class="leaderboard-score-page" style="font-size: 1.2rem; font-weight: bold;">${u.score || 0}</div>
      `;
      list.appendChild(item);
    });

    if (pagination && totalPages > 1) {
      let paginationHTML = '<div class="pagination-controls">';
      
      if (page > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="${page - 1}" aria-label="Previous page">
          <i class="fa-solid fa-chevron-left"></i> Previous
        </button>`;
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
          Next <i class="fa-solid fa-chevron-right"></i>
        </button>`;
      }
      
      paginationHTML += '</div>';
      pagination.innerHTML = paginationHTML;
      
      pagination.querySelectorAll('.pagination-btn:not(.active)').forEach(btn => {
        btn.addEventListener('click', () => {
          const newPage = parseInt(btn.getAttribute('data-page'));
          loadLeaderboardPage(newPage, itemsPerPage);
        });
      });
    }
  } catch (err) {
    list.innerHTML = "<div style='text-align: center; padding: 2rem; color: #ef4444;'>Error loading leaderboard. Please try again.</div>";
    console.error("Leaderboard fetch failed:", err);
  }
}

function openSettingsFromHome() {
  if (typeof navigateTo === 'function') {
    navigateTo('settings');
  } else {
    window.location.href = "index.html#settings";
  }
}

