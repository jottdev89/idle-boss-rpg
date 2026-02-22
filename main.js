document.addEventListener("DOMContentLoaded", function() {

  // ==========================
  // DOM
  // ==========================
  const bossFill = document.getElementById("boss-hp-fill");
  const bossText = document.getElementById("boss-hp-text");
  const bossName = document.getElementById("boss-name");
  const dpstext = document.getElementById("dpstext");
  const shardtext = document.getElementById("shardtext");
  const inventoryEl = document.getElementById("inventory");
  const lootPreviewEl = document.getElementById("loot-preview");
  const stageNumEl = document.getElementById("stage-num");
  const bossLootListEl = document.getElementById("boss-loot-list");
  const stagePrev = document.getElementById("stage-prev");
  const stageNext = document.getElementById("stage-next");
  const resetCheckbox = document.getElementById("enable-reset");
  const versionEl = document.getElementById("version");
  const panel = document.getElementById("control-panel");
  const toggleBtn = document.getElementById("control-toggle");
  const header = document.getElementById("control-header");

header.addEventListener("click", () => {
  panel.classList.toggle("collapsed");
  toggleBtn.textContent = panel.classList.contains("collapsed") ? "+" : "–";
});

const dpsPerShard = 10; // 10% DPS pro Soul Shard

document.getElementById("prestige-btn").onclick = () => {

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
      inventory = [];
      bossLooted = {};
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

stagePrev.onclick = () => {
  const next = getNextAvailableStage(-1);
  if (next !== null) {
    stage = next;
    spawnBoss();
  }
};

stageNext.onclick = () => {
  const next = getNextAvailableStage(1);
  if (next !== null) {
    stage = next;
    spawnBoss();
  }
};

  // ==========================
  // GAME STATE
  // ==========================
  let stage = 1;
  let bossMaxHp = 0;
  let bossHp = bossMaxHp;

  let baseDps = 1;
  let bonusDps = 0;
  let dps = 1;

  let inventory = [];
  let bossLooted = {};
  let maxStageReached = 1;
  let soulShards = 0;
  const SOUL_DPS_BONUS = 0.10; // 10%

  let lastTick = Date.now();
  
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
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    navigator.platform
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
      console.warn("DEV HASH:", deviceHash);
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
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.9);
    color: #0f0;
    padding: 10px;
    z-index: 99999;
    font-size: 12px;
    border-radius: 5px;
  `;

  div.innerHTML = `
    <b>DEV MODE</b><br>
    <button id="dev-add-dps">+100 DPS</button><br>
    <button id="dev-reduce-dps">-100 DPS</button><br>
    <button id="dev-kill-boss">Boss Kill</button><br>
    <button id="dev-loot-all">Loot All</button><br>
    <button id="dev-reset-save">RESET SAVE</button>
  `;

  document.body.appendChild(div);

  // +DPS
  document.getElementById("dev-add-dps").onclick = () => {
    bonusDps += 100;
    updateDps();
  };

  // -DPS
  document.getElementById("dev-reduce-dps").onclick = () => {
    bonusDps = Math.max(0, bonusDps - 100);
    updateDps();
  };

  // Boss Kill
  document.getElementById("dev-kill-boss").onclick = () => {
    bossHp = 0;
    bossDefeated();
  };

  // Loot All
  document.getElementById("dev-loot-all").onclick = () => {

    if (!bossLooted[stage]) bossLooted[stage] = {};

    cardPool.forEach(card => {
      if (isCardAvailableForStage(card, stage)) {
        addCardToInventory(card);
        bossLooted[stage][card.rarity] = true;
      }
    });

    renderLootPreview();
    renderBossLootList();
  };

  // Reset Save
  document.getElementById("dev-reset-save").onclick = () => {

    localStorage.removeItem("idleGameSave");

    stage = 1;
    bossLooted = {};
    inventory = [];
    maxStageReached = 1;
    bonusDps = 0;
    soulShards = 0;

    updateDps();
    renderInventory();
    spawnBoss();

    alert("SAVE RESET");
  };
}

  // ==========================
  // CARDS
  // ==========================
  const cardPool = [
    { id: 1, name: "stick", cdps: 1, chance: 1, rarity: "common" },
    { id: 2, name: "sword", cdps: 5, chance: 0.60, rarity: "rare", minStage: 10 },
    { id: 3, name: "gun", cdps: 20, chance: 0.30, rarity: "epic", minStage: 20},
    { id: 4, name: "twin blade", cdps: 100, chance: 0.1, rarity: "legendary", minStage: 30 },
    { id: 100, name: "v0.0.1 alpha sword", cdps: 1000, chance: 0.025, rarity: "eventdrop", specialStage: [30, 40, 50, 60, 70, 80, 90, 100] }
  ];

  // ==========================
// DPS SYSTEM
// ==========================
function calculateDps() {
  const cardDps = inventory.reduce((total, item) => {
    const cardData = cardPool.find(c => c.id === item.id);
    if (!cardData) return total;
    return total + cardData.cdps * item.count;
  }, 0);

  const baseTotal = baseDps + bonusDps + cardDps;

  const prestigeMultiplier = 1 + (soulShards * SOUL_DPS_BONUS); // 1% pro Soul Shard
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


  function getAllRarities() {
    return [...new Set(cardPool.map(c => c.rarity))];
  }

  function isCardAvailableForStage(card, stageNumber) {

    if (card.specialStage) {
      if (Array.isArray(card.specialStage)) {
        return card.specialStage.includes(stageNumber);
      }
      return card.specialStage === stageNumber;
    }

    if (card.minStage) {
      return stageNumber >= card.minStage;
    }

    return true;
  }
  
  function isBossFullyLooted(stageNumber) {

  const loot = bossLooted[stageNumber] || {};

  const availableCards = cardPool.filter(c =>
    isCardAvailableForStage(c, stageNumber)
  );

  if (availableCards.length === 0) return false;

  return availableCards.every(card =>
    loot[card.rarity]
  );
}

function getNextAvailableStage(direction) {
  let newStage = stage;

  while (true) {
    newStage += direction;

    // Check bounds
    if (newStage < 1 || newStage > maxStageReached) {
      return null; // KEIN anderer Boss gefunden
    }

    // Nur Boss nehmen, der noch lootbaren Content hat
    if (!isBossFullyLooted(newStage)) {
      return newStage;
    }
  }
}

  // ==========================
  // INVENTORY
  // ==========================
  function addCardToInventory(card) {
    const existing = inventory.find(c => c.id === card.id);
    if (existing) existing.count++;
    else inventory.push({ id: card.id, count: 1 });

    updateDps();
    renderInventory();
  }

  function renderInventory() {
  inventoryEl.innerHTML = "";

  if (inventory.length === 0) {
    inventoryEl.innerHTML = `<div class="empty-state">— inventory empty —</div>`;
    return;
  }

  inventory.forEach(item => {
    const cardData = cardPool.find(c => c.id === item.id);
    if (!cardData) return;

    const div = document.createElement("div");
    div.classList.add("card", cardData.rarity);

    div.textContent =
      `${item.count}x ${cardData.name} (+${cardData.cdps} dps) = +${cardData.cdps * item.count} dps`;

    inventoryEl.appendChild(div);
  });
}

  // ==========================
  // LOOT
  // ==========================
  function dropCard() {
    if (!bossLooted[stage]) bossLooted[stage] = {};

    const rarities = getAllRarities();

    rarities.forEach(rarity => {

      if (bossLooted[stage][rarity]) return;

      const pool = cardPool.filter(c =>
        c.rarity === rarity &&
        isCardAvailableForStage(c, stage)
      );

      if (pool.length === 0) return;

      const card = pool[Math.floor(Math.random() * pool.length)];

      if (Math.random() < card.chance) {
        addCardToInventory(card);
        bossLooted[stage][rarity] = true;
      }
    });

    renderLootPreview();
    renderBossLootList();
  }

  // ==========================
  // LOOT PREVIEW
  // ==========================
  function renderLootPreview() {

    lootPreviewEl.innerHTML = "";

    let any = false;

    cardPool.forEach(card => {

      if (!isCardAvailableForStage(card, stage)) return;
      if (bossLooted[stage] && bossLooted[stage][card.rarity]) return;

      const div = document.createElement("div");
      div.classList.add("card", card.rarity);
      div.textContent = `${card.name} (+${card.cdps} dps)`;

      lootPreviewEl.appendChild(div);
      any = true;
    });

    if (!any) {
      lootPreviewEl.innerHTML = `<div class="empty-state">— no loot remaining —</div>`;
    }
  }

  // ==========================
  // DROP MODAL
  // ==========================
  function openDropChanceModal() {

    if (document.getElementById("drop-chance-modal")) return;

    const modal = document.createElement("div");
    modal.id = "drop-chance-modal";

    const box = document.createElement("div");
    box.className = "modal-box";

    box.innerHTML = `
      <div class="modal-title">⚔ Drop Chances ⚔</div>
      ${cardPool.map(card => {

        let dropText = "always available";

        if (card.specialStage) {
          dropText = `Boss ${card.specialStage}`;
        } else if (card.minStage) {
          dropText = `from Boss ${card.minStage}`;
        }

        return `
          <div class="card ${card.rarity}" style="margin-bottom:6px;">
            ${card.rarity.toUpperCase()} &mdash; ${card.name}
            <br>
            <small style="opacity:0.75;font-family:'Crimson Text',serif;font-weight:400;font-size:12px;">
              Chance: ${(card.chance * 100).toFixed(3)}% &bull; ${dropText}
            </small>
          </div>
        `;
      }).join("")}
      <button class="close-modal-btn">Close</button>
    `;

    modal.appendChild(box);
    document.body.appendChild(modal);

    box.querySelector(".close-modal-btn").onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
  }

  // ==========================
  // BOSS
  // ==========================
  function bossDefeated() {

  dropCard();

  const wasMaxStage = stage === maxStageReached;

  if (!resetCheckbox.checked) {
    stage++;
  }

  // 🔥 If we just defeated the highest boss,
  // maxStageReached should ALWAYS be incremented
  if (wasMaxStage) {
    maxStageReached++;
  }

  spawnBoss();
  saveGame();
}

  function spawnBoss() {
    if (isBossFullyLooted(stage)) {
  stage = getNextAvailableStage(1);
}

    if (stage < 20) {
  // Phase 1 (1–19)
  bossMaxHp = Math.floor(
    10 * Math.pow(1.25, stage - 1)
  );

} else if (stage < 40) {
  // Phase 2 (20–39)
  bossMaxHp = Math.floor(
    10 *
    Math.pow(1.25, 19) *
    Math.pow(1.12, stage - 19)
  );

} else if (stage < 60) {
  // Phase 3 (40–59)
  bossMaxHp = Math.floor(
    10 *
    Math.pow(1.25, 19) *
    Math.pow(1.12, 20) *
    Math.pow(1.10, stage - 39)
  );

} else {
  // Phase 4 (60+)
  bossMaxHp = Math.floor(
    10 *
    Math.pow(1.25, 19) *
    Math.pow(1.12, 20) *
    Math.pow(1.10, 20) *
    Math.pow(1.05, stage - 59)
  );
}

    bossHp = bossMaxHp;
    bossName.textContent = `Boss #${stage}`;
    if (stageNumEl) stageNumEl.textContent = stage;

    updateBossUI();
    renderLootPreview();
    renderBossLootList();
    stagePrev.disabled = stage <= 1;
    stageNext.disabled = stage >= maxStageReached;
    console.log(stage, bossMaxHp);
  }

  function updateBossUI() {
    const percent = (bossHp / bossMaxHp) * 100;
    bossFill.style.width = percent + "%";
    bossText.textContent = `${Math.ceil(bossHp)} / ${bossMaxHp}`;
  }

  // ==========================
  // BOSS LIST
  // ==========================
  function renderBossLootList() {

    bossLootListEl.innerHTML = "";
    let anyVisible = false;

    for (let i = 1; i <= maxStageReached; i++) {

      const loot = bossLooted[i] || {};
      const availableCards = cardPool.filter(c =>
        isCardAvailableForStage(c, i)
      );

      if (availableCards.length === 0) continue;

      if (isBossFullyLooted(i)) continue;

      const row = document.createElement("div");
      row.textContent = `Boss ${i}: `;

      getAllRarities().forEach(rarity => {

        const exists = availableCards.some(c => c.rarity === rarity);
        if (!exists) return;

        const span = document.createElement("span");
        span.classList.add("card", rarity);
        span.textContent = loot[rarity] ? "✅" : rarity.toUpperCase();

        row.appendChild(span);
      });

      bossLootListEl.appendChild(row);
      anyVisible = true;
    }

    if (!anyVisible) {
      bossLootListEl.innerHTML = `<div class="empty-state">— all boss loot collected —</div>`;
    }
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
    saveVersion: 1,
    stage: stage,
    bossHp: bossHp,
    bossMaxHp: bossMaxHp,
    inventory: inventory,
    bossLooted: bossLooted,
    maxStageReached: maxStageReached,
    soulShards: soulShards ?? 0
  };

  console.log("Saving SoulShards:", soulShards);

  localStorage.setItem("idleGameSave", JSON.stringify(saveData));
}

  function loadGame() {
    console.log("Loaded SoulShards:",soulShards);
  const raw = localStorage.getItem("idleGameSave");
  if (!raw) return;

  const data = JSON.parse(raw);

  // Check Save-Version
  const saveVersion = data.saveVersion ?? 1; // alte saves default 1
  if (saveVersion > 1) {
    localStorage.removeItem("idleGameSave");
    return;
  }

  stage = data.stage ?? stage;
  bossHp = data.bossHp ?? bossHp;
  bossMaxHp = data.bossMaxHp ?? bossMaxHp;
  inventory = data.inventory ?? [];
  bossLooted = data.bossLooted ?? {};
  maxStageReached = data.maxStageReached ?? stage;
  soulShards = data.soulShards ?? 0;
  console.log("SoulShards after load:", soulShards);
  updateDps();
  updateShardDisplay();
  renderInventory();
}

  // ==========================
  // START
  // ==========================
  document.getElementById("drop-info-btn").addEventListener("click", openDropChanceModal);

  loadGame();
  spawnBoss();
  updateDps();
  idleLoop();

  setInterval(saveGame, 5000);
});