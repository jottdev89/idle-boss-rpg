// ============================================================
// CHAT.JS — Global Chat via Firebase Realtime Database
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  const MAX_MESSAGES  = 60;
  const RATE_LIMIT_MS = 2000;
  const INIT_TIMEOUT  = 8000; // 8s dann Fehlermeldung

  const playerName = localStorage.getItem("playerName") || "Warrior";
  const playerUID  = localStorage.getItem("playerUID")  || "guest_" + Math.random().toString(36).slice(2);

  // ── DOM ──────────────────────────────────────────────────
  const chatWrap   = document.getElementById("chat-wrap");
  const messagesEl = document.getElementById("chat-messages");
  const inputEl    = document.getElementById("chat-input");
  const sendBtn    = document.getElementById("chat-send");
  const toggleBtn  = document.getElementById("chat-toggle");
  const titleEl    = document.getElementById("chat-title");
  const onlineEl   = document.getElementById("chat-online");

  if (!chatWrap || !messagesEl || !inputEl) return;

  // ── STATE ────────────────────────────────────────────────
  let isOpen      = false;
  let lastSent    = 0;
  let unreadCount = 0;
  let dbReady     = false;
  let chatRef;

  // ── TOGGLE ───────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    chatWrap.classList.add("open");
    toggleBtn.textContent = "▼";
    unreadCount = 0;
    titleEl.textContent = "💬 Global Chat";
    setTimeout(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
      // Kein inputEl.focus() — verhindert Tastatur auf Mobile
    }, 60);
  }

  function closeChat() {
    isOpen = false;
    chatWrap.classList.remove("open");
    toggleBtn.textContent = "▲";
  }

  document.getElementById("chat-header").addEventListener("click", function () {
    isOpen ? closeChat() : openChat();
  });

  // ── FIREBASE INIT ────────────────────────────────────────
  let initAttempts = 0;
  const initStart  = Date.now();

  function initFirebase() {
    initAttempts++;

    // Timeout
    if (Date.now() - initStart > INIT_TIMEOUT) {
      setStatus("⚠ Chat nicht verfügbar — Firebase Database prüfen", "#ff6060");
      console.error("[Chat] Firebase Database init timeout. Mögliche Ursachen:\n" +
        "1. databaseURL fehlt in firebase-config.js\n" +
        "2. Realtime Database nicht aktiviert in Firebase Console\n" +
        "3. Database Rules verbieten Zugriff");
      return;
    }

    // Firebase SDK noch nicht geladen
    if (typeof firebase === "undefined") {
      setTimeout(initFirebase, 300); return;
    }

    // Database SDK fehlt
    if (typeof firebase.database === "undefined") {
      setStatus("⚠ firebase-database-compat.js fehlt", "#ff6060");
      console.error("[Chat] firebase.database ist undefined — firebase-database-compat.js nicht geladen?");
      return;
    }

    // databaseURL fehlt in Config
    let db;
    try {
      db = firebase.database();
    } catch (e) {
      setStatus("⚠ databaseURL fehlt in firebase-config.js", "#ff6060");
      console.error("[Chat] firebase.database() Fehler:", e.message);
      return;
    }

    // Test-Verbindung
    db.ref(".info/connected").on("value", snap => {
      if (snap.val() === true) {
        if (!dbReady) {
          dbReady = true;
          setStatus(null);
          setupChat(db);
        }
      } else {
        if (dbReady) setStatus("⚠ Verbindung unterbrochen…", "#ffaa40");
        else         setStatus("⏳ Verbinde…", "#888");
      }
    });
  }

  function setupChat(db) {
    chatRef = db.ref("globalChat");
    const presRef = db.ref("presence/" + playerUID);

    // Presence
    try {
      presRef.set({ name: playerName, online: true, ts: Date.now() });
      presRef.onDisconnect().remove();
      db.ref("presence").on("value", snap => {
        if (onlineEl) onlineEl.textContent = snap.numChildren() + " online";
      });
    } catch(e) { console.warn("[Chat] Presence Fehler:", e); }

    // Nachrichten empfangen
    let firstLoad = true;
    chatRef.limitToLast(MAX_MESSAGES).on("child_added", snap => {
      const msg = snap.val();
      if (!msg || !msg.text) return;
      appendMessage(msg, snap.key);
      if (!firstLoad && !isOpen) {
        unreadCount++;
        titleEl.textContent = "💬 Global Chat (" + unreadCount + ")";
      }
    });

    chatRef.limitToLast(MAX_MESSAGES).once("value", () => {
      firstLoad = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function setStatus(msg, color) {
    let el = document.getElementById("chat-status");
    if (!msg) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "chat-status";
      el.style.cssText = "padding:8px 12px;font-family:var(--font-title);font-size:10px;letter-spacing:1px;text-align:center;";
      messagesEl.prepend(el);
    }
    el.style.color = color || "#888";
    el.textContent = msg;
  }

  initFirebase();

  // ── SEND ─────────────────────────────────────────────────
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    if (!dbReady || !chatRef) {
      showError("Keine Verbindung zur Datenbank");
      return;
    }

    const now = Date.now();
    if (now - lastSent < RATE_LIMIT_MS) {
      showError("Bitte kurz warten…");
      return;
    }

    lastSent = now;
    inputEl.value = "";
    inputEl.setAttribute("readonly", true);
    inputEl.blur();

    const level = window.gameState?.playerLevel ?? 1;

    chatRef.push({
      uid:   playerUID,
      name:  playerName,
      level: level,
      text:  text,
      ts:    firebase.database.ServerValue.TIMESTAMP
    }).catch(e => {
      console.error("[Chat] Senden Fehler:", e);
      showError("Senden fehlgeschlagen: " + e.message);
    });

    // Älteste löschen wenn zu viele
    chatRef.once("value", snap => {
      if (snap.numChildren() > MAX_MESSAGES) {
        let oldest = null;
        snap.forEach(child => { if (!oldest) oldest = child.key; });
        if (oldest) chatRef.child(oldest).remove();
      }
    });
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

  // Tastatur auf Mobile nicht automatisch öffnen
  // readonly bis User direkt draufklickt
  inputEl.setAttribute("readonly", true);
  inputEl.addEventListener("click", function () {
    inputEl.removeAttribute("readonly");
    inputEl.focus();
  });

  // ── RENDER ───────────────────────────────────────────────
  function appendMessage(msg, key) {
    if (document.getElementById("msg-" + key)) return;

    const isSelf = msg.uid === playerUID;
    const time   = msg.ts
      ? new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const div = document.createElement("div");
    div.id        = "msg-" + key;
    div.className = "chat-msg";
    div.innerHTML =
      '<div class="chat-msg-header">' +
        '<span class="chat-msg-name' + (isSelf ? " chat-msg-name-self" : "") + '">' + esc(msg.name) + '</span>' +
        '<span class="chat-msg-lvl">Lv.' + (msg.level ?? 1) + '</span>' +
        '<span class="chat-msg-time">' + time + '</span>' +
      '</div>' +
      '<div class="chat-msg-text' + (isSelf ? " chat-msg-text-self" : "") + '">' + esc(msg.text) + '</div>';

    messagesEl.appendChild(div);

    while (messagesEl.children.length > MAX_MESSAGES + 1) {
      messagesEl.removeChild(messagesEl.firstChild);
    }

    const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
    if (nearBottom || isSelf) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showError(msg) {
    const el = document.createElement("div");
    el.className = "chat-error";
    el.textContent = msg;
    messagesEl.appendChild(el);
    setTimeout(() => el.remove(), 3000);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

});
