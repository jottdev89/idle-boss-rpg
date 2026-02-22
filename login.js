// ============================================================
// LOGIN — login.js
// Handles Google Auth + Guest login
// Saves player name + auth state to localStorage
// then redirects to index.html
// ============================================================

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();

const nameInput  = document.getElementById("player-name-input");
const nameError  = document.getElementById("name-error");
const btnGoogle  = document.getElementById("btn-google");
const btnGuest   = document.getElementById("btn-guest");
const statusEl   = document.getElementById("login-status");

// Pre-fill name if already known
nameInput.value = localStorage.getItem("playerName") || "";

// ── If already logged in → skip login page ────────────────
auth.onAuthStateChanged(user => {
  if (user && localStorage.getItem("playerName")) {
    goToGame();
  }
});

// ── Validate name ─────────────────────────────────────────
function validateName() {
  const val = nameInput.value.trim();
  if (!val) {
    nameError.textContent = "Please enter a name first.";
    nameInput.focus();
    return null;
  }
  if (val.length < 2) {
    nameError.textContent = "Name must be at least 2 characters.";
    nameInput.focus();
    return null;
  }
  nameError.textContent = "";
  return val;
}

// ── Google Login ──────────────────────────────────────────
btnGoogle.addEventListener("click", async () => {
  const name = validateName();
  if (!name) return;

  setStatus("Signing in…");
  btnGoogle.disabled = true;

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result   = await auth.signInWithPopup(provider);

    // Use entered name (not Google display name) — player chose it
    localStorage.setItem("playerName", name);
    localStorage.setItem("authType", "google");
    localStorage.setItem("playerUID", result.user.uid);
    localStorage.setItem("playerPhoto", result.user.photoURL || "");

    goToGame();
  } catch (err) {
    setStatus("Login failed: " + err.message);
    btnGoogle.disabled = false;
  }
});

// ── Guest Login ───────────────────────────────────────────
btnGuest.addEventListener("click", () => {
  const name = validateName();
  if (!name) return;

  // Generate a stable guest ID
  let guestId = localStorage.getItem("guestId");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("guestId", guestId);
  }

  localStorage.setItem("playerName", name);
  localStorage.setItem("authType", "guest");
  localStorage.setItem("playerUID", guestId);
  localStorage.setItem("playerPhoto", "");

  goToGame();
});

// ── Helpers ───────────────────────────────────────────────
function setStatus(msg) {
  statusEl.textContent = msg;
}

function goToGame() {
  window.location.href = "index.html";
}
