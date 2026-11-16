/* Interactive "Try it" plots. Each demo fits a real model in the browser. */
(function () {
  const F = window.Fits;
  const W = 680, H = 380, M = { l: 46, r: 16, t: 14, b: 38 };
  const num = (v, d) => (Number.isFinite(v) ? v.toFixed(d === undefined ? 2 : d) : "–");
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function normCdf(z) {            // Abramowitz-Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }

  /* ---------- sample data ---------- */
  const KINDS = {
    linear: { ydom: [0, 10], n: 24, truth: (x) => 1.5 + 0.7 * x, sd: 0.9 },
    curve: { ydom: [0, 10], n: 30, truth: (x) => 5 + 3 * Math.sin(0.8 * x), sd: 0.9 },
    binary: { ydom: [-0.12, 1.12], n: 34, snap: (y) => (y >= 0.5 ? 1 : 0),
      draw: (r, x) => (r() < sig(1.1 * (x - 5)) ? 1 : 0) },
    counts: { ydom: [0, 30], n: 32, snap: (y) => Math.max(0, Math.round(y)),
      draw: (r, x) => F.poissonDraw(r, Math.exp(0.3 + 0.25 * x)) },
    spread: { ydom: [0, 10], n: 48, draw: (r, x) => 1 + 0.45 * x + F.normal(r) * (0.1 + 0.2 * x) },
    outliers: { ydom: [0, 10], n: 24, draw: (r, x, i) => 2 + 0.55 * x + F.normal(r) * 0.45 + (i % 8 === 3 ? 3.2 : 0) },
    few: { ydom: [0, 10], n: 12, truth: (x) => 2 + 0.6 * x, sd: 1 }
  };
  function sample(kind, seed, n) {
    const K = KINDS[kind], r = F.rng(seed), pts = [];
    for (let i = 0; i < (n || K.n); i++) {
      const x = 0.3 + r() * 9.4;
      let y = K.draw ? K.draw(r, x, i) : K.truth(x) + K.sd * F.normal(r);
      y = clamp(y, K.snap ? 0 : K.ydom[0] + 0.1, K.ydom[1] > 1.5 ? K.ydom[1] - 0.1 : 1);
      pts.push({ x, y });
    }
    return pts;
  }
  const fresh = {};
  function freshRmse(kind, f) {
    if (!KINDS[kind].truth) return null;
    if (!fresh[kind]) fresh[kind] = sample(kind, 424242, 400);
    return F.rmse(fresh[kind], f);
  }
  const errInfo = (kind, pts, f) => {
    const out = [["Error on these points (RMSE)", num(F.rmse(pts, f))]];
    const fr = freshRmse(kind, f);
    if (fr !== null) out.push(["Error on 400 fresh points", num(fr)]);
    return out;
  };
  const lam = (v) => Math.pow(10, v);
  const lamFmt = (v) => { const l = lam(v); return l >= 1 ? l.toFixed(1) : l >= 0.01 ? l.toFixed(3) : l.toExponential(1); };
  const coefList = (beta) => beta.map((b, j) => ({ name: "x" + (j === 0 ? "" : "<sup>" + (j + 1) + "</sup>"), val: b }));

  /* ---------- demo definitions ---------- */
  const DEMOS = {
    simple: {
      data: "linear", sliders: [],
      hint: "Click the plot to add a point, or click a point to remove it. Put one far from the rest and watch how much a single outlier moves the line.",
      fit(pts) {
        const o = F.ols(pts);
        return { f: o.f, residuals: true, info: [["Slope", num(o.b1)], ["Intercept", num(o.b0)], ["R²", num(F.r2(pts, o.f))], ["RMSE", num(F.rmse(pts, o.f))]] };
      }
    },
    poly: {
      data: "curve",
      sliders: [{ key: "d", label: "Polynomial degree", min: 1, max: 12, step: 1, val: 3 }],
      hint: "Raise the degree. Error on the points you can see keeps falling. Error on fresh data from the same process falls, then rises: that turning point is overfitting.",
      fit(pts, p) { const m = F.poly(pts, p.d); return { f: m.f, info: errInfo("curve", pts, m.f) }; }
    },
    ridge: {
      data: "curve",
      sliders: [{ key: "l", label: "Penalty λ", min: -6, max: 1.5, step: 0.1, val: -3, fmt: lamFmt }],
      hint: "The model is a degree-8 polynomial. With λ near zero it wiggles. Increase λ: every coefficient shrinks smoothly, none reaches exactly zero, and the curve calms down.",
      fit(pts, p) {
        const m = F.ridge(pts, lam(p.l), 8);
        return { f: m.f, coefs: coefList(m.beta), info: errInfo("curve", pts, m.f).concat([["Coefficients at zero", "0 of 8"]]) };
      }
    },
    lasso: {
      data: "curve",
      sliders: [{ key: "l", label: "Penalty λ", min: -4, max: 0.6, step: 0.05, val: -1.6, fmt: lamFmt }],
      hint: "Same degree-8 polynomial, different penalty. Increase λ and coefficients drop to exactly zero one after another. Compare the bars with the ridge demo.",
      fit(pts, p) {
        const m = F.enet(pts, lam(p.l), 1, 8);
        return { f: m.f, coefs: coefList(m.beta), info: errInfo("curve", pts, m.f).concat([["Coefficients at zero", m.beta.filter((b) => b === 0).length + " of 8"]]) };
      }
    },
    enet: {
      data: "curve",
      sliders: [
        { key: "l", label: "Penalty λ", min: -4, max: 0.6, step: 0.05, val: -1.6, fmt: lamFmt },
        { key: "a", label: "L1 share (0 = ridge, 1 = lasso)", min: 0, max: 1, step: 0.05, val: 0.5 }
      ],
      hint: "Slide the L1 share from 1 toward 0 at a fixed λ. Zeroed coefficients come back and the weight spreads across the correlated powers of x.",
      fit(pts, p) {
        const m = F.enet(pts, lam(p.l), p.a, 8);
        return { f: m.f, coefs: coefList(m.beta), info: errInfo("curve", pts, m.f).concat([["Coefficients at zero", m.beta.filter((b) => b === 0).length + " of 8"]]) };
      }
    },
    logit: {
      data: "binary", ylabel: "probability of y = 1",
      hint: "Each point is a yes (top) or a no (bottom). Click in the upper or lower half to add one. Separate the two groups completely and the curve turns into a step: that is perfect separation.",
      sliders: [],
      fit(pts) {
        const m = F.logistic(pts);
        return { f: m.f, info: [["Odds ratio per +1 in x", num(Math.exp(m.b1))], ["x where probability = 50%", Math.abs(m.b1) > 1e-6 ? num(-m.b0 / m.b1) : "–"], ["Coefficient (log-odds)", num(m.b1)]] };
      }
    },
    pois: {
      data: "counts", ylabel: "count",
      hint: "The points are counts. The fitted mean curves upward because effects multiply. Notice the scatter widening as the mean grows, which the Poisson model expects.",
      sliders: [],
      fit(pts) {
        const m = F.poisson(pts), mu = pts.map((p) => m.f(p.x));
        let chi = 0; pts.forEach((p, i) => { chi += (p.y - mu[i]) ** 2 / Math.max(mu[i], 1e-9); });
        return { f: m.f, info: [["Rate ratio per +1 in x", num(Math.exp(m.b1))], ["Expected count at x = 0", num(Math.exp(m.b0))], ["Dispersion (≈1 if Poisson fits)", num(chi / Math.max(pts.length - 2, 1))]] };
      }
    },
    quant: {
      data: "spread",
      sliders: [{ key: "t", label: "Quantile τ", min: 0.05, max: 0.95, step: 0.05, val: 0.9 }],
      hint: "The spread of y grows with x. Move τ and compare the quantile line with the dashed mean line: their slopes differ, which a mean-only model cannot show.",
      fit(pts, p) {
        const m = F.quantile(pts, p.t), o = F.ols(pts);
        const below = pts.filter((q) => q.y <= m.f(q.x) + 1e-9).length / (pts.length || 1);
        return { f: m.f, ref: o.f, refLabel: "mean (least squares)", fitLabel: "quantile line",
          info: [["Slope at this quantile", num(m.b1)], ["Slope of the mean", num(o.b1)], ["Share of points on or below line", Math.round(below * 100) + "%"]] };
      }
    },
    tree: {
      data: "curve",
      sliders: [{ key: "d", label: "Maximum depth", min: 1, max: 8, step: 1, val: 3 }],
      hint: "A tree predicts a flat average inside each region, so the fit is a staircase. Increase depth until each step holds a single point.",
      fit(pts, p) { const m = F.tree(pts, p.d, 1); return { f: m.f, info: [["Leaves", String(m.leaves)]].concat(errInfo("curve", pts, m.f)) }; }
    },
    rf: {
      data: "curve",
      sliders: [{ key: "b", label: "Number of trees", min: 1, max: 200, step: 1, val: 1 }],
      hint: "Start with one deep tree: jagged and overfitted. Add trees. Each is as jagged as the first, but their average smooths out and the error on fresh data falls, then flattens.",
      fit(pts, p) { const m = F.forest(pts, p.b, 6, 7); return { f: m.f, info: errInfo("curve", pts, m.f) }; }
    },
    gbm: {
      data: "curve",
      sliders: [
        { key: "m", label: "Boosting rounds", min: 0, max: 300, step: 1, val: 5 },
        { key: "lr", label: "Learning rate", min: 0.02, max: 1, step: 0.02, val: 0.1 }
      ],
      hint: "Round 0 is a flat line at the mean. Each round adds a small tree fitted to the remaining errors. Keep adding rounds and watch fresh-data error bottom out and climb again. Then try a larger learning rate.",
      fit(pts, p) { const m = F.boost(pts, p.m, p.lr, 2); return { f: m.f, info: errInfo("curve", pts, m.f) }; }
    },
    svr: {
      data: "outliers",
      sliders: [
        { key: "e", label: "Tube half-width ε", min: 0, max: 3, step: 0.1, val: 0.8 },
        { key: "c", label: "Penalty C", min: -2, max: 2, step: 0.1, val: 0, fmt: (v) => lam(v).toFixed(2) }
      ],
      hint: "Points inside the shaded tube cost nothing. Ringed points are support vectors, the only ones that shape the line. The dashed least-squares line is pulled up by the outliers; the SVR line much less.",
      fit(pts, p) {
        const m = F.svr(pts, p.e, lam(p.c)), o = F.ols(pts);
        return { f: m.f, tube: p.e, sv: m.isSV, ref: o.f, refLabel: "least squares", fitLabel: "SVR line",
          info: [["Support vectors", pts.filter(m.isSV).length + " of " + pts.length], ["SVR slope", num(m.b1)], ["Least-squares slope", num(o.b1)]] };
      }
    },
    knn: {
      data: "curve",
      sliders: [{ key: "k", label: "Neighbours k", min: 1, max: 30, step: 1, val: 5 }],
      hint: "With k = 1 the prediction copies the nearest point. Raise k and it smooths, then flattens toward the overall mean. Look at the edges, where all neighbours lie on one side.",
      fit(pts, p) { const m = F.knn(pts, p.k); return { f: m.f, info: errInfo("curve", pts, m.f) }; }
    },
    bayes: {
      data: "few",
      sliders: [
        { key: "n", label: "Data points observed", min: 0, max: 12, step: 1, val: 2 },
        { key: "a", label: "Prior strength (pull toward zero slope)", min: -2, max: 2.5, step: 0.1, val: 0, fmt: (v) => lam(v).toFixed(2) }
      ],
      hint: "Thin lines are plausible regression lines drawn from the posterior. With no data they fan out widely. Reveal points one at a time and they tighten, most of all where the data are.",
      fit(pts, p) {
        const used = pts.slice(0, p.n), m = F.bayes(used, lam(p.a), 1, 11);
        const prob = m.slopeSd > 0 ? normCdf(m.slope / m.slopeSd) : NaN;
        return { f: m.f, band: { lo: (x) => m.f(x) - 2 * m.sd(x), hi: (x) => m.f(x) + 2 * m.sd(x) }, draws: m.draws, used: p.n,
          fitLabel: "posterior mean", bandLabel: "95% credible band",
          info: [["Slope (posterior mean ± sd)", num(m.slope) + " ± " + num(m.slopeSd)], ["Probability slope > 0", Number.isFinite(prob) ? Math.round(prob * 100) + "%" : "–"]] };
      }
    }
  };

  /* ---------- rendering ---------- */
  function mount(host, id) {
    const D = DEMOS[id]; if (!D) return;
    const K = KINDS[D.data], y0 = K.ydom[0], y1 = K.ydom[1];
    let seed = 20, pts = sample(D.data, seed);
    const params = {}; D.sliders.forEach((s) => { params[s.key] = s.val; });
    const sx = (x) => M.l + (x / 10) * (W - M.l - M.r);
    const sy = (y) => M.t + (1 - (y - y0) / (y1 - y0)) * (H - M.t - M.b);

    host.innerHTML =
      '<p class="pg-hint"></p><div class="pg-controls"></div><div class="pg-legend"></div>' +
      '<div class="pg-plot"><svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Interactive plot of the fitted model"></svg><div class="pg-tip" hidden></div></div>' +
      '<div class="pg-coefs"></div><dl class="pg-info"></dl>' +
      '<div class="pg-actions"><button type="button" data-a="new">New random sample</button><button type="button" data-a="reset">Reset</button></div>';
    host.querySelector(".pg-hint").textContent = D.hint;
    const svg = host.querySelector("svg"), tip = host.querySelector(".pg-tip");
    const ctr = host.querySelector(".pg-controls");

    D.sliders.forEach((s) => {
      const row = document.createElement("label"); row.className = "pg-slider";
      const show = (v) => (s.fmt ? s.fmt(v) : String(+(+v).toFixed(2)));
      row.innerHTML = '<span class="pg-slabel">' + s.label + '</span><input type="range" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.val + '"><output>' + show(s.val) + "</output>";
      const input = row.querySelector("input"), out = row.querySelector("output");
      input.addEventListener("input", () => { params[s.key] = +input.value; out.textContent = show(+input.value); draw(); });
      s._reset = () => { input.value = s.val; params[s.key] = s.val; out.textContent = show(s.val); };
      ctr.appendChild(row);
    });

    let last = null;
    function path(f) {
      let d = ""; const span = y1 - y0;
      for (let i = 0; i <= 340; i++) {
        const x = (i / 340) * 10, y = clamp(f(x), y0 - span, y1 + span);
        d += (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(y).toFixed(1);
      }
      return d;
    }
    function draw() {
      if (pts.length < 2 && id !== "bayes") { pts = sample(D.data, seed); }
      const R = D.fit(pts, params); last = R;
      let s = '<defs><clipPath id="clip-' + id + '"><rect x="' + M.l + '" y="' + M.t + '" width="' + (W - M.l - M.r) + '" height="' + (H - M.t - M.b) + '"/></clipPath></defs>';
      const ticks = y1 > 20 ? [0, 10, 20, 30] : y1 > 2 ? [0, 2, 4, 6, 8, 10] : [0, 0.25, 0.5, 0.75, 1];
      ticks.forEach((t) => {
        s += '<line class="pg-grid" x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + sy(t) + '" y2="' + sy(t) + '"/>';
        s += '<text class="pg-tick" x="' + (M.l - 8) + '" y="' + (sy(t) + 4) + '" text-anchor="end">' + t + "</text>";
      });
      for (let t = 0; t <= 10; t += 2) s += '<text class="pg-tick" x="' + sx(t) + '" y="' + (H - M.b + 18) + '" text-anchor="middle">' + t + "</text>";
      s += '<line class="pg-axis" x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + (H - M.b) + '" y2="' + (H - M.b) + '"/>';
      s += '<text class="pg-tick" x="' + (W - M.r) + '" y="' + (H - 4) + '" text-anchor="end">x</text>';
      s += '<g clip-path="url(#clip-' + id + ')">';
      const bandOf = R.band || (R.tube !== undefined ? { lo: (x) => R.f(x) - R.tube, hi: (x) => R.f(x) + R.tube } : null);
      if (bandOf) {
        let d = path(bandOf.hi);
        for (let i = 340; i >= 0; i--) { const x = (i / 340) * 10; d += "L" + sx(x).toFixed(1) + " " + sy(clamp(bandOf.lo(x), y0 - (y1 - y0), y1 + (y1 - y0))).toFixed(1); }
        s += '<path class="pg-band" d="' + d + 'Z"/>';
      }
      if (R.draws) R.draws.forEach((f) => { s += '<path class="pg-draw" d="' + path(f) + '"/>'; });
      if (R.ref) s += '<path class="pg-ref" d="' + path(R.ref) + '"/>';
      if (R.residuals) pts.forEach((p) => { s += '<line class="pg-res" x1="' + sx(p.x) + '" x2="' + sx(p.x) + '" y1="' + sy(p.y) + '" y2="' + sy(R.f(p.x)) + '"/>'; });
      s += '<path class="pg-fit" d="' + path(R.f) + '"/>';
      pts.forEach((p, i) => {
        const unused = R.used !== undefined && i >= R.used;
        if (R.sv && R.sv(p)) s += '<circle class="pg-sv" cx="' + sx(p.x) + '" cy="' + sy(p.y) + '" r="9"/>';
        s += '<circle class="pg-point' + (unused ? " pg-unused" : "") + '" cx="' + sx(p.x) + '" cy="' + sy(p.y) + '" r="5"/>';
      });
      s += "</g>";
      svg.innerHTML = s;

      const leg = [['<span class="lg-dot"></span>', R.used !== undefined ? "observed data (hollow = not yet seen)" : "data"],
        ['<span class="lg-line"></span>', R.fitLabel || "fitted model"]];
      if (R.ref) leg.push(['<span class="lg-line lg-ref"></span>', R.refLabel]);
      if (R.band) leg.push(['<span class="lg-band"></span>', R.bandLabel || "band"]);
      if (R.tube !== undefined) leg.push(['<span class="lg-band"></span>', "ε-tube"], ['<span class="lg-sv"></span>', "support vector"]);
      if (R.residuals) leg.push(['<span class="lg-res"></span>', "residual"]);
      host.querySelector(".pg-legend").innerHTML = leg.map((l) => '<span class="lg-item">' + l[0] + l[1] + "</span>").join("");

      host.querySelector(".pg-info").innerHTML = R.info.map((r) => "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>").join("");
      const cf = host.querySelector(".pg-coefs");
      if (R.coefs) {
        const mx = Math.max.apply(null, R.coefs.map((c) => Math.abs(c.val)).concat([1e-9]));
        cf.innerHTML = '<div class="cf-title">Coefficients on the standardised terms (bar length = size)</div>' + R.coefs.map((c) =>
          '<div class="cf-row' + (c.val === 0 ? " cf-zero" : "") + '"><span class="cf-name">' + c.name + '</span><span class="cf-track"><span class="cf-bar" style="width:' + (Math.abs(c.val) / mx * 100).toFixed(1) + '%"></span></span><span class="cf-val">' + (c.val === 0 ? "0" : c.val.toFixed(2)) + "</span></div>").join("");
      } else cf.innerHTML = "";
    }

    function toData(ev) {
      const r = svg.getBoundingClientRect();
      const px = (ev.clientX - r.left) * (W / r.width), py = (ev.clientY - r.top) * (H / r.height);
      return { px, py, x: (px - M.l) / (W - M.l - M.r) * 10, y: y0 + (1 - (py - M.t) / (H - M.t - M.b)) * (y1 - y0) };
    }
    function nearest(px, py) {
      let bi = -1, bd = 14;
      pts.forEach((p, i) => { const d = Math.hypot(sx(p.x) - px, sy(p.y) - py); if (d < bd) { bd = d; bi = i; } });
      return bi;
    }
    svg.addEventListener("click", (ev) => {
      const m = toData(ev), i = nearest(m.px, m.py);
      if (i >= 0) { if (pts.length > 3) pts.splice(i, 1); }
      else if (m.x >= 0 && m.x <= 10 && m.y >= y0 && m.y <= y1) {
        const y = K.snap ? K.snap(m.y) : m.y;
        pts.push({ x: m.x, y });
      }
      tip.hidden = true; draw();
    });
    svg.addEventListener("mousemove", (ev) => {
      const m = toData(ev), i = nearest(m.px, m.py);
      if (i < 0 || !last) { tip.hidden = true; return; }
      const p = pts[i], r = svg.getBoundingClientRect(), fit = last.f(p.x);
      tip.innerHTML = "<b>x " + num(p.x, 1) + ", y " + num(p.y, K.snap ? 0 : 2) + "</b><br>model: " + num(fit) + (K.snap ? "" : "<br>residual: " + num(p.y - fit)) + "<br><i>click to remove</i>";
      tip.hidden = false;
      const left = sx(p.x) * (r.width / W), top = sy(p.y) * (r.height / H);
      tip.style.left = clamp(left + 12, 0, r.width - 150) + "px"; tip.style.top = Math.max(top - 70, 0) + "px";
    });
    svg.addEventListener("mouseleave", () => { tip.hidden = true; });
    host.querySelector(".pg-actions").addEventListener("click", (ev) => {
      const a = ev.target.getAttribute("data-a"); if (!a) return;
      if (a === "new") seed += 1; else { seed = 20; D.sliders.forEach((s) => s._reset()); }
      pts = sample(D.data, seed); draw();
    });
    draw();
  }

  window.Playground = { mount, has: (id) => !!DEMOS[id], DEMOS, sample };
})();
