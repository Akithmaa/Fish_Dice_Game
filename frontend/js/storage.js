export const Store = {
  get: (k, d=null) => JSON.parse(localStorage.getItem(k) || "null") ?? d,
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  del: k => localStorage.removeItem(k)
};

function clearAllStorage() {
  const localStorageKeys = [
    "user",
    "isLoggedIn",
    "rememberMe",
    "selectedLevel",
    "sound",
    "musicEnabled"
  ];
  
  localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  localStorage.clear();
  
  sessionStorage.clear();
  
  console.log("All storage cleared!");
  
  if (typeof API_BASE_URL !== 'undefined') {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    }).catch(() => {
    });
  }
  
  return true;
}

if (typeof window !== 'undefined') {
  window.clearAllStorage = clearAllStorage;
}
