// ============================================================
// AUTH GUARD — auth-guard.js
// Include on every game page (index.html, worldboss.html)
// Redirects to login.html if not logged in.
// Shows player name + avatar in the player bar.
// ============================================================

(function() {
  const playerName  = localStorage.getItem("playerName");
  const playerUID   = localStorage.getItem("playerUID");

  // Not logged in → back to login
  if (!playerName || !playerUID) {
    window.location.href = "login.html";
    return;
  }

  // Show player bar once DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const nameEl   = document.getElementById("player-bar-name");
    const avatarEl = document.getElementById("player-avatar");
    const logoutEl = document.getElementById("logout-btn");

    if (nameEl) nameEl.textContent = playerName;

    const photo = localStorage.getItem("playerPhoto");
    if (avatarEl && photo) {
      avatarEl.src          = photo;
      avatarEl.style.display = "block";
    }

    if (logoutEl) {
      logoutEl.addEventListener("click", () => {
        const authType = localStorage.getItem("authType");

        // Sign out of Firebase if Google user
        if (authType === "google" && typeof firebase !== "undefined") {
          try { firebase.auth().signOut(); } catch {}
        }

        // Clear session
        localStorage.removeItem("playerName");
        localStorage.removeItem("playerUID");
        localStorage.removeItem("authType");
        localStorage.removeItem("playerPhoto");

        window.location.href = "login.html";
      });
    }
  });
})();
