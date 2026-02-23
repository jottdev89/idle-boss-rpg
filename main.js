document.addEventListener("DOMContentLoaded", function() {

  // ==========================
  // FEATURE FLAGS
  // Setze auf true um ein Feature zu aktivieren
  // ==========================
  const FEATURES = {
    PRESTIGE:   false,   // Prestige-Button & Soul Shards
    WORLD_BOSS: false,   // World Boss Tab
  };

  // ==========================
  // DOM
  // ==========================
  const bossFill    = document.getElementById("boss-hp-fill");
  const bossText    = document.getElementById("boss-hp-text");
  const bossName    = document.getElementById("boss-name");
  const dpstext     = document.getElementById("dpstext");
  const shardtext   = document.getElementById("shardtext");
  const inventoryEl = document.getElementById("inventory");
  const stagePrev   = document.getElementById("stage-prev");
  const stageNext   = document.getElementById("stage-next");
  const resetCheckbox = document.getElementById("enable-reset");
  const versionEl = document.getElementById("version") || document.createElement("span");

  // EXP / Level
  const expFill        = document.getElementById("exp-bar-fill");
  const expCurrentEl   = document.getElementById("exp-current");
  const expNeededEl    = document.getElementById("exp-needed");
  const playerLevelEl  = document.getElementById("player-level");
  const playerNameEl   = document.getElementById("player-name-display");
  const playerAvatarEl = document.getElementById("player-avatar");

  // Fill player name + avatar from login
  const playerName  = localStorage.getItem("playerName") || "Warrior";
  const playerPhoto = localStorage.getItem("playerPhoto") || "";
  if (playerNameEl) playerNameEl.textContent = playerName;
  if (playerAvatarEl && playerPhoto) {
    playerAvatarEl.src = playerPhoto;
    playerAvatarEl.style.display = "block";
  }

const dpsPerShard = 10;

// Feature-abhängige UI
if (!FEATURES.PRESTIGE) {
  document.getElementById("prestige-btn").style.display = "none";
  document.getElementById("shard-badge").style.display  = "none";
}

if (FEATURES.WORLD_BOSS) {
  document.getElementById("tab-worldboss").style.display = "";
}

document.getElementById("prestige-btn").onclick = () => {
  if (!FEATURES.PRESTIGE) return;

  if (maxStageReached < 50) {
    showPrestigeModal("locked");
    return;
  }

  const reward = calculatePrestigeReward();
  showPrestigeModal("confirm", reward);
};

function showPrestigeModal(type, reward = 0, multiplier = "1.00") {

  if (document.getElementById("prestige-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "prestige-modal";
  overlay.style.cssText = `
    position:fixed;inset:0;
    background:rgba(0,0,0,0.8);
    display:flex;align-items:center;justify-content:center;
    z-index:99999;
    backdrop-filter:blur(5px);
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    background:linear-gradient(160deg,#14101c,#0e0c14);
    border:1px solid #6b3fa0;
    border-radius:14px;
    padding:24px 20px;
    width:90%;max-width:300px;
    font-family:'Cinzel',serif;
    box-shadow:0 0 40px rgba(100,50,180,0.35),inset 0 1px 0 rgba(255,255,255,0.05);
    text-align:center;
  `;

  if (type === "locked") {

    box.innerHTML = `
      <div style="font-size:28px;margin-bottom:10px;">🔒</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:14px;color:#c9973a;letter-spacing:2px;margin-bottom:12px;">
        Prestige Locked
      </div>
      <div style="font-family:'Crimson Text',serif;font-size:15px;color:#7a6e5a;margin-bottom:20px;line-height:1.5;">
        Reach <span style="color:#c9973a;">Stage 50</span> to unlock Prestige.
      </div>
      <button class="pm-btn-close" style="
        width:100%;padding:10px;
        background:transparent;border:1px solid #2a2030;
        color:#7a6e5a;font-family:'Cinzel',serif;font-size:12px;
        letter-spacing:1px;border-radius:8px;cursor:pointer;
        transition:all 0.2s;
      ">Close</button>
    `;

    box.querySelector(".pm-btn-close").onclick = () => overlay.remove();

  } else if (type === "confirm") {

    const dpsGain = (reward * dpsPerShard).toFixed(0);

    box.innerHTML = `
      <div style="font-size:28px;margin-bottom:10px;">✦</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:14px;color:#c9973a;letter-spacing:2px;margin-bottom:14px;">
        Prestige
      </div>
      <div style="font-family:'Crimson Text',serif;font-size:15px;color:#7a6e5a;margin-bottom:6px;line-height:1.6;">
        You will receive
        <span style="color:#f0c060;font-size:18px;font-weight:600;"> ${reward} Soul Shards</span>
      </div>
      <div style="font-family:'Crimson Text',serif;font-size:13px;color:#7a6e5a;margin-bottom:20px;">
        +${dpsGain}% permanent DPS bonus
      </div>
      <div style="display:flex;gap:8px;">
        <button class="pm-btn-cancel" style="
          flex:1;padding:10px;
          background:transparent;border:1px solid #2a2030;
          color:#7a6e5a;font-family:'Cinzel',serif;font-size:11px;
          letter-spacing:1px;border-radius:8px;cursor:pointer;
        ">Cancel</button>
        <button class="pm-btn-confirm" style="
          flex:1;padding:10px;
          background:linear-gradient(135deg,#1e1000,#2c1800);
          border:1px solid #7a5c1e;
          color:#f0c060;font-family:'Cinzel',serif;font-size:11px;
          letter-spacing:1px;border-radius:8px;cursor:pointer;
          box-shadow:0 0 10px rgba(160,110,20,0.3);
        ">Confirm</button>
      </div>
    `;

    box.querySelector(".pm-btn-cancel").onclick = () => overlay.remove();

    box.querySelector(".pm-btn-confirm").onclick = () => {
      overlay.remove();

      soulShards += reward;

      stage = 1;
      maxStageReached = 1;
      bonusDps = 0;

      updateDps();
      updateShardDisplay();
      renderInventory();
      spawnBoss();
      saveGame();

      const multiplier = (1 + (soulShards * dpsPerShard / 100)).toFixed(2);
      showPrestigeModal("success", reward, multiplier);
    };

  } else if (type === "success") {

    box.innerHTML = `
      <div style="font-size:28px;margin-bottom:10px;animation:skullPulse 2s infinite;">⚔</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:14px;color:#c9973a;letter-spacing:2px;margin-bottom:14px;">
        Prestige Successful!
      </div>
      <div style="font-family:'Crimson Text',serif;color:#7a6e5a;font-size:15px;line-height:1.8;margin-bottom:20px;">
        <span style="color:#f0c060;font-size:18px;font-weight:600;">+${reward} Soul Shards</span><br>
        Total: <span style="color:#c9973a;">${soulShards}</span><br>
        DPS Multiplier: <span style="color:#c9973a;">x${multiplier}</span>
      </div>
      <button class="pm-btn-close" style="
        width:100%;padding:10px;
        background:linear-gradient(135deg,#1e1000,#2c1800);
        border:1px solid #7a5c1e;color:#f0c060;
        font-family:'Cinzel',serif;font-size:12px;
        letter-spacing:1px;border-radius:8px;cursor:pointer;
        box-shadow:0 0 10px rgba(160,110,20,0.3);
      ">Weiter</button>
    `;

    box.querySelector(".pm-btn-close").onclick = () => overlay.remove();
  }

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}
  
  // ==========================
// STAGE NAVIGATION
// ==========================

stagePrev.addEventListener("click", () => {
  if (stagePrev.classList.contains("disabled")) return;
  const next = getNextAvailableStage(-1);
  if (next !== null) { stage = next; spawnBoss(); }
});

stageNext.addEventListener("click", () => {
  if (stageNext.classList.contains("disabled")) return;
  const next = getNextAvailableStage(1);
  if (next !== null) { stage = next; spawnBoss(); }
});

  // ==========================
  // GAME STATE
  // ==========================
  let stage = 1;
  let bossMaxHp = 0;
  let bossHp = bossMaxHp;

  let baseDps = 1;
  let bonusDps = 0;
  let dps = 1;

  let maxStageReached = 1;
  let soulShards = 0;
  const SOUL_DPS_BONUS = 0.10;

  // EXP / Level
  let playerLevel = 1;
  let playerExp   = 0;

  // Gold
  let gold = 0;
  let totalBossKills = 0;

  let lastTick = Date.now();

  // Expose live state for tabs.js
  window.gameState = {
    get playerLevel()     { return playerLevel; },
    get playerExp()       { return playerExp; },
    get gold()            { return gold; },
    get maxStageReached() { return maxStageReached; },
    get dps()             { return dps; },
    get totalBossKills()  { return totalBossKills; },
    expForLevel,
  };

  // ==========================
  // DEV MODE
  // ==========================
  let devMode = false;
  let tapCount = 0;
  let tapTimer = null;
  const TAP_THRESHOLD = 20;
  const TAP_TIME = 4000;

  const DEV_DEVICE_HASHES = [
    "dev_43658a99",
    "dev_77e84e93"
  ];

  function getDeviceHash() {
    const raw = [
      navigator.userAgent, navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth, navigator.platform
    ].join("|");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash) + raw.charCodeAt(i);
      hash |= 0;
    }
    return "dev_" + Math.abs(hash).toString(16);
  }

  versionEl.addEventListener("click", () => {
    tapCount++;
    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = setTimeout(() => tapCount = 0, TAP_TIME);

    if (tapCount >= TAP_THRESHOLD) {
      tapCount = 0;
      const deviceHash = getDeviceHash();
      if (!DEV_DEVICE_HASHES.includes(deviceHash)) {
        alert("DEV HASH:\n" + deviceHash);
        return;
      }
      devMode = !devMode;
      if (devMode) {
        createDevOverlay();
        document.getElementById("dev-overlay").style.display = "block";
      } else {
        const o = document.getElementById("dev-overlay");
        if (o) o.style.display = "none";
      }
      alert("DEV MODE " + (devMode ? "ON" : "OFF"));
    }
  });

  function createDevOverlay() {
    if (document.getElementById("dev-overlay")) return;
    const div = document.createElement("div");
    div.id = "dev-overlay";
    div.style = `
      position:fixed;top:10px;left:10px;
      background:rgba(0,0,0,0.9);color:#0f0;
      padding:10px;z-index:99999;font-size:12px;border-radius:5px;
    `;
    div.innerHTML = `
      <b>DEV MODE</b><br>
      <button id="dev-add-dps">+100 DPS</button><br>
      <button id="dev-reduce-dps">-100 DPS</button><br>
      <button id="dev-kill-boss">Boss Kill</button><br>
      <button id="dev-reset-save">RESET SAVE</button>
    `;
    document.body.appendChild(div);

    document.getElementById("dev-add-dps").onclick = () => { bonusDps += 100; updateDps(); };
    document.getElementById("dev-reduce-dps").onclick = () => { bonusDps = Math.max(0, bonusDps - 100); updateDps(); };
    document.getElementById("dev-kill-boss").onclick = () => { bossHp = 0; bossDefeated(); };
    document.getElementById("dev-reset-save").onclick = () => {
      localStorage.removeItem("idleGameSave");
      stage = 1; maxStageReached = 1; bonusDps = 0; soulShards = 0;
      playerLevel = 1; playerExp = 0; gold = 0; totalBossKills = 0;
      updateDps(); updateExpUI(); updateGoldUI(); renderInventory(); spawnBoss();
      alert("SAVE RESET");
    };
  }

  // ==========================
  // DPS SYSTEM
  // ==========================
  function calculateDps() {
    const baseTotal = baseDps + bonusDps;
    const prestigeMultiplier = FEATURES.PRESTIGE
      ? 1 + (soulShards * SOUL_DPS_BONUS)
      : 1;
    return baseTotal * prestigeMultiplier;
  }

  function updateDps() {
    dps = calculateDps();
    dpstext.textContent = dps.toFixed(1);
    if (shardtext) shardtext.textContent = Math.floor(soulShards);
  }

  function updateShardDisplay() {
    if (shardtext) shardtext.textContent = Math.floor(soulShards);
  }

  // ==========================
  // UTIL
  // ==========================
  function calculatePrestigeReward() {
    if (maxStageReached < 50) return 0;
    return Math.floor(Math.pow(maxStageReached - 40, 1.2) / 5);
  }

  function getNextAvailableStage(direction) {
    const newStage = stage + direction;
    if (newStage < 1 || newStage > maxStageReached) return null;
    return newStage;
  }

  // ==========================
  // EXP SYSTEM
  // ==========================
  function expForLevel(lvl) {
    return Math.floor(100 * Math.pow(lvl, 1.5));
  }

  function expFromBoss(bossStage) {
    return bossStage * 10;
  }

  function gainExp(amount) {
    playerExp += amount;
    let leveled = false;

    while (playerExp >= expForLevel(playerLevel)) {
      playerExp -= expForLevel(playerLevel);
      playerLevel++;
      leveled = true;
    }

    if (leveled) showLevelUpToast(playerLevel);
    updateExpUI();
  }

  function updateExpUI() {
    const needed = expForLevel(playerLevel);
    const pct    = Math.min(100, (playerExp / needed) * 100);
    if (expFill)      expFill.style.width      = pct + "%";
    if (expCurrentEl) expCurrentEl.textContent = playerExp;
    if (expNeededEl)  expNeededEl.textContent  = needed;
    if (playerLevelEl) playerLevelEl.textContent = playerLevel;
  }

  function showLevelUpToast(newLevel) {
    const toast = document.createElement("div");
    toast.className = "levelup-toast";
    toast.innerHTML = `✦ LEVEL UP! <span>LVL ${newLevel}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 2200);
  }

  // ==========================
  // GOLD SYSTEM
  // ==========================
  function goldFromBoss(bossStage) {
    return Math.floor(bossStage * 5 * (1 + bossStage * 0.1));
  }

  function formatGold(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  }

  function gainGold(amount) {
    gold += amount;
    updateGoldUI();
  }

  function updateGoldUI() {
    const el = document.getElementById("gold-amount");
    if (el) el.textContent = formatGold(gold);
  }


  function renderInventory() {
    inventoryEl.innerHTML = `<div class="empty-state">— no items yet —</div>`;
  }

  // ==========================
  // BOSS
  // ==========================
  function bossDefeated() {
    gainExp(expFromBoss(stage));
    gainGold(goldFromBoss(stage));
    totalBossKills++;
    const wasMaxStage = stage === maxStageReached;
    if (!resetCheckbox.checked) stage++;
    if (wasMaxStage) maxStageReached++;
    spawnBoss();
    saveGame();
  }

  function spawnBoss() {
    if (stage < 20) {
  bossMaxHp = Math.floor(10 * Math.pow(1.25, stage - 1));
} else if (stage < 40) {
  bossMaxHp = Math.floor(10 * Math.pow(1.25, 19) * Math.pow(1.12, stage - 19));
} else if (stage < 60) {
  bossMaxHp = Math.floor(10 * Math.pow(1.25, 19) * Math.pow(1.12, 20) * Math.pow(1.10, stage - 39));
} else {
  bossMaxHp = Math.floor(10 * Math.pow(1.25, 19) * Math.pow(1.12, 20) * Math.pow(1.10, 20) * Math.pow(1.05, stage - 59));
}

    bossHp = bossMaxHp;
    bossName.textContent = `Boss #${stage}`;

    updateBossUI();
    stagePrev.classList.toggle("disabled", stage <= 1);
    stageNext.classList.toggle("disabled", stage >= maxStageReached);
  }

  function updateBossUI() {
    const percent = (bossHp / bossMaxHp) * 100;
    bossFill.style.width = percent + "%";
    bossText.textContent = `${Math.ceil(bossHp)} / ${bossMaxHp}`;
  }

  // ==========================
  // LOOP
  // ==========================
  function idleLoop() {

    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    lastTick = now;

    if (bossHp > 0) {
      bossHp = Math.max(0, bossHp - dps * delta);
    } else {
      bossDefeated();
    }

    updateBossUI();
    requestAnimationFrame(idleLoop);
  }

  // ==========================
  // SAVE / LOAD
  // ==========================
  function saveGame() {
    const saveData = {
      saveVersion: 2,
      stage, bossHp, bossMaxHp, maxStageReached,
      soulShards: soulShards ?? 0,
      playerLevel, playerExp, gold, totalBossKills
    };
    localStorage.setItem("idleGameSave", JSON.stringify(saveData));
  }

  function loadGame() {
    const raw = localStorage.getItem("idleGameSave");
    if (!raw) return;
    const data = JSON.parse(raw);
    if ((data.saveVersion ?? 1) < 2) {
      localStorage.removeItem("idleGameSave");
      return;
    }
    stage           = data.stage           ?? 1;
    bossHp          = data.bossHp          ?? 0;
    bossMaxHp       = data.bossMaxHp       ?? 0;
    maxStageReached = data.maxStageReached  ?? 1;
    soulShards      = data.soulShards      ?? 0;
    playerLevel     = data.playerLevel     ?? 1;
    playerExp       = data.playerExp       ?? 0;
    gold            = data.gold            ?? 0;
    totalBossKills  = data.totalBossKills  ?? 0;
    updateDps();
    updateShardDisplay();
    updateExpUI();
    updateGoldUI();
    renderInventory();
  }

  // ==========================
  // START
  // ==========================
  loadGame();
  spawnBoss();
  updateDps();
  updateExpUI();
  updateGoldUI();
  idleLoop();

  setInterval(saveGame, 5000);
});