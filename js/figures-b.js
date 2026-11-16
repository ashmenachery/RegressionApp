/* Figures for models 11 to 20, and the outcome gallery on the home page */
(function () {
  const F = window.Fits, G = window.Figures, H = G.h, P = H.P, cloud = H.cloud;
  const DATA_TITLE = "What the data should, and should not, look like";

  /* ================= Poisson ================= */
  const HIST_LEG = [["bar", "Observed counts"], ["pt2", "What a Poisson with the same mean expects"]];
  const histPanels = {
    pois: () => ({ v: "good", h: "Variance close to the mean", p: H.countHist("pois"), c: "The bars follow the Poisson shape, and the variance is about equal to the mean. That equality is the assumption Poisson regression makes." }),
    over: (v) => ({ v, h: "A long right tail (overdispersion)", p: H.countHist("over"), c: "More zeros and more very large counts than Poisson allows; the variance is several times the mean. Poisson would report standard errors that are far too small. Use negative binomial." }),
    zero: () => ({ v: "bad", h: "A spike at zero", p: H.countHist("zero"), c: "Far more zeros than either distribution expects, because some units can never have an event (customers with no account, machines switched off). Use a zero-inflated or hurdle model." })
  };
  G.add("pois", () => {
    const r = F.rng(151), d = []; for (let i = 0; i < 50; i++) { const x = 0.4 + 9.2 * r(); d.push({ x, y: F.poissonDraw(r, Math.exp(-0.5 + 0.31 * x)) }); }
    const o = F.ols(d), po = F.poisson(d), top = Math.max.apply(null, d.map((p) => p.y)) + 2;
    const mk = (f, alt) => P({ y: [-3.5, top], xl: "x (for example, store size)", yl: "Count of events", ty: [[0, "0"], [10, "10"]], alt }).hline(0, "fg-grid").pts(d).line(f);
    const a = mk(o.f, "A straight line through count data dipping below zero").text(0.3, -2.6, "predicts a negative count", { cls: "fg-tb" });
    const b = mk(po.f, "An exponential curve through count data");
    return [
      { where: "terms", title: "Why counts need their own model", legend: [["pt", "One store's count"], ["fit", "Fitted model"]], panels: [
        { v: "bad", h: "Straight line", p: a, c: "A line dips below zero for small x, and it ignores the fact that counts scatter more when the expected count is higher." },
        { v: "good", h: "Poisson regression (log link)", p: b, c: "The model works on the log of the expected count, so the curve can never go negative and each unit of x multiplies the expected count by a fixed factor (the rate ratio)." }
      ] },
      { where: "data", title: DATA_TITLE, lead: "Before fitting, compare the mean and the variance of your counts. Each panel is 400 simulated units.", legend: HIST_LEG, panels: [histPanels.pois(), histPanels.over("bad"), histPanels.zero()] }
    ];
  });

  /* ================= negative binomial ================= */
  G.add("nb", () => {
    const m = 4, size = 1.5, pp = size / (size + m), nbp = [Math.pow(pp, size)];
    for (let k = 0; k < 16; k++) nbp.push(nbp[k] * (k + size) / (k + 1) * (1 - pp));
    const ks = Array.from({ length: 17 }, (_, k) => k), pa = ks.map((k) => ({ x: k, y: H.poisPmf(k, m) })), pb = ks.map((k) => ({ x: k, y: nbp[k] }));
    const pc = P({ w: 640, h: 270, x: [-0.5, 16.5], y: [0, 0.22], xl: "Count", yl: "Probability", tx: [0, 4, 8, 12, 16].map((k) => [k, String(k)]), ty: [[0, "0%"], [0.1, "10%"], [0.2, "20%"]], alt: "Poisson and negative binomial distributions with the same mean" });
    pc.vline(4, "fg-ref").line(pa, "fg-fit1").pts(pa, "fg-pt", 3).line(pb).pts(pb, "fg-pt2", 3);
    pc.text(4, 0.22, "both have mean 4", { dx: 6, dy: 12, cls: "fg-tm" }).text(5.6, H.poisPmf(5, m), "Poisson: variance 4", { dx: 4, dy: -4, cls: "fg-tb" }).text(11, nbp[11], "Negative binomial: variance " + (m + m * m / size).toFixed(0), { dx: 0, dy: -12, cls: "fg-tb" });
    const r = F.rng(161), mv = [];
    for (let g = 1; g <= 12; g++) { const s = []; for (let i = 0; i < 150; i++) s.push(H.nbDraw(r, g, 2)); mv.push({ x: F.mean(s), y: H.variance(s) }); }
    const vp = P({ x: [0, 13.5], y: [0, 105], xl: "Mean count in a group", yl: "Variance in that group", tx: [[0, "0"], [5, "5"], [10, "10"]], ty: [[0, "0"], [50, "50"], [100, "100"]], alt: "Variance against mean for twelve groups" });
    vp.line((x) => x, "fg-ref").line((x) => x + x * x / 2).pts(mv);
    return [
      { where: "terms", title: "Same average, very different spread", legend: [["pt", "Poisson"], ["pt2", "Negative binomial"]], panels: [{ p: pc, c: "Both distributions average 4 events. Poisson insists the variance is also 4. The negative binomial adds a dispersion parameter that lets the variance be larger, putting more weight on zero and on very high counts. Real counts (claims, visits, defects) nearly always look like the orange curve." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "One group of units"], ["ref", "What Poisson assumes"], ["fit", "Negative binomial"], ["bar", "Observed counts"]], panels: [
        { v: "good", h: "Variance climbs faster than the mean", p: vp, c: "Group your data (by region, by month), then plot each group's variance against its mean. Points well above the dashed line mean overdispersion: the case this model is for." },
        histPanels.over("good"),
        histPanels.zero()
      ] }
    ];
  });

  /* ================= quantile ================= */
  G.add("quant", () => {
    const pin = (tau) => (u) => (u >= 0 ? tau * u : (tau - 1) * u);
    const lp = P({ w: 640, h: 270, x: [-3, 3], y: [0, 2.9], xl: "Residual: actual − predicted", yl: "Penalty", tx: [[-3, "−3"], [0, "0"], [3, "+3"]], alt: "Pinball loss for the median and for the 90th percentile" });
    lp.vline(0, "fg-grid").line(pin(0.5), "fg-fit1").line(pin(0.9)).text(-2.9, 1.45, "Median (τ = 0.5): both sides cost the same", { dy: -8, cls: "fg-tb" }).text(2.9, 2.61, "90th percentile (τ = 0.9)", { a: "end", dx: -22, dy: 2, cls: "fg-tb" });
    lp.text(-1.5, 0.15, "predicted too high", { a: "middle", dy: 24, cls: "fg-tm" }).text(1.5, 0.15, "predicted too low", { a: "middle", dy: 24, cls: "fg-tm" });
    const fan = cloud(171, 70, (x) => 1.4 + 0.42 * x, (x) => 0.12 + 0.2 * x), even = H.lin(172, 70);
    const three = (d) => { const p = P({ xl: "x", yl: "y", alt: "10th, 50th and 90th percentile lines" }).pts(d); [0.1, 0.9].forEach((t) => p.line(F.quantile(d, t).f, "fg-ref")); p.line(F.quantile(d, 0.5).f); return p; };
    const base = cloud(173, 34, (x) => 1.5 + 0.5 * x, 0.5), outs = [{ x: 7.6, y: 9.6 }, { x: 8.4, y: 9.9 }, { x: 9.1, y: 9.4 }, { x: 8.9, y: 9.8 }], od = base.concat(outs);
    const op = P({ xl: "x", yl: "y", alt: "Median line and mean line with outliers present" }).pts(base).pts(outs, "fg-pt-hollow").line(F.ols(od).f, "fg-ink").line(F.quantile(od, 0.5).f);
    return [
      { where: "math", title: "The pinball loss, drawn", legend: [["fit1", "τ = 0.5"], ["fit", "τ = 0.9"]], panels: [{ p: lp, c: "For the 90th percentile, predicting too low costs nine times as much as predicting too high. To keep the total penalty down, the line has to rise until only about 10% of the points sit above it. Change τ and you change the tilt, and therefore which percentile the line settles on." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "Median (50th percentile)"], ["ref", "10th and 90th percentiles"], ["ink", "Least-squares mean line"]], panels: [
        { v: "good", h: "Spread that changes with x", p: three(fan), c: "The percentile lines fan out: x affects the top of the distribution more than the bottom. A single mean line would hide that. Typical of delivery times, incomes and costs." },
        { v: "good", h: "Outliers you cannot remove", p: op, c: "A few extreme rows (hollow) pull the mean line up. The median line barely moves, because it only cares which side of the line a point is on, not how far away." },
        { v: "note", h: "Even spread", b: "● Not needed here", p: three(even), c: "The percentile lines are parallel. Ordinary regression plus a constant margin gives the same answer with less noise." }
      ] }
    ];
  });

  /* ================= Cox ================= */
  function timeline(alt) {
    const S = [[2.3, 1], [10, 0], [4.8, 1], [6.2, 0], [10, 0], [7.9, 1], [3.3, 0], [9.0, 1]];
    const p = P({ x: [0, 11.6], y: [0.3, 8.9], xl: "Months since sign-up →", yaxis: false, alt: alt || "Customer timelines ending in an event or in censoring" });
    p.vline(10, "fg-ref").text(10, 8.9, "study ends", { a: "middle", dy: 8, cls: "fg-tm" });
    S.forEach((s, i) => { const y = 8 - i; p.seg(0, y, s[0], y, "fg-life").pts([{ x: s[0], y }], s[1] ? "fg-pt2" : "fg-pt-hollow", 4.2); });
    return p;
  }
  G.add("cox", () => {
    const sample = (seed, n, draw) => { const r = F.rng(seed), o = []; for (let i = 0; i < n; i++) { const t = draw(r); o.push({ t: Math.min(t, 10), e: t < 10 ? 1 : 0 }); } return o; };
    const ex = (h) => (r) => -Math.log(1 - r()) / h, wb = (sh, sc) => (r) => sc * Math.pow(-Math.log(1 - r()), 1 / sh);
    const at = (k, t) => { let s = 1; k.forEach((q) => { if (q[0] <= t) s = q[1]; }); return s; };
    const kmP = (a, b, la, lb, pa, pb) => { const p = P({ y: [0, 1.04], xl: "Months since sign-up", yl: "Share still active", ty: [[0, "0%"], [0.5, "50%"], [1, "100%"]], tx: [[0, "0"], [5, "5"], [10, "10"]], alt: "Survival curves for two groups" }); const ka = H.km(a), kb = H.km(b); p.steps(ka, "fg-fit1").steps(kb); p.text(pa[0], at(ka, pa[0]), la, { a: pa[1], dy: pa[2], cls: "fg-tb" }).text(pb[0], at(kb, pb[0]), lb, { a: pb[1], dy: pb[2], cls: "fg-tb" }); return p; };
    const tl = timeline(); tl.text(2.3, 8, "cancelled: event observed", { dx: 9, dy: 4 }).text(6.2, 5, "moved away: censored", { dx: 9, dy: 4 }).text(10, 4, "still active: censored", { a: "end", dx: -10, dy: 16 });
    const good = kmP(sample(181, 120, ex(0.07)), sample(182, 120, ex(0.19)), "Annual plan", "Monthly plan", [5, "start", -10], [5, "end", 17]);
    const bad = kmP(sample(183, 120, wb(0.55, 11)), sample(184, 120, wb(2.6, 7)), "Treatment A", "Treatment B", [2.3, "end", 18], [7.2, "end", 18]);
    return [
      { where: "terms", title: "Censoring and survival curves", legend: [["pt2", "Event happened"], ["hollow", "Censored: we stopped watching before any event"]], panels: [
        { h: "What the raw data looks like", p: tl, c: "Each line is one customer. Some cancel (filled). Others are still active when the study ends, or drop out of view (hollow). We know only that they lasted at least that long. Throwing those rows away, or treating them as events, biases everything. Survival models use them correctly." },
        { h: "The survival curve (Kaplan-Meier)", p: good, c: "Step down each time someone has the event, counting only those still being watched. The gap between the curves is what a hazard ratio summarises: here monthly customers leave at a consistently higher rate." }
      ] },
      { where: "data", title: "Checking the proportional-hazards assumption", lead: "Plot survival curves by group before fitting. Simulated data, 120 subjects per group.", panels: [
        { v: "good", h: "Curves that separate and stay apart", p: good, c: "One group is at higher risk by roughly the same factor the whole way through. A single hazard ratio is an honest summary." },
        { v: "bad", h: "Curves that cross", p: bad, c: "One group fails early then stabilises; the other holds up then drops. The risk ratio flips over time, so one hazard ratio averages a harmful period with a helpful one. Add a time-varying effect, stratify, or use another survival model." }
      ] }
    ];
  });

  /* ================= decision tree ================= */
  function split(pts) {
    const n = pts.length, tot = pts.reduce((s, p) => s + p.y, 0); let best = null, ls = 0;
    for (let i = 1; i < n; i++) { ls += pts[i - 1].y; if (i < 3 || n - i < 3) continue; const sc = ls * ls / i + (tot - ls) * (tot - ls) / (n - i) - tot * tot / n; if (!best || sc > best.gain) best = { gain: sc, s: (pts[i - 1].x + pts[i].x) / 2, l: pts.slice(0, i), r: pts.slice(i) }; }
    return best;
  }
  G.add("tree", () => {
    const d = cloud(191, 42, (x) => (x < 3.2 ? 2.4 : x < 6.8 ? 6.1 : 8.4), 0.45), mean = (a) => F.mean(a.map((p) => p.y));
    const s1 = split(d), sl = split(s1.l), sr = split(s1.r), right = sr.gain > sl.gain, s2 = right ? sr : sl;
    const f = (x) => (right ? (x < s1.s ? mean(s1.l) : x < s2.s ? mean(s2.l) : mean(s2.r)) : (x >= s1.s ? mean(s1.r) : x < s2.s ? mean(s2.l) : mean(s2.r)));
    const box = (cx, cy, t, leaf) => '<rect class="fg-node' + (leaf ? " leaf" : "") + '" x="' + (cx - 43) + '" y="' + (cy - 15) + '" width="86" height="30" rx="7"/><text class="fg-t fg-tb" text-anchor="middle" x="' + cx + '" y="' + (cy + 4) + '">' + t + "</text>";
    const edge = (x1, y1, x2, y2, t) => '<line class="fg-edge" x1="' + x1 + '" y1="' + (y1 + 15) + '" x2="' + x2 + '" y2="' + (y2 - 15) + '"/><text class="fg-t fg-tm" text-anchor="middle" x="' + ((x1 + x2) / 2 + (x2 < x1 ? -14 : 14)) + '" y="' + ((y1 + y2) / 2 + 3) + '">' + t + "</text>";
    const dg = P({ w: 360, h: 236, axes: false, alt: "A decision tree with two questions and three leaves" });
    const inner = right ? 270 : 90, leaf1 = right ? 90 : 270;
    dg.raw(edge(180, 34, 90, 112, "yes") + edge(180, 34, 270, 112, "no") + edge(inner, 112, inner - 45, 196, "yes") + edge(inner, 112, inner + 45, 196, "no"));
    dg.raw(box(180, 34, "x < " + s1.s.toFixed(1) + " ?") + box(inner, 112, "x < " + s2.s.toFixed(1) + " ?") + box(leaf1, 112, "predict " + (right ? mean(s1.l) : mean(s1.r)).toFixed(1), true) + box(inner - 45, 196, "predict " + mean(s2.l).toFixed(1), true) + box(inner + 45, 196, "predict " + mean(s2.r).toFixed(1), true));
    const fp = P({ w: 360, h: 236, xl: "x", yl: "y", alt: "The same tree drawn as a step function" }).vline(s1.s, "fg-ref").vline(s2.s, "fg-ref").pts(d).line(f);
    fp.text(s1.s, 10, "split 1", { a: "middle", dy: 8, cls: "fg-tm" }).text(s2.s, 10, "split 2", { a: "middle", dy: 8, cls: "fg-tm" });
    const ln = H.lin(192, 40), stair = P({ xl: "x", yl: "y", alt: "A tree approximating a straight trend with a staircase" }).pts(ln).line(F.tree(ln, 3, 3).f);
    const good = P({ xl: "x", yl: "y", alt: "A tree fitting data with clear thresholds" }).pts(d).line(f);
    const noisy = H.curve(193, 36, 1.0), deep = P({ xl: "x", yl: "y", alt: "An unpruned tree passing through every noisy point" }).line(H.TRUE, "fg-ref").pts(noisy).line(F.tree(noisy, 12, 1).f);
    return [
      { where: "terms", title: "A tree is a list of yes/no questions", legend: [["pt", "Data"], ["fit", "Tree prediction"], ["ref", "Split points"]], panels: [
        { h: "The tree", p: dg, c: "Start at the top (the root). Each question is a split; each box at the bottom is a leaf, and its prediction is simply the average outcome of the training rows that landed there." },
        { h: "The same tree as a prediction", p: fp, c: "Every split is a vertical cut, and between cuts the prediction is flat. The tree chose these two cut points because they reduce squared error the most." }
      ] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "Tree prediction"], ["ref", "True pattern"], ["hollow", "Later data, not used in training"]], panels: [
        { v: "good", h: "Thresholds and plateaus", p: good, c: "Outcomes that jump at cut-offs (pricing tiers, policy rules, age bands). A tree finds the cut points for you." },
        { v: "bad", h: "A smooth straight trend", p: stair, c: "A tree can only approximate a slope with a staircase, wasting many splits on something a linear model captures with one coefficient." },
        { v: "bad", h: "Grown without limits", p: deep, c: "With no depth limit or minimum leaf size, the tree gives every point its own leaf and memorises the noise. Limit depth, prune, or use a forest." },
        H.extrapFig("tree")
      ] }
    ];
  });

  /* ================= random forest ================= */
  G.add("rf", () => {
    const d = H.curve(201, 44, 1.0);
    const a = P({ xl: "x", yl: "y", alt: "Four individual trees giving four different jagged fits" }).pts(d, "fg-pt-faint"); [1, 2, 3, 4].forEach((s) => a.line(F.forest(d, 1, 8, s).f, "fg-path"));
    const b = P({ xl: "x", yl: "y", alt: "The average of 300 trees" }).line(H.TRUE, "fg-ref").pts(d, "fg-pt-faint").line(F.forest(d, 300, 8, 5).f);
    const r = F.rng(202), err = [[1, 2, 3, 5, 8, 12, 20, 35, 60, 100, 200].map((n) => n)][0].map((n) => ({ n, e: 0 })), te = H.curve(203, 400, 1.0);
    err.forEach((q) => { let s = 0; for (let k = 0; k < 6; k++) s += F.rmse(te, F.forest(d, q.n, 8, 1 + Math.floor(r() * 1e6)).f); q.e = s / 6; });
    const ep = P({ x: [-0.08, 2.38], y: [1.0, err[0].e * 1.06], xl: "Number of trees", yl: "Error on new data", tx: [[0, "1"], [1, "10"], [2, "100"]], alt: "New-data error falling and levelling off as trees are added" });
    const el = err.map((q) => ({ x: Math.log10(q.n), y: q.e })); ep.line(el, "fg-fit1").pts(el);
    const good = P({ xl: "x", yl: "y", alt: "A forest following an irregular pattern" }).pts(d).line(F.forest(d, 300, 5, 5).f);
    return [
      { where: "terms", title: "Many unstable trees, one stable average", legend: [["fit1", "A single deep tree"], ["fit", "Average of 300 trees"], ["ref", "True pattern"]], panels: [
        { h: "Four trees, four bootstrap samples", p: a, c: "Each tree is trained on a different random resample of the rows (bagging). Alone, each one is jagged and each is wrong in its own way." },
        { h: "Average them", p: b, c: "The trees' individual errors mostly cancel, leaving a steadier and more accurate prediction. Random feature subsets at each split make the trees differ more, so the averaging helps more." },
        { h: "More trees: better, then flat", p: ep, c: "Adding trees never causes overfitting; error drops quickly then levels off. Past a few hundred you are paying compute for nothing." }
      ] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Training data"], ["fit", "Forest prediction"], ["hollow", "Later data, not used in training"]], panels: [
        { v: "good", h: "Irregular, noisy, non-linear", p: good, c: "Tabular data with bends, thresholds and interactions you do not want to specify by hand. A forest handles it with almost no tuning." },
        H.extrapFig("rf")
      ] }
    ];
  });

  /* ================= gradient boosting ================= */
  G.add("gbm", () => {
    const d = H.curve(211, 44, 0.85), te = H.curve(212, 400, 0.85);
    const mk = (n) => P({ xl: "x", yl: "y", alt: "Boosted model after " + n + " rounds" }).line(H.TRUE, "fg-ref").pts(d, "fg-pt-faint").line(F.boost(d, n, 0.3, 2).f);
    const rounds = [0, 1, 2, 3, 5, 8, 12, 18, 27, 40, 60, 90, 140, 220, 350, 600], lx = (n) => Math.log10(n + 1);
    const trn = rounds.map((n) => { const m = F.boost(d, n, 0.3, 2); return { x: lx(n), y: F.rmse(d, m.f), v: F.rmse(te, m.f), n }; });
    const tst = trn.map((q) => ({ x: q.x, y: q.v, n: q.n })); let best = tst[0]; tst.forEach((q) => { if (q.y < best.y) best = q; });
    const ec = P({ w: 640, h: 280, x: [0, lx(600)], y: [0, trn[0].v * 1.08], xl: "Boosting rounds (number of trees)", yl: "Typical error (RMSE)", tx: [[lx(0), "0"], [lx(10), "10"], [lx(100), "100"], [lx(600), "600"]], ty: [[0, "0"], [1, "1"], [2, "2"]], alt: "Training and validation error by boosting round" });
    ec.line(trn, "fg-fit1").pts(trn).line(tst).pts(tst, "fg-pt2").vline(best.x, "fg-ref").text(best.x, trn[0].v * 1.08, "Early stopping: " + best.n + " rounds", { dx: 6, dy: 12, cls: "fg-tb" });
    ec.text(lx(600), trn[trn.length - 1].y, "training data", { a: "end", dy: -9 }).text(lx(600), tst[tst.length - 1].y, "validation data", { a: "end", dy: -9 });
    const good = P({ xl: "x", yl: "y", alt: "A boosted model following a non-linear pattern" }).pts(d).line(F.boost(d, best.n, 0.3, 2).f);
    return [
      { where: "terms", title: "Each round fixes a little of what is still wrong", legend: [["fit", "Model so far"], ["ref", "True pattern"]], panels: [
        { h: "After 1 tree", p: mk(1), c: "Start from the average, then add one shallow tree fitted to the residuals, scaled down by the learning rate. A crude first correction." },
        { h: "After 8 trees", p: mk(8), c: "Each new tree is fitted to whatever error remains. The shape is emerging." },
        { h: "After 60 trees", p: mk(60), c: "Many small corrections add up to a detailed fit. Keep going far beyond this and the model starts fitting the noise." }
      ] },
      { where: "math", title: "Why early stopping matters", legend: [["pt", "Error on the training data"], ["pt2", "Error on validation data"]], panels: [{ p: ec, c: "Unlike a random forest, boosting can overfit by running too long: training error heads toward zero while validation error turns back up. Hold out a validation set and stop when it stops improving (early_stopping_rounds in XGBoost and LightGBM)." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Training data"], ["fit", "Boosted model"], ["hollow", "Later data, not used in training"]], panels: [
        { v: "good", h: "Non-linear tabular data, plenty of rows", p: good, c: "Mixed numeric and categorical features with bends and interactions. With enough rows and early stopping, boosting is usually the most accurate choice." },
        H.extrapFig("gbm")
      ] }
    ];
  });

  /* ================= SVR ================= */
  G.add("svr", () => {
    const base = cloud(221, 26, (x) => 2 + 0.55 * x, 0.6), outs = [{ x: 7.8, y: 1.3 }, { x: 8.8, y: 1.9 }, { x: 9.3, y: 1.1 }], d = base.concat(outs), eps = 1.0, s = F.svr(d, eps, 1);
    const tb = P({ w: 640, h: 300, xl: "x", yl: "y", alt: "A fitted line inside a tube, with support vectors circled" });
    tb.band((x) => s.f(x) - eps, (x) => s.f(x) + eps).line(s.f).pts(d).ring(d.filter(s.isSV));
    tb.seg(1.2, s.f(1.2), 1.2, s.f(1.2) + eps, "fg-mark").text(1.2, s.f(1.2) + eps / 2, "ε", { dx: 6, dy: 4, cls: "fg-tb" }).text(4.6, s.f(4.6) - eps, "inside the tube: error ignored", { dy: 16 });
    const cmp = P({ xl: "x", yl: "y", alt: "SVR and least squares with outliers" }).pts(base).pts(outs, "fg-pt-hollow").line(F.ols(d).f, "fg-ink").line(s.f);
    const lp = P({ x: [-3, 3], y: [0, 3.4], xl: "Residual", yl: "Penalty", tx: [[-1, "−ε"], [0, "0"], [1, "+ε"]], alt: "Epsilon-insensitive loss compared with squared loss" });
    lp.line((u) => Math.max(0, Math.abs(u) - 1)).line((u) => u * u, "fg-ref").text(0, 0, "no penalty", { a: "middle", dy: -8, cls: "fg-tb" }).text(2.95, 1.95, "grows in a straight line", { a: "end", dx: -24, dy: 14 });
    return [
      { where: "terms", title: "The ε-tube and the support vectors", legend: [["fit", "SVR prediction"], ["band", "ε-insensitive tube"], ["ring", "Support vectors"]], panels: [{ p: tb, c: "SVR draws a tube of half-width ε around its line and ignores every point inside it. Only the circled points, on or outside the tube, influence the fit; they are the support vectors. C sets how hard the model is punished for the points that stick out." }] },
      { where: "math", title: "Its loss function, drawn", legend: [["fit", "SVR (ε-insensitive) loss"], ["ref", "Squared loss, for comparison"], ["ink", "Least-squares line"], ["hollow", "Outliers"]], panels: [
        { h: "Flat in the middle, linear outside", p: lp, c: "Errors smaller than ε cost nothing. Larger ones cost in proportion to their size, not their square, so one wild point cannot dominate." },
        { h: "What that buys you", p: cmp, c: "Three outlying rows (hollow) drag the least-squares line down. The SVR line, charged only linearly for them, moves much less." }
      ] },
      H.scaleFig("distance")
    ];
  });

  /* ================= KNN ================= */
  G.add("knn", () => {
    const d = H.curve(231, 32, 0.8), xq = 6.2, k = 5, near = d.slice().sort((a, b) => Math.abs(a.x - xq) - Math.abs(b.x - xq)).slice(0, k), yq = F.mean(near.map((p) => p.y));
    const lo = Math.min.apply(null, near.map((p) => p.x)), hi = Math.max.apply(null, near.map((p) => p.x));
    const qp = P({ w: 640, h: 300, xl: "x", yl: "y", alt: "A query point and its five nearest neighbours" });
    qp.rect(lo - 0.12, 0, hi + 0.12, 10).vline(xq, "fg-ref").pts(d).ring(near).seg(lo - 0.12, yq, hi + 0.12, yq, "fg-fit").pts([{ x: xq, y: yq }], "fg-pt2", 5.5);
    qp.text(xq, 10, "new case, x = " + xq, { dx: 6, dy: 12, cls: "fg-tm" }).text(lo - 0.12, yq, "prediction = average of the 5 circled values", { a: "end", dx: -8, dy: 4, cls: "fg-tb" });
    const mk = (kk) => P({ xl: "x", yl: "y", alt: "KNN fit with k = " + kk }).line(H.TRUE, "fg-ref").pts(d, "fg-pt-faint").line(F.knn(d, kk).f);
    const gap = cloud(232, 34, H.TRUE, 0.6).filter((p) => p.x < 3.6 || p.x > 7.4);
    const gp = P({ xl: "x", yl: "y", alt: "KNN bridging a region with no data" }).rect(3.6, 0, 7.4, 10).line(H.TRUE, "fg-ref").pts(gap).line(F.knn(gap, 4).f).text(5.5, 9.2, "no data here", { a: "middle", cls: "fg-tm" });
    const dense = H.curve(233, 90, 0.7), dp = P({ xl: "x", yl: "y", alt: "KNN on densely covered data" }).pts(dense, "fg-pt", 2.6).line(F.knn(dense, 9).f);
    return [
      { where: "terms", title: "How one prediction is made", legend: [["pt", "Training data"], ["ring", "The 5 nearest neighbours"], ["pt2", "Prediction"]], panels: [{ p: qp, c: "There is no training step and no equation. To predict a new case, find the k training rows most similar to it and average their outcomes." }] },
      { where: "math", title: "k is the only dial, and it controls everything", legend: [["fit", "KNN prediction"], ["ref", "True pattern"]], panels: [
        { v: "bad", h: "k = 1: overfit", p: mk(1), c: "Copies its single nearest neighbour, noise included. Perfect on training data, jumpy on new data." },
        { v: "good", h: "k = 6: about right", p: mk(6), c: "Averaging a handful of neighbours smooths the noise while still following the curve." },
        { v: "bad", h: "k = 32 (every point): underfit", p: mk(32), c: "Every prediction is the overall average. All detail is gone." }
      ] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "KNN prediction"], ["ref", "True pattern"]], panels: [
        { v: "good", h: "Dense, even coverage", p: dp, c: "Plenty of examples near any case you might be asked about, and only a few features. The neighbours really are similar." },
        { v: "bad", h: "Gaps in the data", p: gp, c: "In an empty region the \"nearest\" neighbours are far away, and the model quietly returns their average. It gives no warning that it is guessing. The same happens everywhere when there are many features (the curse of dimensionality)." }
      ] },
      H.scaleFig("distance")
    ];
  });

  /* ================= Bayesian linear ================= */
  G.add("bayes", () => {
    const few = cloud(241, 5, (x) => 1.6 + 0.68 * x, 0.8, [2.5, 6.5]), many = H.lin(242, 45), sg = 0.8, al = 0.08;
    const b0 = F.bayes([], al, sg, 3), b5 = F.bayes(few, al, sg, 3), b45 = F.bayes(many, al, sg, 3);
    const nd = (m, s) => (x) => Math.exp(-0.5 * ((x - m) / s) ** 2);
    const dp = P({ w: 640, h: 270, x: [-1.2, 1.9], y: [0, 1.22], xl: "Slope: change in y per unit of x", yl: "Plausibility (each curve scaled to its peak)", tx: [[-1, "−1"], [0, "0"], [1, "1"]], alt: "Prior and posterior beliefs about the slope" });
    dp.line(nd(0, b0.slopeSd), "fg-ref").line(nd(b5.slope, b5.slopeSd), "fg-fit1").line(nd(b45.slope, b45.slopeSd));
    dp.text(1.88, 0.42, "Prior: before any data", { a: "end" }).text(b5.slope - b5.slopeSd * 1.3, 0.5, "After 5 points", { a: "end", dx: -4, cls: "fg-tb" }).text(b45.slope, 1.02, "After 45 points", { dx: 10, dy: -4, cls: "fg-tb" });
    const bp = (pts, m, alt) => { const p = P({ y: [-1, 11], xl: "x", yl: "y", alt }); p.band((x) => m.f(x) - 1.96 * m.sd(x), (x) => m.f(x) + 1.96 * m.sd(x)); m.draws.slice(0, 8).forEach((f) => p.line(f, "fg-draw")); p.line(m.f).pts(pts); return p; };
    const sr = F.rng(243), six = [1, 2.6, 4.2, 5.8, 7.4, 9].map((x) => ({ x, y: 1.6 + 0.68 * x + 0.5 * F.normal(sr) })), strong = F.bayes(six, 400, sg, 3);
    return [
      { where: "terms", title: "Prior, data, posterior", legend: [["ref", "Prior"], ["fit1", "Posterior after 5 points"], ["fit", "Posterior after 45 points"]], panels: [{ p: dp, c: "Instead of one best slope, Bayesian regression keeps a distribution over every slope that could be true. It starts wide (the prior). Each batch of data narrows it and moves it toward what the data supports (the posterior). The width that remains is your honest uncertainty." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "Posterior mean line"], ["band", "95% credible band for the line"]], panels: [
        { v: "good", h: "Very little data", p: bp(few, b5, "Wide credible band with five points"), c: "Five points. The band is wide and flares out away from the data, and the thin lines are equally plausible alternatives. This is the model telling you what it does not know, which is why it suits small samples." },
        { v: "note", h: "Plenty of data", b: "● Converges to least squares", p: bp(many, b45, "Narrow credible band with forty-five points"), c: "With 45 points the band is tight and the line matches ordinary regression. The prior no longer matters much." },
        { v: "bad", h: "A confident prior that is wrong", p: bp(six, strong, "A strong prior flattening the fit"), c: "A prior that insists the slope is near zero, plus only six points: the model sides with the prior and ignores an obvious trend. Always check how much your conclusions move when you loosen the prior." }
      ] }
    ];
  });

  /* ================= home: what each kind of outcome looks like ================= */
  G.add("home", () => {
    const r = F.rng(251), num = H.lin(252, 34);
    const bin = []; for (let i = 0; i < 44; i++) { const x = 0.4 + 9.2 * r(); bin.push({ x, y: (r() < 1 / (1 + Math.exp(4.2 - 0.9 * x)) ? 1 : 0) + 0.09 * (r() - 0.5) }); }
    const ord = []; for (let i = 0; i < 54; i++) { const x = 0.5 + 9 * r(), l = 0.8 * x + 1.4 * F.normal(r); ord.push({ x, y: (l < 3 ? 1 : l < 5.2 ? 2 : 3) + 0.3 * (r() - 0.5) }); }
    const fan = cloud(253, 60, (x) => 1.4 + 0.42 * x, (x) => 0.12 + 0.2 * x);
    return [{ where: "home", title: "What each kind of outcome looks like when you plot it", panels: [
      { h: "A number", p: P({ xl: "Predictor", yl: "Outcome", alt: "A continuous outcome" }).pts(num), c: "Price, revenue, temperature. Any value on a continuous scale. <a href=\"#/model/slr\">Linear</a>, <a href=\"#/model/ridge\">regularised</a> and <a href=\"#/model/gbm\">tree-based</a> models." },
      { h: "Yes or no", p: P({ y: [-0.35, 1.35], xl: "Predictor", ty: [[0, "No"], [1, "Yes"]], alt: "A binary outcome" }).pts(bin), c: "Churned, clicked, defaulted. Two rows of points. <a href=\"#/model/logit\">Logistic regression</a>." },
      { h: "Ordered categories", p: P({ y: [0.4, 3.6], xl: "Predictor", ty: [[1, "Low"], [2, "Mid"], [3, "High"]], alt: "An ordered categorical outcome" }).pts(ord), c: "Ratings, grades, severity levels. <a href=\"#/model/ord\">Ordinal regression</a>; if there is no order, <a href=\"#/model/mnl\">multinomial</a>." },
      { h: "A count", p: H.countHist("over", true), c: "Claims, visits, defects: whole numbers from zero up, usually skewed right. <a href=\"#/model/pois\">Poisson</a> or <a href=\"#/model/nb\">negative binomial</a>." },
      { h: "Time until an event", p: timeline("Time-to-event data with censoring"), c: "How long until churn, failure or recovery, where some cases have not happened yet (hollow). <a href=\"#/model/cox\">Cox regression</a>." },
      { h: "A spread, not just an average", p: P({ xl: "Predictor", yl: "Outcome", alt: "An outcome whose spread grows" }).pts(fan), c: "When you need the worst case or a range (delivery promises, risk limits). <a href=\"#/model/quant\">Quantile</a> or <a href=\"#/model/bayes\">Bayesian</a> regression." }
    ] }];
  });
})();
