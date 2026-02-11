document.addEventListener("DOMContentLoaded", function() {

  // ==========================
  // DOM
  // ==========================
  const bossFill = document.getElementById("boss-hp-fill");
  const bossText = document.getElementById("boss-hp-text");
  const bossName = document.getElementById("boss-name");
  const dpstext = document.getElementById("dpstext");
  const inventoryEl = document.getElementById("inventory");
  const lootPreviewEl = document.getElementById("loot-preview");
  const bossLootListEl = document.getElementById("boss-loot-list");
  const stagePrev = document.getElementById("stage-prev");
  const stageNext = document.getElementById("stage-next");
  const resetCheckbox = document.getElementById("enable-reset");
  const versionEl = document.getElementById("version");
  
  const panel = document.getElementById("control-panel");
const header = document.getElementById("control-header");
const toggleBtn = document.getElementById("control-toggle");

header.addEventListener("click", () => {
  panel.classList.toggle("collapsed");
  toggleBtn.textContent = panel.classList.contains("collapsed") ? "+" : "–";
});
  
  // ==========================
// STAGE NAVIGATION
// ==========================

stagePrev.addEventListener("click", () => {
  if (stage > 1) {
    stage--;
    spawnBoss();
  }
});

stageNext.addEventListener("click", () => {
  if (stage < maxStageReached) {
    stage++;
    spawnBoss();
  }
});

  // ==========================
  // GAME STATE
  // ==========================
  let stage = 1;
  let bossMaxHp = 13;
  let bossHp = bossMaxHp;

  let baseDps = 1;
  let bonusDps = 0;
  let dps = 1;

  let inventory = [];
  let bossLooted = {};
  let maxStageReached = 1;

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
    { id: 1, name: "stick", cdps: 4, chance: 0.8, rarity: "common" },
    { id: 2, name: "sword", cdps: 20, chance: 0.55, rarity: "rare" },
    { id: 3, name: "gun", cdps: 50, chance: 0.25, rarity: "epic"},
    { id: 4, name: "twin blade", cdps: 100, chance: 0.1, rarity: "legendary", minStage: 25 },
    { id: 100, name: "v0.0.1 alpha sword", cdps: 500, chance: 0.01, rarity: "eventdrop", specialStage: [10, 20, 30, 40, 50] }
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

    return baseDps + bonusDps + cardDps;
  }

  function updateDps() {
    dps = calculateDps();
    dpstext.textContent = dps;
  }

  // ==========================
  // UTIL
  // ==========================
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
    inventoryEl.textContent = "— empty —";
    return;
  }

  inventory.forEach(item => {
    const cardData = cardPool.find(c => c.id === item.id);
    if (!cardData) return;

    const div = document.createElement("div");
    div.classList.add("card", cardData.rarity);

    div.textContent =
      `${item.count}x ${cardData.name} (+${cardData.cdps} dps) = +${cardData.cdps * item.count}`;

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

    lootPreviewEl.innerHTML = `
      <b>loot available:</b>
      <span id="drop-info-btn" style="cursor:pointer;margin-left:6px;">loot chances:❗</span>
      <br>
    `;

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
      lootPreviewEl.innerHTML += "<div>— no loot remaining —</div>";
    }

    document.getElementById("drop-info-btn")
      .addEventListener("click", openDropChanceModal);
  }

  // ==========================
  // DROP MODAL
  // ==========================
  function openDropChanceModal() {

    if (document.getElementById("drop-chance-modal")) return;

    const modal = document.createElement("div");
    modal.id = "drop-chance-modal";
    modal.style = `
      position:fixed;inset:0;
      background:rgba(0,0,0,0.6);
      display:flex;align-items:center;justify-content:center;
      z-index:9999;
    `;

    const box = document.createElement("div");
    box.style = `
      background:#111;color:#fff;
      padding:12px;border-radius:8px;
      width:90%;max-width:320px;
      font-size:12px;
    `;

    box.innerHTML = `
      <b>Drop Chances</b><br><br>
      ${cardPool.map(card => {

        let dropText = "drops always";

        if (card.specialStage) {
          dropText = `drops at boss ${card.specialStage}`;
        } else if (card.minStage) {
          dropText = `drops from boss ${card.minStage}+`;
        }

        return `
          <div class="card ${card.rarity}" style="margin-bottom:6px;">
            ${card.rarity.toUpperCase()}
            <br>
            <small>
              Chance: ${(card.chance * 100).toFixed(3)}%<br>
              ${dropText}
            </small>
          </div>
        `;
      }).join("")}
      <button id="close-drop-modal" style="width:100%;margin-top:8px;">close</button>
    `;

    modal.appendChild(box);
    document.body.appendChild(modal);

    document.getElementById("close-drop-modal").onclick = () => modal.remove();
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

  // 🔥 Wenn wir gerade den höchsten Boss besiegt haben,
  // soll maxStageReached IMMER erhöht werden
  if (wasMaxStage) {
    maxStageReached++;
  }

  spawnBoss();
  saveGame();
}

  function spawnBoss() {

    if (stage < 20) {
      bossMaxHp = Math.floor(13 * Math.pow(1.25, stage - 1));
    } else {
      bossMaxHp = Math.floor(13 * Math.pow(1.25, 19) * Math.pow(1.23, stage - 19));
    }

    bossHp = bossMaxHp;
    bossName.textContent = `Boss #${stage}`;

    updateBossUI();
    renderLootPreview();
    renderBossLootList();
    stagePrev.disabled = stage <= 1;
    stageNext.disabled = stage >= maxStageReached;
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

      const hasMissing = availableCards.some(card =>
        !loot[card.rarity]
      );

      if (!hasMissing) continue;

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
      bossLootListEl.innerHTML = "<div><i>— all boss loot collected —</i></div>";
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
    localStorage.setItem("idleGameSave", JSON.stringify({
      stage,
      bossHp,
      bossMaxHp,
      inventory,
      bossLooted,
      maxStageReached
    }));
  }

  function loadGame() {
    const raw = localStorage.getItem("idleGameSave");
    if (!raw) return;

    const data = JSON.parse(raw);

    stage = data.stage ?? stage;
    bossHp = data.bossHp ?? bossHp;
    bossMaxHp = data.bossMaxHp ?? bossMaxHp;
    inventory = data.inventory ?? [];
    bossLooted = data.bossLooted ?? {};
    maxStageReached = data.maxStageReached ?? stage;

    updateDps();
    renderInventory();
  }

  // ==========================
  // START
  // ==========================
  loadGame();
  spawnBoss();
  updateDps();
  idleLoop();

  setInterval(saveGame, 5000);
});