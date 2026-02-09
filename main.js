document.addEventListener("DOMContentLoaded", function() {
  // ===== DOM Elemente =====
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

  // ===== GAME STATE =====
  let stage = 1;
  let bossMaxHp = 13;
  let bossHp = bossMaxHp;
  let dps = 1;
  let inventory = [];
  let lastTick = Date.now();
  let bossLooted = {};

  // ===== CARD POOL =====
  const cardPool = [
    { id: 1, name: "stick", cdps: 1, chance: 1, rarity: "common" },
    { id: 2, name: "sword", cdps: 5, chance: 0.5, rarity: "rare" },
    { id: 3, name: "gun", cdps: 10, chance: 0.4, rarity: "epic" },
    // Special Item direkt als Card (nur für Stage 10)
    { id: 100, name: "Glubs wedding ring", cdps: 500, chance: 0.001, rarity: "eventdrop", specialStage : 20}
  ];

  // ===== UI Funktionen =====
  stagePrev.addEventListener("click", () => {
    stage = Math.max(1, stage - 1);
    spawnBoss();
    renderLootPreview();
  });

  stageNext.addEventListener("click", () => {
    stage++;
    spawnBoss();
    renderLootPreview();
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
    lootPreviewEl.innerHTML = "<b>loot available:</b><br>";

    let any = false;

    cardPool.forEach(card => {
      // Nur Loot für diese Stage anzeigen
      if (card.specialStage && card.specialStage !== stage) return;
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
  }

  // ===== Boss Loot Liste mit Farben =====
  function renderBossLootList() {
    bossLootListEl.innerHTML = "";

    const rarities = ["common", "rare", "epic", "eventdrop"];
    const maxStage = Math.max(stage, ...Object.keys(bossLooted).map(Number), 1);

    let anyVisible = false;

    for (let i = 1; i <= maxStage; i++) {
      const loot = bossLooted[i] || {};
      const hasMissing = rarities.some(r => !loot[r] && (r !== "eventdrop" || cardPool.some(c => c.rarity==="eventdrop" && c.specialStage===i)));

      if (!hasMissing) continue;

      anyVisible = true;
      const row = document.createElement("div");
      row.style.height = "14px";
      row.style.fontSize = "12px";
      row.textContent = `Boss ${i}: `;

      rarities.forEach(rarity => {
        // Nur zeigen, wenn der Boss diese Rarity hat
        if (rarity === "eventdrop" && !cardPool.some(c => c.rarity==="eventdrop" && c.specialStage===i)) return;

        const span = document.createElement("span");
        span.classList.add("card", rarity);
        span.textContent = loot[rarity] ? "✅" : rarity;
        row.appendChild(span);
      });

      bossLootListEl.appendChild(row);
    }

    if (!anyVisible) {
      bossLootListEl.innerHTML += "<div><i>— all boss loot collected —</i></div>";
    }
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

    ["common", "rare", "epic", "eventdrop"].forEach(rarity => {
      // Spezielle Items nur bei richtiger Stage
      const pool = cardPool.filter(c => c.rarity === rarity && (!c.specialStage || c.specialStage===stage));
      if (pool.length===0 || bossLooted[stage][rarity]) return;

      const card = pool[Math.floor(Math.random() * pool.length)];
      if (Math.random() < card.chance) {
        addCardToInventory(card);
        dps += card.cdps;
        dpstext.textContent = `${dps}`;
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

    spawnBoss();
    saveGame();
  }

  function spawnBoss() {
    bossMaxHp = Math.floor(10 * Math.pow(1.3, stage));
    bossHp = bossMaxHp;
    if (stage > 99){
      stage = 100;
    }
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
    bossLooted
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
});
setInterval(saveGame, 5000); // alle 5 Sekunden