/* Static teaching figures: a tiny SVG panel builder, shared data makers and shared figures.
   Every curve is computed from simulated data with the same routines the demos use. */
(function () {
  const F = window.Fits;
  let uid = 0;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const n2 = (v) => (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, "");

  function Panel(o) {
    o = o || {};
    this.W = o.w || 320; this.H = o.h || 210;
    this.o = o;
    this.m = { l: o.ty ? 44 : (o.yl ? 26 : 12), r: o.r || 12, t: o.t || 12, b: (o.tx ? 18 : 6) + (o.xl ? 18 : 6) };
    this.xd = o.x || [0, 10]; this.yd = o.y || [0, 10];
    this.clip = []; this.over = []; this.id = "fgc" + (++uid);
  }
  const PP = Panel.prototype;
  PP.sx = function (x) { return this.m.l + (x - this.xd[0]) / (this.xd[1] - this.xd[0]) * (this.W - this.m.l - this.m.r); };
  PP.sy = function (y) { return this.H - this.m.b - (y - this.yd[0]) / (this.yd[1] - this.yd[0]) * (this.H - this.m.t - this.m.b); };
  const f1 = (v) => v.toFixed(1);
  PP.pts = function (data, cls, r) {
    for (const p of data) this.clip.push('<circle class="' + (cls || "fg-pt") + '" cx="' + f1(this.sx(p.x)) + '" cy="' + f1(this.sy(p.y)) + '" r="' + (r || 3.2) + '"/>');
    return this;
  };
  PP.ring = function (data) { for (const p of data) this.clip.push('<circle class="fg-ring" cx="' + f1(this.sx(p.x)) + '" cy="' + f1(this.sy(p.y)) + '" r="6.5"/>'); return this; };
  PP._path = function (xy) {
    const span = this.yd[1] - this.yd[0], lo = this.yd[0] - 3 * span, hi = this.yd[1] + 3 * span;
    return xy.map((q, i) => (i ? "L" : "M") + f1(this.sx(q[0])) + " " + f1(this.sy(Math.max(lo, Math.min(hi, q[1]))))).join("");
  };
  PP._xy = function (src, a, b) {
    if (typeof src !== "function") return src.map((q) => Array.isArray(q) ? q : [q.x, q.y]);
    const x0 = a === undefined ? this.xd[0] : a, x1 = b === undefined ? this.xd[1] : b, out = [];
    for (let i = 0; i <= 160; i++) { const x = x0 + (x1 - x0) * i / 160; out.push([x, src(x)]); }
    return out;
  };
  PP.line = function (src, cls, a, b) { this.clip.push('<path class="' + (cls || "fg-fit") + '" d="' + this._path(this._xy(src, a, b)) + '"/>'); return this; };
  PP.steps = function (xy, cls) {
    let d = ""; xy.forEach((q, i) => { d += i ? "H" + f1(this.sx(q[0])) + "V" + f1(this.sy(q[1])) : "M" + f1(this.sx(q[0])) + " " + f1(this.sy(q[1])); });
    this.clip.push('<path class="' + (cls || "fg-fit") + '" d="' + d + '"/>'); return this;
  };
  PP.band = function (lo, hi, cls) {
    const a = this._xy(lo), b = this._xy(hi).reverse();
    this.clip.push('<path class="' + (cls || "fg-band") + '" d="' + this._path(a.concat(b)) + 'Z"/>'); return this;
  };
  PP.shape = function (xy, cls) { this.clip.push('<path class="' + cls + '" d="' + this._path(xy) + 'Z"/>'); return this; };
  PP.seg = function (x1, y1, x2, y2, cls) {
    this.clip.push('<line class="' + (cls || "fg-res") + '" x1="' + f1(this.sx(x1)) + '" y1="' + f1(this.sy(y1)) + '" x2="' + f1(this.sx(x2)) + '" y2="' + f1(this.sy(y2)) + '"/>'); return this;
  };
  PP.vline = function (x, cls) { return this.seg(x, this.yd[0], x, this.yd[1], cls || "fg-ref"); };
  PP.hline = function (y, cls) { return this.seg(this.xd[0], y, this.xd[1], y, cls || "fg-ref"); };
  PP.rect = function (x1, y1, x2, y2, cls) {
    const a = this.sx(Math.min(x1, x2)), b = this.sy(Math.max(y1, y2));
    this.clip.push('<rect class="' + (cls || "fg-shade") + '" x="' + f1(a) + '" y="' + f1(b) + '" width="' + f1(Math.abs(this.sx(x2) - this.sx(x1))) + '" height="' + f1(Math.abs(this.sy(y2) - this.sy(y1))) + '"/>'); return this;
  };
  PP.bars = function (data, w, cls) {
    const base = this.sy(Math.max(0, this.yd[0])), pw = Math.max(2, Math.abs(this.sx(w) - this.sx(0)) - 2);
    for (const q of data) {
      const x = q[0], y = q[1], top = this.sy(y), h = Math.abs(top - base);
      if (h < 0.3) continue;
      this.clip.push('<rect class="' + (cls || "fg-bar") + '" rx="2" x="' + f1(this.sx(x) - pw / 2) + '" y="' + f1(Math.min(top, base)) + '" width="' + f1(pw) + '" height="' + f1(h) + '"/>');
    }
    return this;
  };
  PP.text = function (x, y, s, o) {
    o = o || {};
    this.over.push('<text class="fg-t ' + (o.cls || "") + '" text-anchor="' + (o.a || "start") + '" x="' + f1(this.sx(x) + (o.dx || 0)) + '" y="' + f1(this.sy(y) + (o.dy || 0)) + '">' + esc(s) + "</text>"); return this;
  };
  PP.raw = function (s) { this.over.push(s); return this; };
  PP.svg = function () {
    const m = this.m, W = this.W, H = this.H, o = this.o, x0 = m.l, x1 = W - m.r, y0 = H - m.b, y1 = m.t;
    let s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.alt || "Illustration") + '">';
    s += '<defs><clipPath id="' + this.id + '"><rect x="' + x0 + '" y="' + (y1 - 4) + '" width="' + (x1 - x0) + '" height="' + (y0 - y1 + 8) + '"/></clipPath></defs>';
    if (o.axes !== false) {
      s += '<line class="fg-axis" x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '"/>';
      if (o.yaxis !== false) s += '<line class="fg-axis" x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y1 + '"/>';
    }
    (o.tx || []).forEach((t) => { s += '<text class="fg-tick" text-anchor="middle" x="' + f1(this.sx(t[0])) + '" y="' + (y0 + 14) + '">' + esc(t[1]) + "</text>"; });
    (o.ty || []).forEach((t) => { s += '<text class="fg-tick" text-anchor="end" x="' + (x0 - 6) + '" y="' + f1(this.sy(t[0]) + 4) + '">' + esc(t[1]) + "</text>"; });
    if (o.xl) s += '<text class="fg-axl" text-anchor="middle" x="' + f1((x0 + x1) / 2) + '" y="' + (H - 5) + '">' + esc(o.xl) + "</text>";
    if (o.yl) s += '<text class="fg-axl" text-anchor="middle" transform="translate(' + (o.ty ? 11 : 15) + " " + f1((y0 + y1) / 2) + ') rotate(-90)">' + esc(o.yl) + "</text>";
    s += '<g clip-path="url(#' + this.id + ')">' + this.clip.join("") + "</g>" + this.over.join("") + "</svg>";
    return s;
  };
  const P = (o) => new Panel(o);

  /* ---------- data makers ---------- */
  function cloud(seed, n, fx, noise, xr) {
    const r = F.rng(seed), a = [];
    for (let i = 0; i < n; i++) {
      const x = xr ? xr[0] + r() * (xr[1] - xr[0]) : 0.4 + r() * 9.2;
      a.push({ x, y: fx(x) + (typeof noise === "function" ? noise(x) : noise) * F.normal(r) });
    }
    return a.sort((p, q) => p.x - q.x);
  }
  function dom(vals, pad) {
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    const d = (hi - lo) * (pad === undefined ? 0.1 : pad);
    return [lo - d, hi + d];
  }
  const lin = (seed, n) => cloud(seed, n || 36, (x) => 1.6 + 0.68 * x, 0.75);
  const TRUE = (x) => 5 + 3 * Math.sin(0.8 * x);
  const curve = (seed, n, noise) => cloud(seed, n || 30, TRUE, noise === undefined ? 0.8 : noise);
  const sd = (a) => { const m = F.mean(a); return Math.sqrt(F.mean(a.map((v) => (v - m) ** 2))); };
  const variance = (a) => { const m = F.mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1); };
  const corr = (a, b) => { const ma = F.mean(a), mb = F.mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / a.length / (sd(a) * sd(b)); };

  /* ---------- several predictors ---------- */
  function olsM(X, y) {          // with intercept; returns [b0, b1 ... bp]
    const n = X.length, p = X[0] ? X[0].length : 0, k = p + 1;
    const A = Array.from({ length: k }, () => new Array(k).fill(0)), b = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const row = [1].concat(X[i]);
      for (let a = 0; a < k; a++) { b[a] += row[a] * y[i]; for (let c = 0; c < k; c++) A[a][c] += row[a] * row[c]; }
    }
    for (let a = 0; a < k; a++) A[a][a] += 1e-9;
    return F.solve(A, b);
  }
  const predM = (beta, row) => { let s = beta[0]; for (let j = 0; j < row.length; j++) s += beta[j + 1] * row[j]; return s; };
  function standardise(X, y) {
    const n = X.length, p = X[0].length, Z = X.map((r) => r.slice());
    for (let j = 0; j < p; j++) { const col = X.map((r) => r[j]), m = F.mean(col), s = sd(col) || 1; for (let i = 0; i < n; i++) Z[i][j] = (X[i][j] - m) / s; }
    const yb = F.mean(y); return { Z, yc: y.map((v) => v - yb), n, p };
  }
  function ridgeM(X, y, lam) {
    const D = standardise(X, y), p = D.p, n = D.n;
    const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
    for (let i = 0; i < n; i++) for (let a = 0; a < p; a++) { b[a] += D.Z[i][a] * D.yc[i] / n; for (let c = 0; c < p; c++) A[a][c] += D.Z[i][a] * D.Z[i][c] / n; }
    for (let a = 0; a < p; a++) A[a][a] += lam;
    return F.solve(A, b);
  }
  function enetM(X, y, lam, l1) {
    const D = standardise(X, y), p = D.p, n = D.n, beta = new Array(p).fill(0), r = D.yc.slice();
    for (let it = 0; it < 4000; it++) {
      let delta = 0;
      for (let j = 0; j < p; j++) {
        let rho = 0; for (let k = 0; k < n; k++) rho += D.Z[k][j] * (r[k] + D.Z[k][j] * beta[j]);
        rho /= n;
        const thr = lam * l1, soft = rho > thr ? rho - thr : rho < -thr ? rho + thr : 0, nb = soft / (1 + lam * (1 - l1)), diff = nb - beta[j];
        if (diff !== 0) { for (let k = 0; k < n; k++) r[k] -= D.Z[k][j] * diff; beta[j] = nb; }
        delta = Math.max(delta, Math.abs(diff));
      }
      if (delta < 1e-8) break;
    }
    return beta;
  }
  /* 8 predictors: x1..x3 are near copies of one another, x6 stands alone, the rest are noise */
  const TRUE_BETA = [1, 1, 1, 0, 0, 1.5, 0, 0];
  function groupSim(seed, n) {
    const r = F.rng(seed), X = [], y = [];
    for (let i = 0; i < n; i++) {
      const z = F.normal(r), row = [];
      for (let j = 0; j < 8; j++) row.push(j < 3 ? z + 0.22 * F.normal(r) : F.normal(r));
      X.push(row); y.push(row.reduce((s, v, j) => s + v * TRUE_BETA[j], 0) + 1.2 * F.normal(r));
    }
    return { X, y };
  }
  const XT = [1, 2, 3, 4, 5, 6, 7, 8].map((j) => [j, "x" + j]);
  function coefBars(beta, alt) {
    const p = P({ x: [0.3, 8.7], y: [-0.3, 2.1], tx: XT, ty: [[0, "0"], [1, "1"], [2, "2"]], yl: "Coefficient", alt });
    p.hline(0, "fg-axis").bars(beta.map((b, j) => [j + 1, b]), 0.7);
    return p;
  }

  /* ---------- shared figures ---------- */
  function residData(kind) {
    const pts = kind === "good" ? lin(21, 60) : kind === "bend" ? cloud(22, 60, (x) => 1 + 0.085 * x * x, 0.55) : cloud(23, 60, (x) => 1.5 + 0.7 * x, (x) => 0.1 + 0.23 * x);
    const o = F.ols(pts);
    return pts.map((p) => ({ x: o.f(p.x), y: p.y - o.f(p.x) }));
  }
  function residPanel(kind) {
    const d = residData(kind), yr = Math.max.apply(null, d.map((q) => Math.abs(q.y))) * 1.15;
    const p = P({ x: dom(d.map((q) => q.x), 0.06), y: [-yr, yr], xl: "Predicted value", yl: "Residual", alt: "Residuals against predicted values" });
    p.hline(0, "fg-ref").pts(d);
    return p;
  }
  function residFig(where) {
    return {
      where: where || "practical", title: "The first diagnostic: plot residuals against predictions",
      lead: "A residual is what the model got wrong for one row (actual minus predicted). If the model has captured the pattern, what is left over should look like noise.",
      legend: [["pt", "One row's residual"], ["ref", "Zero error"]],
      panels: [
        { v: "good", h: "A shapeless cloud", p: residPanel("good"), c: "Even scatter above and below zero, the same width everywhere. Nothing systematic is left to explain." },
        { v: "bad", h: "A curve", p: residPanel("bend"), c: "Positive at both ends and negative in the middle: the model is missing a bend. Add a squared term, transform a variable, or switch to a flexible model." },
        { v: "bad", h: "A funnel", p: residPanel("funnel"), c: "Errors grow with the prediction (heteroscedasticity). Coefficients may be fine but the p-values and intervals are wrong. Model log(y), use robust standard errors, or use quantile regression." }
      ]
    };
  }

  function scaleFig(kind) {
    const r = F.rng(31), raw = [], std = [];
    for (let i = 0; i < 45; i++) { const inc = 20 + 180 * r(), age = 20 + 50 * r(); raw.push({ x: inc, y: age / 1000 }); std.push({ x: (inc - 110) / 52, y: (age - 45) / 14.4 }); }
    const a = P({ x: [0, 210], y: [0, 210], xl: "Income (thousands)", yl: "Age (same numeric scale)", tx: [[0, "0"], [100, "100k"], [200, "200k"]], alt: "Raw features drawn on one common scale" }).pts(raw);
    const b = P({ x: [-2.6, 2.6], y: [-2.6, 2.6], xl: "Income (standardised)", yl: "Age (standardised)", tx: [[-2, "−2"], [0, "0"], [2, "2"]], alt: "The same features after standardising" }).pts(std);
    const why = kind === "distance"
      ? ["Drawn in the same units, age differences (20 to 70) vanish next to income differences (20,000 to 200,000). \"Nearest\" now means \"closest income\"; age is ignored.", "After subtracting the mean and dividing by the standard deviation, one step in either direction counts the same, so both features shape the distances."]
      : ["Income in dollars needs a tiny coefficient and age in years a large one, yet the penalty charges both by size alone. The penalty lands unevenly for no good reason.", "After standardising, every coefficient is measured per standard deviation, so the penalty treats all features alike. Always scale inside the cross-validation pipeline."];
    return {
      where: "data", title: "Features must be on a common scale",
      panels: [
        { v: "bad", h: "Raw units", p: a, c: why[0] },
        { v: "good", h: "Standardised", p: b, c: why[1] }
      ]
    };
  }

  /* flexible models cannot continue a trend past the data they saw */
  function extrapPanel(kind) {
    const tr = cloud(41, 34, (x) => 1 + 0.75 * x + 0.5 * Math.sin(1.4 * x), 0.45, [0.3, 6.5]);
    const te = cloud(42, 12, (x) => 1 + 0.75 * x + 0.5 * Math.sin(1.4 * x), 0.45, [6.8, 9.8]);
    const m = kind === "tree" ? F.tree(tr, 4, 2) : kind === "rf" ? F.forest(tr, 120, 5, 3) : F.boost(tr, 120, 0.2, 2);
    const p = P({ y: [0, 10.5], xl: "Time →", yl: "Sales", alt: "A tree-based model predicting a flat line beyond its training range" });
    p.rect(6.65, 0, 10, 10.5).pts(tr).pts(te, "fg-pt-hollow").line(m.f).text(8.3, 1.1, "Not in training data", { a: "middle", cls: "fg-tm" });
    return p;
  }
  function extrapFig(kind) {
    return { v: "bad", h: "A trend that keeps going", p: extrapPanel(kind), c: "Tree-based models predict averages of outcomes they have already seen, so beyond the training range the prediction goes flat while the real values (hollow points) keep climbing. For growing series, model the change or the ratio instead, or combine with a linear trend." };
  }

  function poisPmf(k, m) { let p = Math.exp(-m); for (let i = 1; i <= k; i++) p *= m / i; return p; }
  function nbDraw(r, mean, size) { let g = 0; for (let i = 0; i < size; i++) g += -Math.log(1 - r()); return F.poissonDraw(r, g * mean / size); }
  function countSample(kind, n) {
    const r = F.rng(kind === "pois" ? 51 : kind === "over" ? 52 : 53), a = [];
    for (let i = 0; i < n; i++) a.push(kind === "pois" ? F.poissonDraw(r, 3) : kind === "over" ? nbDraw(r, 3, 1) : (r() < 0.38 ? 0 : F.poissonDraw(r, 4.6)));
    return a;
  }
  function countHist(kind, plain) {
    const s = countSample(kind, 400), m = F.mean(s), v = variance(s), K = 13, freq = new Array(K + 1).fill(0);
    s.forEach((c) => { freq[Math.min(c, K)]++; });
    const bars = freq.map((c, k) => [k, c / s.length]), top = Math.max(0.3, Math.max.apply(null, bars.map((b) => b[1])) * 1.12);
    const p = P({ x: [-0.7, K + 0.7], y: [0, top], xl: "Count per unit", yl: "Share of units", tx: [[0, "0"], [4, "4"], [8, "8"], [12, "12+"]], alt: "Histogram of counts with the Poisson expectation" });
    const pm = []; for (let k = 0; k <= K; k++) pm.push({ x: k, y: poisPmf(k, m) });
    p.bars(bars, 0.92); if (plain) return p; p.line(pm, "fg-fit").pts(pm, "fg-pt2", 2.6);
    p.text(K + 0.4, top * 0.9, "mean " + m.toFixed(1), { a: "end" }).text(K + 0.4, top * 0.78, "variance " + v.toFixed(1), { a: "end" });
    return p;
  }

  /* Kaplan-Meier steps from times and event flags */
  function km(obs) {
    const s = obs.slice().sort((a, b) => a.t - b.t); let S = 1, at = s.length; const out = [[0, 1]];
    for (const o of s) { if (o.e) { S *= 1 - 1 / at; out.push([o.t, S]); } at--; }
    out.push([10, S]); return out;
  }

  /* ---------- registry and DOM rendering ---------- */
  const reg = {}, cache = {};
  const BADGE = { good: "✓ Looks right", bad: "✗ Warning sign", note: "● Worth knowing" };
  const SW = { pt: "sw-dot", pt2: "sw-dot sw-2", pt3: "sw-dot sw-3", hollow: "sw-dot sw-hollow", fit: "sw-line", fit1: "sw-line sw-1", fit3: "sw-line sw-3", ink: "sw-line sw-ink", ref: "sw-line sw-ref", band: "sw-band", res: "sw-res", bar: "sw-bar", ring: "sw-ring" };
  function render(fig) {
    const f = document.createElement("figure"); f.className = "fig";
    let h = '<figcaption class="fig-title">' + fig.title + "</figcaption>";
    if (fig.lead) h += '<p class="fig-lead">' + fig.lead + "</p>";
    if (fig.legend) h += '<div class="fig-legend">' + fig.legend.map((l) => '<span class="lg-item"><i class="' + SW[l[0]] + '"></i>' + l[1] + "</span>").join("") + "</div>";
    h += '<div class="fig-grid' + (fig.panels.length === 1 ? " one" : "") + '">';
    fig.panels.forEach((pn) => {
      h += '<div class="fig-panel ' + (pn.v || "") + '">';
      if (pn.v) h += '<div class="fig-badge">' + (pn.b || BADGE[pn.v]) + "</div>";
      if (pn.h) h += "<h4>" + pn.h + "</h4>";
      h += (pn.p.svg ? pn.p.svg() : pn.p) + (pn.c ? "<p>" + pn.c + "</p>" : "") + "</div>";
    });
    f.innerHTML = h + "</div>";
    return f;
  }
  function get(id) {
    if (!reg[id]) return [];
    if (!cache[id]) { try { cache[id] = reg[id](); } catch (e) { console.error("figure " + id, e); cache[id] = []; } }
    return cache[id];
  }

  window.Figures = {
    add: (id, fn) => { reg[id] = fn; },
    get, render,
    nodes: (id, where) => get(id).filter((f) => f.where === where).map(render),
    h: { P, cloud, dom, lin, curve, TRUE, sd, variance, corr, n2, olsM, predM, ridgeM, enetM, groupSim, TRUE_BETA, coefBars, XT, residFig, scaleFig, extrapFig, countHist, countSample, poisPmf, nbDraw, km }
  };
})();
