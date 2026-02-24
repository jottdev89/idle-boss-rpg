// ============================================================
// BOSS-ART.JS — Prozedurale Boss-Grafiken via Canvas
// ============================================================

const BossArt = (() => {

  const canvas = document.getElementById("boss-canvas");
  const ctx    = canvas ? canvas.getContext("2d") : null;

  let animFrame = null;
  let tick = 0;
  let currentType    = "demon";
  let currentPalette = null;
  let currentRng     = null;

  // ── SEEDED RANDOM ─────────────────────────────────────────
  function seededRng(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  // ── PALETTEN ─────────────────────────────────────────────
  const PALETTES = [
    { body: "#8B2020", dark: "#4a0f0f", accent: "#ff4040", eye: "#ff0000", glow: "rgba(255,30,0,0.4)"    },
    { body: "#1a4a1a", dark: "#0a2a0a", accent: "#40ff40", eye: "#00ff44", glow: "rgba(0,255,60,0.35)"   },
    { body: "#1a1a6a", dark: "#0a0a3a", accent: "#4060ff", eye: "#00aaff", glow: "rgba(40,80,255,0.35)"  },
    { body: "#5a1a6a", dark: "#2a0a3a", accent: "#cc40ff", eye: "#ee00ff", glow: "rgba(180,0,255,0.35)"  },
    { body: "#6a4a00", dark: "#3a2a00", accent: "#ffaa00", eye: "#ffcc00", glow: "rgba(255,160,0,0.4)"   },
    { body: "#3a3a3a", dark: "#1a1a1a", accent: "#aaaaaa", eye: "#ffffff", glow: "rgba(200,200,200,0.3)" },
    { body: "#6a1a1a", dark: "#3a0808", accent: "#ff6600", eye: "#ff3300", glow: "rgba(255,80,0,0.45)"   },
    { body: "#004a4a", dark: "#002222", accent: "#00ffee", eye: "#00ffcc", glow: "rgba(0,220,200,0.35)"  },
    { body: "#4a0a2a", dark: "#280510", accent: "#ff40aa", eye: "#ff80cc", glow: "rgba(255,50,150,0.4)"  },
    { body: "#2a2a00", dark: "#151500", accent: "#dddd00", eye: "#ffff40", glow: "rgba(220,220,0,0.4)"   },
  ];

  // ── BOSS TYPEN ────────────────────────────────────────────
  const BOSS_TYPES = [
    "demon", "spider", "dragon", "skull", "slime",
    "knight", "eye", "hydra", "lich", "scorpion",
    "vampire", "goliath",
  ];

  // ── ZEICHNEN ─────────────────────────────────────────────
  function drawBoss(stage) {
    if (!ctx) return;
    const rng     = seededRng(stage * 7919 + 42);
    const palette = PALETTES[Math.floor(rng() * PALETTES.length)];
    const type    = BOSS_TYPES[Math.floor(rng() * BOSS_TYPES.length)];
    const scale   = 1 + Math.min(stage / 200, 0.45);

    // Für Todesanimation speichern
    currentType    = type;
    currentPalette = palette;
    currentRng     = seededRng(stage * 7919 + 42); // frischer Seed

    if (animFrame) cancelAnimationFrame(animFrame);

    function loop() {
      tick += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBg(palette);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 10);
      ctx.scale(scale, scale);
      switch (type) {
        case "demon":    drawDemon(rng, palette);    break;
        case "spider":   drawSpider(rng, palette);   break;
        case "dragon":   drawDragon(rng, palette);   break;
        case "skull":    drawSkull(rng, palette);    break;
        case "slime":    drawSlime(rng, palette);    break;
        case "knight":   drawKnight(rng, palette);   break;
        case "eye":      drawEyeBoss(rng, palette);  break;
        case "hydra":    drawHydra(rng, palette);    break;
        case "lich":     drawLich(rng, palette);     break;
        case "scorpion": drawScorpion(rng, palette); break;
        case "vampire":  drawVampire(rng, palette);  break;
        case "goliath":  drawGoliath(rng, palette);  break;
      }
      ctx.restore();
      animFrame = requestAnimationFrame(loop);
    }
    loop();
  }

  // ── HELPERS ──────────────────────────────────────────────
  function drawBg(p) {
    const grad = ctx.createRadialGradient(110, 110, 10, 110, 110, 110);
    grad.addColorStop(0, p.glow.replace(/[\d.]+\)$/, "0.10)"));
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function glow(color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
  function noGlow()           { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; }

  function ellipse(x, y, rx, ry, fill, stroke) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  // Einzelnes Auge (Hilfsfunktion für andere Bosse)
  function eyeball(p, x, y, size) {
    ellipse(x, y, size, size * 0.72, "#ffffff");
    const px = x + Math.sin(tick * 0.8) * size * 0.2;
    const py = y + Math.cos(tick * 0.6) * size * 0.15;
    ellipse(px, py, size * 0.52, size * 0.52, p.eye);
    glow(p.eye, 8);
    ellipse(px, py, size * 0.24, size * 0.24, "#ffffff");
    noGlow();
  }

  // ── DEMON ────────────────────────────────────────────────
  function drawDemon(rng, p) {
    const bob = Math.sin(tick) * 3;
    glow(p.glow, 20);
    ellipse(0, 10 + bob, 38, 45, p.body);
    noGlow();
    ctx.save(); ctx.translate(-38, 5 + bob); ctx.rotate(Math.sin(tick * 0.8) * 0.15 - 0.3);
    ellipse(0, 0, 12, 30, p.dark); ctx.restore();
    ctx.save(); ctx.translate(38, 5 + bob);  ctx.rotate(-Math.sin(tick * 0.8) * 0.15 + 0.3);
    ellipse(0, 0, 12, 30, p.dark); ctx.restore();
    glow(p.glow, 15);
    ellipse(0, -38 + bob, 30, 28, p.body);
    noGlow();
    const hw = Math.sin(tick * 1.2) * 2;
    ctx.fillStyle = p.accent;
    ctx.beginPath(); ctx.moveTo(-15,-55+bob+hw); ctx.lineTo(-25,-82+bob); ctx.lineTo(-5,-58+bob); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15,-55+bob+hw);  ctx.lineTo(25,-82+bob);  ctx.lineTo(5,-58+bob);  ctx.closePath(); ctx.fill();
    eyeball(p, -11, -40+bob, 8);
    eyeball(p,  11, -40+bob, 8);
    ctx.beginPath(); ctx.arc(0,-28+bob,12,0.2,Math.PI-0.2);
    ctx.strokeStyle=p.accent; ctx.lineWidth=2; ctx.stroke();
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*5,-28+bob);ctx.lineTo(i*5,-23+bob);ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();}
  }

  // ── SPIDER ───────────────────────────────────────────────
  function drawSpider(rng, p) {
    const bob = Math.sin(tick * 1.0) * 3;
    // Netz
    ctx.strokeStyle = "rgba(200,200,220,0.15)"; ctx.lineWidth = 0.8;
    for(let r=15;r<=55;r+=12){ctx.beginPath();ctx.arc(0,-75,r,0,Math.PI);ctx.stroke();}
    for(let a=0;a<=Math.PI;a+=Math.PI/6){ctx.beginPath();ctx.moveTo(0,-75);ctx.lineTo(Math.cos(a)*55,-75+Math.sin(a)*55);ctx.stroke();}
    ctx.strokeStyle="rgba(200,200,220,0.35)"; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(0,-55+bob); ctx.lineTo(0,-75); ctx.stroke();
    // Beine mit Knien
    for(let i=0;i<4;i++){
      const legWave=Math.sin(tick*2.5+i*1.1)*0.18;
      const kneeLift=Math.sin(tick*2.5+i*1.1+Math.PI)*4;
      const sx=i<2?-26:26, sy=-20+i%2*14+bob;
      const kx=(i<2?-1:1)*(48+i/3*10), ky=-30+i/3*20+kneeLift+bob+Math.sin(legWave)*8;
      const fx=(i<2?-1:1)*(32+i/3*16), fy=25+i/3*10+bob;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(kx,ky);
      ctx.strokeStyle=p.body; ctx.lineWidth=5; ctx.lineCap="round"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(kx,ky); ctx.lineTo(fx,fy);
      ctx.strokeStyle=p.dark; ctx.lineWidth=4; ctx.stroke();
      ctx.beginPath(); ctx.arc(kx,ky,4,0,Math.PI*2); ctx.fillStyle=p.accent; ctx.fill();
      ctx.beginPath(); ctx.arc(fx,fy,3,0,Math.PI*2); ctx.fillStyle=p.dark; ctx.fill();
    }
    // Hinterleib
    glow(p.glow, 20); ellipse(0,30+bob,30,38,p.body); noGlow();
    ctx.fillStyle=p.accent; ctx.globalAlpha=0.5;
    ctx.beginPath(); ctx.moveTo(0,10+bob);ctx.lineTo(10,20+bob);ctx.lineTo(0,30+bob);ctx.lineTo(-10,20+bob);ctx.closePath();ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,35+bob);ctx.lineTo(10,45+bob);ctx.lineTo(0,55+bob);ctx.lineTo(-10,45+bob);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;
    ellipse(0,-5+bob,14,12,p.dark);
    glow(p.glow,14); ellipse(0,-28+bob,28,24,p.body); noGlow();
    // Cheliceren
    ctx.fillStyle=p.dark;
    ctx.beginPath(); ctx.ellipse(-9,-10+bob,5,9,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9,-10+bob,5,9,0.3,0,Math.PI*2); ctx.fill();
    glow(p.eye,8); ctx.fillStyle=p.eye;
    ctx.beginPath(); ctx.moveTo(-9,-4+bob);ctx.lineTo(-11,5+bob);ctx.lineTo(-7,-4+bob);ctx.closePath();ctx.fill();
    ctx.beginPath(); ctx.moveTo(9,-4+bob); ctx.lineTo(11,5+bob); ctx.lineTo(7,-4+bob); ctx.closePath();ctx.fill();
    noGlow();
    const drip=(tick*0.4)%1;
    ctx.beginPath(); ctx.arc(0,-4+drip*20+bob,3*(1-drip*0.5),0,Math.PI*2);
    ctx.fillStyle=`rgba(100,220,50,${0.9-drip*0.9})`; ctx.fill();
    // 8 Augen
    [[-12,-38],[-6,-42],[0,-43],[6,-42],[12,-38],[-10,-32],[0,-31],[10,-32]].forEach(([ex,ey],idx)=>{
      ellipse(ex,ey+bob,3.5,3.5,"#111");
      glow(p.eye,idx<2||idx>5?6:3);
      ellipse(ex,ey+bob,2.2,2.2,p.eye);
      noGlow();
    });
  }

  // ── DRAGON ───────────────────────────────────────────────
  function drawDragon(rng, p) {
    const bob=Math.sin(tick*0.7)*4, wf=Math.sin(tick*1.5)*0.25;
    ctx.save(); ctx.translate(-30,-20+bob); ctx.rotate(-0.4+wf);
    ctx.fillStyle=p.dark; ctx.beginPath();
    ctx.moveTo(0,0);ctx.bezierCurveTo(-60,-20,-70,20,-50,50);ctx.lineTo(0,30);ctx.closePath();ctx.fill();
    ctx.strokeStyle=p.accent;ctx.lineWidth=1.5;ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(30,-20+bob); ctx.rotate(0.4-wf);
    ctx.fillStyle=p.dark; ctx.beginPath();
    ctx.moveTo(0,0);ctx.bezierCurveTo(60,-20,70,20,50,50);ctx.lineTo(0,30);ctx.closePath();ctx.fill();
    ctx.strokeStyle=p.accent;ctx.lineWidth=1.5;ctx.stroke(); ctx.restore();
    glow(p.glow,20); ellipse(0,15+bob,30,40,p.body); noGlow();
    ellipse(0,-20+bob,16,20,p.body);
    glow(p.glow,15); ellipse(0,-48+bob,24,20,p.body); noGlow();
    ellipse(0,-40+bob,12,8,p.dark);
    ctx.fillStyle=p.accent;
    ctx.beginPath();ctx.moveTo(-10,-58+bob);ctx.lineTo(-18,-78+bob);ctx.lineTo(-4,-60+bob);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(10,-58+bob); ctx.lineTo(18,-78+bob); ctx.lineTo(4,-60+bob); ctx.closePath();ctx.fill();
    eyeball(p,-9,-52+bob,7); eyeball(p,9,-52+bob,7);
    const fa=0.4+Math.sin(tick*2)*0.3;
    const fg=ctx.createRadialGradient(0,-30+bob,2,0,-10+bob,30);
    fg.addColorStop(0,`rgba(255,200,0,${fa})`);fg.addColorStop(0.5,`rgba(255,80,0,${fa*0.6})`);fg.addColorStop(1,"transparent");
    ctx.fillStyle=fg; ctx.beginPath();ctx.ellipse(0,-5+bob,14,28,0,0,Math.PI*2);ctx.fill();
  }

  // ── SKULL ────────────────────────────────────────────────
  function drawSkull(rng, p) {
    const bob=Math.sin(tick*0.9)*3, jaw=Math.sin(tick*2)*4;
    for(let i=0;i<4;i++) ellipse(0,30+i*10+bob,8-i,6,p.dark);
    glow(p.glow,10); ellipse(0,5+jaw+bob,32,12,p.dark); noGlow();
    ctx.fillStyle="#e8e8e8";
    for(let i=-3;i<=3;i++){ctx.beginPath();ctx.roundRect(i*9-3,-2+jaw+bob,7,12,2);ctx.fill();}
    glow(p.glow,25); ellipse(0,-30+bob,48,42,p.body); noGlow();
    ellipse(-36,-20+bob,12,10,p.dark); ellipse(36,-20+bob,12,10,p.dark);
    ellipse(-16,-35+bob,16,14,"#000"); ellipse(16,-35+bob,16,14,"#000");
    glow(p.eye,20); ellipse(-16,-35+bob,9,8,p.eye); ellipse(16,-35+bob,9,8,p.eye); noGlow();
    ctx.fillStyle="#e8e8e8";
    for(let i=-3;i<=3;i++){ctx.beginPath();ctx.roundRect(i*9-3,-12+bob,7,14,2);ctx.fill();}
    ctx.strokeStyle=p.dark; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-5,-65+bob);ctx.lineTo(2,-45+bob);ctx.lineTo(-8,-28+bob);ctx.stroke();
  }

  // ── SLIME ────────────────────────────────────────────────
  function drawSlime(rng, p) {
    const sq=Math.sin(tick*1.3), w=55+sq*8, h=50-sq*6;
    ellipse(0,40,w*0.9,8,"rgba(0,0,0,0.3)");
    for(let i=0;i<5;i++){
      const bx=Math.sin(i*1.5+tick*0.4)*20,by=-h+5+i*8,br=4+i*2,ba=0.5+Math.sin(tick+i)*0.3;
      ellipse(bx,by,br,br,p.accent.includes("#")?p.accent+"88":p.accent);
    }
    glow(p.glow,25); ellipse(0,10,w,h,p.body); noGlow();
    const gloss=ctx.createRadialGradient(-15,-20,5,0,0,w);
    gloss.addColorStop(0,"rgba(255,255,255,0.35)");gloss.addColorStop(0.3,"rgba(255,255,255,0.05)");gloss.addColorStop(1,"transparent");
    ctx.fillStyle=gloss;ctx.beginPath();ctx.ellipse(0,10,w,h,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=p.body;ctx.beginPath();ctx.moveTo(-w,10);
    for(let x=-w;x<=w;x+=5){ctx.lineTo(x,-h+10+Math.sin(x*0.08+tick*1.5)*6);}
    ctx.lineTo(w,10);ctx.closePath();ctx.fill();
    eyeball(p,-18,-5,12); eyeball(p,18,-5,12);
    ctx.beginPath();ctx.arc(0,15,18,0.1,Math.PI-0.1);ctx.strokeStyle=p.dark;ctx.lineWidth=3;ctx.stroke();
  }

  // ── KNIGHT ───────────────────────────────────────────────
  function drawKnight(rng, p) {
    const bob=Math.sin(tick*0.6)*2, sw=Math.sin(tick*1.2)*0.3;
    ctx.fillStyle=p.dark; ctx.beginPath();
    ctx.moveTo(-30,-10+bob);ctx.bezierCurveTo(-50,20,-45,50,-20,60+bob);
    ctx.lineTo(20,60+bob);ctx.bezierCurveTo(45,50,50,20,30,-10+bob);ctx.closePath();ctx.fill();
    glow(p.glow,15); ctx.fillStyle=p.body; ctx.beginPath();ctx.roundRect(-28,-15+bob,56,50,6);ctx.fill(); noGlow();
    ctx.strokeStyle=p.accent;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-15+bob);ctx.lineTo(0,35+bob);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-28,10+bob);ctx.lineTo(28,10+bob);ctx.stroke();
    ellipse(-32,-12+bob,14,12,p.body); ellipse(32,-12+bob,14,12,p.body);
    glow(p.glow,12); ctx.fillStyle=p.body;ctx.beginPath();ctx.roundRect(-24,-70+bob,48,58,[20,20,4,4]);ctx.fill(); noGlow();
    ctx.fillStyle="#000";ctx.beginPath();ctx.roundRect(-18,-52+bob,36,16,4);ctx.fill();
    glow(p.eye,10); ctx.fillStyle=p.eye;
    ctx.beginPath();ctx.roundRect(-15,-50+bob,12,10,3);ctx.fill();
    ctx.beginPath();ctx.roundRect(3,-50+bob,12,10,3);ctx.fill(); noGlow();
    ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(-4,-82+bob,8,18,3);ctx.fill();
    ctx.save();ctx.translate(42,10+bob);ctx.rotate(sw);
    ctx.fillStyle="#c0c0c0";ctx.beginPath();ctx.roundRect(-4,-50,8,70,2);ctx.fill();
    ctx.fillStyle=p.accent;ctx.beginPath();ctx.roundRect(-14,-5,28,8,2);ctx.fill();
    glow(p.accent,8);ctx.fillStyle="#fff";ctx.beginPath();ctx.roundRect(-2,-50,4,25,1);ctx.fill();noGlow();
    ctx.restore();
  }

  // ── EYE BOSS ─────────────────────────────────────────────
  function drawEyeBoss(rng, p) {
    const pulse=Math.sin(tick*1.5)*0.06;
    for(let i=0;i<8;i++){
      const angle=(i/8)*Math.PI*2, wave=Math.sin(tick*1.2+i*0.9)*0.3, len=35+Math.sin(i*1.3)*10;
      ctx.save(); ctx.translate(0,5); ctx.rotate(angle+wave);
      ctx.fillStyle=p.dark; ctx.beginPath();ctx.roundRect(-4,22,8,len,4);ctx.fill(); ctx.restore();
    }
    glow(p.glow,25); ellipse(0,0,38+pulse*38,38+pulse*38,p.body); noGlow();
    const ig=ctx.createRadialGradient(0,0,4,0,0,28);
    ig.addColorStop(0,p.eye);ig.addColorStop(0.4,p.accent);ig.addColorStop(1,p.body);
    ctx.fillStyle=ig;ctx.beginPath();ctx.ellipse(0,0,28,28,0,0,Math.PI*2);ctx.fill();
    ellipse(Math.sin(tick*0.7)*6,Math.cos(tick*0.5)*5,12,12,"#000");
    ellipse(-9,-10,6,4,"rgba(255,255,255,0.35)");
    ctx.strokeStyle=p.accent;ctx.lineWidth=1;ctx.globalAlpha=0.4;
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);
      ctx.bezierCurveTo(Math.cos(a+0.3)*22,Math.sin(a+0.3)*22,Math.cos(a-0.2)*32,Math.sin(a-0.2)*32,Math.cos(a)*36,Math.sin(a)*36);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  // ── HYDRA ────────────────────────────────────────────────
  function drawHydra(rng, p) {
    const bob=Math.sin(tick*0.5)*2;
    // Körper
    glow(p.glow,20); ellipse(0,30+bob,42,38,p.body); noGlow();
    ellipse(-10,28+bob,14,10,p.dark); ellipse(10,28+bob,14,10,p.dark);

    // 3 Hälse mit eigenem Timing
    const necks=[
      {ox:-28, oy:-5, cx:-45, cy:-35, hx:-38, hy:-62, phase:0},
      {ox:0,   oy:-8, cx:0,   cy:-45, hx:0,   hy:-70, phase:1.2},
      {ox:28,  oy:-5, cx:45,  cy:-35, hx:38,  hy:-62, phase:2.4},
    ];
    necks.forEach(n=>{
      const sway=Math.sin(tick*1.1+n.phase)*12;
      const headBob=Math.sin(tick*1.3+n.phase)*5;
      // Hals
      ctx.beginPath();
      ctx.moveTo(n.ox,n.oy+bob);
      ctx.quadraticCurveTo(n.cx+sway,n.cy+bob,n.hx+sway,n.hy+headBob+bob);
      ctx.strokeStyle=p.body;ctx.lineWidth=14;ctx.lineCap="round";ctx.stroke();
      ctx.strokeStyle=p.dark;ctx.lineWidth=10;ctx.stroke();
      // Kopf
      glow(p.glow,12);
      ellipse(n.hx+sway,n.hy+headBob+bob,18,14,p.body); noGlow();
      // Augen
      eyeball(p,n.hx+sway-6,n.hy+headBob+bob-4,5);
      eyeball(p,n.hx+sway+6,n.hy+headBob+bob-4,5);
      // Zähne
      ctx.fillStyle="#ddd";
      for(let t=-1;t<=1;t++){
        ctx.beginPath();ctx.moveTo(n.hx+sway+t*6,n.hy+headBob+bob+4);
        ctx.lineTo(n.hx+sway+t*6-2,n.hy+headBob+bob+10);
        ctx.lineTo(n.hx+sway+t*6+2,n.hy+headBob+bob+10);
        ctx.closePath();ctx.fill();
      }
      // Feuer-Atem (mittlerer Kopf)
      if(n.phase===1.2){
        const fa=0.3+Math.sin(tick*3)*0.3;
        const fg=ctx.createRadialGradient(n.hx+sway,n.hy+headBob+bob+12,2,n.hx+sway,n.hy+headBob+bob+30,20);
        fg.addColorStop(0,`rgba(255,220,0,${fa})`);fg.addColorStop(1,"transparent");
        ctx.fillStyle=fg;ctx.beginPath();ctx.ellipse(n.hx+sway,n.hy+headBob+bob+22,8,18,0,0,Math.PI*2);ctx.fill();
      }
    });
  }

  // ── LICH ─────────────────────────────────────────────────
  function drawLich(rng, p) {
    const bob=Math.sin(tick*0.5)*4;
    // Umhang — flattern
    ctx.fillStyle=p.dark;ctx.globalAlpha=0.85;
    ctx.beginPath();
    ctx.moveTo(-35,-30+bob);
    ctx.bezierCurveTo(-55,10+Math.sin(tick*1.2)*8,-50,50,-25,70+bob);
    ctx.lineTo(25,70+bob);
    ctx.bezierCurveTo(50,50,55,10+Math.sin(tick*1.0)*8,35,-30+bob);
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    // Körper (Knochen-Rüstung)
    glow(p.glow,15);ctx.fillStyle=p.body;ctx.beginPath();ctx.roundRect(-22,-35+bob,44,60,6);ctx.fill();noGlow();
    // Rippenmuster
    ctx.strokeStyle=p.dark;ctx.lineWidth=2;
    for(let r=0;r<4;r++){
      ctx.beginPath();ctx.moveTo(-18,-20+r*12+bob);ctx.lineTo(18,-20+r*12+bob);ctx.stroke();
    }
    // Schulterknochen
    ellipse(-30,-28+bob,16,10,p.body); ellipse(30,-28+bob,16,10,p.body);
    // Arme — Skelett
    const staffSway=Math.sin(tick*0.8)*0.15;
    ctx.strokeStyle=p.body;ctx.lineWidth=6;ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-30,-20+bob);ctx.lineTo(-45,10+bob);ctx.lineTo(-38,35+bob);ctx.stroke();
    ctx.strokeStyle=p.dark;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-30,-20+bob);ctx.lineTo(-45,10+bob);ctx.lineTo(-38,35+bob);ctx.stroke();
    // Stab
    ctx.save();ctx.translate(38,5+bob);ctx.rotate(staffSway);
    ctx.strokeStyle="#8060a0";ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(0,40);ctx.stroke();
    // Kristall-Kopf
    glow(p.eye,18);ctx.fillStyle=p.eye;
    ctx.beginPath();ctx.moveTo(0,-50);ctx.lineTo(8,-35);ctx.lineTo(0,-30);ctx.lineTo(-8,-35);ctx.closePath();ctx.fill();
    noGlow();ctx.restore();
    // Schädelkopf
    glow(p.glow,18);ellipse(0,-60+bob,24,20,p.body);noGlow();
    ellipse(0,-55+bob,16,10,p.dark);
    // Augenhöhlen
    ellipse(-9,-63+bob,7,6,"#000");ellipse(9,-63+bob,7,6,"#000");
    glow(p.eye,15);ellipse(-9,-63+bob,5,4,p.eye);ellipse(9,-63+bob,5,4,p.eye);noGlow();
    // Magische Aura-Partikel
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+tick*0.5;
      const pr=30+Math.sin(tick*2+i)*8;
      glow(p.eye,8);
      ellipse(Math.cos(a)*pr,Math.sin(a)*pr-30+bob,3,3,p.eye);
      noGlow();
    }
  }

  // ── SCORPION ─────────────────────────────────────────────
  function drawScorpion(rng, p) {
    const bob=Math.sin(tick*0.8)*2;
    // Schwanz (geschwungen nach oben)
    const tailPoints=[[0,40],[20,20],[35,-5],[30,-35],[10,-55]];
    ctx.strokeStyle=p.body;ctx.lineWidth=14;ctx.lineCap="round";ctx.lineJoin="round";
    ctx.beginPath();ctx.moveTo(tailPoints[0][0],tailPoints[0][1]+bob);
    for(let i=1;i<tailPoints.length;i++){
      const sway=Math.sin(tick*1.2+i*0.5)*5;
      ctx.lineTo(tailPoints[i][0]+sway,tailPoints[i][1]+bob);
    }
    ctx.stroke();
    ctx.strokeStyle=p.dark;ctx.lineWidth=8;ctx.stroke();
    // Stachel
    const stingSway=Math.sin(tick*1.2+2)*5;
    glow(p.eye,12);ctx.fillStyle=p.accent;
    ctx.beginPath();ctx.moveTo(10+stingSway,-55+bob);ctx.lineTo(20+stingSway,-72+bob);ctx.lineTo(4+stingSway,-58+bob);ctx.closePath();ctx.fill();noGlow();
    // 6 Beine
    for(let i=0;i<3;i++){
      const lw=Math.sin(tick*3+i*1.3)*0.2, ly=-5+i*14+bob;
      ctx.strokeStyle=p.body;ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(-20,ly);ctx.lineTo(-45+Math.sin(lw)*5,ly+15);ctx.lineTo(-38,ly+30);ctx.stroke();
      ctx.strokeStyle=p.dark;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(-20,ly);ctx.lineTo(-45+Math.sin(lw)*5,ly+15);ctx.lineTo(-38,ly+30);ctx.stroke();
      ctx.beginPath();ctx.moveTo(20,ly);ctx.lineTo(45+Math.sin(lw)*5,ly+15);ctx.lineTo(38,ly+30);ctx.stroke();
      ctx.strokeStyle=p.body;ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(20,ly);ctx.lineTo(45+Math.sin(lw)*5,ly+15);ctx.lineTo(38,ly+30);ctx.stroke();
    }
    // Scheren
    const clawSnap=Math.sin(tick*2)*6;
    [-1,1].forEach(side=>{
      ctx.save();ctx.translate(side*32,20+bob);ctx.rotate(side*0.3);
      // Arm
      ctx.strokeStyle=p.body;ctx.lineWidth=10;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*20,-15);ctx.stroke();
      ctx.strokeStyle=p.dark;ctx.lineWidth=6;ctx.stroke();
      // Obere Schere
      glow(p.glow,8);ctx.fillStyle=p.body;
      ctx.beginPath();ctx.moveTo(side*20,-15);ctx.lineTo(side*38,-10-clawSnap*0.5);ctx.lineTo(side*30,-25);ctx.closePath();ctx.fill();noGlow();
      // Untere Schere
      ctx.fillStyle=p.dark;
      ctx.beginPath();ctx.moveTo(side*20,-15);ctx.lineTo(side*38,-18+clawSnap*0.5);ctx.lineTo(side*28,-8);ctx.closePath();ctx.fill();
      ctx.restore();
    });
    // Körper (Panzer-Segmente)
    glow(p.glow,18);ellipse(0,15+bob,30,22,p.body);noGlow();
    for(let s=0;s<3;s++){
      ctx.strokeStyle=p.dark;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,8+s*7+bob,28-s*3,4,0,0,Math.PI);ctx.stroke();
    }
    // Kopf
    glow(p.glow,12);ellipse(0,-8+bob,22,18,p.body);noGlow();
    // Augen
    eyeball(p,-8,-10+bob,5);eyeball(p,8,-10+bob,5);
    // Zangen-Mund
    ctx.fillStyle=p.dark;
    ctx.beginPath();ctx.moveTo(-8,-2+bob);ctx.lineTo(-14,4+bob);ctx.lineTo(-4,0+bob);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(8,-2+bob); ctx.lineTo(14,4+bob); ctx.lineTo(4,0+bob);  ctx.closePath();ctx.fill();
  }

  // ── VAMPIRE ──────────────────────────────────────────────
  function drawVampire(rng, p) {
    const bob=Math.sin(tick*0.6)*3;
    // Fledermaus-Flügel (ausgebreitet)
    const wf=Math.sin(tick*1.8)*0.2;
    [-1,1].forEach(side=>{
      ctx.save();ctx.translate(side*20,-15+bob);ctx.rotate(side*(0.3+wf));
      ctx.fillStyle=p.dark;ctx.globalAlpha=0.9;
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.bezierCurveTo(side*25,-25,side*55,-20,side*65,0);
      ctx.bezierCurveTo(side*55,10,side*45,5,side*35,15);
      ctx.bezierCurveTo(side*30,8,side*20,12,side*15,20);
      ctx.bezierCurveTo(side*10,12,side*5,8,0,15);
      ctx.closePath();ctx.fill();
      // Flügel-Rippen
      ctx.strokeStyle=p.body;ctx.lineWidth=1.5;ctx.globalAlpha=0.5;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*55,-10);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*40,15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(side*20,20);ctx.stroke();
      ctx.globalAlpha=1;ctx.restore();
    });
    // Umhang
    ctx.fillStyle=p.dark;ctx.globalAlpha=0.8;
    ctx.beginPath();ctx.moveTo(-20,-25+bob);
    ctx.bezierCurveTo(-35,10,-30,50,-10,65+bob);ctx.lineTo(10,65+bob);
    ctx.bezierCurveTo(30,50,35,10,20,-25+bob);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    // Körper (eleganter Frack)
    glow(p.glow,15);ctx.fillStyle=p.body;ctx.beginPath();ctx.roundRect(-18,-30+bob,36,55,5);ctx.fill();noGlow();
    // Kragen
    ctx.fillStyle=p.dark;
    ctx.beginPath();ctx.moveTo(-18,-25+bob);ctx.lineTo(0,-10+bob);ctx.lineTo(18,-25+bob);ctx.lineTo(12,-35+bob);ctx.lineTo(0,-22+bob);ctx.lineTo(-12,-35+bob);ctx.closePath();ctx.fill();
    // Kopf
    glow(p.glow,14);ellipse(0,-55+bob,20,24,p.body);noGlow();
    // Haare (nach hinten)
    ctx.fillStyle=p.dark;
    ctx.beginPath();ctx.moveTo(-20,-55+bob);ctx.bezierCurveTo(-25,-80+bob,-10,-82+bob,0,-70+bob);ctx.bezierCurveTo(10,-82+bob,25,-80+bob,20,-55+bob);ctx.closePath();ctx.fill();
    // Augen - leuchtend rot
    glow(p.eye,12);ellipse(-7,-55+bob,5,4,p.eye);ellipse(7,-55+bob,5,4,p.eye);noGlow();
    // Mund mit Fangzähnen
    ctx.fillStyle="#ddd";
    ctx.beginPath();ctx.roundRect(-10,-44+bob,8,5,2);ctx.fill();
    ctx.beginPath();ctx.roundRect(2,-44+bob,8,5,2);ctx.fill();
    ctx.fillStyle="#cc0000";
    ctx.beginPath();ctx.roundRect(-3,-42+bob,6,4,1);ctx.fill();
    // Blutstropfen
    const bd=(tick*0.3)%1;
    glow("rgba(200,0,0,0.8)",8);ctx.fillStyle=`rgba(200,0,0,${0.9-bd})`;
    ctx.beginPath();ctx.arc(-2,-40+bd*25+bob,2.5*(1-bd*0.6),0,Math.PI*2);ctx.fill();noGlow();
  }

  // ── GOLIATH ──────────────────────────────────────────────
  function drawGoliath(rng, p) {
    const bob=Math.sin(tick*0.4)*2;
    const breathe=Math.sin(tick*0.7)*3;
    // Riesige Arme
    [-1,1].forEach(side=>{
      const armSway=Math.sin(tick*0.6+side)*0.12;
      ctx.save();ctx.translate(side*42,-5+bob);ctx.rotate(side*armSway);
      glow(p.glow,10);ctx.fillStyle=p.body;ctx.beginPath();ctx.roundRect(-14,-5,28,55,8);ctx.fill();noGlow();
      // Faust
      ctx.fillStyle=p.dark;ctx.beginPath();ctx.roundRect(-16,45,32,28,10);ctx.fill();
      glow(p.accent,5);ctx.strokeStyle=p.accent;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-10,50);ctx.lineTo(10,50);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-10,58);ctx.lineTo(10,58);ctx.stroke();noGlow();
      ctx.restore();
    });
    // Massiver Körper
    glow(p.glow,22);ctx.fillStyle=p.body;
    ctx.beginPath();ctx.roundRect(-36,-35+bob,72,78+breathe,12);ctx.fill();noGlow();
    // Panzer-Platten auf Brust
    ctx.fillStyle=p.dark;
    ctx.beginPath();ctx.roundRect(-28,-28+bob,22,30,5);ctx.fill();
    ctx.beginPath();ctx.roundRect(6,-28+bob,22,30,5);ctx.fill();
    ctx.strokeStyle=p.accent;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(0,-35+bob);ctx.lineTo(0,40+bob);ctx.stroke();
    // Nieten
    [-22,22].forEach(x=>{
      for(let y=-20;y<=30;y+=16){
        ellipse(x,y+bob,3,3,p.accent);
      }
    });
    // Massiver Kopf
    glow(p.glow,15);ctx.fillStyle=p.body;ctx.beginPath();ctx.roundRect(-28,-90+bob,56,58,[10,10,5,5]);ctx.fill();noGlow();
    // Stirnpanzer
    ctx.fillStyle=p.dark;ctx.beginPath();ctx.roundRect(-26,-90+bob,52,20,8);ctx.fill();
    // Augen — tief eingesunken
    ellipse(-12,-70+bob,10,9,"#111");ellipse(12,-70+bob,10,9,"#111");
    glow(p.eye,14);ellipse(-12,-70+bob,7,6,p.eye);ellipse(12,-70+bob,7,6,p.eye);noGlow();
    // Mund — breites Grinsen
    ctx.strokeStyle=p.accent;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-16,-52+bob);ctx.quadraticCurveTo(0,-44+bob,16,-52+bob);ctx.stroke();
    // Zähne
    for(let t=-2;t<=2;t++){
      ctx.fillStyle="#ddd";
      ctx.beginPath();ctx.roundRect(t*6-2,-54+bob,5,6,1);ctx.fill();
    }
  }

  // ── DEATH ANIMATION ──────────────────────────────────────
  function playDeath() {
    if (!ctx) return;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

    const startTime = Date.now();
    const DURATION  = 1500;

    // Partikel beim Tod
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const angle  = (i / 20) * Math.PI * 2;
      const speed  = 1.5 + Math.random() * 3;
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 40,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 5,
        alpha: 1,
        color: Math.random() < 0.5 ? "#ffcc00" : "#ff4400",
      });
    }

    function deathLoop() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / DURATION, 1); // 0→1

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Boss verblasst, schrumpft und kippt
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 10);
      ctx.rotate(t * 0.6);                           // kippt zur Seite
      ctx.scale((1 - t * 0.7), (1 - t * 0.7));      // schrumpft
      ctx.globalAlpha = Math.max(0, 1 - t * 1.5);

      // Letztes Frame des Bosses nochmal zeichnen
      switch (currentType) {
        case "demon":    drawDemon(currentRng, currentPalette);    break;
        case "spider":   drawSpider(currentRng, currentPalette);   break;
        case "dragon":   drawDragon(currentRng, currentPalette);   break;
        case "skull":    drawSkull(currentRng, currentPalette);    break;
        case "slime":    drawSlime(currentRng, currentPalette);    break;
        case "knight":   drawKnight(currentRng, currentPalette);   break;
        case "eye":      drawEyeBoss(currentRng, currentPalette);  break;
        case "hydra":    drawHydra(currentRng, currentPalette);    break;
        case "lich":     drawLich(currentRng, currentPalette);     break;
        case "scorpion": drawScorpion(currentRng, currentPalette); break;
        case "vampire":  drawVampire(currentRng, currentPalette);  break;
        case "goliath":  drawGoliath(currentRng, currentPalette);  break;
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // Partikel
      particles.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.15; // Schwerkraft
        p.alpha = Math.max(0, 1 - t * 1.8);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Explosion-Blitz am Anfang
      if (t < 0.15) {
        ctx.fillStyle = `rgba(255,200,50,${(0.15 - t) * 5})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (t < 1) {
        animFrame = requestAnimationFrame(deathLoop);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    deathLoop();
  }

  // ── PUBLIC API ───────────────────────────────────────────
  return { draw: drawBoss, playDeath };

})();
