document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

$('#year').textContent = new Date().getFullYear();

/* ---------- Nav: scrolled state, progress bar, active link ---------- */
const nav = $('#nav');
const progress = $('#progress');
const timeline = $('#timeline');
const tlItems = $$('#timeline li');

function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 10);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  // timeline line fills as you scroll
  if (timeline) {
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    timeline.style.setProperty('--p', p.toFixed(3));
    tlItems.forEach((li) => {
      li.classList.toggle('lit', li.getBoundingClientRect().top < innerHeight * 0.6);
    });
  }
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

const links = $$('.nav ul a');
const sections = links.map((a) => $(a.getAttribute('href')));
const navIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => s && navIO.observe(s));

/* ---------- Scroll reveal with stagger ---------- */
const reveals = $$('.reveal');
const revealIO = new IntersectionObserver((entries) => {
  const visible = entries.filter((e) => e.isIntersecting);
  visible.forEach((e, i) => {
    e.target.style.setProperty('--stagger', `${i * 0.08}s`);
    e.target.classList.add('in');
    revealIO.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -8% 0px' });
reveals.forEach((el) => revealIO.observe(el));

/* ---------- Count-up numbers ---------- */
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    countIO.unobserve(el);
    const to = +el.dataset.count;
    if (reduceMotion) { el.textContent = to; return; }
    const dur = 1600 + Math.min(to, 4000) * 0.15;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIO.observe(el));

/* ---------- Typing rotator ---------- */
(function rotator() {
  const el = $('#rot');
  if (!el || reduceMotion) return;
  const words = [
    'things that look like science fiction.',
    'wireless EV charging.',
    'software people use.',
    'robots that learn from each other.',
  ];
  let w = 0, i = words[0].length, deleting = true;
  const step = () => {
    const word = words[w];
    if (deleting) {
      i--;
      if (i <= 0) { deleting = false; w = (w + 1) % words.length; }
    } else {
      i++;
      if (i >= words[w].length) { deleting = true; el.textContent = words[w]; return setTimeout(step, 2200); }
    }
    el.textContent = words[deleting ? w : w].slice(0, i);
    setTimeout(step, deleting ? 28 : 55);
  };
  setTimeout(step, 3200);
})();

/* ---------- Pointer effects: glow, spotlight, tilt, magnetic ---------- */
if (finePointer && !reduceMotion) {
  const glow = $('.cursor-glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    document.body.classList.add('has-cursor');
  }, { passive: true });
  document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
  (function follow() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(follow);
  })();

  $$('.spot').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (card.classList.contains('tilt')) {
        const rx = ((y / r.height) - 0.5) * -4;
        const ry = ((x / r.width) - 0.5) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
      btn.style.transform = '';
      setTimeout(() => (btn.style.transition = ''), 500);
    });
  });
}

