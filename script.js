/* ====== Michi Club · lógica (drag & drop, sin medidor) ====== */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const cat = $('#cat'), bubble = $('#bubble'), fx = $('#fx'), stage = $('#stage');
  const muteBtn = $('#muteBtn'), giftCountEl = $('#giftCount');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MODES = ['is-dancing','is-playing','is-eating','is-ball','is-fancy'];

  /* === Textos EXACTOS del usuario === */
  const GIFTS = {
    cafe:     { mode:'is-dancing', duration:6000, burst:['☕','🎶','💃','✨','🤎'],
                lines:['ñam ñam cafecito','osi bro el cafe es el mejor','ehhh es demasiado cafe blo'] },
    guitarra: { mode:'is-playing', duration:7000, burst:['🎸','🎵','🤘','✨'],
                lines:['pongan el opening de one piece','pongan juan gabriel','COMO FUE Q ME DEJASTE DE AMAAR, YO AUN PODIA SOPORTAR, TU TANTA FALTA DE QUERER'] },
    pescado:  { mode:'is-eating',  duration:3500, burst:['🐟','❤️','😋'],
                lines:['miau','pescadito traido de bolivia ñam ñam','osi salmon xdddd'] },
    pelota:   { mode:'is-ball',    duration:5000, burst:['🎾','💨','⭐'],
                lines:['oh una pelota omg','omg mas pelotas','Yo la atrapo'] },
    sombrero: { mode:'is-fancy',   duration:4000, burst:['🎩','✨','🎀'],
                lines:['un tesito porfavor','michigante','ahora soy elegante osi.'] }
  };
  const IDLE_LINES = ['Más regalos? 👀','*ronronea sensualon','ya me aburri dame cafe ☕','Toca los botones de abajo xd'];

  /* ---------- Estado ---------- */
  let giftCount = 0, muted = false;
  const timers = [];
  let beatTimer = null, strumTimer = null;

  const addTimer = (id) => timers.push(id);
  const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()); };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- Audio (WebAudio, sin archivos) ---------- */
  let ctx = null;
  const ensureCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  function tone(freq, dur = 0.15, type = 'sine', vol = 0.1, delay = 0) {
    if (muted) return;
    try {
      const c = ensureCtx(), t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (_) { /* audio no disponible: el juego sigue */ }
  }

  function kick() {
    if (muted) return;
    try {
      const c = ensureCtx(), t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + 0.2);
    } catch (_) {}
  }

  const startDanceBeat = () => {
    let step = 0;
    beatTimer = setInterval(() => {
      if (step % 2 === 0) kick(); else tone(2200, 0.04, 'square', 0.03);
      if (step % 8 === 4) tone(660, 0.1, 'triangle', 0.06);
      step++;
    }, 240);
  };

  const EM = [82.41, 123.47, 164.81, 196, 246.94, 329.63];
  const strum = () => EM.forEach((f, i) => tone(f, 0.5, 'triangle', 0.06, i * 0.045));
  const startStrum = () => { strum(); strumTimer = setInterval(strum, 950); };

  const stopLoops = () => {
    [beatTimer, strumTimer].forEach(clearInterval);
    beatTimer = strumTimer = null;
  };

  /* ---------- UI ---------- */
  function say(text) {
    bubble.textContent = text;
    bubble.classList.add('show');
    addTimer(setTimeout(() => bubble.classList.remove('show'), 3200));
  }

  function spawnBurst(emojis, count = 12) {
    const n = reducedMotion ? Math.min(4, count) : count;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'fx__p';
      p.textContent = pick(emojis);
      p.style.left = `${28 + Math.random() * 44}%`;
      p.style.top  = `${25 + Math.random() * 35}%`;
      p.style.fontSize = `${18 + Math.random() * 14}px`;
      p.style.setProperty('--dx', `${Math.round(-90 + Math.random() * 180)}px`);
      p.style.setProperty('--rot', `${Math.round(-60 + Math.random() * 120)}deg`);
      fx.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function backToIdle() {
    MODES.forEach((m) => cat.classList.remove(m));
    stopLoops();
  }

  function giveGift(key) {
    const g = GIFTS[key];
    if (!g) return;
    clearTimers(); backToIdle();
    void cat.offsetWidth;
    cat.classList.add(g.mode);
    say(pick(g.lines));
    spawnBurst(g.burst, 14);
    giftCount++;
    giftCountEl.textContent = String(giftCount);

    if (key === 'cafe') startDanceBeat();
    else if (key === 'guitarra') startStrum();
    else if (key === 'pescado') { tone(320, 0.08, 'square', 0.09); tone(210, 0.08, 'square', 0.09, 0.12); }
    else if (key === 'pelota')  { tone(240, 0.18, 'sine', 0.1); tone(480, 0.14, 'sine', 0.08, 0.15); }
    else if (key === 'sombrero'){ [660, 880].forEach((f, i) => tone(f, 0.15, 'triangle', 0.08, i * 0.1)); }

    addTimer(setTimeout(backToIdle, g.duration));
  }

  /* =========================================================
     === DRAG & DROP con Pointer Events (mouse + táctil) ===
     ========================================================= */
  const gifts = document.querySelectorAll('.gift');
  const DRAG_THRESHOLD = 5; // px mínimos para considerar "arrastre"
  let drag = {
    active: false,
    btn: null,
    ghost: null,
    key: null,
    startX: 0, startY: 0,
    offsetX: 0, offsetY: 0,
    moved: false
  };

  const isOverCat = (x, y) => {
    const r = cat.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  function startDrag(e) {
    const btn = e.currentTarget;
    if (!btn.dataset.gift) return;

    const rect = btn.getBoundingClientRect();
    drag.active = true;
    drag.btn = btn;
    drag.key = btn.dataset.gift;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.offsetX = e.clientX - rect.left;
    drag.offsetY = e.clientY - rect.top;
    drag.moved = false;

    // Creamos el "fantasma" que sigue al dedo/cursor
    const ghost = btn.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = (rect.left) + 'px';
    ghost.style.top = (rect.top) + 'px';
    document.body.appendChild(ghost);
    drag.ghost = ghost;

    // Capturamos el pointer para seguir los eventos aunque salga del botón
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag.active || !drag.ghost) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      drag.btn.classList.add('is-dragging');
    }
    if (drag.moved) {
      drag.ghost.style.left = (e.clientX - drag.offsetX) + 'px';
      drag.ghost.style.top  = (e.clientY - drag.offsetY) + 'px';
      // Highlight del gato si el puntero está encima
      cat.classList.toggle('drop-target', isOverCat(e.clientX, e.clientY));
    }
  }

  function onUp(e) {
    if (!drag.active) return;
    const btn = drag.btn;
    const ghost = drag.ghost;

    btn.removeEventListener('pointermove', onMove);
    btn.removeEventListener('pointerup', onUp);
    btn.removeEventListener('pointercancel', onUp);
    try { btn.releasePointerCapture(e.pointerId); } catch (_) {}

    cat.classList.remove('drop-target');
    btn.classList.remove('is-dragging');
    if (ghost) ghost.remove();

    // Lógica de entrega
    if (drag.moved) {
      if (isOverCat(e.clientX, e.clientY)) {
        giveGift(drag.key);
      }
    } else {
      // Si NO se movió → fue un tap/click: también entregamos el regalo
      giveGift(drag.key);
    }

    drag = { active:false, btn:null, ghost:null, key:null,
             startX:0, startY:0, offsetX:0, offsetY:0, moved:false };
  }

  gifts.forEach(g => g.addEventListener('pointerdown', startDrag));

  /* ---------- Aceptar drops de HTML5 DnD como respaldo (por si algún browser) ---------- */
  cat.addEventListener('dragover', (e) => { e.preventDefault(); cat.classList.add('drop-target'); });
  cat.addEventListener('dragleave', () => cat.classList.remove('drop-target'));
  cat.addEventListener('drop', (e) => {
    e.preventDefault();
    cat.classList.remove('drop-target');
    const key = e.dataTransfer.getData('text/plain');
    if (GIFTS[key]) giveGift(key);
  });
  gifts.forEach(g => {
    g.draggable = true;
    g.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', g.dataset.gift);
      e.dataTransfer.effectAllowed = 'move';
    });
  });

  /* ---------- Click en el gato = cariño ---------- */
  cat.addEventListener('click', (e) => {
    // Evita disparar cariño justo después de un drop
    if (drag.moved) return;
    say(pick(['¡Miaaau! ❤️','¡Prrr, prrr!','¡Ese es mi humano favorito!']));
    spawnBurst(['❤️','💛','✨'], 6);
    tone(700, 0.12, 'sine', 0.08); tone(900, 0.14, 'sine', 0.07, 0.12);
  });
  cat.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cat.click(); }
  });

  /* ---------- Mute ---------- */
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(muted));
    if (muted) stopLoops();
  });

  /* ---------- Frases ocasionales cuando está tranquilo ---------- */
  setInterval(() => {
    if (!MODES.some((m) => cat.classList.contains(m)) && Math.random() < 0.4) {
      bubble.textContent = pick(IDLE_LINES);
      bubble.classList.add('show');
      setTimeout(() => bubble.classList.remove('show'), 2800);
    }
  }, 7000);
})();