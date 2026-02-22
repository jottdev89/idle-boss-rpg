// ============================================================
// WORLD BOSS — worldboss.js
// Player identity comes from login page (localStorage)
// Firebase Realtime Database for live leaderboard
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  // ── CONFIG ───────────────────────────────────────────────
  const WB_MAX_HP   = 10_000_000;
  const WB_RESET_MS = 24 * 60 * 60 * 1000; // 24h
  const TICK_MS     = 250;
  const WRITE_MS    = 3000;

  // ── DOM ──────────────────────────────────────────────────
  const hpFill        = document.getElementById("wb-hp-fill");
  const hpText        = document.getElementById("wb-hp-text");
  const dpsText       = document.getElementById("wb-dpstext");
  const myDmgVal      = document.getElementById("wb-my-dmg-val");
  const statusEl      = document.getElementById("wb-status");
  const leaderboardEl = document.getElementById("wb-leaderboard");
  const resetTimer    = document.getElementById("wb-reset-timer");

  // ── PLAYER IDENTITY (set on login page) ──────────────────
  const playerName  = localStorage.getItem("playerName")  || "Warrior";
  const playerId    = localStorage.getItem("playerUID")   || "guest_unknown";
  const playerPhoto = localStorage.getItem("playerPhoto") || "";

  // ── FIREBASE ─────────────────────────────────────────────
  // firebase already initialized by auth-guard / Firebase SDKs
  // Use a try/catch in case it was already initialized
  let db;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
  } catch(e) {}
  db = firebase.database();

  // ── GAME STATE ────────────────────────────────────────────
  let myDamage   = 0;
  let myDps      = 1;
  let bossHp     = WB_MAX_HP;
  let defeated   = false;
  let lastTick   = Date.now();
  let lastWrite  = 0;
  let cycleStart = null;
  let tickTimer  = null;
  let lbListener = null;

  // ── LOAD DPS FROM SOLO SAVE ──────────────────────────────
  function loadSoloDps() {
    try {
      const raw = localStorage.getItem("idleGameSave");
      if (!raw) return 1;
      const data = JSON.parse(raw);
      const cardPool = [
        { id: 1,   cdps: 1    },
        { id: 2,   cdps: 5    },
        { id: 3,   cdps: 20   },
        { id: 4,   cdps: 100  },
        { id: 100, cdps: 1000 }
      ];
      const cardDps = (data.inventory || []).reduce((total, item) => {
        const card = cardPool.find(c => c.id === item.id);
        return card ? total + card.cdps * item.count : total;
      }, 0);
      const prestige = 1 + ((data.soulShards || 0) * 0.10);
      return Math.max(1, (1 + cardDps) * prestige);
    } catch { return 1; }
  }

  // ── BOSS CYCLE ────────────────────────────────────────────
  async function initCycle() {
    const cycleRef = db.ref("worldboss/cycle");
    const snap     = await cycleRef.once("value");
    const data     = snap.val();
    const now      = Date.now();

    if (!data || !data.startTime || (now - data.startTime) >= WB_RESET_MS) {
      cycleStart = now;
      await cycleRef.set({ startTime: now });
      await db.ref(`worldboss/damage/${playerId}`).set({
        name: playerName, photoURL: playerPhoto, dmg: 0, updatedAt: now
      });
      myDamage = 0;
    } else {
      cycleStart = data.startTime;
      const mySnap = await db.ref(`worldboss/damage/${playerId}`).once("value");
      const myData = mySnap.val();
      myDamage = myData ? (myData.dmg || 0) : 0;
    }

    bossHp = Math.max(0, WB_MAX_HP - myDamage);
    updateHpUI();
  }

  // ── WRITE DAMAGE ─────────────────────────────────────────
  async function writeDamage() {
    const now = Date.now();
    if (now - lastWrite < WRITE_MS) return;
    lastWrite = now;
    try {
      await db.ref(`worldboss/damage/${playerId}`).set({
        name: playerName, photoURL: playerPhoto,
        dmg: Math.floor(myDamage), updatedAt: now
      });
    } catch(e) { console.warn("Firebase write failed:", e); }
  }

  // ── LIVE LEADERBOARD ─────────────────────────────────────
  function subscribeLeaderboard() {
    if (lbListener) db.ref("worldboss/damage").off("value", lbListener);
    lbListener = db.ref("worldboss/damage").on("value", snap => {
      const data = snap.val();
      if (!data) { renderLeaderboard([]); return; }
      const entries = Object.entries(data)
        .map(([uid, v]) => ({ uid, name: v.name || "Unknown", dmg: v.dmg || 0 }))
        .sort((a, b) => b.dmg - a.dmg);
      renderLeaderboard(entries);
    });
  }

  // ── RENDER LEADERBOARD ───────────────────────────────────
  const RANK_ICONS = ["🥇", "🥈", "🥉"];

  function formatDmg(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
    return Math.floor(n).toString();
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
    );
  }

  function renderLeaderboard(entries) {
    leaderboardEl.innerHTML = "";
    if (entries.length === 0) {
      leaderboardEl.innerHTML = `<div class="empty-state">— Be the first to fight! —</div>`;
      return;
    }
    entries.forEach((entry, i) => {
      const isMe = entry.uid === playerId;
      const row  = document.createElement("div");
      row.className = `lb-row${i < 3 ? " rank-" + (i+1) : ""}${isMe ? " is-me" : ""}`;
      const icon = RANK_ICONS[i] || `<span style="color:#4a3a60;font-size:11px;">#${i+1}</span>`;
      row.innerHTML = `
        <div class="lb-rank">${icon}</div>
        <div class="lb-name${isMe ? " is-me" : ""}">${escapeHtml(entry.name)}${isMe ? " 👤" : ""}</div>
        <div class="lb-dmg${isMe ? " is-me" : ""}">${formatDmg(entry.dmg)}</div>
      `;
      leaderboardEl.appendChild(row);
    });
  }

  // ── HP UI ─────────────────────────────────────────────────
  function updateHpUI() {
    const pct = Math.max(0, (bossHp / WB_MAX_HP) * 100);
    hpFill.style.width = pct + "%";
    hpText.textContent = `${formatDmg(Math.ceil(bossHp))} / ${formatDmg(WB_MAX_HP)}`;
  }

  // ── RESET TIMER ───────────────────────────────────────────
  function updateResetTimer() {
    if (!cycleStart || !resetTimer) return;
    const remaining = Math.max(0, WB_RESET_MS - (Date.now() - cycleStart));
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    resetTimer.textContent =
      `RESETS IN ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  // ── GAME LOOP ─────────────────────────────────────────────
  function tick() {
    if (defeated) return;
    const now   = Date.now();
    const delta = (now - lastTick) / 1000;
    lastTick    = now;

    myDps = loadSoloDps();
    const dmg = myDps * delta;
    myDamage += dmg;
    bossHp    = Math.max(0, bossHp - dmg);

    dpsText.textContent  = myDps.toFixed(1);
    myDmgVal.textContent = formatDmg(myDamage);
    updateHpUI();
    updateResetTimer();
    writeDamage();

    if (bossHp <= 0) {
      defeated = true;
      bossDefeated();
      return;
    }
    tickTimer = setTimeout(tick, TICK_MS);
  }

  function bossDefeated() {
    if (statusEl) {
      statusEl.textContent = "⚔ BOSS SLAIN — Await the next cycle ⚔";
      statusEl.className   = "defeated";
    }
    hpFill.style.width = "0%";
    hpText.textContent = "0 / " + formatDmg(WB_MAX_HP);
    lastWrite = 0;
    writeDamage();
  }

  // ── BOOT ──────────────────────────────────────────────────
  async function boot() {
    await initCycle();
    myDps = loadSoloDps();
    dpsText.textContent = myDps.toFixed(1);
    subscribeLeaderboard();

    if (bossHp > 0) {
      lastTick = Date.now();
      tickTimer = setTimeout(tick, TICK_MS);
    } else {
      defeated = true;
      bossDefeated();
    }
  }

  boot();
});