/* ---------- Hero: flowing energy field ---------- */
(function field() {
  const canvas = $('#field');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, running = true, t0 = performance.now();
  const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };
  const LINES = 30;
  const sparks = Array.from({ length: 7 }, () => ({ line: Math.random() * LINES | 0, x: Math.random(), v: 0.0012 + Math.random() * 0.0018 }));

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);
  canvas.parentElement.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  function yAt(i, x, t) {
    const base = h * 0.42 + (i - LINES / 2) * (h * 0.018);
    const spread = (i - LINES / 2) / LINES;
    let y = base
      + Math.sin(x * 0.0032 + t * 0.00035 + i * 0.12) * (h * 0.11)
      + Math.sin(x * 0.0081 - t * 0.0005 + i * 0.35) * (h * 0.03) * (1 + spread)
      + Math.sin(x * 0.0015 + t * 0.0002) * h * 0.06;
    if (mouse.sx > -1000) {
      const dx = x - mouse.sx;
      const f = Math.exp(-(dx * dx) / (2 * 140 * 140));
      y += (mouse.sy - y) * 0.22 * f * (1 - Math.abs(spread));
    }
    return y;
  }

  function draw(now) {
    if (!running) return;
    const t = reduceMotion ? 0 : now - t0;
    mouse.sx = mouse.x < -1000 ? -9999 : (mouse.sx < -1000 ? mouse.x : mouse.sx + (mouse.x - mouse.sx) * 0.08);
    mouse.sy = mouse.y < -1000 ? -9999 : (mouse.sy < -1000 ? mouse.y : mouse.sy + (mouse.y - mouse.sy) * 0.08);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i < LINES; i++) {
      const c = 1 - Math.abs(i - LINES / 2) / (LINES / 2);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(234,165,76,0)');
      grad.addColorStop(0.35, `rgba(234,165,76,${0.05 + c * 0.28})`);
      grad.addColorStop(0.7, `rgba(246,210,154,${0.04 + c * 0.22})`);
      grad.addColorStop(1, 'rgba(234,165,76,0)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 14) {
        const y = yAt(i, x, t);
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // travelling sparks of energy
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    sparks.forEach((s) => {
      if (!reduceMotion) s.x += s.v;
      if (s.x > 1.05) { s.x = -0.05; s.line = Math.random() * LINES | 0; }
      const x = s.x * w, y = yAt(s.line, x, t);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
      g.addColorStop(0, 'rgba(255,236,200,.95)');
      g.addColorStop(0.2, 'rgba(234,165,76,.5)');
      g.addColorStop(1, 'rgba(234,165,76,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  new IntersectionObserver(([e]) => {
    const was = running;
    running = e.isIntersecting;
    if (running && !was && !reduceMotion) requestAnimationFrame(draw);
  }).observe(canvas);
  requestAnimationFrame(draw);
})();

/* ---------- Maglion demo: car charging from guardrail coils ---------- */
(function demo() {
  const root = $('#demo');
  if (!root) return;
  const car = $('#car', root), strip = $('#strip', root), beams = $('#beams', root);
  const beamLines = $$('.beam', root), coils = $$('.coil', root);
  const batt = $('#batt', root), bar = $('#battbar', root), chip = $('#chg', root);
  const coilX = [270, 560, 850];
  const PERIOD = 8000, START = -170, END = 1020, CAR_MID = 74;
  let level = 38, last = performance.now(), loopStart = last, running = false;

  function render(now) {
    const dt = Math.min(64, now - last); last = now;
    let p = (now - loopStart) / PERIOD;
    if (p >= 1) { loopStart = now; p = 0; level = 38; }
    const x = START + (END - START) * p;
    const mid = x + CAR_MID;
    car.setAttribute('transform', `translate(${x.toFixed(1)} 152)`);

    let active = -1;
    coils.forEach((c, i) => {
      const on = Math.abs(mid - coilX[i]) < 70;
      c.classList.toggle('on', on);
      if (on) active = i;
    });
    const charging = active >= 0;
    level += (charging ? 0.018 : -0.0013) * dt;
    level = Math.max(20, Math.min(100, level));

    if (charging) {
      const cx = coilX[active];
      beamLines.forEach((l, k) => {
        const off = (k - 1) * 22;
        l.setAttribute('x1', cx + off);
        l.setAttribute('x2', mid + off * 1.4);
      });
    }
    beams.setAttribute('opacity', charging ? 1 : 0);
    strip.setAttribute('opacity', charging ? 1 : 0.35);
    chip.textContent = charging ? 'Charging' : 'Driving';
    chip.classList.toggle('on', charging);
    batt.textContent = Math.round(level) + '%';
    bar.style.width = level + '%';

    if (running) requestAnimationFrame(render);
  }

  if (reduceMotion) {
    // static frame: car over the middle coil, charging
    running = false;
    loopStart = performance.now() - PERIOD * ((560 - CAR_MID - START) / (END - START));
    level = 64;
    render(performance.now());
    return;
  }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(render); }
    else if (!e.isIntersecting) running = false;
  }, { threshold: 0.15 }).observe(root);
})();
