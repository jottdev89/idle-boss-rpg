// ============================================================
// CHAT.JS — Global Chat via Firebase Realtime Database
// ============================================================

(function () {
  const MAX_MESSAGES   = 60;   // wie viele Nachrichten wir laden/halten
  const RATE_LIMIT_MS  = 2000; // min. Zeit zwischen Nachrichten

  const playerName = localStorage.getItem("playerName") || "Warrior";
  const playerUID  = localStorage.getItem("playerUID")  || "guest";

  // ── DOM ────────────────────────────────────────────────────
  const chatWrap    = document.getElementById("chat-wrap");
  const chatBody    = document.getElementById("chat-body");
  const messagesEl  = document.getElementById("chat-messages");
  const inputEl     = document.getElementById("chat-input");
  const sendBtn     = document.getElementById("chat-send");
  const toggleBtn   = document.getElementById("chat-toggle");
  const onlineEl    = document.getElementById("chat-online");

  // ── STATE ──────────────────────────────────────────────────
  let isOpen       = false;
  let lastSent     = 0;
  let unreadCount  = 0;
  let isFirstLoad  = true;

  // ── FIREBASE ───────────────────────────────────────────────
  const db        = firebase.database();
  const chatRef   = db.ref("globalChat");
  const presRef   = db.ref("presence/" + playerUID);

  // ── PRESENCE ───────────────────────────────────────────────
  presRef.set({ name: playerName, online: true, lastSeen: Date.now() });
  presRef.onDisconnect().remove();

  // Online-Zähler
  db.ref("presence").on("value", snap => {
    const count = snap.numChildren();
    onlineEl.textContent = count + " online";
  });

  // ── TOGGLE OPEN / CLOSED ───────────────────────────────────
  function openChat() {
    isOpen = true;
    chatWrap.classList.add("open");
    toggleBtn.textContent = "▼";
    unreadCount = 0;
    updateTitle();
    setTimeout(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
      inputEl.focus();
    }, 50);
  }

  function closeChat() {
    isOpen = false;
    chatWrap.classList.remove("open");
    toggleBtn.textContent = "▲";
  }

  toggleBtn.addEventListener("click", () => isOpen ? closeChat() : openChat());
  document.getElementById("chat-header").addEventListener("click", e => {
    if (e.target === toggleBtn) return;
    isOpen ? closeChat() : openChat();
  });

  // ── TITLE / UNREAD ─────────────────────────────────────────
  function updateTitle() {
    const titleEl = document.getElementById("chat-title");
    titleEl.textContent = unreadCount > 0 && !isOpen
      ? `💬 Global Chat (${unreadCount})`
      : "💬 Global Chat";
  }

  // ── SEND MESSAGE ───────────────────────────────────────────
  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    const now = Date.now();
    if (now - lastSent < RATE_LIMIT_MS) {
      showError("Bitte warte kurz…");
      return;
    }

    lastSent = now;
    inputEl.value = "";

    const level = window.gameState?.playerLevel ?? 1;

    chatRef.push({
      uid:    playerUID,
      name:   playerName,
      level:  level,
      text:   text,
      ts:     firebase.database.ServerValue.TIMESTAMP
    });

    // Alte Nachrichten löschen (nur eigene Cleanup-Logik, kein serverseitiges Limit)
    chatRef.limitToFirst(1).once("value", snap => {
      snap.forEach(child => {
        chatRef.child(child.key).remove();
      });
    });
  }

  function showError(msg) {
    const el = document.createElement("div");
    el.className = "chat-error";
    el.textContent = msg;
    messagesEl.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // ── RECEIVE MESSAGES ───────────────────────────────────────
  chatRef.limitToLast(MAX_MESSAGES).on("child_added", snap => {
    const msg = snap.val();
    if (!msg || !msg.text) return;

    appendMessage(msg, snap.key);

    if (!isFirstLoad) {
      if (!isOpen) {
        unreadCount++;
        updateTitle();
      }
    }
  });

  // Nach erstem Laden: isFirstLoad false setzen
  chatRef.limitToLast(MAX_MESSAGES).once("value", () => {
    isFirstLoad = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  function appendMessage(msg, key) {
    // Duplikate verhindern
    if (document.getElementById("msg-" + key)) return;

    const isSelf = msg.uid === playerUID;
    const time   = msg.ts ? new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

    const div = document.createElement("div");
    div.id        = "msg-" + key;
    div.className = "chat-msg" + (isSelf ? " chat-msg-self" : "");

    div.innerHTML = `
      <div class="chat-msg-header">
        <span class="chat-msg-name${isSelf ? " chat-msg-name-self" : ""}">${escHtml(msg.name)}</span>
        <span class="chat-msg-lvl">Lv.${msg.level ?? 1}</span>
        <span class="chat-msg-time">${time}</span>
      </div>
      <div class="chat-msg-text">${escHtml(msg.text)}</div>
    `;

    messagesEl.appendChild(div);

    // Max Nachrichten im DOM halten
    while (messagesEl.children.length > MAX_MESSAGES) {
      messagesEl.removeChild(messagesEl.firstChild);
    }

    // Auto-scroll wenn nah am Ende
    const threshold = 80;
    const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
    if (nearBottom || isSelf) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

})();
