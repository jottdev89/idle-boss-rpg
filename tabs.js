// ============================================================
// TABS.JS — Tab-Navigation ohne Seitenwechsel
// ============================================================

// ── DOM ──────────────────────────────────────────────────────
const tabOverlay = document.getElementById("tab-overlay");
const tabContent = document.getElementById("tab-content");
const navBtns    = document.querySelectorAll(".scene-btn");
let activeTab    = "fight";

// ── COMING SOON HELPER ───────────────────────────────────────
function comingSoon(icon, title, color) {
  return `
    <div class="panel" style="text-align:center;padding:40px 20px;margin-top:12px;">
      <div style="font-size:48px;margin-bottom:16px;filter:drop-shadow(0 0 16px ${color});">${icon}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:18px;color:${color};letter-spacing:2px;margin-bottom:10px;">${title}</div>
      <div style="font-family:'Crimson Text',serif;font-size:15px;color:var(--text-dim);font-style:italic;">Coming soon...</div>
    </div>`;
}

// ── PROFILE TAB ──────────────────────────────────────────────
function buildProfileTab() {
  const name    = localStorage.getItem("playerName")  || "Warrior";
  const photo   = localStorage.getItem("playerPhoto") || "";
  const auth    = localStorage.getItem("authType")    || "guest";

  // Pull live game state (exposed on window by main.js)
  const level   = window.gameState?.playerLevel    ?? 1;
  const exp     = window.gameState?.playerExp      ?? 0;
  const expNeed = window.gameState?.expForLevel(level) ?? 100;
  const expPct  = Math.min(100, (exp / expNeed) * 100).toFixed(1);
  const goldVal = window.gameState?.gold           ?? 0;
  const maxStage= window.gameState?.maxStageReached ?? 1;
  const dps     = window.gameState?.dps            ?? 1;
  const bossKills = window.gameState?.totalBossKills ?? 0;

  const authLabel = auth === "google" ? "🔵 Google Account" : "👤 Guest";
  const avatarHtml = photo
    ? `<img src="${photo}" style="width:72px;height:72px;border-radius:50%;border:2px solid var(--border-glow);object-fit:cover;">`
    : `<div style="width:72px;height:72px;border-radius:50%;border:2px solid var(--border-glow);background:rgba(120,60,180,0.2);display:flex;align-items:center;justify-content:center;font-size:32px;">👤</div>`;

  function fmt(n) {
    if (n >= 1_000_000) return (n/1_000_000).toFixed(2)+"M";
    if (n >= 1_000)     return (n/1_000).toFixed(1)+"K";
    return Math.floor(n).toString();
  }

  return `
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">

    <!-- Avatar + Name -->
    <div class="panel" style="display:flex;align-items:center;gap:16px;padding:16px;">
      ${avatarHtml}
      <div style="flex:1;min-width:0;">
        <div style="font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--gold-bright);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
        <div style="font-family:'Cinzel',serif;font-size:11px;color:#c080ff;letter-spacing:2px;margin-bottom:6px;">LEVEL ${level}</div>
        <div style="font-family:'Cinzel',serif;font-size:10px;color:var(--text-dim);letter-spacing:1px;">${authLabel}</div>
      </div>
    </div>

    <!-- EXP Bar -->
    <div class="panel" style="padding:12px 14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-family:'Cinzel',serif;font-size:11px;color:var(--text-dim);letter-spacing:2px;">EXPERIENCE</div>
        <div style="font-family:'Cinzel',serif;font-size:10px;color:#c080ff;">${exp} / ${expNeed} EXP</div>
      </div>
      <div style="background:rgba(0,0,0,0.5);border:1px solid rgba(120,60,180,0.3);border-radius:6px;height:10px;overflow:hidden;">
        <div style="height:100%;width:${expPct}%;background:linear-gradient(90deg,#6020a0,#c060ff);border-radius:6px;box-shadow:0 0 8px rgba(160,80,255,0.5);transition:width 0.4s;"></div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="panel" style="padding:12px 14px;">
      <div style="font-family:'Cinzel',serif;font-size:11px;color:var(--text-dim);letter-spacing:2px;margin-bottom:10px;">⚔ STATISTICS</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${statCard("💰", "Gold", fmt(goldVal), "#f0c030")}
        ${statCard("⚔", "ATK", fmt(window.gameState?.atk ?? 1), "#c09030")}
        ${statCard("☠", "Boss Kills", fmt(bossKills), "#cc4040")}
        ${statCard("🏆", "Max Stage", maxStage, "#6080ff")}
      </div>
    </div>

    <!-- Settings / Info -->
    <div class="panel" style="padding:12px 14px;">
      <div style="font-family:'Cinzel',serif;font-size:11px;color:var(--text-dim);letter-spacing:2px;margin-bottom:10px;">⚙ SETTINGS</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:'Cinzel',serif;font-size:11px;color:var(--text-dim);letter-spacing:1px;">Version</span>
          <span style="font-family:'Cinzel',serif;font-size:11px;color:var(--gold);">α v0.0.1</span>
        </div>
        <div style="height:1px;background:var(--border-dim);"></div>
        <button onclick="doLogout()" style="
          width:100%;background:transparent;border:1px solid var(--red-glow);
          color:#ff6060;font-family:'Cinzel',serif;font-size:12px;
          letter-spacing:2px;padding:10px;border-radius:8px;cursor:pointer;
          transition:all 0.2s;margin-top:2px;
        " onmouseover="this.style.background='rgba(200,30,20,0.1)'" onmouseout="this.style.background='transparent'">
          LOGOUT
        </button>
      </div>
    </div>

  </div>`;
}

function statCard(icon, label, value, color) {
  return `
    <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border-dim);border-radius:8px;padding:10px;text-align:center;">
      <div style="font-size:18px;margin-bottom:4px;">${icon}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:13px;color:${color};margin-bottom:2px;">${value}</div>
      <div style="font-family:'Cinzel',serif;font-size:9px;color:var(--text-dim);letter-spacing:1px;">${label}</div>
    </div>`;
}

// ── LOGOUT ───────────────────────────────────────────────────
function doLogout() {
  const authType = localStorage.getItem("authType");
  if (authType === "google" && typeof firebase !== "undefined") {
    try { firebase.auth().signOut(); } catch {}
  }
  localStorage.removeItem("playerName");
  localStorage.removeItem("playerUID");
  localStorage.removeItem("authType");
  localStorage.removeItem("playerPhoto");
  window.location.href = "login.html";
}

// ── TAB CONFIG ───────────────────────────────────────────────
const TAB_CONTENT = {
  profile:   { html: buildProfileTab },
  upgrades:  { html: () => comingSoon("⬆", "Upgrades",  "#c9973a") },
  pets:      { html: () => comingSoon("🐾", "Pets",      "#60c060") },
  clan:      { html: () => comingSoon("🛡", "Clan",      "#6080ff") },
  worldboss: { html: () => comingSoon("☠", "World Boss","#cc2020") },
};

// ── SWITCH TAB ───────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  navBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));

  if (tab === "fight") {
    tabOverlay.style.display = "none";
  } else {
    const cfg = TAB_CONTENT[tab];
    tabContent.innerHTML = cfg ? cfg.html() : "";
    tabOverlay.style.display = "block";
  }
}

// ── WIRE UP NAV ──────────────────────────────────────────────
navBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    switchTab(btn.dataset.tab);
  });
});
