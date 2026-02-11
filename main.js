  document.addEventListener("DOMContentLoaded", function() {
// getElementById stuff
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
// variables
  let stage = 1;
  let bossMaxHp = 13;
  let bossHp = bossMaxHp;
  let dps = 1;
  let inventory = [];
  let lastTick = Date.now();
  let bossLooted = {};
  let maxStageReached = 1;
  let devMode = false;
  let tapCount = 0;
  let tapTimer = null;
  const TAP_THRESHOLD = 20;
  const TAP_TIME = 4000;

// cards
  const cardPool = [
  { id: 1, name: "stick", cdps: 1, chance: 1, rarity: "common" },
  { id: 2, name: "sword", cdps: 5, chance: 0.7, rarity: "rare" },
  { id: 3, name: "gun", cdps: 10, chance: 0.4, rarity: "epic" },

  // Legendary ab Stage 25
  { id: 4, name: "Ancient Blade", cdps: 100, chance: 1, rarity: "legendary", minStage: 25 },

  // Event Drop
  { id: 100, name: "v0.0.1 Alpha Sword", cdps: 500, chance: 0.001, rarity: "eventdrop", specialStage: [20] }
];
// everything for dev mode
  versionEl.addEventListener("click", () => {
  tapCount++;

  if (tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(() => {
    tapCount = 0;
  }, TAP_TIME);

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

    alert("DEV MODE " + (devMode ? "on" : "off"));
  }
});

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
    <button id="dev-loot-all">Loot All</button>
  `;

  document.body.appendChild(div);

  // +DPS
  document.getElementById("dev-add-dps").onclick = () => {
    dps += 100;
    dpstext.textContent = dps;
  };

  // -DPS
  document.getElementById("dev-reduce-dps").onclick = () => {
    dps = Math.max(1, dps - 100); // DPS nicht unter 1
    dpstext.textContent = dps;
  };

  // Boss Kill
  document.getElementById("dev-kill-boss").onclick = () => {
    bossHp = 0;
    updateBossUI();
    bossDefeated();
  };

  // Loot All
  document.getElementById("dev-loot-all").onclick = () => {
    if (!bossLooted[stage]) bossLooted[stage] = {};
    const rarities = ["common", "rare", "epic", "legendary", "eventdrop"];
    rarities.forEach(r => {
      if (!bossLooted[stage][r]) {
        const pool = cardPool.filter(c => c.rarity === r && (!c.specialStage || c.specialStage === stage));
        pool.forEach(card => {
          addCardToInventory(card);
          dps += card.cdps;
          bossLooted[stage][r] = true;
        });
      }
    });
    dpstext.textContent = dps;
    renderLootPreview();
    renderBossLootList();
  };
}
  
  stagePrev.addEventListener("click", () => {
    stage = Math.max(1, stage - 1);
    spawnBoss();
    renderLootPreview();
  });

  stageNext.addEventListener("click", () => {
     if (stage < maxStageReached){
    stage++;
    spawnBoss();
    renderLootPreview();
  }
});

  function updateBossUI() {
    const percent = (bossHp / bossMaxHp) * 100;
    bossFill.style.width = percent + "%";
    bossText.textContent = `${Math.ceil(bossHp)} / ${bossMaxHp}`;
  }

  function renderInventory() {
    inventoryEl.innerHTML = "";
    if (inventory.length === 0) {
      inventoryEl.textContent = "— empty —";
      return;
    }

    inventory.forEach(card => {
      const div = document.createElement("div");
      div.style.height = "14px";
      div.style.fontSize = "12px";
      div.classList.add("card", card.rarity);
      div.textContent = `${card.count} x ${card.name} (+${card.cdps} dps) = +${card.cdps * card.count} dps`;
      inventoryEl.appendChild(div);
    });
  }

function renderLootPreview() {
  lootPreviewEl.innerHTML = `
    <b>loot available:</b>
    <span id="drop-info-btn" style="cursor:pointer; margin-left:6px;">dropchances❗</span>
    <br>
  `;

  let any = false;

  cardPool.forEach(card => {

    if (!isCardAvailableForStage(card, stage)) return;
    if (bossLooted[stage] && bossLooted[stage][card.rarity]) return;

    const div = document.createElement("div");
    div.style.height = "14px";
    div.style.fontSize = "12px";
    div.classList.add("card", card.rarity);
    div.textContent = `${card.name} (+${card.cdps} dps)`;

    lootPreviewEl.appendChild(div);
    any = true;
  });

  if (!any) {
    lootPreviewEl.innerHTML += "<div>— no loot remaining —</div>";
  }

  // ❗ Dropchance Button Event
  document.getElementById("drop-info-btn").addEventListener("click", openDropChanceModal);
}

  // ===== Boss Loot Liste mit Farben =====
function renderBossLootList() {
  bossLootListEl.innerHTML = "";

  const rarities = getAllRarities();
  const maxStage = Math.max(stage, ...Object.keys(bossLooted).map(Number), 1);

  let anyVisible = false;

  for (let i = 1; i <= maxStage; i++) {

    const loot = bossLooted[i] || {};

    // Alle Items die es für diesen Boss geben kann
    const availableCards = cardPool.filter(c =>
      isCardAvailableForStage(c, i)
    );

    if (availableCards.length === 0) continue;

    // Prüfen ob noch etwas fehlt
    const hasMissing = availableCards.some(card =>
      !loot[card.rarity]
    );

    // Wenn nichts fehlt → Boss nicht anzeigen
    if (!hasMissing) continue;

    const row = document.createElement("div");
    row.textContent = `Boss ${i}: `;

    rarities.forEach(rarity => {

      const existsForStage = availableCards.some(c => c.rarity === rarity);
      if (!existsForStage) return;

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

function getAllRarities() {
  return [...new Set(cardPool.map(c => c.rarity))];
}

function isCardAvailableForStage(card, stageNumber) {

  // Eventdrop mit specialStage (eine oder mehrere Stages)
  if (card.specialStage) {
    if (Array.isArray(card.specialStage)) {
      return card.specialStage.includes(stageNumber);
    }
    return card.specialStage === stageNumber;
  }

  // Items mit minStage (z.B. Legendary ab 25)
  if (card.minStage) {
    return stageNumber >= card.minStage;
  }

  // Normale Items (common, rare, epic etc.)
  return true;
}
  
  function openDropChanceModal() {
  if (document.getElementById("drop-chance-modal")) return;

  const modal = document.createElement("div");
  modal.id = "drop-chance-modal";
  modal.style = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const box = document.createElement("div");
  box.style = `
    background: #111;
    color: #fff;
    padding: 12px;
    border-radius: 8px;
    width: 90%;
    max-width: 320px;
    font-size: 12px;
  `;

  box.innerHTML = `
    <b>Drop Chances</b><br><br>
    ${generateDropChanceList()}
    <br>
    <button id="close-drop-modal" style="margin-top:8px;width:100%;">close</button>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  document.getElementById("close-drop-modal").onclick = () => modal.remove();

  // Klick außerhalb schließt
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

function generateDropChanceList() {
  return cardPool.map(card => {
    let dropText = "";

    // Event Drop (fester Boss)
    if (card.specialStage) {
      dropText = `drops at boss ${card.specialStage}`;
    }
    // Legendary / normale Min-Stage Drops
    else if (card.minStage) {
      dropText = `drops from boss ${card.minStage}+`;
    }
    // Immer verfügbar
    else {
      dropText = "drops always";
    }

    const percent = (card.chance * 100).toFixed(3);

    return `
      <div class="card ${card.rarity}" style="margin-bottom:4px;">
        ${card.rarity} <!-- statt Name -->
        <br>
        <small>
          Chance: <b>${percent}%</b><br>
          ${dropText}
        </small>
      </div>
    `;
  }).join("");
}


  // ===== Inventory & Loot =====
  function addCardToInventory(card) {
    const existing = inventory.find(c => c.id === card.id);
    if (existing) existing.count++;
    else inventory.push({ ...card, count: 1 });
    renderInventory();
  }

function dropCard() {
  if (!bossLooted[stage]) bossLooted[stage] = {};

  const rarities = getAllRarities();

  rarities.forEach(rarity => {

    if (bossLooted[stage][rarity]) return;

    const pool = cardPool.filter(c =>
      c.rarity === rarity &&
      (!c.specialStage || c.specialStage.includes(stage)) &&
      (!c.minStage || stage >= c.minStage)
    );

    if (pool.length === 0) return;

    const card = pool[Math.floor(Math.random() * pool.length)];

    if (Math.random() < card.chance) {
      addCardToInventory(card);
      dps += card.cdps;
      dpstext.textContent = dps;
      bossLooted[stage][rarity] = true;
    }
  });

  renderLootPreview();
  renderBossLootList();
}

  // ===== Boss Funktionen =====
  function bossDefeated() {
    dropCard();

    if (resetCheckbox.checked) {
      const val = parseInt(stage);
      if (!isNaN(val) && val >= 1) stage = val;
    } else {
      stage++;
    }
    maxStageReached = Math.max(maxStageReached, stage);

    spawnBoss();
    saveGame();
  }

  function spawnBoss() {
    bossMaxHp = Math.floor(10 * Math.pow(1.3, stage));
    bossHp = bossMaxHp;
    bossName.textContent = `Boss #${stage}`;
    
    updateBossUI();
    renderLootPreview();
    renderBossLootList();
  }

  // ===== Idle Loop =====
  function idleLoop() {
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    lastTick = now;

    if (bossHp > 0) bossHp = Math.max(0, bossHp - dps * delta);
    else bossDefeated();

    updateBossUI();
    requestAnimationFrame(idleLoop);
  }

function saveGame() {
  const saveData = {
    stage,
    bossHp,
    bossMaxHp,
    dps,
    inventory,
    bossLooted,
    maxStageReached
  };

  localStorage.setItem("idleGameSave", JSON.stringify(saveData));
}

function loadGame() {
  const raw = localStorage.getItem("idleGameSave");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    stage = data.stage ?? stage;
    bossHp = data.bossHp ?? bossHp;
    bossMaxHp = data.bossMaxHp ?? bossMaxHp;
    dps = data.dps ?? dps;
    inventory = data.inventory ?? [];
    bossLooted = data.bossLooted ?? {};
    maxStageReached = data.maxStageReached ?? stage;

    dpstext.textContent = `${dps}`;

  } catch (e) {
    console.error("Save konnte nicht geladen werden", e);
  }
}

  // ===== START =====
  dpstext.textContent = `${dps}`;
  loadGame();
  renderInventory();
  spawnBoss();
  updateBossUI();
  idleLoop();
  
  const resetSaveBtn = document.getElementById("reset-save");

resetSaveBtn.addEventListener("click", () => {
  const ok = confirm("alles löschen?");
  if (!ok) return;

  // 🔥 Save löschen
  localStorage.removeItem("idleGameSave");

  // 🔄 Game State zurücksetzen
  stage = 1;
  dps = 1;
  maxStageReached = 1;
  inventory = [];
  bossLooted = {};

  // Boss neu starten
  spawnBoss();

  // UI neu rendern
  dpstext.textContent = `${dps}`;
  renderInventory();
  renderLootPreview();
  renderBossLootList();

  alert("alles gelöscht");
});
});
setInterval(saveGame, 5000); // alle 5 Sekunden