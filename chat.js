// ============================================================
// CHAT.JS — Global Chat via Firebase Realtime Database
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  const MAX_MESSAGES  = 60;
  const RATE_LIMIT_MS = 2000;

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
  let chatRef, presRef;

  // ── TOGGLE ───────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    chatWrap.classList.add("open");
    toggleBtn.textContent = "▼";
    unreadCount = 0;
    titleEl.textContent = "💬 Global Chat";
    setTimeout(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
      inputEl.focus();
    }, 60);
  }

  function closeChat() {
    isOpen = false;
    chatWrap.classList.remove("open");
    toggleBtn.textContent = "▲";
  }

  // Klick auf Header ODER Toggle-Button klappt auf/zu
  document.getElementById("chat-header").addEventListener("click", function () {
    isOpen ? closeChat() : openChat();
  });

  // ── FIREBASE INIT ────────────────────────────────────────
  function initFirebase() {
    try {
      if (typeof firebase === "undefined" || !firebase.database) {
        setTimeout(initFirebase, 300);
        return;
      }

      const db = firebase.database();
      chatRef  = db.ref("globalChat");
      presRef  = db.ref("presence/" + playerUID);
      dbReady  = true;

      // Presence
      presRef.set({ name: playerName, online: true, ts: Date.now() });
      presRef.onDisconnect().remove();

      // Online-Zähler
      db.ref("presence").on("value", snap => {
        if (onlineEl) onlineEl.textContent = (snap.numChildren() || 0) + " online";
      });

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

      // Nach erstem Batch scrollen
      chatRef.limitToLast(MAX_MESSAGES).once("value", () => {
        firstLoad = false;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });

    } catch (e) {
      console.warn("Chat Firebase init error:", e);
    }
  }

  initFirebase();

  // ── SEND ─────────────────────────────────────────────────
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    if (!dbReady) { showError("Verbindung wird aufgebaut…"); return; }

    const now = Date.now();
    if (now - lastSent < RATE_LIMIT_MS) {
      showError("Bitte kurz warten…");
      return;
    }

    lastSent = now;
    inputEl.value = "";

    const level = window.gameState?.playerLevel ?? 1;

    chatRef.push({
      uid:   playerUID,
      name:  playerName,
      level: level,
      text:  text,
      ts:    firebase.database.ServerValue.TIMESTAMP
    }).catch(e => showError("Senden fehlgeschlagen"));

    // Älteste Nachricht löschen wenn zu viele
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

  // ── RENDER MESSAGE ───────────────────────────────────────
  function appendMessage(msg, key) {
    if (document.getElementById("msg-" + key)) return;

    const isSelf = msg.uid === playerUID;
    const time   = msg.ts
      ? new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const div = document.createElement("div");
    div.id        = "msg-" + key;
    div.className = "chat-msg" + (isSelf ? " chat-msg-self" : "");
    div.innerHTML =
      '<div class="chat-msg-header">' +
        '<span class="chat-msg-name' + (isSelf ? " chat-msg-name-self" : "") + '">' + esc(msg.name) + '</span>' +
        '<span class="chat-msg-lvl">Lv.' + (msg.level ?? 1) + '</span>' +
        '<span class="chat-msg-time">' + time + '</span>' +
      '</div>' +
      '<div class="chat-msg-text">' + esc(msg.text) + '</div>';

    messagesEl.appendChild(div);

    // DOM-Limit
    while (messagesEl.children.length > MAX_MESSAGES) {
      messagesEl.removeChild(messagesEl.firstChild);
    }

    // Auto-scroll wenn nah am Ende
    const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
    if (nearBottom || isSelf) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── HELPERS ──────────────────────────────────────────────
  function showError(msg) {
    const el = document.createElement("div");
    el.className = "chat-error";
    el.textContent = msg;
    messagesEl.appendChild(el);
    setTimeout(() => el.remove(), 2000);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

});
