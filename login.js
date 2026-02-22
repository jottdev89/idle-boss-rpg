// ============================================================
// LOGIN — login.js
// ============================================================

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.database();

document.addEventListener("DOMContentLoaded", () => {

  // ── DOM ────────────────────────────────────────────────────
  const nameSection      = document.getElementById("name-section");
  const returningSection = document.getElementById("returning-section");
  const returningNameEl  = document.getElementById("returning-name");
  const nameInput        = document.getElementById("player-name-input");
  const nameError        = document.getElementById("name-error");
  const btnGoogle        = document.getElementById("btn-google");
  const btnGuest         = document.getElementById("btn-guest");
  const statusEl         = document.getElementById("login-status");

  // ── HELPERS ──────────────────────────────────────────────
  function setStatus(msg) { statusEl.textContent = msg; }
  function goToGame()     { window.location.href = "index.html"; }

  function showNameInput() {
    nameSection.style.display      = "block";
    returningSection.style.display = "none";
  }

  function showWelcomeBack(name) {
    nameSection.style.display      = "none";
    returningSection.style.display = "block";
    returningNameEl.textContent    = name;
  }

  function saveSession(uid, name, photo, authType) {
    localStorage.setItem("playerUID",   uid);
    localStorage.setItem("playerName",  name);
    localStorage.setItem("playerPhoto", photo);
    localStorage.setItem("authType",    authType);
  }

  function validateName() {
    const val = nameInput.value.trim();
    if (!val)           { nameError.textContent = "Please enter a name first."; nameInput.focus(); return null; }
    if (val.length < 2) { nameError.textContent = "Name must be at least 2 characters."; nameInput.focus(); return null; }
    nameError.textContent = "";
    return val;
  }

  async function loadNameFromFirebase(uid) {
    try {
      const snap = await db.ref(`players/${uid}/name`).once("value");
      return snap.val() || null;
    } catch { return null; }
  }

  async function saveNameToFirebase(uid, name) {
    try {
      await db.ref(`players/${uid}`).set({ name, createdAt: Date.now() });
    } catch(e) { console.warn("Could not save name:", e); }
  }

  // ── SCHRITT 1: Sofort prüfen ob Gast zurückkommt ─────────
  // Das passiert synchron bevor Firebase antwortet
  const guestId   = localStorage.getItem("guestId");
  const guestName = localStorage.getItem("playerName");
  const authType  = localStorage.getItem("authType");

  if (guestId && guestName && authType === "guest") {
    showWelcomeBack(guestName);
  }

  // ── SCHRITT 2: Firebase Auth prüfen (async) ───────────────
  auth.onAuthStateChanged(async user => {
    if (!user) return;

    // Google User ist noch eingeloggt
    setStatus("Loading your profile…");
    btnGoogle.disabled = true;

    const existingName = await loadNameFromFirebase(user.uid);

    if (existingName) {
      // Bekannter Spieler → Welcome Back zeigen, direkt weiter
      showWelcomeBack(existingName);
      saveSession(user.uid, existingName, user.photoURL || "", "google");
      setStatus("");
      btnGoogle.disabled = false;

      // Auto-redirect nach kurzer Verzögerung
      setTimeout(goToGame, 800);
    } else {
      // Google eingeloggt aber noch kein Name → Eingabe zeigen
      showNameInput();
      setStatus("");
      btnGoogle.disabled = false;
      switchGoogleToConfirm(user);
    }
  });

  // ── GOOGLE BUTTON ─────────────────────────────────────────
  btnGoogle.addEventListener("click", async () => {
    // Wenn Welcome Back aktiv → direkt weiter (Google User wird über onAuthStateChanged behandelt)
    setStatus("Signing in…");
    btnGoogle.disabled = true;

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result   = await auth.signInWithPopup(provider);
      const user     = result.user;

      const existingName = await loadNameFromFirebase(user.uid);

      if (existingName) {
        saveSession(user.uid, existingName, user.photoURL || "", "google");
        goToGame();
      } else {
        // Neuer Google Spieler → Name eingeben
        showNameInput();
        setStatus("");
        btnGoogle.disabled = false;
        switchGoogleToConfirm(user);
      }
    } catch (err) {
      setStatus("Login failed: " + err.message);
      btnGoogle.disabled = false;
    }
  });

  function switchGoogleToConfirm(user) {
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

  // ── GAST BUTTON ───────────────────────────────────────────
  btnGuest.addEventListener("click", () => {
    // Zurückkehrender Gast → direkt weiter
    if (guestId && guestName && authType === "guest") {
      saveSession(guestId, guestName, "", "guest");
      goToGame();
      return;
    }

    // Neuer Gast → Name pflichtfeld
    const name = validateName();
    if (!name) return;

    const newGuestId = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("guestId", newGuestId);
    saveSession(newGuestId, name, "", "guest");
    goToGame();
  });

});
