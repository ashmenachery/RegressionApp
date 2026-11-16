/* Small numerical routines behind the interactive demos. No dependencies. */
(function (root) {
  const F = {};

  F.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  F.normal = function (r) {
    return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  };
  F.poissonDraw = function (r, mu) {
    const L = Math.exp(-mu); let k = 0, p = 1;
    do { k++; p *= r(); } while (p > L);
    return k - 1;
  };

  /* Gaussian elimination with partial pivoting */
  F.solve = function (A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      const tmp = M[c]; M[c] = M[p]; M[p] = tmp;
      const d = Math.abs(M[c][c]) < 1e-14 ? 1e-14 : M[c][c];
      for (let r = c + 1; r < n; r++) {
        const f = M[r][c] / d;
        if (f === 0) continue;
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let s = M[i][n];
      for (let k = i + 1; k < n; k++) s -= M[i][k] * x[k];
      x[i] = s / (Math.abs(M[i][i]) < 1e-14 ? 1e-14 : M[i][i]);
    }
    return x;
  };

  const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  F.mean = mean;
  const U = (x) => (x - 5) / 5;           // map the 0..10 x-range to -1..1

  F.rmse = function (pts, f) {
    if (!pts.length) return NaN;
    let s = 0; for (const p of pts) { const e = p.y - f(p.x); s += e * e; }
    return Math.sqrt(s / pts.length);
  };
  F.r2 = function (pts, f) {
    const yb = mean(pts.map((p) => p.y)); let sr = 0, st = 0;
    for (const p of pts) { sr += (p.y - f(p.x)) ** 2; st += (p.y - yb) ** 2; }
    return st > 0 ? 1 - sr / st : NaN;
  };

  /* ---- ordinary least squares, one predictor ---- */
  F.ols = function (pts) {
    const xb = mean(pts.map((p) => p.x)), yb = mean(pts.map((p) => p.y));
    let sxy = 0, sxx = 0;
    for (const p of pts) { sxy += (p.x - xb) * (p.y - yb); sxx += (p.x - xb) ** 2; }
    const b1 = sxx > 0 ? sxy / sxx : 0, b0 = yb - b1 * xb;
    return { b0, b1, f: (x) => b0 + b1 * x };
  };

  /* ---- polynomial least squares (Chebyshev basis for stability) ---- */
  function cheb(u, d) {
    const t = [1, u];
    for (let k = 2; k <= d; k++) t.push(2 * u * t[k - 1] - t[k - 2]);
    return t.slice(0, d + 1);
  }
  F.poly = function (pts, degree) {
    const d = Math.max(0, Math.min(degree, pts.length - 1));
    const n = d + 1;
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    const b = new Array(n).fill(0);
    for (const p of pts) {
      const t = cheb(U(p.x), d);
      for (let i = 0; i < n; i++) { b[i] += t[i] * p.y; for (let j = 0; j < n; j++) A[i][j] += t[i] * t[j]; }
    }
    for (let i = 0; i < n; i++) A[i][i] += 1e-10;
    const c = F.solve(A, b);
    return { degree: d, f: (x) => { const t = cheb(U(x), d); let s = 0; for (let i = 0; i < n; i++) s += c[i] * t[i]; return s; } };
  };

  /* ---- standardised power features x, x^2 ... x^P (what a pipeline of
         PolynomialFeatures + StandardScaler would hand to a penalised model) ---- */
  function design(pts, P) {
    const n = pts.length, mu = [], sd = [], Z = [];
    for (let j = 1; j <= P; j++) {
      const col = pts.map((p) => Math.pow(U(p.x), j));
      const m = mean(col);
      const s = Math.sqrt(mean(col.map((v) => (v - m) ** 2))) || 1;
      mu.push(m); sd.push(s); Z.push(col.map((v) => (v - m) / s));
    }
    const yb = mean(pts.map((p) => p.y));
    return { n, P, mu, sd, Z, yb, yc: pts.map((p) => p.y - yb) };
  }
  function predictor(D, beta) {
    return (x) => { let s = D.yb; const u = U(x); for (let j = 0; j < D.P; j++) s += beta[j] * (Math.pow(u, j + 1) - D.mu[j]) / D.sd[j]; return s; };
  }

  /* ridge: minimise (1/n)||y - Zb||^2 + lambda ||b||^2 */
  F.ridge = function (pts, lambda, P) {
    const D = design(pts, P || 8), p = D.P, n = D.n;
    const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
      for (let k = 0; k < n; k++) b[i] += D.Z[i][k] * D.yc[k] / n;
      for (let j = 0; j < p; j++) { let s = 0; for (let k = 0; k < n; k++) s += D.Z[i][k] * D.Z[j][k]; A[i][j] = s / n; }
      A[i][i] += lambda;
    }
    const beta = F.solve(A, b);
    return { beta, f: predictor(D, beta) };
  };

  /* elastic net by coordinate descent (scikit-learn's objective):
     (1/2n)||y - Zb||^2 + lambda*l1*||b||_1 + 0.5*lambda*(1-l1)*||b||^2 */
  F.enet = function (pts, lambda, l1, P) {
    const D = design(pts, P || 8), p = D.P, n = D.n;
    const beta = new Array(p).fill(0), r = D.yc.slice();
    for (let it = 0; it < 3000; it++) {
      let delta = 0;
      for (let j = 0; j < p; j++) {
        const z = D.Z[j]; let rho = 0;
        for (let k = 0; k < n; k++) rho += z[k] * (r[k] + z[k] * beta[j]);
        rho /= n;
        const thr = lambda * l1;
        const soft = rho > thr ? rho - thr : rho < -thr ? rho + thr : 0;
        const nb = soft / (1 + lambda * (1 - l1));
        const diff = nb - beta[j];
        if (diff !== 0) { for (let k = 0; k < n; k++) r[k] -= z[k] * diff; beta[j] = nb; }
        delta = Math.max(delta, Math.abs(diff));
      }
      if (delta < 1e-7) break;
    }
    return { beta, f: predictor(D, beta) };
  };

  /* ---- logistic regression (Newton / IRLS, tiny ridge for separation) ---- */
  F.logistic = function (pts) {
    let a = 0, b = 0; const sig = (z) => 1 / (1 + Math.exp(-z));
    for (let it = 0; it < 40; it++) {
      let g0 = 0, g1 = 0, h00 = 1e-3, h01 = 0, h11 = 1e-3;
      for (const p of pts) {
        const x = p.x - 5, mu = sig(a + b * x), w = Math.max(mu * (1 - mu), 1e-9);
        g0 += p.y - mu; g1 += (p.y - mu) * x; h00 += w; h01 += w * x; h11 += w * x * x;
      }
      g0 -= 1e-3 * a; g1 -= 1e-3 * b;
      const det = h00 * h11 - h01 * h01; if (Math.abs(det) < 1e-12) break;
      let da = (h11 * g0 - h01 * g1) / det, db = (h00 * g1 - h01 * g0) / det;
      const m = Math.max(Math.abs(da), Math.abs(db)); if (m > 3) { da *= 3 / m; db *= 3 / m; }
      a += da; b += db;
      if (Math.abs(da) + Math.abs(db) < 1e-9) break;
    }
    return { b0: a - 5 * b, b1: b, f: (x) => sig(a + b * (x - 5)) };
  };

  /* ---- Poisson regression, log link ---- */
  F.poisson = function (pts) {
    let a = Math.log(mean(pts.map((p) => p.y)) + 0.1), b = 0;
    for (let it = 0; it < 60; it++) {
      let g0 = 0, g1 = 0, h00 = 1e-8, h01 = 0, h11 = 1e-8;
      for (const p of pts) {
        const x = p.x - 5, mu = Math.exp(Math.min(a + b * x, 20));
        g0 += p.y - mu; g1 += (p.y - mu) * x; h00 += mu; h01 += mu * x; h11 += mu * x * x;
      }
      const det = h00 * h11 - h01 * h01; if (Math.abs(det) < 1e-12) break;
      let da = (h11 * g0 - h01 * g1) / det, db = (h00 * g1 - h01 * g0) / det;
      const m = Math.max(Math.abs(da), Math.abs(db)); if (m > 1) { da /= m; db /= m; }
      a += da; b += db;
      if (Math.abs(da) + Math.abs(db) < 1e-10) break;
    }
    return { b0: a - 5 * b, b1: b, f: (x) => Math.exp(Math.min(a + b * (x - 5), 20)) };
  };

  /* ---- quantile regression, exact for one predictor: the optimum always
         passes through two data points, so try every pair ---- */
  F.quantile = function (pts, tau) {
    const n = pts.length; let best = null, bestLoss = Infinity;
    const loss = (b0, b1) => { let s = 0; for (const p of pts) { const u = p.y - b0 - b1 * p.x; s += u >= 0 ? tau * u : (tau - 1) * u; } return s; };
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (pts[i].x === pts[j].x) continue;
      const b1 = (pts[j].y - pts[i].y) / (pts[j].x - pts[i].x), b0 = pts[i].y - b1 * pts[i].x;
      const l = loss(b0, b1);
      if (l < bestLoss - 1e-12) { bestLoss = l; best = { b0, b1 }; }
    }
    if (!best) best = { b0: mean(pts.map((p) => p.y)), b1: 0 };
    return { b0: best.b0, b1: best.b1, f: (x) => best.b0 + best.b1 * x };
  };

  /* ---- regression tree on one predictor ---- */
  function build(pts, depth, minLeaf) {
    const n = pts.length; let sum = 0; for (const p of pts) sum += p.y;
    const node = { v: sum / n };
    if (depth <= 0 || n < 2 * minLeaf) return node;
    let best = -1, bestScore = sum * sum / n + 1e-9, ls = 0;
    for (let i = 1; i < n; i++) {
      ls += pts[i - 1].y;
      if (pts[i].x === pts[i - 1].x || i < minLeaf || n - i < minLeaf) continue;
      const rs = sum - ls, sc = ls * ls / i + rs * rs / (n - i);
      if (sc > bestScore) { bestScore = sc; best = i; }
    }
    if (best < 0) return node;
    node.s = (pts[best - 1].x + pts[best].x) / 2;
    node.l = build(pts.slice(0, best), depth - 1, minLeaf);
    node.r = build(pts.slice(best), depth - 1, minLeaf);
    return node;
  }
  function predictTree(t, x) { while (t.s !== undefined) t = x < t.s ? t.l : t.r; return t.v; }
  function leaves(t) { return t.s === undefined ? 1 : leaves(t.l) + leaves(t.r); }
  const sorted = (pts) => pts.slice().sort((a, b) => a.x - b.x);

  F.tree = function (pts, depth, minLeaf) {
    const t = build(sorted(pts), depth, minLeaf || 1);
    return { leaves: leaves(t), f: (x) => predictTree(t, x) };
  };
  F.forest = function (pts, nTrees, depth, seed) {
    const r = F.rng(seed || 7), trees = [], n = pts.length;
    for (let b = 0; b < nTrees; b++) {
      const s = []; for (let i = 0; i < n; i++) s.push(pts[Math.floor(r() * n)]);
      trees.push(build(sorted(s), depth, 1));
    }
    return { f: (x) => { let s = 0; for (const t of trees) s += predictTree(t, x); return s / trees.length; } };
  };
  F.boost = function (pts, rounds, lr, depth) {
    const base = mean(pts.map((p) => p.y)), sp = sorted(pts), trees = [];
    const cur = sp.map(() => base);
    for (let m = 0; m < rounds; m++) {
      const t = build(sp.map((p, i) => ({ x: p.x, y: p.y - cur[i] })), depth || 2, 2);
      trees.push(t);
      for (let i = 0; i < sp.length; i++) cur[i] += lr * predictTree(t, sp[i].x);
    }
    return { f: (x) => { let s = base; for (const t of trees) s += lr * predictTree(t, x); return s; } };
  };

  /* ---- linear support vector regression: subgradient descent on
         0.5 w^2 + C * sum max(0, |r| - eps) ---- */
  F.svr = function (pts, eps, C) {
    const o = F.ols(pts); let w = o.b1, b = o.b0 + 5 * o.b1;      // b is the value at x = 5
    const obj = (w, b) => { let s = 0.5 * w * w; for (const p of pts) s += C * Math.max(0, Math.abs(p.y - w * (p.x - 5) - b) - eps); return s; };
    let bw = w, bb = b, bo = obj(w, b);
    for (let t = 0; t < 4000; t++) {
      let gw = w, gb = 0;
      for (const p of pts) {
        const x = p.x - 5, r = p.y - w * x - b;
        if (r > eps) { gw -= C * x; gb -= C; } else if (r < -eps) { gw += C * x; gb += C; }
      }
      const norm = Math.hypot(gw, gb); if (norm < 1e-12) break;
      const step = 0.5 / Math.pow(1 + t, 0.75);
      w -= step * gw / norm; b -= step * gb / norm;
      const cur = obj(w, b); if (cur < bo) { bo = cur; bw = w; bb = b; }
    }
    w = bw; b = bb;
    const f = (x) => w * (x - 5) + b;
    return { b0: b - 5 * w, b1: w, f, isSV: (p) => Math.abs(p.y - f(p.x)) >= eps - 1e-6 };
  };

  /* ---- k nearest neighbours ---- */
  F.knn = function (pts, k) {
    const kk = Math.max(1, Math.min(k, pts.length));
    return { k: kk, f: (x) => {
      const d = pts.map((p) => ({ d: Math.abs(p.x - x), y: p.y })).sort((a, b) => a.d - b.d);
      let s = 0; for (let i = 0; i < kk; i++) s += d[i].y; return s / kk;
    } };
  };

  /* ---- Bayesian linear regression: prior b ~ N(0, 1/alpha I) on centred y,
         known noise sd. Returns posterior mean line, sd of the line, draws ---- */
  F.bayes = function (pts, alpha, sigma, seed) {
    const n = pts.length, yb = n ? mean(pts.map((p) => p.y)) : 5, beta = 1 / (sigma * sigma);
    let s00 = alpha, s01 = 0, s11 = alpha, t0 = 0, t1 = 0;
    for (const p of pts) { const u = U(p.x), y = p.y - yb; s00 += beta; s01 += beta * u; s11 += beta * u * u; t0 += beta * y; t1 += beta * u * y; }
    const det = s00 * s11 - s01 * s01;
    const S = [[s11 / det, -s01 / det], [-s01 / det, s00 / det]];
    const m = [S[0][0] * t0 + S[0][1] * t1, S[1][0] * t0 + S[1][1] * t1];
    const f = (x) => yb + m[0] + m[1] * U(x);
    const sd = (x) => { const u = U(x); return Math.sqrt(Math.max(S[0][0] + 2 * u * S[0][1] + u * u * S[1][1], 0)); };
    const l00 = Math.sqrt(S[0][0]), l10 = S[0][1] / l00, l11 = Math.sqrt(Math.max(S[1][1] - l10 * l10, 0));
    const r = F.rng(seed || 11), draws = [];
    for (let i = 0; i < 12; i++) {
      const z0 = F.normal(r), z1 = F.normal(r), a = m[0] + l00 * z0, b = m[1] + l10 * z0 + l11 * z1;
      draws.push((x) => yb + a + b * U(x));
    }
    return { f, sd, draws, slope: m[1] / 5, slopeSd: Math.sqrt(S[1][1]) / 5 };
  };

  root.Fits = F;
  if (typeof module !== "undefined" && module.exports) module.exports = F;
})(typeof window !== "undefined" ? window : globalThis);
