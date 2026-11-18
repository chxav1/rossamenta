/* Rossamenta · motor 3D de tartas v2 (Three.js r149, build global) */
(function () {
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;

  const OPC = {
    forma: [{ v: 'round', t: 'Redonda' }, { v: 'square', t: 'Cuadrada' }, { v: 'heart', t: 'Corazón' }],
    tam: [{ v: 'S', t: 'S', d: 'Pequeña' }, { v: 'M', t: 'M', d: 'Mediana' }, { v: 'L', t: 'L', d: 'Grande' }],
    pisos: [{ v: 1, t: '1 piso' }, { v: 2, t: '2 pisos' }, { v: 3, t: '3 pisos' }],
    bizcocho: [{ v: 'vainilla', t: 'Vainilla', c: '#F3D28B' }, { v: 'chocolate', t: 'Chocolate', c: '#5E3324' }, { v: 'redvelvet', t: 'Red velvet', c: '#A8213A' }, { v: 'limon', t: 'Limón', c: '#F5E27A' }, { v: 'zanahoria', t: 'Zanahoria', c: '#D08A45' }],
    relleno: [{ v: 'nata', t: 'Nata y fresa', c: '#FFF1F5' }, { v: 'trufa', t: 'Trufa', c: '#3E1F14' }, { v: 'queso', t: 'Crema de queso', c: '#FFF6E2' }, { v: 'pistacho', t: 'Pistacho', c: '#A9C97A' }, { v: 'dulce', t: 'Dulce de leche', c: '#C4843F' }, { v: 'frutos', t: 'Frutos rojos', c: '#C2185B' }],
    cobertura: [{ v: 'nata', t: 'Nata', c: '#FFF4EA' }, { v: 'rosa', t: 'Rosa', c: '#F4BFD9' }, { v: 'menta', t: 'Menta', c: '#BFE3DD' }, { v: 'verde', t: 'Menta intensa', c: '#72B6A9' }, { v: 'lila', t: 'Lila', c: '#D4C2F0' }, { v: 'choco', t: 'Chocolate', c: '#4A2619' }, { v: 'negro', t: 'Negro', c: '#1E1A1B' }],
    drip: [{ v: 'no', t: 'Sin goteo' }, { v: 'rosa', t: 'Rosa', c: '#E0609F' }, { v: 'fresa', t: 'Fresa', c: '#D63D7E' }, { v: 'menta', t: 'Menta', c: '#5FAE9F' }, { v: 'choco', t: 'Chocolate', c: '#2E150C' }, { v: 'blanco', t: 'Blanco', c: '#FFFFFF' }, { v: 'oro', t: 'Oro', c: '#D9B04C' }],
    toppings: [{ v: 'borde', t: 'Borde de nata' }, { v: 'fresas', t: 'Fresas' }, { v: 'corazones', t: 'Corazones' }, { v: 'oro', t: 'Perlas doradas' }, { v: 'arandanos', t: 'Arándanos' }, { v: 'macarons', t: 'Macarons' }, { v: 'flores', t: 'Flores' }, { v: 'velas', t: 'Velas' }, { v: 'sprinkles', t: 'Sprinkles' }, { v: 'perlas', t: 'Perlas en la base' }]
  };
  const find = (k, v) => OPC[k].find(o => o.v == v) || OPC[k][0];

  /* ---------- utilidades ---------- */
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const reseed = s => { seed = s; };
  const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function mat(color, o) {
    return new T.MeshPhysicalMaterial(Object.assign({
      color: new T.Color(color), roughness: 0.6, metalness: 0, envMapIntensity: 0.32,
      clearcoat: 0.08, clearcoatRoughness: 0.6, sheen: 0.35,
      sheenColor: new T.Color('#ffffff'), sheenRoughness: 0.8
    }, o || {}));
  }
  const glossy = (c, o) => mat(c, Object.assign({ roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0, envMapIntensity: 1.1 }, o || {}));
  const gold = () => mat('#E2BC5A', { metalness: 1, roughness: 0.22, envMapIntensity: 1.4, sheen: 0, clearcoat: 0.4 });

  function smooth(g) {
    const pos = g.attributes.position, map = new Map(), idx = [], verts = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const k = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
      let j = map.get(k);
      if (j === undefined) { j = verts.length / 3; verts.push(x, y, z); map.set(k, j); }
      idx.push(j);
    }
    const n = new T.BufferGeometry();
    n.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
    n.setIndex(idx); n.computeVertexNormals(); g.dispose();
    return n;
  }

  function shapeFor(kind, r) {
    const s = new T.Shape();
    if (kind === 'square') {
      const a = r * 0.9, c = r * 0.2;
      s.moveTo(-a + c, -a); s.lineTo(a - c, -a); s.quadraticCurveTo(a, -a, a, -a + c);
      s.lineTo(a, a - c); s.quadraticCurveTo(a, a, a - c, a); s.lineTo(-a + c, a);
      s.quadraticCurveTo(-a, a, -a, a - c); s.lineTo(-a, -a + c); s.quadraticCurveTo(-a, -a, -a + c, -a);
    } else if (kind === 'heart') {
      const k = r * 1.02;
      s.moveTo(0, -1.0 * k);
      s.bezierCurveTo(0.35 * k, -0.62 * k, 1.08 * k, -0.25 * k, 1.05 * k, 0.28 * k);
      s.bezierCurveTo(1.02 * k, 0.8 * k, 0.42 * k, 1.02 * k, 0, 0.56 * k);
      s.bezierCurveTo(-0.42 * k, 1.02 * k, -1.02 * k, 0.8 * k, -1.05 * k, 0.28 * k);
      s.bezierCurveTo(-1.08 * k, -0.25 * k, -0.35 * k, -0.62 * k, 0, -1.0 * k);
    } else {
      s.absarc(0, 0, r, 0, Math.PI * 2, false);
    }
    return s;
  }

  function slab(shape, h, b, curve) {
    const g = new T.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, h - 2 * b), bevelEnabled: true, bevelThickness: b,
      bevelSize: b, bevelOffset: -b, bevelSegments: 7, curveSegments: curve || 80
    });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
    return smooth(g);
  }

  // puntos del contorno en coordenadas de mundo (x, z) con normal hacia fuera y posición por longitud de arco
  function outline(shape, n) {
    const pts = shape.getSpacedPoints(n); pts.pop();
    return pts.map((p, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
      let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      let nx = ty, ny = -tx;
      if (nx * p.x + ny * p.y < 0) { nx = -nx; ny = -ny; }
      return { x: p.x, z: -p.y, nx, nz: -ny, s: i / pts.length };
    });
  }
  const inPoly = (x, z, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if (((a.z > z) !== (b.z > z)) && (x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x)) c = !c;
    }
    return c;
  };

  /* ---------- GOTEO: cortina continua con gotas redondeadas ---------- */
  function dripProfile(perim, h, sd) {
    reseed(sd);
    const K = Math.max(4, Math.round(perim * 4.4)), bumps = [];
    for (let k = 0; k < K; k++) {
      const long = rnd() < 0.6;
      bumps.push({
        c: (k + 0.15 + rnd() * 0.7) / K * perim,
        L: long ? h * (0.26 + rnd() * 0.4) : h * (0.08 + rnd() * 0.12),
        w: 0.03 + rnd() * 0.028, long
      });
    }
    return (s) => { // s = posición en longitud de arco
      let L = 0, B = 0;
      for (const b of bumps) {
        let d = s - b.c; d -= Math.round(d / perim) * perim;
        const ad = Math.abs(d);
        if (ad < b.w) { const q = Math.sqrt(1 - (d / b.w) ** 2); L = Math.max(L, b.L * q); B = Math.max(B, q * (b.long ? 1 : 0.5)); }
        const f = b.L * 0.32 * Math.exp(-((d / (b.w * 2.6)) ** 2)); if (f > L) L = f;
      }
      return { L: L + 0.028, B };
    };
  }
  function curtain(cols, closed, yTop, th) {
    const M = 26, n = cols.length, C = closed ? n + 1 : n;
    const pos = new Float32Array(C * (M + 1) * 3), idx = [];
    for (let i = 0; i < C; i++) {
      const c = cols[i % n];
      for (let j = 0; j <= M; j++) {
        const t = j / M, s = (1 - Math.cos(t * Math.PI)) / 2;
        const k = th * (1 + 0.6 * c.B * smoothstep(0.55, 0.93, s)) * Math.sqrt(Math.max(0, 1 - Math.pow(s, 12))) + 0.002;
        const o = (i * (M + 1) + j) * 3;
        pos[o] = c.x + c.nx * k; pos[o + 1] = yTop - s * c.L; pos[o + 2] = c.z + c.nz * k;
      }
    }
    for (let i = 0; i < C - 1; i++) for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j, b = (i + 1) * (M + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  /* ---------- toppings (geometrías compartidas) ---------- */
  const G = {};
  function geos() {
    if (G.ready) return G;
    const V = (x, y) => new T.Vector2(x, y);
    G.straw = new T.LatheGeometry([V(0, 0), V(0.028, 0.012), V(0.055, 0.045), V(0.075, 0.09), V(0.084, 0.13), V(0.078, 0.16), V(0.055, 0.178), V(0, 0.182)], 28);
    G.leaf = new T.ConeGeometry(0.022, 0.07, 6); G.leaf.translate(0, 0.035, 0);
    G.berry = new T.SphereGeometry(0.044, 24, 16);
    // roseta de nata con manga (estrella retorcida)
    const dp = [];
    for (let i = 0; i <= 44; i++) { const t = i / 44; dp.push(V(Math.max(0.0008, 0.11 * Math.pow(1 - t, 0.8) + 0.012 * Math.sin(t * 26) * (1 - t)), t * 0.15)); }
    const lg = new T.LatheGeometry(dp, 48), lp = lg.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const x = lp.getX(i), y = lp.getY(i), z = lp.getZ(i), a = Math.atan2(z, x) + y * 18, r = Math.hypot(x, z);
      const rr = r * (1 + 0.16 * Math.cos(a * 8));
      lp.setXYZ(i, Math.cos(Math.atan2(z, x)) * rr, y, Math.sin(Math.atan2(z, x)) * rr);
    }
    lg.computeVertexNormals(); G.dollop = lg;
    G.shell = new T.SphereGeometry(0.085, 28, 14); G.shell.scale(1, 0.42, 1);
    G.fill = new T.CylinderGeometry(0.074, 0.074, 0.03, 28);
    G.petal = new T.SphereGeometry(0.042, 14, 10); G.petal.scale(1, 0.3, 0.75);
    G.dot = new T.SphereGeometry(0.024, 12, 10);
    G.candle = new T.CylinderGeometry(0.02, 0.02, 0.32, 18); G.candle.translate(0, 0.16, 0);
    G.flame = new T.SphereGeometry(0.026, 14, 12); G.flame.scale(1, 1.9, 1);
    G.wick = new T.CylinderGeometry(0.004, 0.004, 0.03, 6);
    G.sprinkle = new T.CapsuleGeometry(0.01, 0.042, 3, 6);
    G.pearl = new T.SphereGeometry(0.04, 18, 14);
    G.goldBall = new T.SphereGeometry(0.024, 16, 12);
    const hs = shapeFor('heart', 0.055);
    G.heart = new T.ExtrudeGeometry(hs, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 18 });
    G.heart = smooth(G.heart); G.heart.translate(0, 0, -0.011);
    const sc = document.createElement('canvas'); sc.width = 32; sc.height = 256;
    const x = sc.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 32, 256);
    x.strokeStyle = '#E482B5'; x.lineWidth = 12;
    for (let y = -40; y < 300; y += 44) { x.beginPath(); x.moveTo(-10, y); x.lineTo(42, y + 30); x.stroke(); }
    G.candleTex = new T.CanvasTexture(sc); G.candleTex.encoding = T.sRGBEncoding;
    G.M = {
      straw: glossy('#D9102F', { envMapIntensity: 0.8 }), leaf: mat('#3E9B3A', { roughness: 0.5 }),
      berry: mat('#3A3F7E', { roughness: 0.3, clearcoat: 0.6, sheen: 0.8, sheenColor: new T.Color('#B9C6FF') }),
      cream: mat('#FFF8EF', { roughness: 0.78, sheen: 0.5 }), creamPink: mat('#F6CBDF', { roughness: 0.78 }), creamMint: mat('#CDEBE4', { roughness: 0.78 }),
      fillCream: mat('#FFF7FA', { roughness: 0.8 }), yellow: mat('#F7C948'),
      candle: new T.MeshStandardMaterial({ map: G.candleTex, roughness: 0.4 }),
      flame: new T.MeshBasicMaterial({ color: '#FFB020' }), wick: new T.MeshBasicMaterial({ color: '#222' }),
      pearl: mat('#FFFFFF', { roughness: 0.12, clearcoat: 1, metalness: 0.2, sheen: 0, envMapIntensity: 1.2 }),
      gold: gold(), heart: glossy('#D51B3B', { envMapIntensity: 0.9 })
    };
    G.ready = true;
    return G;
  }
  const mk = (g, m, cast) => { const o = new T.Mesh(g, m); o.castShadow = cast !== false; o.receiveShadow = true; return o; };

  function strawberry() {
    const g = new T.Group(); const s = mk(G.straw, G.M.straw); s.rotation.x = Math.PI; s.position.y = 0.182; g.add(s);
    for (let i = 0; i < 5; i++) { const l = mk(G.leaf, G.M.leaf, false); const a = i / 5 * Math.PI * 2; l.position.set(0, 0.17, 0); l.rotation.set(Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25); g.add(l); }
    g.rotation.z = 0.35; return g;
  }
  function blueberry() { const b = mk(G.berry, G.M.berry); b.position.y = 0.04; const g = new T.Group(); g.add(b); return g; }
  function dollop(m, sc) { const g = new T.Group(); g.add(mk(G.dollop, m || G.M.cream)); if (sc) g.scale.setScalar(sc); return g; }
  function macaron(c) {
    const g = new T.Group(), m = mat(c, { roughness: 0.75, sheen: 0.7 });
    const a = mk(G.shell, m); a.position.y = 0.035; const f = mk(G.fill, G.M.fillCream); f.position.y = 0.07;
    const b = mk(G.shell, m); b.position.y = 0.105; g.add(a, f, b); g.rotation.x = -0.5; g.position.y = 0.04; return g;
  }
  function flower(c) {
    const g = new T.Group(), m = mat(c, { roughness: 0.6, sheen: 0.8 });
    for (let i = 0; i < 5; i++) { const p = mk(G.petal, m); const a = i / 5 * Math.PI * 2; p.position.set(Math.cos(a) * 0.045, 0.02, Math.sin(a) * 0.045); p.rotation.y = -a; g.add(p); }
    const d = mk(G.dot, G.M.yellow); d.position.y = 0.03; g.add(d); return g;
  }
  function candle(flames) {
    const g = new T.Group(); g.add(mk(G.candle, G.M.candle));
    const w = new T.Mesh(G.wick, G.M.wick); w.position.y = 0.335; g.add(w);
    const f = new T.Mesh(G.flame, G.M.flame); f.position.y = 0.385; g.add(f); flames.push(f); return g;
  }
  function heartFlat() { const m = mk(G.heart, G.M.heart); m.rotation.x = -Math.PI / 2; m.position.y = 0.018; const g = new T.Group(); g.add(m); return g; }
  function sideHearts(grp, ol, h, n, sd) {
    reseed(sd);
    for (let k = 0; k < n; k++) {
      const p = ol[Math.floor(rnd() * ol.length)], y = h * (0.22 + rnd() * 0.5);
      const m = mk(G.heart, G.M.heart); const s = 0.7 + rnd() * 0.7;
      m.scale.setScalar(s); m.position.set(p.x + p.nx * 0.012, y, p.z + p.nz * 0.012);
      m.rotation.y = Math.atan2(p.nx, p.nz); m.rotateZ((rnd() - 0.5) * 0.6); grp.add(m);
    }
  }

  function textPlane(text, w, color) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 320;
    const x = c.getContext('2d'); let fs = 150;
    const F = s => `italic 600 ${s}px "Fraunces", Georgia, serif`;
    x.font = F(fs);
    while (x.measureText(text).width > 940 && fs > 40) { fs -= 6; x.font = F(fs); }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = color; x.fillText(text, 512, 165);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const m = new T.Mesh(new T.PlaneGeometry(w, w * 320 / 1024), new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; return m;
  }

  /* ---------- tarta configurable ---------- */
  function buildCake(o) {
    geos(); reseed(17);
    const root = new T.Group(), flames = [], parts = [];
    const R = { S: 0.92, M: 1.1, L: 1.3 }[o.tam] || 1.1;
    const H = [0.78, 0.66, 0.56], SC = [1, 0.7, 0.48];
    const cover = find('cobertura', o.cobertura).c;
    const coverM = mat(cover, { roughness: 0.64 });
    const dripC = o.drip && o.drip !== 'no' ? find('drip', o.drip).c : null;
    const dripM = dripC ? (o.drip === 'oro' ? gold() : glossy(dripC)) : null;
    if (dripM) dripM.side = T.DoubleSide;
    const tops = new Set(o.toppings || []);
    const creamM = ['rosa'].includes(o.cobertura) ? G.M.cream : o.cobertura === 'negro' || o.cobertura === 'choco' ? G.M.creamPink : G.M.cream;

    // base: blonda y plato
    const plate = new T.Group();
    const pm = mat('#F2F2F4', { roughness: 0.25, metalness: 0.6, sheen: 0, envMapIntensity: 1 });
    const p1 = mk(new T.CylinderGeometry(R * 1.3, R * 1.3, 0.04, 96), pm); p1.position.y = 0.02;
    plate.add(p1); root.add(plate);

    let y = 0.04; const tiers = [];
    for (let i = 0; i < o.pisos; i++) {
      const r = R * SC[i], h = H[i], sh = shapeFor(o.forma, r);
      const tier = new T.Group(); tier.position.y = y;
      tier.add(mk(slab(sh, h, Math.min(0.09, h * 0.14)), coverM));
      const per = sh.getLength(), ol = outline(sh, Math.round(per * 110));
      if (dripM) {
        const cap = mk(slab(shapeFor(o.forma, r + 0.02), 0.075, 0.032, 96), dripM);
        cap.position.y = h - 0.05; tier.add(cap);
        const prof = dripProfile(per, h, 11 + i * 7);
        const cols = ol.map(p => Object.assign({}, p, prof(p.s * per)));
        tier.add(mk(curtain(cols, true, h - 0.03, 0.022), dripM));
      }
      if (tops.has('perlas')) {
        outline(sh, Math.round(per * 12)).forEach(p => { const s = mk(G.pearl, G.M.pearl); s.position.set(p.x + p.nx * 0.03, 0.04, p.z + p.nz * 0.03); tier.add(s); });
      }
      if (tops.has('corazones')) sideHearts(tier, ol, h, Math.round(per * 1.6), 31 + i);
      if (tops.has('oro')) {
        reseed(51 + i);
        for (let k = 0; k < Math.round(per * 2.2); k++) { const p = ol[Math.floor(rnd() * ol.length)]; const b = mk(G.goldBall, G.M.gold); b.scale.setScalar(0.7 + rnd() * 0.9); b.position.set(p.x + p.nx * 0.018, h * (0.15 + rnd() * 0.6), p.z + p.nz * 0.018); tier.add(b); }
      }
      // borde de nata en la base de cada piso superior
      if (tops.has('borde') && i > 0) {
        outline(sh, Math.round(per * 9)).forEach(p => { const d = dollop(creamM, 0.5); d.position.set(p.x * 1.0 + p.nx * 0.02, 0, p.z + p.nz * 0.02); d.rotation.y = rnd() * 6; tier.add(d); });
      }
      root.add(tier); parts.push(tier);
      tiers.push({ r, h, y, sh, per, top: y + h + (dripM ? 0.025 : 0) });
      y += h;
    }
    if (tops.has('borde')) {
      const t0 = tiers[0];
      outline(t0.sh, Math.round(t0.per * 9)).forEach(p => { const d = dollop(creamM, 0.55); d.position.set(p.x + p.nx * 0.025, 0.04, p.z + p.nz * 0.025); d.rotation.y = rnd() * 6; root.add(d); });
    }

    // decoración en el piso superior
    const T0 = tiers[tiers.length - 1], top = new T.Group(); top.position.y = T0.top;
    const ring = (scale, n) => T0.sh.getSpacedPoints(n).slice(0, n).map(p => ({ x: p.x * scale, z: -p.y * scale }));
    const poly = T0.sh.getPoints(48).map(p => ({ x: p.x, z: -p.y }));
    const scatter = (n, scale, fn, sd) => {
      reseed(sd); let k = 0, guard = 0;
      while (k < n && guard++ < 4000) {
        const x = (rnd() * 2 - 1) * T0.r, z = (rnd() * 2 - 1) * T0.r;
        if (!inPoly(x / scale, z / scale, poly)) continue;
        if (o.msg && Math.abs(z - T0.r * 0.12) < T0.r * 0.2 && Math.abs(x) < T0.r * 0.62) continue;
        fn(x, z); k++;
      }
    };
    if (tops.has('borde')) ring(0.84, Math.round(T0.per * 5.2)).forEach(p => { const d = dollop(creamM, 0.8); d.position.set(p.x, 0, p.z); d.rotation.y = rnd() * 6; top.add(d); });
    const list = [];
    if (tops.has('fresas')) list.push(() => strawberry());
    if (tops.has('arandanos')) list.push(() => blueberry());
    if (tops.has('flores')) list.push((i) => flower(['#FFFFFF', '#E482B5', '#BFE3DD', '#F4BFD9'][i % 4]));
    if (list.length) {
      const n = Math.round(6 + T0.r * 5);
      ring(tops.has('borde') ? 0.58 : 0.74, n).forEach((p, i) => { const item = list[i % list.length](i); item.position.set(p.x, 0, p.z); item.rotation.y = rnd() * 6.28; top.add(item); });
    }
    if (tops.has('macarons')) {
      const cs = ['#F4BFD9', '#BFE3DD', '#FFF4EA'];
      [[-0.3, -0.18], [0.28, -0.24], [0.02, -0.4]].forEach(([dx, dz], i) => { const m = macaron(cs[i]); m.position.set(dx * T0.r, 0, dz * T0.r); m.rotation.y = i * 0.8; top.add(m); });
    }
    if (tops.has('corazones')) scatter(Math.round(5 + T0.r * 6), 0.62, (x, z) => { const hh = heartFlat(); hh.position.set(x, 0, z); hh.rotation.y = rnd() * 6; top.add(hh); }, 61);
    if (tops.has('oro')) scatter(Math.round(10 + T0.r * 14), 0.7, (x, z) => { const b = mk(G.goldBall, G.M.gold); b.scale.setScalar(0.6 + rnd() * 0.9); b.position.set(x, 0.015, z); top.add(b); }, 71);
    if (tops.has('velas')) {
      const n = o.msg ? 3 : 5;
      for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 1.6; const c = candle(flames); c.position.set(Math.sin(a) * T0.r * 0.34, 0, -Math.cos(a) * T0.r * 0.28 + (o.msg ? -0.14 : 0.12)); top.add(c); }
    }
    if (tops.has('sprinkles')) {
      const cols = ['#E482B5', '#72B6A9', '#FFFFFF', '#F7C948', '#BFE3DD', '#D63D7E'];
      const n = Math.round(80 * T0.r);
      const im = new T.InstancedMesh(G.sprinkle, mat('#ffffff', { roughness: 0.35, clearcoat: 0.6, sheen: 0 }), n);
      const d = new T.Object3D(), col = new T.Color(); let k = 0;
      scatter(n, 0.8, (x, z) => { d.position.set(x, 0.011, z); d.rotation.set(Math.PI / 2, 0, rnd() * Math.PI); d.updateMatrix(); im.setMatrixAt(k, d.matrix); im.setColorAt(k, col.set(cols[k % cols.length])); k++; }, 81);
      im.count = k; im.castShadow = true; top.add(im);
    }
    if (o.msg) {
      const dark = ['choco', 'negro', 'verde'].includes(o.cobertura);
      const t = textPlane(o.msg, T0.r * (o.forma === 'heart' ? 1.2 : 1.4), dark ? '#FFF4EA' : '#18574E');
      t.position.set(0, 0.006, o.forma === 'heart' ? 0 : T0.r * 0.12); top.add(t);
    }
    root.add(top); parts.push(top);
    return { group: root, flames, height: y + 0.4, parts, tiers };
  }

  /* ---------- tarta del hero (redonda, con porción) ---------- */
  function layerTexture(cover, sponge, filling) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
    const band = (a, b, col) => { x.fillStyle = col; x.fillRect(0, 512 * (1 - b), 512, 512 * (b - a)); };
    band(0, 1, sponge);
    reseed(5);
    for (let i = 0; i < 3200; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '130,80,25' : '255,255,235'},${0.06 + rnd() * 0.13})`; const r = 0.8 + rnd() * 3; x.beginPath(); x.arc(rnd() * 512, rnd() * 512, r, 0, 7); x.fill(); }
    const fillBand = (a, b) => {
      band(a, b, filling);
      for (let i = 0; i < 30; i++) { x.fillStyle = rnd() < 0.7 ? '#D81E44' : '#E482B5'; const cx = rnd() * 470, cy = 512 * (1 - (a + (b - a) * (0.25 + rnd() * 0.5))); x.beginPath(); x.ellipse(cx, cy, 6 + rnd() * 9, 4 + rnd() * 5, rnd() * 3, 0, 7); x.fill(); }
    };
    fillBand(0.27, 0.36); fillBand(0.6, 0.69);
    band(0.9, 1, cover);
    x.fillStyle = cover; x.fillRect(490, 0, 22, 512);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8; return tex;
  }

  function buildHeroCake() {
    geos(); reseed(3);
    const R = 1.25, h = 0.95, W = Math.PI / 3.4, rt = 0.11, rb = 0.035;
    const cover = '#FFF1E6', drip = '#E0609F';
    const V = (x, y) => new T.Vector2(x, y);
    const prof = [V(0, 0)];
    for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; prof.push(V(R - rb + rb * Math.cos(a), rb + rb * Math.sin(a))); }
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; prof.push(V(R - rt + rt * Math.cos(a), h - rt + rt * Math.sin(a))); }
    prof.push(V(0, h));
    const coverM = mat(cover, { roughness: 0.62, side: T.DoubleSide });
    const dripM = glossy(drip); dripM.side = T.DoubleSide;
    const tex = layerTexture(cover, '#F3D28B', '#FCE4EE');
    const faceM = new T.MeshStandardMaterial({ map: tex, roughness: 0.85, side: T.DoubleSide });
    const faceGeo = (phi) => {
      const g = new T.ShapeGeometry(new T.Shape(prof), 12);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / R, p.getY(i) / h);
      g.rotateY(phi - Math.PI / 2); return g;
    };
    const gT = 0.03;
    const glazeProf = [V(0, h + gT), V(R - rt, h + gT)];
    for (let i = 0; i <= 14; i++) { const a = Math.PI / 2 - i / 14 * Math.PI / 2; glazeProf.push(V(R - rt + (rt + gT) * Math.cos(a), h - rt + (rt + gT) * Math.sin(a))); }
    glazeProf.push(V(R + gT, h - rt - 0.02));
    const per = Math.PI * 2 * R, prof2 = dripProfile(per, h, 9);

    function piece(start, len, segs) {
      const g = new T.Group();
      g.add(mk(new T.LatheGeometry(prof, segs, start, len), coverM));
      g.add(mk(new T.LatheGeometry(glazeProf, segs, start, len), dripM));
      g.add(mk(faceGeo(start), faceM, false)); g.add(mk(faceGeo(start + len), faceM, false));
      const n = Math.max(8, Math.round(len * R / 0.007)), cols = [];
      for (let i = 0; i <= n; i++) {
        const phi = start + i / n * len, s = ((phi % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * R;
        cols.push(Object.assign({ x: Math.sin(phi) * R, z: Math.cos(phi) * R, nx: Math.sin(phi), nz: Math.cos(phi) }, prof2(s)));
      }
      g.add(mk(curtain(cols, false, h - rt - 0.005, gT - 0.002), dripM));
      return g;
    }
    const root = new T.Group();
    const pm = mat('#FFFFFF', { roughness: 0.08, clearcoat: 1, sheen: 0, envMapIntensity: 1 });
    const mint = mat('#72B6A9', { roughness: 0.25, clearcoat: 1, sheen: 0, envMapIntensity: 0.9 });
    const plate = mk(new T.CylinderGeometry(R * 1.3, R * 1.27, 0.05, 96), pm); plate.position.y = -0.025;
    const stand = mk(new T.CylinderGeometry(R * 0.4, R * 0.56, 0.24, 64), mint); stand.position.y = -0.17;
    const base = mk(new T.CylinderGeometry(R * 0.7, R * 0.74, 0.035, 64), mint); base.position.y = -0.3;
    root.add(plate, stand, base);

    const body = piece(W / 2, Math.PI * 2 - W, 140);
    const wedge = piece(-W / 2, W, 30);
    const toppings = [];
    const place = (grp, phi, rad, obj, list) => { obj.position.set(Math.sin(phi) * rad, h + gT, Math.cos(phi) * rad); grp.add(obj); (list || toppings).push(obj); };
    // borde de rosetas
    const borderAt = (grp, a0, a1, n) => { for (let i = 0; i < n; i++) { const phi = a0 + (i + 0.5) / n * (a1 - a0); const d = dollop(G.M.cream, 0.95); d.rotation.y = rnd() * 6; place(grp, phi, R - 0.13, d); } };
    borderAt(body, W / 2, Math.PI * 2 - W / 2, 30); borderAt(wedge, -W / 2, W / 2, 5);
    const N = 9;
    for (let i = 0; i < N; i++) {
      const phi = W / 2 + 0.25 + i / (N - 1) * (Math.PI * 2 - W - 0.5);
      const obj = i % 3 === 1 ? blueberry() : strawberry(); obj.rotation.y = rnd() * 6; place(body, phi, R * 0.6, obj);
    }
    [[2.5, 0.3, '#BFE3DD'], [3.8, 0.28, '#F4BFD9']].forEach(([phi, rad, c]) => { const m = macaron(c); m.rotation.y = phi; place(body, phi, R * rad, m); });
    reseed(44);
    for (let i = 0; i < 26; i++) { const phi = W / 2 + rnd() * (Math.PI * 2 - W), rad = R * (0.15 + rnd() * 0.55); const b = mk(G.goldBall, G.M.gold); b.scale.setScalar(0.7 + rnd()); place(body, phi, rad, b); b.position.y += 0.012; }
    for (let i = 0; i < 5; i++) { const phi = W / 2 + 0.6 + i * 1.05, hh = heartFlat(); hh.rotation.y = rnd() * 6; place(body, phi, R * 0.32, hh); }
    place(wedge, 0, R * 0.55, strawberry());
    // corazones en el lateral
    const side = []; for (let i = 0; i < 160; i++) { const phi = W / 2 + 0.1 + i / 159 * (Math.PI * 2 - W - 0.2); side.push({ x: Math.sin(phi) * R, z: Math.cos(phi) * R, nx: Math.sin(phi), nz: Math.cos(phi) }); }
    sideHearts(body, side, h * 0.82, 10, 7);
    root.add(body, wedge);
    return { group: root, body, wedge, toppings, W, R, h };
  }

  /* ---------- luces + entorno de estudio ---------- */
  function studioEnv(r) {
    const pm = new T.PMREMGenerator(r), s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(24, 14, 24), new T.MeshBasicMaterial({ color: '#cfc7c0', side: T.BackSide })));
    const panel = (w, hgt, int, pos, rot, col) => { const m = new T.Mesh(new T.PlaneGeometry(w, hgt), new T.MeshBasicMaterial({ color: new T.Color(col || '#ffffff').multiplyScalar(int), side: T.DoubleSide })); m.position.set(...pos); m.rotation.set(...rot); s.add(m); };
    panel(10, 10, 5, [0, 6.9, 0], [Math.PI / 2, 0, 0]);
    panel(6, 8, 3.2, [-11.9, 2, 2], [0, Math.PI / 2, 0]);
    panel(5, 7, 2.4, [9, 2.5, 11.9], [0, Math.PI, 0], '#ffe3ef');
    panel(8, 3, 1.6, [6, 1, -11.9], [0, 0, 0], '#d9f2ec');
    const env = pm.fromScene(s, 0.035).texture; pm.dispose();
    return env;
  }
  function lights(scene, shadow, r) {
    if (r) scene.environment = studioEnv(r);
    scene.add(new T.HemisphereLight('#ffffff', '#BFE3DD', 0.42));
    const key = new T.DirectionalLight('#ffffff', 1.25); key.position.set(3.5, 6, 4.5);
    if (shadow) {
      key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
      const c = key.shadow.camera; c.left = -4.5; c.right = 4.5; c.top = 4.5; c.bottom = -4.5; c.near = 1; c.far = 20;
      key.shadow.bias = -0.0004; key.shadow.radius = 7;
    }
    scene.add(key);
    const rim = new T.DirectionalLight('#D9F2EC', 0.7); rim.position.set(-4, 3, -4); scene.add(rim);
    const fill = new T.DirectionalLight('#FFE3EF', 0.35); fill.position.set(-4, 1, 3); scene.add(fill);
    return key;
  }
  function renderer(canvas, opts) {
    const r = new T.WebGLRenderer(Object.assign({ canvas, antialias: true, alpha: true }, opts || {}));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(max-width:820px)').matches ? 1.5 : 2));
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.06;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    return r;
  }
  function dispose(obj) {
    const shared = new Set(Object.values(G)); const sharedM = new Set(Object.values(G.M || {}));
    obj.traverse(o => {
      if (o.geometry && !shared.has(o.geometry)) o.geometry.dispose();
      if (o.material && !sharedM.has(o.material)) { if (o.material.map && o.material.map !== G.candleTex) o.material.map.dispose(); o.material.dispose(); }
    });
  }
  function servings(o) {
    const b = { S: [8, 10], M: [12, 15], L: [18, 22] }[o.tam], f = [1, 1.6, 2.1][o.pisos - 1], s = o.forma === 'square' ? 1.25 : o.forma === 'heart' ? 0.9 : 1;
    return [Math.round(b[0] * f * s), Math.round(b[1] * f * s)];
  }

  window.RM = { OPC, find, buildCake, buildHeroCake, lights, renderer, dispose, servings, mat };
})();
