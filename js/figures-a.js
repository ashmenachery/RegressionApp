/* Figures for models 1 to 10 */
(function () {
  const F = window.Fits, G = window.Figures, H = G.h, P = H.P, cloud = H.cloud;
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const DATA_TITLE = "What the data should, and should not, look like";

  /* ================= simple linear ================= */
  G.add("slr", () => {
    const pts = cloud(3, 12, (x) => 1.8 + 0.62 * x, 0.95), o = F.ols(pts);
    const an = P({ w: 640, h: 300, x: [0, 10], y: [0, 10], xl: "x: the predictor (for example, advertising spend)", yl: "y: the outcome (for example, sales)", alt: "A fitted line with its intercept, slope and residuals marked" });
    pts.forEach((p) => an.seg(p.x, p.y, p.x, o.f(p.x)));
    an.line(o.f).pts(pts);
    let big = pts[0]; pts.forEach((p) => { if (p.x > 1.5 && p.x < 5 && Math.abs(p.y - o.f(p.x)) > Math.abs(big.y - o.f(big.x))) big = p; });
    const up = big.y > o.f(big.x);
    an.text(big.x, big.y, "Residual: actual − predicted", { dx: 9, dy: up ? -2 : 10, cls: "fg-tb" });
    an.pts([{ x: 0, y: o.b0 }], "fg-pt2", 4.5).text(0, o.b0, "Intercept β₀: prediction when x = 0", { dx: 10, dy: 22, cls: "fg-tb" });
    const xa = 6.3, xb = 8.6, ya = o.f(xa);
    an.seg(xa, ya, xb, ya, "fg-mark").seg(xb, ya, xb, o.f(xb), "fg-mark");
    an.text((xa + xb) / 2, ya, "run: +1 unit of x", { a: "middle", dy: 15 }).text(xb, (ya + o.f(xb)) / 2, "rise: +β₁", { dx: 7, dy: 4 });
    an.text(xb, ya, "Slope β₁ = rise ÷ run", { a: "end", dy: 32, cls: "fg-tb" });

    const b1 = o.b1, xb_ = F.mean(pts.map((p) => p.x)), yb_ = F.mean(pts.map((p) => p.y));
    const sse = (b) => pts.reduce((s, p) => s + (p.y - yb_ - b * (p.x - xb_)) ** 2, 0);
    const cand = [b1 - 0.45, b1 + 0.45];
    const c1 = P({ xl: "x", yl: "y", alt: "Three candidate lines through the same points" }).pts(pts);
    cand.forEach((b) => c1.line((x) => yb_ + b * (x - xb_), "fg-ref"));
    c1.line(o.f);
    const top = sse(b1 + 0.62) * 1.05;
    const c2 = P({ x: [b1 - 0.62, b1 + 0.62], y: [0, top], xl: "Slope tried", yl: "Sum of squared residuals", alt: "Squared error as a function of the slope, shaped like a bowl" });
    c2.line(sse, "fg-fit1").pts(cand.map((b) => ({ x: b, y: sse(b) })), "fg-pt-hollow", 4).pts([{ x: b1, y: sse(b1) }], "fg-pt2", 5);
    c2.text(b1, sse(b1), "Lowest point: the fitted slope", { a: "middle", dy: -12, cls: "fg-tb" }).text(cand[0], sse(cand[0]), "too flat", { dx: 8, dy: 4 }).text(cand[1], sse(cand[1]), "too steep", { a: "end", dx: -8, dy: 4 });

    const good = H.lin(4, 40), bend = cloud(5, 40, (x) => 2 + 0.085 * x * x, 0.55), fun = cloud(6, 45, (x) => 1.3 + 0.6 * x, (x) => 0.08 + 0.2 * x);
    const base = cloud(7, 22, (x) => 2 + 0.5 * x, 0.5, [0.5, 6.5]), out = base.concat([{ x: 9.4, y: 1.2 }]);
    const mk = (d) => P({ xl: "x", yl: "y", alt: "Scatter plot with a fitted straight line" }).pts(d).line(F.ols(d).f);
    const lev = P({ xl: "x", yl: "y", alt: "One far-away point pulling the fitted line down" }).pts(base).pts([{ x: 9.4, y: 1.2 }], "fg-pt2", 4.5).line(F.ols(base).f, "fg-ref").line(F.ols(out).f);
    lev.text(9.4, 1.2, "one unusual row", { a: "end", dx: -9, dy: 4 });
    return [
      { where: "terms", title: "The key terms on one picture", legend: [["pt", "Observed data"], ["fit", "Fitted line ŷ = β₀ + β₁x"], ["res", "Residual"]], panels: [{ p: an, c: "Each grey bar is one residual. Least squares chooses the intercept and slope that make the sum of the squared bars as small as possible." }] },
      { where: "math", title: "The cost function, drawn", lead: "Try every possible slope, add up the squared residuals for each, and you get a bowl. The fitted line is its lowest point, and calculus finds it in one step.", legend: [["fit", "Best line"], ["ref", "Other candidates"], ["fit1", "Cost for each slope"]], panels: [{ h: "Three candidate lines", p: c1 }, { h: "Their cost", p: c2 }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "Fitted line"], ["ref", "Line without the unusual row"]], panels: [
        { v: "good", h: "Straight trend, even scatter", p: mk(good), c: "Points form a band of constant width around a straight path. This is the picture the model assumes." },
        { v: "bad", h: "A bend", p: mk(bend), c: "The line runs under the points at both ends and over them in the middle. Add x² (polynomial regression) or take logs." },
        { v: "bad", h: "A funnel", p: mk(fun), c: "Spread grows with x. The slope is still usable, but confidence intervals are too narrow at the wide end. Try log(y) or robust standard errors." },
        { v: "bad", h: "One point with leverage", p: lev, c: "A single row far from the rest drags the whole line. Check whether it is a data error; report the fit with and without it." }
      ] },
      H.residFig("practical")
    ];
  });

  /* ================= multiple linear ================= */
  G.add("mlr", () => {
    const sub = cloud(11, 18, (x) => 6.6 - 0.9 * x, 0.5, [1, 5]), city = cloud(12, 18, (x) => 13.2 - 0.9 * x, 0.5, [5, 9]);
    const all = sub.concat(city), pooled = F.ols(all);
    const beta = H.olsM(sub.map((p) => [p.x, 0]).concat(city.map((p) => [p.x, 1])), all.map((p) => p.y));
    const a = P({ xl: "Price", yl: "Units sold", alt: "Pooled data with a rising fitted line" }).pts(sub).pts(city, "fg-pt2").line(pooled.f, "fg-ink");
    const b = P({ xl: "Price", yl: "Units sold", alt: "Two parallel falling lines, one per store type" }).pts(sub).pts(city, "fg-pt2");
    b.line((x) => beta[0] + beta[1] * x, "fg-ink", 0.6, 5.4).line((x) => beta[0] + beta[2] + beta[1] * x, "fg-ink", 4.6, 9.4);

    const mkX = (seed, rho) => { const r = F.rng(seed), d = []; for (let i = 0; i < 45; i++) { const z = F.normal(r), w = F.normal(r); d.push({ x: 5 + 1.6 * z, y: 5 + 1.6 * (rho * z + Math.sqrt(1 - rho * rho) * w) }); } return d; };
    const ind = P({ xl: "Predictor 1", yl: "Predictor 2", alt: "Two unrelated predictors" }).pts(mkX(13, 0));
    const col = P({ xl: "Predictor 1 (floor area)", yl: "Predictor 2 (rooms)", alt: "Two predictors that rise together" }).pts(mkX(14, 0.97));
    const est = (rho, seed) => { const r = F.rng(seed), out = []; for (let s = 0; s < 40; s++) { const X = [], y = []; for (let i = 0; i < 40; i++) { const z = F.normal(r), w = F.normal(r), x1 = z, x2 = rho * z + Math.sqrt(1 - rho * rho) * w; X.push([x1, x2]); y.push(x1 + x2 + F.normal(r)); } out.push(H.olsM(X, y)[1]); } return out; };
    const jr = F.rng(15), st = P({ w: 640, h: 230, x: [-2.2, 4.2], y: [0.3, 2.9], xl: "Estimated effect of predictor 1, in 40 repeated samples", tx: [[-2, "−2"], [0, "0"], [1, "1"], [2, "2"], [4, "4"]], yaxis: false, alt: "Spread of a coefficient estimate with independent and with correlated predictors" });
    st.vline(1, "fg-ref").pts(est(0, 16).map((v) => ({ x: v, y: 2.1 + 0.22 * (jr() - 0.5) }))).pts(est(0.97, 17).map((v) => ({ x: v, y: 1 + 0.22 * (jr() - 0.5) })), "fg-pt2");
    st.text(-2.1, 2.55, "Independent predictors", { cls: "fg-tb" }).text(-2.1, 1.45, "Correlated predictors (r = 0.97)", { cls: "fg-tb" }).text(1, 2.9, "true effect = 1", { dx: 5, dy: 10, cls: "fg-tm" });
    const rf = H.residFig("practical");
    return [
      { where: "terms", title: "What \"holding the other variables fixed\" buys you", lead: "Shops in the city charge more and also sell more. Look at price alone and it seems higher prices raise sales. Add store type to the model and the true, negative price effect appears.", legend: [["pt", "Suburban stores"], ["pt2", "City stores"], ["ink", "Fitted line"]], panels: [
        { v: "bad", h: "Price only (simple regression)", p: a, c: "The slope is positive because store type is hiding inside price. This is a confounder, and it gives the wrong sign." },
        { v: "good", h: "Price and store type (multiple regression)", p: b, c: "One shared slope for price, with a separate level for each store type. Within either group, higher price means fewer units." }
      ] },
      { where: "data", title: DATA_TITLE, lead: "With several predictors, plot them against each other as well as against the outcome.", panels: [
        { v: "good", h: "Predictors carry separate information", p: ind, c: "A round cloud: knowing one predictor tells you little about the other, so the model can separate their effects." },
        { v: "bad", h: "Predictors move together", p: col, c: "Multicollinearity. The model sees the two only ever changing together and cannot say which deserves the credit. Check the variance inflation factor (VIF); drop one, combine them, or use ridge." }
      ] },
      { where: "data", title: "What multicollinearity does to your coefficients", legend: [["pt", "Independent predictors"], ["pt2", "Correlated predictors"], ["ref", "True effect"]], panels: [{ p: st, c: "Each dot is the coefficient from one fresh sample of 40 rows. Predictions are equally good in both cases, but with correlated predictors the individual coefficient swings widely and sometimes takes the wrong sign. Do not read a story into it." }] },
      rf
    ];
  });

  /* ================= polynomial ================= */
  G.add("poly", () => {
    const tr = H.curve(5, 16, 0.9), te = H.curve(99, 400, 0.9);
    const mk = (d) => P({ xl: "x", yl: "y", alt: "Polynomial of degree " + d + " fitted to 16 points" }).line(H.TRUE, "fg-ref").pts(tr).line(F.poly(tr, d).f);
    const degs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], trn = degs.map((d) => ({ x: d, y: F.rmse(tr, F.poly(tr, d).f) })), tst = degs.map((d) => ({ x: d, y: F.rmse(te, F.poly(tr, d).f) }));
    let best = tst[0]; tst.forEach((q) => { if (q.y < best.y) best = q; });
    const ec = P({ w: 640, h: 280, x: [0.6, 10.4], y: [0, 3.2], xl: "Polynomial degree", yl: "Typical error (RMSE)", tx: degs.map((d) => [d, String(d)]), ty: [[0, "0"], [1, "1"], [2, "2"], [3, "3"]], alt: "Training error and new-data error by polynomial degree" });
    ec.line(trn, "fg-fit1").pts(trn).line(tst).pts(tst, "fg-pt2");
    ec.vline(best.x, "fg-ref").text(best.x, 3.2, "Best on new data: degree " + best.x, { dx: 6, dy: 12, cls: "fg-tb" });
    ec.text(7, trn[6].y, "training data", { a: "middle", dy: -9 }).text(1.2, tst[0].y, "400 new points", { dy: -9 });

    const one = cloud(61, 34, (x) => 2 + 0.2 * (x - 1) * (x - 1) * (x < 5.5 ? 1 : 0) + (x >= 5.5 ? 4.05 + 0.25 * (x - 5.5) : 0), 0.45);
    const g = P({ xl: "x", yl: "y", alt: "A smooth single bend fitted by a quadratic" }).pts(one).line(F.poly(one, 3).f);
    const nar = cloud(62, 26, (x) => 3 + 2 * Math.sin(0.7 * x), 0.4, [0.5, 6.3]);
    const ex = P({ xl: "x", yl: "y", alt: "A polynomial shooting off beyond the data" }).rect(6.5, 0, 10, 10).pts(nar).line(F.poly(nar, 5).f).text(8.25, 0.8, "no data here", { a: "middle", cls: "fg-tm" });
    const stp = cloud(63, 40, (x) => (x < 3.3 ? 2.5 : x < 6.6 ? 6.5 : 4), 0.4);
    const sp = P({ xl: "x", yl: "y", alt: "A polynomial wiggling around sudden steps" }).pts(stp).line(F.poly(stp, 7).f);
    return [
      { where: "terms", title: "Underfitting and overfitting, same 16 points", legend: [["pt", "Data"], ["fit", "Fitted polynomial"], ["ref", "True pattern"]], panels: [
        { v: "bad", h: "Degree 1: underfit", p: mk(1), c: "Too rigid. The line cannot follow the wave, so it is wrong in the same way on any sample (high bias)." },
        { v: "good", h: "Degree 4: about right", p: mk(4), c: "Flexible enough to follow the real pattern, not so flexible that it chases individual points." },
        { v: "bad", h: "Degree 11: overfit", p: mk(11), c: "Passes close to every point by swinging wildly between them. It has memorised the noise (high variance)." }
      ] },
      { where: "math", title: "Why you cannot choose the degree from training error", legend: [["pt", "Error on the training data"], ["pt2", "Error on new data"]], panels: [{ p: ec, c: "Training error falls every time you add a term, so it will always vote for more complexity. Error on data the model has not seen falls, bottoms out, then rises. Choose the degree by cross-validation." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "Fitted polynomial"]], panels: [
        { v: "good", h: "One or two smooth bends", p: g, c: "A gentle, continuous curve inside a well-covered range. Degree 2 or 3 is usually all you need." },
        { v: "bad", h: "Predicting beyond the data", p: ex, c: "Outside the range it was fitted on, a polynomial heads for plus or minus infinity. Never extrapolate one." },
        { v: "bad", h: "Sudden jumps", p: sp, c: "Polynomials are smooth, so they ripple around a step instead of following it. Use a tree or a piecewise model." }
      ] }
    ];
  });

  /* ================= stepwise ================= */
  G.add("step", () => {
    const sim = (seed, n) => { const r = F.rng(seed), X = [], y = []; for (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < 12; j++) row.push(F.normal(r)); X.push(row); y.push(1.2 * row[0] + 0.8 * row[1] + 0.5 * row[2] + F.normal(r)); } return { X, y }; };
    const tr = sim(71, 50), te = sim(72, 500), chosen = [], trn = [], tst = [];
    const err = (D, cols, beta) => Math.sqrt(F.mean(D.y.map((v, i) => (v - H.predM(beta, cols.map((c) => D.X[i][c]))) ** 2)));
    const fit = (cols) => H.olsM(tr.X.map((r) => cols.map((c) => r[c])), tr.y);
    for (let k = 0; k <= 12; k++) {
      if (k > 0) { let bj = -1, be = Infinity; for (let j = 0; j < 12; j++) { if (chosen.includes(j)) continue; const c = chosen.concat([j]), e = err(tr, c, fit(c)); if (e < be) { be = e; bj = j; } } chosen.push(bj); }
      const beta = fit(chosen); trn.push({ x: k, y: err(tr, chosen, beta) }); tst.push({ x: k, y: err(te, chosen, beta) });
    }
    let best = tst[0]; tst.forEach((q) => { if (q.y < best.y) best = q; });
    const top = Math.max(trn[0].y, tst[0].y) * 1.1;
    const pc = P({ w: 640, h: 280, x: [-0.4, 12.4], y: [0, top], xl: "Number of predictors added so far (12 candidates, only 3 truly matter)", yl: "Typical error (RMSE)", tx: [0, 2, 4, 6, 8, 10, 12].map((d) => [d, String(d)]), ty: [[0, "0"], [1, "1"], [2, "2"]], alt: "Training and new-data error as forward selection adds predictors" });
    pc.line(trn, "fg-fit1").pts(trn).line(tst).pts(tst, "fg-pt2").vline(best.x, "fg-ref").text(best.x, top, "Stop here: " + best.x + " predictors", { dx: 6, dy: 12, cls: "fg-tb" });
    pc.text(12.3, trn[12].y, "training data", { a: "end", dy: 16 }).text(12.3, tst[12].y, "new data", { a: "end", dy: -9 });

    const r = F.rng(73), n = 25, y = [], cols = [];
    for (let i = 0; i < n; i++) y.push(5 + 1.5 * F.normal(r));
    for (let j = 0; j < 60; j++) { const c = []; for (let i = 0; i < n; i++) c.push(5 + 1.7 * F.normal(r)); cols.push(c); }
    let bj = 0, bc = 0; cols.forEach((c, j) => { const v = H.corr(c, y); if (Math.abs(v) > Math.abs(bc)) { bc = v; bj = j; } });
    const d1 = cols[bj].map((x, i) => ({ x, y: y[i] })), d2 = []; for (let i = 0; i < n; i++) d2.push({ x: 5 + 1.7 * F.normal(r), y: 5 + 1.5 * F.normal(r) });
    const c2 = H.corr(d2.map((p) => p.x), d2.map((p) => p.y));
    const s1 = P({ xl: "The \"winning\" predictor", yl: "Outcome", alt: "A noise predictor that looks related to the outcome" }).pts(d1).line(F.ols(d1).f).text(0.4, 9.3, "correlation " + bc.toFixed(2), { cls: "fg-tb" });
    const s2 = P({ xl: "Same predictor, new sample", yl: "Outcome", alt: "The same predictor showing no relationship on new data" }).pts(d2).line(F.ols(d2).f).text(0.4, 9.3, "correlation " + c2.toFixed(2), { cls: "fg-tb" });
    return [
      { where: "terms", title: "Forward selection, step by step", legend: [["pt", "Error on the training data"], ["pt2", "Error on new data"]], panels: [{ p: pc, c: "Each step adds the predictor that improves the fit most. The first few are real and both errors fall. After that the procedure is adding noise: training error keeps improving while error on new data creeps up. A stopping rule (AIC, BIC or cross-validation) exists to halt at the dashed line." }] },
      { where: "data", title: "The trap: search enough columns and noise looks like signal", lead: "Here the outcome and all 60 candidate predictors are pure random numbers. Nothing is related to anything. Stepwise picks the column that happens to line up best.", legend: [["pt", "Data"], ["fit", "Fitted line"]], panels: [
        { v: "bad", h: "Best of 60 noise columns", b: "✗ Looks convincing", p: s1, c: "In the sample that was searched, the winner shows a clear trend, and its p-value would look significant. The p-value does not know 59 other columns were tried." },
        { v: "note", h: "The same column on fresh data", b: "● The truth", p: s2, c: "The relationship is gone, because it was never there. Judge a stepwise model on data it did not see, and keep the number of candidates small relative to the rows." }
      ] }
    ];
  });

  /* ================= penalty geometry shared by ridge, lasso, elastic net ================= */
  const A = [[1.0, 0.75], [0.75, 1.3]], BH = [0.75, 2.1], T = 1.25;
  const loss = (a, b) => { const u = a - BH[0], v = b - BH[1]; return A[0][0] * u * u + 2 * A[0][1] * u * v + A[1][1] * v * v; };
  function boundary(kind) {
    const out = [];
    for (let i = 0; i < 1440; i++) {
      const th = i * Math.PI / 720, c = Math.cos(th), s = Math.sin(th), q = Math.abs(c) + Math.abs(s); let r;
      if (kind === "ridge") r = T; else if (kind === "lasso") r = T / q; else { const al = 0.5, t = al * T + (1 - al) * T * T; r = (-al * q + Math.sqrt(al * al * q * q + 4 * (1 - al) * t)) / (2 * (1 - al)); }
      out.push([r * c, r * s]);
    }
    return out;
  }
  function penaltyPanel(kind) {
    const b = boundary(kind); let sol = b[0]; b.forEach((q) => { if (loss(q[0], q[1]) < loss(sol[0], sol[1])) sol = q; });
    const c0 = loss(sol[0], sol[1]);
    const p = P({ h: 318, x: [-1.7, 3.1], y: [-1.7, 3.1], xl: "Coefficient β₁", yl: "Coefficient β₂", axes: false, alt: "Loss contours meeting the " + kind + " penalty region" });
    p.hline(0, "fg-axis").vline(0, "fg-axis").shape(b, "fg-region");
    [0.12, 0.45, 1].forEach((k) => { const e = []; for (let i = 0; i <= 200; i++) { const th = i * Math.PI / 100, c = Math.cos(th), s = Math.sin(th), rr = Math.sqrt(c0 * k / (A[0][0] * c * c + 2 * A[0][1] * c * s + A[1][1] * s * s)); e.push([BH[0] + rr * c, BH[1] + rr * s]); } p.line(e, "fg-contour"); });
    p.pts([{ x: BH[0], y: BH[1] }], "fg-pt", 4).pts([{ x: sol[0], y: sol[1] }], "fg-pt2", 5);
    p.text(BH[0], BH[1], "Least-squares answer", { dx: 8, dy: -6 }).text(sol[0], sol[1], Math.abs(sol[0]) < 0.01 ? "Penalised answer: β₁ = 0" : "Penalised answer", { dx: 9, dy: 14, cls: "fg-tb" });
    p.text(0, -0.55, "allowed", { a: "middle", cls: "fg-tm" }).text(0, -0.85, "region", { a: "middle", cls: "fg-tm" });
    return { p, sol };
  }
  const GEO_LEG = [["pt", "Best fit with no penalty"], ["pt2", "Best fit inside the region"], ["fit1", "Equal-error contours"]];
  const sim = H.groupSim(84, 100);
  function pathPanel(kind) {
    const lo = kind === "ridge" ? -2 : -2.3, hi = kind === "ridge" ? 2.3 : 0.5, lines = [0, 1, 2, 3, 4, 5, 6, 7].map(() => []);
    for (let i = 0; i <= 60; i++) { const lg = lo + (hi - lo) * i / 60, lam = Math.pow(10, lg), b = kind === "ridge" ? H.ridgeM(sim.X, sim.y, lam) : H.enetM(sim.X, sim.y, lam, 1); b.forEach((v, j) => lines[j].push([lg, v])); }
    const p = P({ x: [lo, hi], y: [-0.4, 2.6], xl: "Penalty strength λ (weak → strong)", yl: "Coefficient", ty: [[0, "0"], [1, "1"], [2, "2"]], alt: "Coefficient paths as the " + kind + " penalty grows" });
    p.hline(0, "fg-axis"); lines.forEach((l) => p.line(l, "fg-path"));
    return p;
  }
  const trueBars = () => H.coefBars(H.TRUE_BETA, "True effects of eight predictors");
  const dense = () => { const r = F.rng(82), b = []; for (let j = 0; j < 8; j++) b.push(0.35 + 0.75 * r()); return H.coefBars(b, "Eight predictors each with a modest effect"); };
  const twins = () => { const r = F.rng(83), d = []; for (let i = 0; i < 45; i++) { const z = F.normal(r); d.push({ x: 5 + 1.6 * z, y: 5 + 1.6 * (0.96 * z + 0.28 * F.normal(r)) }); } return P({ xl: "Predictor 1", yl: "Predictor 2", alt: "Two highly correlated predictors" }).pts(d); };
  const LAS = H.enetM(sim.X, sim.y, 0.35, 1), ENE = H.enetM(sim.X, sim.y, 0.35, 0.3);
  G._est = { LAS, ENE, ridge: H.ridgeM(sim.X, sim.y, 0.5) };

  G.add("ridge", () => [
    { where: "math", title: "The penalty, drawn", lead: "Picture just two coefficients. The rings are combinations with equal prediction error, smallest at the blue dot. The L2 penalty says the coefficients must stay inside a circle, so the answer is the first place the rings touch it.", legend: GEO_LEG, panels: [
      { h: "A round region shrinks, never zeroes", p: penaltyPanel("ridge").p, c: "A circle has no corners, so the rings almost always touch it at a point where both coefficients are non-zero, just smaller." },
      { h: "Every coefficient as λ grows", p: pathPanel("ridge"), c: "Each line is one of eight coefficients, fitted to simulated data. They slide smoothly toward zero as the penalty strengthens, but none ever reaches it." }
    ] },
    { where: "data", title: DATA_TITLE, panels: [
      { v: "good", h: "Many predictors, each with a small effect", p: dense(), c: "When most features contribute a little, shrinking all of them a bit beats trying to pick winners." },
      { v: "good", h: "Predictors that move together", p: twins(), c: "Ridge splits the credit between correlated predictors and gives stable coefficients where ordinary least squares would swing wildly." },
      { v: "note", h: "Only a handful matter", b: "● Consider lasso", p: trueBars(), c: "If you believe most true effects are exactly zero, ridge still works but keeps every feature in the model. Lasso gives a shorter list." }
    ] },
    H.scaleFig("penalty")
  ]);

  G.add("lasso", () => [
    { where: "math", title: "The penalty, drawn", lead: "Picture just two coefficients. The rings are combinations with equal prediction error, smallest at the blue dot. The L1 penalty keeps the coefficients inside a diamond, so the answer is the first place the rings touch it.", legend: GEO_LEG, panels: [
      { h: "A diamond has corners on the axes", p: penaltyPanel("lasso").p, c: "The rings usually hit a corner first, and at a corner one coefficient is exactly zero. That is how lasso removes features." },
      { h: "Every coefficient as λ grows", p: pathPanel("lasso"), c: "Each line is one of eight coefficients, fitted to simulated data. One after another they hit zero and stay there. A stronger penalty means a shorter feature list." }
    ] },
    { where: "data", title: DATA_TITLE, lead: "The bars show simulated data where x1, x2 and x3 are near-copies of each other, x6 acts alone and the rest are noise.", panels: [
      { v: "good", h: "A few real effects among many zeros", p: H.coefBars([0, 1.4, 0, 0, 0, 1.5, 0, 0.8], "A sparse set of true effects"), c: "Sparse truth: most candidate features do nothing. Lasso is built to find the few that do." },
      { v: "note", h: "Truth, with a correlated group", b: "● The truth here", p: trueBars(), c: "x1, x2 and x3 each have a true effect of 1, but they are almost the same variable (correlation about 0.95)." },
      { v: "bad", h: "What lasso reports", p: H.coefBars(LAS, "Lasso estimates on the grouped data"), c: "Lasso has dropped x3 entirely and inflated x1 to compensate, although all three matter equally. Which one survives can change with the sample, so do not read the survivors as \"the important ones\". Elastic net handles this better." }
    ] },
    H.scaleFig("penalty")
  ]);

  G.add("enet", () => [
    { where: "math", title: "Three penalties, three shapes", lead: "The same two-coefficient picture for each penalty. The rings are combinations with equal prediction error.", legend: GEO_LEG, panels: [
      { h: "Ridge (L2): circle", p: penaltyPanel("ridge").p, c: "Shrinks everything, removes nothing." },
      { h: "Lasso (L1): diamond", p: penaltyPanel("lasso").p, c: "Sharp corners set coefficients exactly to zero." },
      { h: "Elastic net: rounded diamond", p: penaltyPanel("enet").p, c: "Still has corners, so it can drop features, but the curved sides share weight among correlated ones. The l1_ratio setting slides the shape between the other two." }
    ] },
    { where: "data", title: DATA_TITLE, lead: "Simulated data: x1, x2 and x3 are near-copies of each other, x6 acts alone and the rest are noise. Both models use the same penalty strength.", panels: [
      { v: "note", h: "The truth", b: "● The truth", p: trueBars(), c: "A correlated group of three real effects, one separate effect and four useless features. Common in practice: think several survey questions measuring the same thing." },
      { v: "bad", h: "Lasso on this data", p: H.coefBars(LAS, "Lasso estimates"), c: "Drops x3 and over-weights x1, although all three matter equally. A different sample would pick a different survivor." },
      { v: "good", h: "Elastic net on this data", p: H.coefBars(ENE, "Elastic net estimates"), c: "Keeps the correlated group together with similar weights and still pushes the noise features to zero or near it." }
    ] },
    H.scaleFig("penalty")
  ]);

  /* ================= logistic ================= */
  G.add("logit", () => {
    const bin = (seed, n, pf) => { const r = F.rng(seed), d = []; for (let i = 0; i < n; i++) { const x = 0.4 + 9.2 * r(); d.push({ x, y: r() < pf(x) ? 1 : 0 }); } return d; };
    const jit = (d, seed) => { const r = F.rng(seed); return d.map((p) => ({ x: p.x, y: p.y + 0.09 * (r() - 0.5) })); };
    const base = () => P({ y: [-0.35, 1.35], xl: "x (for example, days since last login)", yl: "Outcome", ty: [[0, "No"], [1, "Yes"]], alt: "Yes or no outcomes against a predictor" }).hline(0, "fg-grid").hline(1, "fg-grid");
    const d = bin(91, 60, (x) => sig(-4.2 + 0.9 * x)), lg = F.logistic(d), cut = -lg.b0 / lg.b1;
    const a = base().pts(jit(d, 1)).line(F.ols(d).f).text(9.9, 1.26, "above 100%", { a: "end", cls: "fg-tb" }).text(0.2, -0.27, "below 0%", { cls: "fg-tb" });
    const b = base().pts(jit(d, 1)).line(lg.f).hline(0.5, "fg-ref").vline(cut, "fg-ref").text(cut, 0.5, "50% line", { dx: 6, dy: -6 });
    const ll = P({ w: 640, h: 270, x: [0, 1], y: [0, 4.8], xl: "Probability the model gave to what actually happened", yl: "Penalty (log loss)", tx: [[0, "0%"], [0.25, "25%"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]], ty: [[0, "0"], [2, "2"], [4, "4"]], alt: "Log loss falling as the predicted probability of the true outcome rises" });
    ll.line((p) => -Math.log(Math.max(p, 0.008)), "fg-fit1", 0.008, 1).pts([{ x: 0.9, y: -Math.log(0.9) }, { x: 0.5, y: -Math.log(0.5) }, { x: 0.05, y: -Math.log(0.05) }], "fg-pt2", 4.5);
    ll.text(0.9, -Math.log(0.9), "Confident and right: almost free", { a: "end", dx: 4, dy: -12 }).text(0.5, -Math.log(0.5), "Unsure: small penalty", { a: "end", dx: -8, dy: 17 }).text(0.05, -Math.log(0.05), "Confident and wrong: heavy penalty", { dx: 10, dy: 2, cls: "fg-tb" });

    const sep = bin(92, 44, (x) => (x > 5.4 ? 1 : x < 4.6 ? 0 : 0.5)).filter((p) => p.x < 4.6 || p.x > 5.4);
    const mid = bin(93, 60, (x) => 0.92 * Math.exp(-((x - 5) ** 2) / 3.2)), rare = bin(94, 70, (x) => sig(-6.3 + 0.48 * x));
    const mk = (dd) => base().pts(jit(dd, 2)).line(F.logistic(dd).f);
    return [
      { where: "terms", title: "Why a yes/no outcome needs an S-curve, not a line", legend: [["pt", "One customer (Yes = churned)"], ["fit", "Fitted model"], ["ref", "Decision threshold"]], panels: [
        { v: "bad", h: "Straight line through 0s and 1s", p: a, c: "A line predicts values below 0 and above 1, which cannot be probabilities, and it assumes each extra unit of x adds the same amount everywhere." },
        { v: "good", h: "Logistic (sigmoid) curve", p: b, c: "The curve stays between 0 and 1. It is steepest in the middle, where one more unit of x changes the odds most visibly, and flattens as it nears certainty. Where it crosses 50% is the default decision boundary." }
      ] },
      { where: "math", title: "Log loss, drawn", legend: [["fit1", "Penalty for one prediction"]], panels: [{ p: ll, c: "The cost for each row depends on the probability the model assigned to the outcome that really occurred. Saying 5% about something that then happens costs about 30 times more than saying 90%. This is why the fitted model is pushed toward honest probabilities, not just correct labels." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Data"], ["fit", "Fitted probability"]], panels: [
        { v: "good", h: "Overlapping groups, gradual change", p: mk(d), c: "Mostly No on one side, mostly Yes on the other, with a mixed zone between. The S-curve describes that transition." },
        { v: "bad", h: "Perfect separation", p: mk(sep), c: "No overlap at all. The best curve is an infinitely steep step, so coefficients and standard errors blow up. Often a sign of a leaked feature. Add regularisation or use Firth's method." },
        { v: "bad", h: "Yes in the middle only", p: mk(mid), c: "The probability rises then falls, but a logistic curve can only go one way. The fit is flat and useless. Add x², bin the variable, or use a tree-based model." },
        { v: "note", h: "Very few Yes cases", p: mk(rare), c: "The model can still be valid, but accuracy will mislead you (always saying No scores well). Judge it with precision, recall and calibration, and count events, not rows, when sizing the model." }
      ] }
    ];
  });

  /* ================= multinomial ================= */
  G.add("mnl", () => {
    const sc = (x) => [0.4, -2.6 + 0.75 * x, -7.6 + 1.4 * x], pr = (x, k) => { const s = sc(x).map(Math.exp); return s[k] / (s[0] + s[1] + s[2]); };
    const pc = P({ w: 640, h: 280, y: [0, 1], xl: "Distance to work →", yl: "Probability of each choice", ty: [[0, "0%"], [0.5, "50%"], [1, "100%"]], alt: "Three probability curves that sum to one" });
    pc.line((x) => pr(x, 0), "fg-fit1").line((x) => pr(x, 1), "fg-fit").line((x) => pr(x, 2), "fg-fit3");
    pc.text(0.3, pr(0.3, 0), "Walk", { dy: 16, cls: "fg-tb" }).text(4.6, pr(4.6, 1), "Bus", { a: "middle", dy: -9, cls: "fg-tb" }).text(9.7, pr(9.7, 2), "Car", { a: "end", dy: 16, cls: "fg-tb" });
    const r = F.rng(101), cl = [[], [], []], cen = [[2.6, 3.2], [5.2, 6.8], [7.6, 3.4]];
    cen.forEach((c, k) => { for (let i = 0; i < 20; i++) cl[k].push({ x: c[0] + 1.15 * F.normal(r), y: c[1] + 1.15 * F.normal(r) }); });
    const sp = P({ xl: "Feature 1", yl: "Feature 2", alt: "Three unordered classes in a two-feature space" }).pts(cl[0]).pts(cl[1], "fg-pt2").pts(cl[2], "fg-pt3");
    const od = [[], [], []]; for (let i = 0; i < 60; i++) { const x = 0.5 + 9 * r(), l = 0.8 * x + 1.4 * F.normal(r), k = l < 3 ? 0 : l < 5.2 ? 1 : 2; od[k].push({ x, y: k + 1 + 0.3 * (r() - 0.5) }); }
    const op = P({ y: [0.4, 3.6], xl: "Predictor", ty: [[1, "Low"], [2, "Mid"], [3, "High"]], alt: "Ordered categories shifting upward with a predictor" }).pts(od[0]).pts(od[1]).pts(od[2]);
    const sh = P({ x: [0.3, 3.7], y: [0, 0.75], tx: [[1, "Class A"], [2, "Class B"], [3, "Class C"]], yl: "Share of rows", ty: [[0, "0%"], [0.5, "50%"]], alt: "Class shares with one very small class" }).bars([[1, 0.61], [2, 0.36], [3, 0.03]], 0.6).text(3, 0.03, "3%", { a: "middle", dy: -7, cls: "fg-tb" });
    return [
      { where: "terms", title: "One probability curve per class, always adding up to 100%", panels: [{ p: pc, c: "Multinomial logistic regression gives each class its own score, then softmax turns the scores into probabilities that sum to one. As distance grows, walking loses out first to the bus, then to the car. The predicted class is whichever curve is highest." }] },
      { where: "data", title: DATA_TITLE, legend: [["pt", "Class A"], ["pt2", "Class B"], ["pt3", "Class C"]], panels: [
        { v: "good", h: "Three or more classes with no order", p: sp, c: "Categories such as transport mode, product chosen or ticket type, each occupying its own region of feature space with some overlap." },
        { v: "bad", h: "Classes that have an order", p: op, c: "Low, Mid and High are steps along one scale. Multinomial would ignore that and spend twice the parameters. Use ordinal regression." },
        { v: "bad", h: "One tiny class", p: sh, c: "With a handful of examples the model cannot learn that class's coefficients. Merge it with a neighbour, collect more, or use class weights and check per-class recall." }
      ] }
    ];
  });

  /* ================= ordinal ================= */
  G.add("ord", () => {
    const dens = (m) => (x) => { const z = (x - m) / 0.75, e = Math.exp(-z); return 8 * e / ((1 + e) * (1 + e)) / 0.75 * 0.75; };
    const lp = P({ w: 640, h: 290, y: [0, 2.6], xl: "Underlying satisfaction (never observed directly) →", yaxis: false, alt: "A hidden scale cut into four ordered categories" });
    [3.2, 5.2, 7.2].forEach((c, i) => lp.vline(c, "fg-ref").text(c, 2.6, "cut-point " + (i + 1), { a: "middle", dy: 26, cls: "fg-tm" }));
    ["Poor", "Fair", "Good", "Excellent"].forEach((t, i) => lp.text([1.6, 4.2, 6.2, 8.6][i], 2.6, t, { a: "middle", dy: 10, cls: "fg-tb" }));
    lp.line(dens(4.0), "fg-fit1").line(dens(6.4), "fg-fit").text(4.0, 2.02, "New customer", { a: "middle", dy: -4 }).text(6.4, 2.02, "Five-year customer", { a: "middle", dy: -4 });

    const emp = (seed, het) => {
      const r = F.rng(seed), bins = [0, 1, 2, 3, 4, 5, 6, 7].map(() => [0, 0, 0, 0]), cuts = [1.6, 3, 4.4];
      for (let i = 0; i < 6000; i++) { const x = 10 * r(), u = r(), lg = Math.log(u / (1 - u)), l = 0.6 * x + (het ? 0.35 + 0.22 * x : 1) * lg; let k = 0; while (k < 3 && l > cuts[k]) k++; bins[Math.min(7, Math.floor(x / 1.25))][k]++; }
      return [0, 1, 2].map((k) => bins.map((b, j) => { const n = b[0] + b[1] + b[2] + b[3]; let c = 0; for (let q = 0; q <= k; q++) c += b[q]; const pp = Math.min(0.995, Math.max(0.005, c / n)); return { x: 0.625 + 1.25 * j, y: Math.log(pp / (1 - pp)) }; }));
    };
    const pan = (L) => { const p = P({ r: 52, y: [-6, 6], xl: "Predictor", yl: "Log-odds of being at or below", alt: "Cumulative log-odds for each threshold" }); L.forEach((l0, k) => { const l = l0.filter((q) => Math.abs(q.y) < 5.2), e = l[l.length - 1]; p.line(l, "fg-path").pts(l, "fg-pt", 2.6).text(e.x, e.y, ["≤ Poor", "≤ Fair", "≤ Good"][k], { dx: 7, dy: [13, 4, -5][k] }); }); return p; };
    return [
      { where: "terms", title: "The idea: one hidden scale, sliced by cut-points", legend: [["fit1", "New customer"], ["fit", "Five-year customer"], ["ref", "Cut-points (thresholds)"]], panels: [{ p: lp, c: "Imagine everyone has a position on a continuous satisfaction scale that the survey only reports in four boxes. Predictors slide a person's whole curve left or right; the cut-points stay put. The area of a curve between two cut-points is the probability of that answer. One slope per predictor, plus the cut-points, is the entire model." }] },
      { where: "data", title: "Checking the proportional-odds assumption", lead: "Simulated data, 6,000 rows. For each threshold, the points show the observed log-odds of being at or below it across the range of the predictor.", panels: [
        { v: "good", h: "Roughly parallel lines", p: pan(emp(111, false)), c: "The predictor shifts every threshold by the same amount, which is exactly what the model assumes. One coefficient describes the effect." },
        { v: "bad", h: "Lines that fan out or converge", p: pan(emp(112, true)), c: "The predictor has a different effect at different thresholds. A single coefficient would misstate it. Use a partial proportional-odds model, or fall back to multinomial." }
      ] }
    ];
  });
})();
