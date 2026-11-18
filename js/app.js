/* Rossamenta · app v3 */
(() => {
  'use strict';

  const CONFIG = {
    whatsapp: '34643594123',
    instagram: 'rossamentapm'
  };
  const A = window.ASSET || 'assets';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const T = window.THREE, RM = window.RM;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isMobile = () => innerWidth <= 980;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  const wa = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  let webgl = false;
  try { const c = document.createElement('canvas'); webgl = !!(T && RM && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { webgl = false; }
  if (!webgl) document.documentElement.classList.add('no-webgl');

  /* ===== Lenis ===== */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollToEl = (target, offset = 0) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ===== util ===== */
  function split(el, keepLabel) {
    if (el._chars) return el._chars;
    const text = el.textContent.trim();
    if (!keepLabel) el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    text.split(' ').forEach((w, i, arr) => {
      const ws = document.createElement('span'); ws.className = 'w'; ws.setAttribute('aria-hidden', 'true');
      [...w].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; ws.appendChild(c); chars.push(c); });
      el.appendChild(ws);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el._chars = chars;
    return chars;
  }
  const toastEl = $('#toast');
  function toast(t) { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 4600); }
  function party(y = 0.7) {
    if (!window.confetti || reduce) return;
    const colors = ['#E482B5', '#72B6A9', '#D63D7E', '#FFFBF6', '#B6DDDA', '#E2BC5A'];
    confetti({ particleCount: 130, spread: 80, startVelocity: 45, origin: { x: 0.3, y }, colors, scalar: 1.1 });
    confetti({ particleCount: 130, spread: 80, startVelocity: 45, origin: { x: 0.7, y }, colors, scalar: 1.1 });
  }

  /* ===== ajustar textos gigantes al ancho (nunca se cortan) ===== */
  function fitHero() {
    const h = $('#heroTitle'), ws = $$('.ht-w', h), gap = $('.ht-gap', h);
    h.style.fontSize = '100px';
    const wL = ws[0].scrollWidth, wR = ws[1].scrollWidth, vw = innerWidth;
    if (isMobile()) h.style.fontSize = (100 * vw * 0.88 / Math.max(wL, wR)) + 'px';
    else h.style.fontSize = (100 * (vw * 0.95 - gap.offsetWidth) / (wL + wR)) + 'px';
  }
  function fitFoot() {
    const f = $('#footWord'); f.style.fontSize = '100px';
    const w = f.scrollWidth, avail = f.parentElement.clientWidth - parseFloat(getComputedStyle(f.parentElement).paddingLeft) * 2;
    f.style.fontSize = (100 * avail * 0.985 / w) + 'px';
  }

  /* ===== loader ===== */
  const ld = { v: 0, num: $('#ldNum'), ring: $('#ldProg'), msg: $('#ldMsg') };
  const MSGS = [[0, 'Batiendo la nata'], [30, 'Horneando el bizcocho'], [55, 'Montando las capas'], [80, 'Poniendo la guinda'], [100, '¡Lista!']];
  function prog(v) {
    gsap.to(ld, {
      v, duration: 0.6, ease: 'power2.out', overwrite: true, onUpdate: () => {
        ld.num.textContent = Math.round(ld.v);
        ld.ring.style.strokeDashoffset = 590.6 * (1 - ld.v / 100);
        const m = MSGS.filter(x => ld.v >= x[0]).pop()[1];
        if (ld.msg.textContent !== m) { ld.msg.textContent = m; if (!reduce) gsap.fromTo(ld.msg, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }); }
      }
    });
  }
  function loaderSprinkles() {
    const box = $('.ld-spr'), cols = ['#E482B5', '#72B6A9', '#B6DDDA', '#FFFBF6', '#E2BC5A'];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length];
      s.style.animationDuration = 4 + Math.random() * 5 + 's'; s.style.animationDelay = -Math.random() * 8 + 's';
      s.style.transform = `rotate(${Math.random() * 180}deg)`; box.appendChild(s);
    }
  }

  /* =====================================================
     ESCENA 3D PRINCIPAL (hero + capa a capa)
     ===================================================== */
  const stage = { active: true, idle: 1, mx: 0, my: 0, smx: 0, smy: 0 };
  const P = { x: 0, y: -0.45, s: 1, ry: 0, wo: 0, wl: 0, wr: 0, camY: 1.7, camZ: 1, lookY: 0.38 };
  const TAN = Math.tan(16 * Math.PI / 180);

  function baseDist(aspect) {
    const frac = aspect < 0.9 ? 0.84 : 0.37;
    return clamp(3.4 / (frac * 2 * TAN * aspect), 6, 16);
  }
  function initStage() {
    const canvas = $('#stage');
    const r = RM.renderer(canvas);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    RM.lights(scene, true, r);
    const rig = new T.Group(), tilt = new T.Group(), intro = new T.Group(), spin = new T.Group();
    scene.add(rig); rig.add(tilt); tilt.add(intro); intro.add(spin);
    const hero = RM.buildHeroCake();
    spin.add(hero.group);
    const pivot = new T.Group(), PZ = hero.R * 0.55;
    pivot.position.z = PZ; hero.wedge.position.z = -PZ;
    hero.group.remove(hero.wedge); pivot.add(hero.wedge); hero.group.add(pivot);
    const sh = new T.Mesh(new T.PlaneGeometry(12, 12), new T.ShadowMaterial({ opacity: 0.14 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = -0.318; sh.receiveShadow = true; intro.add(sh);

    // sprinkles flotando (paleta de marca)
    const N = isMobile() ? 90 : 170;
    const field = new T.InstancedMesh(new T.CapsuleGeometry(0.024, 0.1, 3, 8), RM.mat('#ffffff', { roughness: 0.35, clearcoat: 0.8, sheen: 0 }), N);
    const cols = ['#E482B5', '#72B6A9', '#FFFFFF', '#B6DDDA', '#E2BC5A', '#F4C6DD'];
    const d = new T.Object3D(), col = new T.Color();
    for (let i = 0; i < N; i++) {
      const rad = 3 + Math.random() * 6, th = Math.random() * Math.PI * 2;
      d.position.set(Math.cos(th) * rad * 1.4, (Math.random() - 0.45) * 7, Math.sin(th) * rad * 0.5 - 3.5);
      d.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); d.updateMatrix();
      field.setMatrixAt(i, d.matrix); field.setColorAt(i, col.set(cols[i % cols.length]));
    }
    scene.add(field);
    function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    resize(); addEventListener('resize', resize);
    Object.assign(stage, { r, scene, cam, rig, tilt, intro, spin, hero, pivot, PZ, field, canvas });
    intro.position.y = 7;
    heroAlign();
  }
  function heroAlign() {
    if (!stage.cam || scrollY > 10) return;
    const g = $('.ht-gap').getBoundingClientRect(), f = (g.top + g.height / 2) / innerHeight;
    const Hv = 2 * TAN * baseDist(stage.cam.aspect);
    P.y = (0.5 - f) * Hv + (P.lookY - 0.5) + 0.08;
  }
  const xOff = () => {
    if (isMobile() || !stage.cam) return 0;
    const dist = baseDist(stage.cam.aspect) * 0.78;
    return TAN * dist * stage.cam.aspect * 0.46;
  };
  function renderStage(dt, t) {
    if (!stage.r || !stage.active) return;
    const { cam, rig, tilt, spin, pivot, PZ, field, r, scene } = stage;
    stage.smx = lerp(stage.smx, stage.mx, 0.05); stage.smy = lerp(stage.smy, stage.my, 0.05);
    const dist = baseDist(cam.aspect) * P.camZ;
    cam.position.set(stage.smx * 0.3, P.camY * dist / 7 + stage.smy * 0.2, dist);
    cam.lookAt(0, P.lookY, 0);
    rig.position.set(P.x, P.y, 0); rig.scale.setScalar(P.s);
    tilt.rotation.set(stage.smy * 0.05, P.ry + stage.smx * 0.2, 0);
    if (!reduce) {
      if (stage.idle > 0.001) spin.rotation.y += dt * 0.26 * stage.idle;
      if (stage.idle < 1) { const target = Math.round(spin.rotation.y / (Math.PI * 2)) * Math.PI * 2; spin.rotation.y = lerp(spin.rotation.y, target, (1 - stage.idle) * 0.08); }
      field.rotation.y += dt * 0.03; field.position.y = Math.sin(t * 0.4) * 0.12;
    }
    pivot.position.set(0, P.wl, PZ + P.wo * 1.05);
    pivot.rotation.set(P.wo * 0.1, P.wr, -P.wo * 0.06);
    r.render(scene, cam);
  }

  function initStory() {
    const steps = $$('.step'), bars = $$('.story-progress i');
    steps.forEach(s => { const h = $('h2', s); h.classList.add('split'); s._chars = split(h); });
    let cur = -1;
    const starts = [1.8, 3.8, 5.8, 7.8];
    function show(i) {
      const prev = steps[cur], next = steps[i];
      if (prev) gsap.to(prev, { autoAlpha: 0, y: -40, duration: 0.4, ease: 'power2.in', overwrite: true });
      if (next) {
        gsap.fromTo(next, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', overwrite: true, delay: prev ? 0.2 : 0 });
        gsap.fromTo(next._chars, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.03, delay: prev ? 0.2 : 0 });
      }
      gsap.to(['.story-label', '.story-progress'], { autoAlpha: i >= 0 ? 1 : 0, duration: 0.4 });
      cur = i;
    }
    function update(p) {
      const u = p * 10;
      const i = u < 1.5 ? -1 : u < 3.8 ? 0 : u < 5.8 ? 1 : u < 7.8 ? 2 : 3;
      if (i !== cur) show(i);
      bars.forEach((b, k) => b.style.setProperty('--p', clamp((u - starts[k]) / 2, 0, 1)));
      stage.idle = 1 - clamp(p / 0.06, 0, 1);
    }
    if (webgl && stage.r) {
      const m = () => isMobile();
      gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom bottom', scrub: 1.2, invalidateOnRefresh: true, onUpdate: s => update(s.progress) }
      })
        .to(P, { x: () => xOff(), y: () => (m() ? 0.55 : -0.3), ry: -0.75, s: 1, wo: 1, wl: 0.26, wr: -0.3, camY: 1.5, camZ: () => (m() ? 0.9 : 0.8), lookY: 0.38, duration: 1.8 }, 0)
        .to(P, { ry: -1.05, camZ: () => (m() ? 0.82 : 0.72), lookY: 0.3, camY: 1.2, duration: 2 }, 1.8)
        .to(P, { ry: -0.3, wr: 0.6, camY: 1.75, camZ: () => (m() ? 0.86 : 0.76), duration: 2 }, 3.8)
        .to(P, { wo: 0, wl: 0, wr: 0, ry: 1.2, camY: 2.1, camZ: () => (m() ? 0.9 : 0.82), lookY: 0.48, duration: 2 }, 5.8)
        .to(P, { ry: 2.6, camY: 4.4, camZ: () => (m() ? 0.86 : 0.74), lookY: 0.65, duration: 2.2 }, 7.8);
      ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom top', onToggle: s => { stage.active = s.isActive; } });
      // el título del hero se separa al hacer scroll
      if (!reduce) gsap.to('.ht-w', { xPercent: i => (i ? 30 : -30), opacity: 0.0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    } else {
      ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom bottom', onUpdate: s => update(s.progress) });
    }
  }

  function heroIntro() {
    const chars = $$('#heroTitle .c');
    if (reduce) { gsap.set(chars, { opacity: 1 }); if (stage.intro) stage.intro.position.y = 0; return; }
    gsap.fromTo(chars, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: { each: 0.045, from: 'center' }, delay: 0.15 });
    gsap.from('.reveal-up', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.7 });
    gsap.from('.scroll-cue', { opacity: 0, duration: 1, delay: 1.5 });
    gsap.from('.nav', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.4 });
    if (stage.intro) {
      gsap.fromTo(stage.intro.position, { y: 7 }, { y: 0, duration: 1.8, ease: 'bounce.out', delay: 0.2 });
      gsap.fromTo(stage.intro.rotation, { y: -2.5 }, { y: 0, duration: 2.4, ease: 'expo.out', delay: 0.2 });
      stage.hero.toppings.forEach((o, i) => {
        const y = o.position.y, dl = 1.3 + i * 0.025;
        gsap.fromTo(o.position, { y: y + 2.4 }, { y, duration: 0.9, ease: 'bounce.out', delay: dl });
        gsap.fromTo(o.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: o.scale.x, y: o.scale.y, z: o.scale.z, duration: 0.5, ease: 'back.out(3)', delay: dl });
      });
      gsap.from(stage.field.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 2.2, ease: 'expo.out', delay: 0.6 });
    }
  }

  /* =====================================================
     CONFIGURADOR 3D
     ===================================================== */
  const DEF = { forma: 'round', tam: 'M', pisos: 2, bizcocho: 'vainilla', relleno: 'nata', cobertura: 'nata', drip: 'rosa', toppings: ['borde', 'fresas', 'corazones', 'oro'], msg: '' };
  const st = Object.assign({}, DEF, (() => { try { return JSON.parse(localStorage.getItem('rm-tarta-v3') || '{}'); } catch (e) { return {}; } })());
  const save = () => { try { localStorage.setItem('rm-tarta-v3', JSON.stringify(st)); } catch (e) {} };
  const cfg = { active: false, rotY: -0.5, rotX: 0, vel: 0, drag: false, idleT: 0 };
  const ICON = {
    round: '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="13" rx="15" ry="5" fill="currentColor" opacity=".55"/><path d="M5 13v13c0 3 7 5 15 5s15-2 15-5V13c0 3-7 5-15 5S5 16 5 13z" fill="currentColor"/></svg>',
    square: '<svg viewBox="0 0 40 40"><path d="M6 12l8-5h20l-8 5z" fill="currentColor" opacity=".55"/><path d="M6 12h20v20H6zM26 12l8-5v20l-8 5z" fill="currentColor"/></svg>',
    heart: '<svg viewBox="0 0 40 40"><path d="M20 34S5 25 5 14a7.5 7.5 0 0 1 15-3 7.5 7.5 0 0 1 15 3c0 11-15 20-15 20z" fill="currentColor"/></svg>'
  };
  function buildOpts() {
    $$('.opts[data-name]').forEach(box => {
      const k = box.dataset.name, multi = box.hasAttribute('data-multi');
      box.innerHTML = RM.OPC[k].map(o => {
        const checked = multi ? st[k].includes(o.v) : st[k] == o.v;
        const inner = k === 'forma' ? ICON[o.v] + o.t : (o.c ? `<i class="sw" style="background:${o.c}"></i>` : '') + o.t + (o.d ? ` <small style="opacity:.6;font-weight:500">${o.d}</small>` : '');
        return `<label class="opt"><input type="${multi ? 'checkbox' : 'radio'}" name="${k}" value="${o.v}" ${checked ? 'checked' : ''}><span>${inner}</span></label>`;
      }).join('');
    });
    $('#msg').value = st.msg || '';
    $('#msgCount').textContent = (st.msg || '').length + '/20';
  }
  function readOpts() {
    ['forma', 'tam', 'pisos', 'bizcocho', 'relleno', 'cobertura', 'drip'].forEach(k => {
      const el = $(`input[name="${k}"]:checked`); if (el) st[k] = k === 'pisos' ? +el.value : el.value;
    });
    st.toppings = $$('input[name="toppings"]:checked').map(i => i.value);
    st.msg = $('#msg').value.trim();
  }
  function updateMeta() {
    const [a, b] = RM.servings(st);
    const el = $('#servNum'); const o = { a: parseInt(el.textContent) || a, b: parseInt(el.textContent.split('–')[1]) || b };
    gsap.to(o, { a, b, duration: 0.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.a) + '–' + Math.round(o.b); } });
    const bc = RM.find('bizcocho', st.bizcocho).c, rc = RM.find('relleno', st.relleno).c, cc = RM.find('cobertura', st.cobertura).c;
    $('#cut').innerHTML = `<i style="background:${cc};flex:.5"></i><i style="background:${bc}"></i><i style="background:${rc};flex:.55"></i><i style="background:${bc}"></i><i style="background:${rc};flex:.55"></i><i style="background:${bc}"></i>`;
  }
  function fitCam(cam, obj, aspect, pad) {
    const box = new T.Box3().setFromObject(obj), size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
    const tn = Math.tan(T.MathUtils.degToRad(cam.fov / 2));
    const dv = size.y * pad / (2 * tn), dh = size.x * pad / (2 * tn * aspect);
    const dist = Math.max(dv, dh) + size.z * 0.5;
    return { y: c.y + dist * 0.36, z: dist, look: c.y - size.y * 0.06 };
  }
  function initCfg() {
    const canvas = $('#cfgCanvas');
    const r = RM.renderer(canvas, { preserveDrawingBuffer: true });
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 0.1, 100);
    RM.lights(scene, true, r);
    const holder = new T.Group(); scene.add(holder);
    const sh = new T.Mesh(new T.PlaneGeometry(14, 14), new T.ShadowMaterial({ opacity: 0.16 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0; sh.receiveShadow = true; scene.add(sh);
    Object.assign(cfg, { r, scene, cam, holder, canvas });
    const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); refit(true); };
    addEventListener('resize', resize);
    new IntersectionObserver(es => es.forEach(e => { cfg.active = e.isIntersecting; }), { rootMargin: '100px' }).observe(canvas);
    let lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', e => { cfg.drag = true; lx = e.clientX; ly = e.clientY; cfg.vel = 0; $('.cfg-hint').classList.add('off'); });
    addEventListener('pointermove', e => {
      if (!cfg.drag) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      cfg.vel = dx * 0.011; cfg.rotY += cfg.vel; cfg.rotX = clamp(cfg.rotX + dy * 0.004, -0.2, 0.45); cfg.idleT = 0;
    });
    const up = () => { cfg.drag = false; };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    buildOpts();
    $('#cfgForm').addEventListener('change', e => {
      if (e.target.id === 'msg' || !e.target.name) return;
      readOpts();
      build(['forma', 'tam', 'pisos'].includes(e.target.name) ? 'big' : 'soft');
    });
    let mt;
    $('#msg').addEventListener('input', e => { $('#msgCount').textContent = e.target.value.length + '/20'; clearTimeout(mt); mt = setTimeout(() => { readOpts(); build('soft'); }, 220); });
    resize(); build(false);
  }
  function refit(instant) {
    if (!cfg.cake) return;
    const g = cfg.cake.group, rx = g.rotation.y; g.rotation.y = 0;
    const f = fitCam(cfg.cam, g, cfg.cam.aspect, isMobile() ? 1.16 : 1.3);
    g.rotation.y = rx;
    if (instant || !cfg.camS) cfg.camS = Object.assign(cfg.camS || {}, f);
    else gsap.to(cfg.camS, Object.assign({ duration: 1, ease: 'power3.inOut' }, f));
  }
  function build(anim) {
    if (!cfg.r) { updateMeta(); save(); return; }
    const res = RM.buildCake(st);
    if (cfg.cake) { const old = cfg.cake.group; cfg.holder.remove(old); RM.dispose(old); }
    cfg.cake = res; cfg.holder.add(res.group);
    refit(!cfg.camS);
    if (anim === 'big' && !reduce) {
      gsap.from(res.group.scale, { x: 0.86, y: 0.86, z: 0.86, duration: 0.8, ease: 'back.out(2.4)' });
      res.parts.forEach((p, i) => gsap.from(p.position, { y: p.position.y + 1.4, duration: 0.8, ease: 'bounce.out', delay: i * 0.09 }));
    } else if (anim && !reduce) gsap.fromTo(res.group.scale, { x: 0.97, y: 0.97, z: 0.97 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(3)' });
    updateMeta(); save();
  }
  function renderCfg(dt, t) {
    if (!cfg.r || !cfg.active || !cfg.camS) return;
    if (!cfg.drag) { cfg.rotY += cfg.vel; cfg.vel *= 0.94; cfg.idleT += dt; if (cfg.idleT > 2.5 && !reduce) cfg.rotY += dt * 0.3; }
    cfg.holder.rotation.y = cfg.rotY;
    cfg.holder.rotation.x = lerp(cfg.holder.rotation.x, cfg.rotX * 0.4, 0.1);
    cfg.cake.flames.forEach((f, i) => { f.scale.set(1 + Math.sin(t * 18 + i) * 0.08, 1 + Math.sin(t * 23 + i * 2) * 0.15, 1); });
    cfg.cam.position.set(0, cfg.camS.y, cfg.camS.z); cfg.cam.lookAt(0, cfg.camS.look, 0);
    cfg.r.render(cfg.scene, cfg.cam);
  }
  function initTabs() {
    const tabs = $$('.tab'), panes = $$('.pane'), prev = $('#prevTab'), next = $('#nextTab');
    let cur = 0;
    function go(i) {
      cur = clamp(i, 0, panes.length - 1);
      tabs.forEach((t, k) => { t.classList.toggle('is-on', k === cur); t.setAttribute('aria-selected', k === cur); });
      panes.forEach((p, k) => p.classList.toggle('is-on', k === cur));
      prev.disabled = cur === 0;
      next.style.visibility = cur === panes.length - 1 ? 'hidden' : 'visible';
      $('span', next).textContent = cur === panes.length - 2 ? 'Último paso' : 'Siguiente';
      const tb = tabs[cur].parentElement; if (tb.scrollWidth > tb.clientWidth + 2) tb.scrollTo({ left: Math.max(0, tabs[cur].offsetLeft - tb.clientWidth / 2 + tabs[cur].clientWidth / 2), behavior: 'smooth' }); else tb.scrollLeft = 0;
    }
    tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
    prev.addEventListener('click', () => go(cur - 1));
    next.addEventListener('click', () => go(cur + 1));
    go(0); cfg.goTab = go;
  }

  function orderText() {
    const v = id => ($('#' + id).value || '').trim();
    const [a, b] = RM.servings(st);
    const F = k => RM.find(k, st[k]).t;
    const tops = st.toppings.map(t => RM.find('toppings', t).t).join(', ') || 'sin decoración extra';
    const fecha = v('fecha') ? new Date(v('fecha') + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'por concretar';
    return `¡Hola Rossamenta! He diseñado mi tarta en vuestra web 🎂

• Forma: ${F('forma')}, tamaño ${st.tam}, ${st.pisos} piso${st.pisos > 1 ? 's' : ''} (${a}-${b} raciones aprox.)
• Bizcocho: ${F('bizcocho')}
• Relleno: ${F('relleno')}
• Cobertura: ${F('cobertura')}${st.drip !== 'no' ? ' con goteo ' + F('drip').toLowerCase() : ''}
• Decoración: ${tops}
• Mensaje: ${st.msg ? '"' + st.msg + '"' : 'sin mensaje'}
• Ocasión: ${v('ocasion')}
• Para el: ${fecha}${v('notas') ? '\n• Notas: ' + v('notas') : ''}

Soy ${v('nombre') || '(nombre)'}. ¿Me decís precio y disponibilidad? ¡Gracias!`;
  }
  function downloadSnap() {
    if (!cfg.r) return;
    renderCfg(0, 0);
    const src = cfg.r.domElement, W = 1080, H = 1350;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const g = x.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.45, H * 0.8);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#E6F4F1'); g.addColorStop(1, '#B6DDDA');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const s = Math.min((W * 0.95) / src.width, (H * 0.66) / src.height), w = src.width * s, h = src.height * s;
    x.drawImage(src, (W - w) / 2, 200, w, h);
    const done = () => {
      x.textAlign = 'center'; x.fillStyle = '#18574E'; x.font = '800 44px "Bricolage Grotesque", system-ui, sans-serif';
      const nombre = ($('#nombre').value || '').trim();
      x.fillText(nombre ? `La tarta de ${nombre}` : 'Mi tarta Rossamenta', W / 2, H - 150);
      x.font = 'italic 30px Fraunces, Georgia, serif'; x.fillStyle = '#D63D7E';
      x.fillText(`${RM.find('bizcocho', st.bizcocho).t} con ${RM.find('relleno', st.relleno).t.toLowerCase()}`, W / 2, H - 100);
      x.font = '600 26px "Bricolage Grotesque", system-ui, sans-serif'; x.fillStyle = '#18574E';
      x.fillText('@rossamentapm · 643 594 123', W / 2, H - 52);
      try { const a = document.createElement('a'); a.download = 'mi-tarta-rossamenta.png'; a.href = c.toDataURL('image/png'); a.click(); toast('Foto descargada. Adjúntala en WhatsApp con tu pedido.'); }
      catch (e) { toast('No se pudo descargar la foto en este navegador.'); }
    };
    const logo = new Image(); logo.crossOrigin = 'anonymous';
    logo.onload = () => { x.drawImage(logo, W / 2 - 80, 36, 160, 160); done(); };
    logo.onerror = done; logo.src = A + '/logo.png';
  }
  function initSend() {
    $('#sendWa').addEventListener('click', () => {
      const n = $('#nombre');
      if (!n.value.trim()) { toast('Pon tu nombre para que sepan quién eres.'); n.focus(); return; }
      party(); setTimeout(() => window.open(wa(orderText()), '_blank', 'noopener'), 500);
    });
    $('#snap').addEventListener('click', downloadSnap);
    const hoy = new Date(); hoy.setDate(hoy.getDate() + 2); $('#fecha').min = hoy.toISOString().slice(0, 10);
    $('#ctSend').addEventListener('click', () => {
      const n = $('#cNombre'), m = $('#cMsg');
      if (!n.value.trim() || !m.value.trim()) { toast('Escribe tu nombre y tu mensaje.'); (n.value.trim() ? m : n).focus(); return; }
      party(0.8);
      const t = `¡Hola Rossamenta! Soy ${n.value.trim()}.\nMe interesa: ${$('#cTipo').value}.\n\n${m.value.trim()}`;
      setTimeout(() => window.open(wa(t), '_blank', 'noopener'), 400);
    });
  }

  /* =====================================================
     GALERÍA horizontal con fotos reales
     ===================================================== */
  function initGaleria() {
    const track = $('#galTrack'), cards = $$('.ph', track);
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const apply = cd => { cd.style.transform = `perspective(1200px) translateZ(${cd._cz || 0}px) rotateY(${(cd._cy || 0) + (cd._ry || 0)}deg) rotateX(${cd._rx || 0}deg)`; };
    const imgs = cards.map(c => $('img', c));
    const curve = () => {
      const c = innerWidth / 2;
      cards.forEach((cd, i) => {
        const r = cd.getBoundingClientRect(), off = (r.left + r.width / 2 - c) / innerWidth;
        cd._cy = clamp(-off * 18, -24, 24); cd._cz = -Math.abs(off) * 110; apply(cd);
        if (imgs[i]) imgs[i].style.transform = `scale(1.18) translateX(${clamp(-off * 9, -9, 9)}%)`;
      });
    };
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '#galeria', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: curve, onRefresh: curve }
    });
    if (!reduce) gsap.from(cards, { y: 140, opacity: 0, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '#galeria', start: 'top 70%' } });
    curve();
    if (fine && !reduce) cards.forEach(cd => {
      const o = { rx: 0, ry: 0 };
      cd.addEventListener('pointermove', e => {
        const r = cd.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(o, { rx: -y * 10, ry: x * 12, duration: 0.5, ease: 'power3.out', overwrite: true, onUpdate: () => { cd._rx = o.rx; cd._ry = o.ry; apply(cd); } });
      });
      cd.addEventListener('pointerleave', () => gsap.to(o, { rx: 0, ry: 0, duration: 1, ease: 'elastic.out(1,.4)', overwrite: true, onUpdate: () => { cd._rx = o.rx; cd._ry = o.ry; apply(cd); } }));
    });
    cards.forEach(cd => {
      const b = $('.ph-cta', cd); if (!b) return;
      b.addEventListener('click', () => window.open(wa(`¡Hola Rossamenta! He visto en vuestra web ${cd.dataset.name} y me encanta. ¿Me podéis hacer una parecida? 🎂`), '_blank', 'noopener'));
    });
  }

  /* servicios con imagen que sigue al cursor */
  function initServicios() {
    $$('.sv-list a[data-tipo]').forEach(a => a.addEventListener('click', () => { $('#cTipo').value = a.dataset.tipo; }));
    if (!fine || reduce) return;
    const box = $('#hoverImg'), img = $('img', box);
    let x = 0, y = 0, tx = 0, ty = 0, on = false, lastX = 0;
    $$('.sv-list li').forEach(li => {
      li.addEventListener('pointerenter', () => { img.src = A + '/' + li.dataset.img; on = true; gsap.to(box, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }); });
      li.addEventListener('pointerleave', () => { on = false; gsap.to(box, { opacity: 0, scale: 0.6, duration: 0.4, ease: 'power2.in' }); });
    });
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    gsap.ticker.add(() => {
      if (!on && +box.style.opacity === 0) return;
      x = lerp(x, tx, 0.14); y = lerp(y, ty, 0.14);
      const rot = clamp((x - lastX) * 0.6, -14, 14); lastX = x;
      box.style.left = x + 'px'; box.style.top = y + 'px'; box.style.rotate = rot + 'deg';
    });
  }

  /* navidad: vídeo perezoso + parallax */
  function initNavidad() {
    const v = $('#nvVideo'), snd = $('#snd');
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.25 }).observe(v);
    snd.addEventListener('click', () => { v.muted = !v.muted; snd.classList.toggle('on', !v.muted); snd.setAttribute('aria-label', v.muted ? 'Activar sonido' : 'Silenciar'); if (!v.muted) v.play().catch(() => {}); });
    if (reduce) return;
    [['.f1', -120, -14], ['.f2', -40, 12], ['.f3', -180, 9]].forEach(([s, y, r]) => gsap.to('.nv-float' + s, { y, rotate: r, ease: 'none', scrollTrigger: { trigger: '.navidad', start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.phone', { y: 120, rotate: -6, scale: 0.9, ease: 'none', scrollTrigger: { trigger: '.navidad', start: 'top bottom', end: 'center center', scrub: true } });
  }

  /* =====================================================
     SPRINKLES con física
     ===================================================== */
  function initSprinkles() {
    if (!window.Matter) return;
    const { Engine, Bodies, Composite, Body } = Matter;
    const sec = $('#fiesta'), cv = $('#sprCanvas'), ctx = cv.getContext('2d');
    const eng = Engine.create(); eng.gravity.y = 1;
    let W = 0, H = 0, dpr = 1, walls = [], active = false, started = false;
    const bodies = [], MAX = isMobile() ? 220 : 400;
    const COLS = ['#E482B5', '#72B6A9', '#FFFFFF', '#B6DDDA', '#E2BC5A', '#D63D7E', '#18574E'];
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; H = sec.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      if (walls.length) Composite.remove(eng.world, walls);
      walls = [Bodies.rectangle(W / 2, H + 60 - 44, W * 3, 120, { isStatic: true }), Bodies.rectangle(-60, H / 2, 120, H * 4, { isStatic: true }), Bodies.rectangle(W + 60, H / 2, 120, H * 4, { isStatic: true })];
      Composite.add(eng.world, walls);
    }
    const sc = () => clamp(W / 1300, 0.7, 1.25);
    function add(x, y, vy) {
      const s = sc(), k = Math.random(); let b;
      if (k < 0.7) { const w = 40 * s, h = 11 * s; b = Bodies.rectangle(x, y, w, h, { chamfer: { radius: h / 2 - 0.5 }, restitution: 0.3, friction: 0.15, angle: Math.random() * Math.PI }); b._t = 'r'; b._w = w; b._h = h; }
      else { const r = (k < 0.9 ? 9 : 13) * s; b = Bodies.circle(x, y, r, { restitution: 0.45, friction: 0.1 }); b._t = 'c'; b._r = r; }
      b._c = b._t === 'c' && Math.random() < 0.4 ? '#E2BC5A' : COLS[(Math.random() * COLS.length) | 0];
      if (vy) Body.setVelocity(b, { x: (Math.random() - 0.5) * 12, y: vy });
      Composite.add(eng.world, b); bodies.push(b);
      if (bodies.length > MAX) Composite.remove(eng.world, bodies.shift());
    }
    const rain = (n, d) => { for (let i = 0; i < n; i++) setTimeout(() => add(Math.random() * W, -30 - Math.random() * 260), Math.random() * d); };
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      for (const b of bodies) {
        ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle); ctx.fillStyle = b._c;
        if (b._t === 'r') { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-b._w / 2, -b._h / 2, b._w, b._h, b._h / 2) : ctx.rect(-b._w / 2, -b._h / 2, b._w, b._h); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-b._w / 2 + b._h / 2, -b._h / 2 + 2, b._w - b._h, 2); }
        else { ctx.beginPath(); ctx.arc(0, 0, b._r, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-b._r * 0.35, -b._r * 0.35, b._r * 0.3, 0, 7); ctx.fill(); }
        ctx.restore();
      }
    }
    let px = -999, py = -999;
    sec.addEventListener('pointermove', e => {
      const r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const sp = Math.min(Math.hypot(x - px, y - py), 60); px = x; py = y;
      for (const b of bodies) {
        const dx = b.position.x - x, dy = b.position.y - y, d = Math.hypot(dx, dy);
        if (d < 110 && d > 0.1) { const f = 0.0011 * b.mass * (1 - d / 110) * (4 + sp); Body.applyForce(b, b.position, { x: dx / d * f, y: dy / d * f - 0.0004 * b.mass * sp }); }
      }
    });
    sec.addEventListener('pointerleave', () => { px = py = -999; });
    sec.addEventListener('click', e => {
      if (e.target.closest('a,button')) return;
      const r = sec.getBoundingClientRect();
      for (let i = 0; i < 22; i++) add(e.clientX - r.left + (Math.random() - 0.5) * 30, e.clientY - r.top + (Math.random() - 0.5) * 30, -6 - Math.random() * 10);
    });
    $('#moreSpr').addEventListener('click', () => { rain(90, 1200); party(0.5); });
    size(); addEventListener('resize', size);
    new IntersectionObserver(es => es.forEach(e => {
      active = e.isIntersecting;
      if (active && !started) { started = true; rain(isMobile() ? 110 : 180, 2800); }
    }), { threshold: 0.2 }).observe(sec);
    gsap.ticker.add((t, dms) => { if (!active) return; let ms = Math.min(dms, 64); while (ms > 0) { Engine.update(eng, Math.min(ms, 1000 / 60)); ms -= 1000 / 60; } draw(); });
  }

  /* =====================================================
     reveals, marquee, nav, cursor
     ===================================================== */
  function initReveals() {
    $$('h2.split').forEach(h => {
      if (h.closest('.step')) return;
      const chars = split(h);
      if (reduce) return;
      gsap.set(chars, { yPercent: 118 });
      ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: () => gsap.to(chars, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.022 }) });
    });
    if (reduce) return;
    $$('.kicker, .gal-head > p, .taller-head > p, .nv-text p, .nv-text .btn, .fiesta p, .ct-card, .ct-form, .ct-map, .faq details').forEach(el => {
      gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    $$('.sv-list li').forEach((li, i) => gsap.from(li, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', delay: i * 0.05, scrollTrigger: { trigger: li, start: 'top 94%', once: true } }));
    gsap.from('.proc li', { y: 110, opacity: 0, rotate: 3, duration: 1.2, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.proc', start: 'top 82%', once: true } });
    gsap.from('.cfg-stage', { clipPath: 'inset(28% 18% 28% 18% round 36px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.cfg', start: 'top 80%', once: true } });
    gsap.from('.cfg-panel', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cfg', start: 'top 75%', once: true } });
    gsap.from('.fiesta-logo', { scale: 0, rotate: -180, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.fiesta', start: 'top 60%', once: true } });
    const fc = split($('#footWord'), true);
    gsap.from(fc, { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });
    gsap.from('.foot-logo', { scale: 0, rotate: -120, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });
  }
  function initMarquee() {
    const rows = $$('.mq').map(m => { const tr = $('.mq-track', m); tr.innerHTML = tr.innerHTML.repeat(3); return { tr, x: 0, dir: +m.dataset.dir, sk: 0 }; });
    if (reduce) return;
    gsap.ticker.add((t, dms) => {
      const dt = Math.min(dms, 50) / 1000, v = lenis ? lenis.velocity : 0;
      rows.forEach(r => {
        const w = r.tr.scrollWidth / 3;
        r.x += (60 + Math.abs(v) * 20) * dt * r.dir;
        if (r.x <= -w) r.x += w; if (r.x > 0) r.x -= w;
        r.sk = lerp(r.sk, clamp(-v * 0.3, -10, 10), 0.1);
        r.tr.style.transform = `translate3d(${r.x}px,0,0) skewX(${r.sk}deg)`;
      });
    });
  }
  function initNav() {
    const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
    const setMenu = open => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      e.preventDefault(); setMenu(false);
      setTimeout(() => scrollToEl(id, id === '#story' ? innerHeight * 1.9 : 0), 50);
    });
    $$('.marquee-sec, .taller, .contacto, .foot').forEach(sec => ScrollTrigger.create({ trigger: sec, start: 'top 40px', end: 'bottom 40px', onToggle: s => nav.classList.toggle('on-dark', s.isActive) }));
    let last = 0;
    const onScroll = y => { const down = y > last && y > 300; last = y; nav.classList.toggle('is-hidden', down && !document.body.classList.contains('menu-open')); };
    if (lenis) lenis.on('scroll', l => onScroll(l.scroll)); else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  }
  function initCursor() {
    if (!fine || reduce) return;
    document.documentElement.classList.add('has-cursor');
    const cur = $('#cursor'), dot = $('.c-dot', cur), ring = $('.c-ring', cur), label = $('#cLabel');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; stage.mx = (tx / innerWidth) * 2 - 1; stage.my = (ty / innerHeight) * 2 - 1; });
    gsap.ticker.add(() => { x = lerp(x, tx, 0.18); y = lerp(y, ty, 0.18); dot.style.transform = `translate(${tx}px,${ty}px)`; ring.style.transform = `translate(${x}px,${y}px)`; });
    document.addEventListener('pointerover', e => {
      const t = e.target;
      const drag = t.closest('#cfgCanvas') ? 'Girar' : (t.closest('#fiesta') && !t.closest('a,button')) ? 'Empujar' : t.closest('.ph:not(.ph-end)') && !t.closest('button') ? 'Ver' : '';
      cur.classList.toggle('is-drag', !!drag); label.textContent = drag;
      cur.classList.toggle('is-link', !drag && !!t.closest('a,button,label,summary,select'));
    });
  }
  function initMagnet() {
    if (!fine || reduce) return;
    $$('.mag').forEach(b => {
      const s = $('span', b);
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        gsap.to(b, { x: x * 0.22, y: y * 0.32, duration: 0.4, ease: 'power3.out' }); gsap.to(s, { x: x * 0.1, y: y * 0.12, duration: 0.4, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => gsap.to([b, s], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,.4)' }));
    });
  }

  /* ===== loop ===== */
  let tt = 0;
  gsap.ticker.add((time, dms) => { const dt = Math.min(dms, 50) / 1000; tt += dt; renderStage(dt, tt); renderCfg(dt, tt); });
  if (!fine) addEventListener('deviceorientation', e => { if (e.gamma == null) return; stage.mx = clamp(e.gamma / 30, -1, 1); stage.my = clamp((e.beta - 45) / 30, -1, 1); });

  /* ===== arranque ===== */
  async function boot() {
    $('#year').textContent = new Date().getFullYear();
    loaderSprinkles();
    $$('#heroTitle .ht-w').forEach(w => split(w, true));
    gsap.set('#heroTitle .c', { opacity: 0 });
    if (!reduce) gsap.to('.ld-badge img', { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.6)' }); else gsap.set('.ld-badge img', { scale: 1, opacity: 1 });
    prog(10);
    try { await Promise.race([document.fonts.ready, wait(2500)]); } catch (e) {}
    fitHero(); fitFoot();
    prog(35); await frame();
    if (webgl) { try { initStage(); } catch (e) { console.error(e); webgl = false; document.documentElement.classList.add('no-webgl'); } }
    prog(65); await frame();
    if (webgl) { try { initCfg(); } catch (e) { console.error(e); } }
    if (!cfg.r) { $('#cfgStage').insertAdjacentHTML('beforeend', '<p style="position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:2rem;font-weight:700;color:#18574E">Tu navegador no muestra 3D, pero puedes diseñarla igual y enviarla por WhatsApp.</p>'); buildOpts(); updateMeta(); }
    prog(85); await frame();
    initTabs(); initSend(); initStory(); initGaleria(); initServicios(); initNavidad(); initReveals(); initMarquee(); initSprinkles(); initNav(); initCursor(); initMagnet();
    addEventListener('resize', () => { fitHero(); fitFoot(); heroAlign(); });
    prog(100);
    await wait(700);
    ScrollTrigger.refresh();
    document.body.classList.remove('is-loading');
    if (reduce) { $('#loader').remove(); heroIntro(); lenis && lenis.start(); return; }
    const tl = gsap.timeline();
    tl.to('.ld-num, .ld-msg', { y: -20, opacity: 0, duration: 0.4, ease: 'power2.in' })
      .to('.ld-badge', { scale: 1.12, duration: 0.35, ease: 'power2.out' }, '<')
      .to('.ld-badge', { scale: 0, rotate: 90, duration: 0.7, ease: 'back.in(1.6)' })
      .to('#loader', { clipPath: 'circle(0% at 50% 50%)', duration: 1, ease: 'expo.inOut', onComplete: () => $('#loader').remove() }, '-=0.45')
      .add(() => { heroIntro(); lenis && lenis.start(); }, '-=0.85');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
