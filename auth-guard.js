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
    const logoutEl = document.getElementById("logout-btn");

    if (logoutEl) {
      logoutEl.addEventListener("click", () => {
        const authType = localStorage.getItem("authType");
        if (authType === "google" && typeof firebase !== "undefined") {
          try { firebase.auth().signOut(); } catch {}
        }
        localStorage.removeItem("playerName");
        localStorage.removeItem("playerUID");
        localStorage.removeItem("authType");
        localStorage.removeItem("playerPhoto");
        window.location.href = "login.html";
      });
    }
  });
})();
