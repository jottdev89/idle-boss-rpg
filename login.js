// ============================================================
// LOGIN — login.js
//
// Google User:
//   - Erster Login → Name eingeben → in Firebase gespeichert
//   - Spätere Logins → Name wird aus Firebase geladen
//   - Name ist permanent an die Google UID gebunden
//
// Gast:
//   - Name eingeben → in localStorage gespeichert
//   - Stabile Gast-ID im localStorage
// ============================================================

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.database();

// ── DOM ──────────────────────────────────────────────────────
const nameSection      = document.getElementById("name-section");
const returningSection = document.getElementById("returning-section");
const returningNameEl  = document.getElementById("returning-name");
const nameInput        = document.getElementById("player-name-input");
const nameError        = document.getElementById("name-error");
const btnGoogle        = document.getElementById("btn-google");
const btnGuest         = document.getElementById("btn-guest");
const statusEl         = document.getElementById("login-status");

// ── AUTO-LOGIN: Bereits eingeloggt? ──────────────────────────
auth.onAuthStateChanged(async user => {
  if (!user) return;

  // Google User ist noch eingeloggt → Namen aus Firebase laden
  setStatus("Loading your profile…");
  btnGoogle.disabled = true;

  const existingName = await loadNameFromFirebase(user.uid);

  if (existingName) {
    // Bekannter Spieler → direkt weiter
    saveSession(user.uid, existingName, user.photoURL || "", "google");
    goToGame();
  } else {
    // Eingeloggt aber noch kein Name → Eingabe zeigen
    setStatus("");
    btnGoogle.disabled = false;
  }
});

// ── NAME AUS FIREBASE LADEN ───────────────────────────────────
async function loadNameFromFirebase(uid) {
  try {
    const snap = await db.ref(`players/${uid}/name`).once("value");
    return snap.val() || null;
  } catch { return null; }
}

// ── NAME IN FIREBASE SPEICHERN ────────────────────────────────
async function saveNameToFirebase(uid, name) {
  try {
    await db.ref(`players/${uid}`).set({ name, createdAt: Date.now() });
  } catch(e) {
    console.warn("Could not save name to Firebase:", e);
  }
}

// ── VALIDIERUNG ───────────────────────────────────────────────
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

// ── GOOGLE LOGIN ──────────────────────────────────────────────
btnGoogle.addEventListener("click", async () => {
  setStatus("Signing in…");
  btnGoogle.disabled = true;

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result   = await auth.signInWithPopup(provider);
    const user     = result.user;

    // Prüfen ob dieser Spieler schon einen Namen hat
    const existingName = await loadNameFromFirebase(user.uid);

    if (existingName) {
      // Bekannter Spieler → direkt weiter
      saveSession(user.uid, existingName, user.photoURL || "", "google");
      goToGame();
    } else {
      // Neuer Spieler → Name eingeben lassen
      setStatus("");
      btnGoogle.disabled = false;
      showNameInput();

      // Google Button wird jetzt zum "Confirm Name" Button
      btnGoogle.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:20px;height:20px;"> Confirm & Enter Game`;
      btnGoogle.onclick = async () => {
        const name = validateName();
        if (!name) return;

        btnGoogle.disabled = true;
        setStatus("Saving your name…");

        await saveNameToFirebase(user.uid, name);
        saveSession(user.uid, name, user.photoURL || "", "google");
        goToGame();
      };
    }

  } catch (err) {
    setStatus("Login failed: " + err.message);
    btnGoogle.disabled = false;
  }
});

// ── GAST LOGIN ────────────────────────────────────────────────
btnGuest.addEventListener("click", () => {
  const name = validateName();
  if (!name) return;

  let guestId = localStorage.getItem("guestId");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("guestId", guestId);
  }

  saveSession(guestId, name, "", "guest");
  goToGame();
});

// ── HELPERS ───────────────────────────────────────────────────
function saveSession(uid, name, photo, authType) {
  localStorage.setItem("playerUID",   uid);
  localStorage.setItem("playerName",  name);
  localStorage.setItem("playerPhoto", photo);
  localStorage.setItem("authType",    authType);
}

function showNameInput() {
  nameSection.style.display      = "block";
  returningSection.style.display = "none";
}

function showReturning(name) {
  nameSection.style.display      = "none";
  returningSection.style.display = "block";
  returningNameEl.textContent    = name;
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function goToGame() {
  window.location.href = "index.html";
}
