/* Regression Field Guide: routing, pages, quizzes, progress */
(function () {
  const MODELS = window.MODELS;
  const byId = {}; MODELS.forEach((m) => { byId[m.id] = m; });
  const FAMILIES = []; MODELS.forEach((m) => { if (!FAMILIES.includes(m.family)) FAMILIES.push(m.family); });
  const KEY = "regression-field-guide-v1";
  const main = document.getElementById("main"), nav = document.getElementById("nav");

  let state = { answers: {}, theme: null, bestExam: null };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "html") n.innerHTML = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => { if (c) n.appendChild(c); });
    return n;
  }
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  const mastered = (m) => m.quiz.every((q, i) => state.answers[m.id + ":" + i] === true);
  const masteredCount = () => MODELS.filter(mastered).length;

  /* ---------- theme ---------- */
  function applyTheme() { if (state.theme) document.documentElement.setAttribute("data-theme", state.theme); else document.documentElement.removeAttribute("data-theme"); }
  document.getElementById("theme").addEventListener("click", () => {
    const dark = state.theme ? state.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    state.theme = dark ? "light" : "dark"; save(); applyTheme();
  });
  document.getElementById("menu").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  applyTheme();

  /* ---------- sidebar ---------- */
  function renderNav(active) {
    nav.innerHTML = "";
    const top = el("div", { class: "nav-top" }, [
      el("a", { href: "#/", class: active === "home" ? "on" : "", text: "Start here" }),
      el("a", { href: "#/plots", class: active === "plots" ? "on" : "", text: "How to read plots" }),
      el("a", { href: "#/practice", class: active === "practice" ? "on" : "", text: "Scenario practice" }),
      el("a", { href: "#/compare", class: active === "compare" ? "on" : "", text: "Compare all models" }),
      el("a", { href: "#/exam", class: active === "exam" ? "on" : "", text: "Final exam" })
    ]);
    nav.appendChild(top);
    nav.appendChild(el("div", { class: "nav-progress", html: "<span>" + masteredCount() + " of " + MODELS.length + " models mastered</span><div class=\"bar\"><i style=\"width:" + (masteredCount() / MODELS.length * 100) + "%\"></i></div>" }));
    let n = 0;
    FAMILIES.forEach((fam) => {
      nav.appendChild(el("div", { class: "nav-fam", text: fam }));
      MODELS.filter((m) => m.family === fam).forEach((m) => {
        n++;
        const a = el("a", { href: "#/model/" + m.id, class: "nav-model" + (active === m.id ? " on" : "") }, [
          el("span", { class: "nav-n", text: String(n) }),
          el("span", { class: "nav-name", text: m.name.replace(" Regression", "").replace(" (XGBoost, LightGBM)", "") }),
          el("span", { class: "nav-check", text: mastered(m) ? "✓" : "", title: mastered(m) ? "Quiz passed" : "" })
        ]);
        nav.appendChild(a);
      });
    });
  }

  /* ---------- quiz card ---------- */
  function quizCard(model, qi, opts) {
    const q = (opts && opts.q) || model.quiz[qi], key = model.id + ":" + qi;
    const card = el("div", { class: "q-card" });
    if (opts && opts.label) card.appendChild(el("div", { class: "q-label", text: opts.label }));
    card.appendChild(el("p", { class: "q-text", text: q.q }));
    card.appendChild(el("p", { class: "q-ask", text: "Which model fits best?" }));
    const list = el("div", { class: "q-opts" });
    const fb = el("div", { class: "q-fb", "aria-live": "polite" });
    shuffle([q.a].concat(q.d)).forEach((id) => {
      const b = el("button", { type: "button", class: "q-opt", text: byId[id].name });
      b.addEventListener("click", () => {
        if (card.classList.contains("done")) return;
        const ok = id === q.a;
        card.classList.add("done");
        list.querySelectorAll("button").forEach((x) => { x.disabled = true; if (x.textContent === byId[q.a].name) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        if (opts && opts.q) { state.practice = state.practice || {}; state.practice[key] = ok; } else state.answers[key] = ok;
        save();
        fb.className = "q-fb " + (ok ? "ok" : "no");
        fb.innerHTML = "<b>" + (ok ? "✓ Correct." : "✗ Not quite. The best fit is " + byId[q.a].name + ".") + "</b> " + q.why +
          (ok || !opts || !opts.linkBack ? "" : ' <a href="#/model/' + q.a + '">Review ' + byId[q.a].name + "</a>");
        if (opts && opts.onAnswer) opts.onAnswer(ok, q);
      });
      list.appendChild(b);
    });
    card.appendChild(list); card.appendChild(fb);
    return card;
  }

  /* ---------- pages ---------- */
  const GUIDE = [
    ["A number, and you want to explain it", ["slr", "mlr", "poly", "step"]],
    ["A number, with many or correlated predictors", ["ridge", "lasso", "enet"]],
    ["A number, and accuracy is the goal", ["rf", "gbm", "tree", "svr", "knn"]],
    ["A yes / no outcome", ["logit"]],
    ["One of several categories", ["mnl", "ord"]],
    ["A count of events", ["pois", "nb"]],
    ["A percentile, not the average", ["quant"]],
    ["Time until something happens", ["cox"]],
    ["Little data, or uncertainty is the point", ["bayes"]]
  ];
  const RULES = [
    ["Start from the decision, not the data.", "Before choosing a model, write down what someone will do differently with its output and what it costs to be wrong in each direction. That tells you the target, the metric and often the model."],
    ["Build the dumbest baseline first.", "Predict the mean, last week's value, or a one-variable line. Many projects discover late that the sophisticated model barely beats it. Know the number to beat before you start."],
    ["Your validation split must imitate deployment.", "Forecasting the future? Validate on later dates. Scoring new customers? Hold out whole customers. A random split on data with time or group structure gives a number you will never see in production."],
    ["Ask of every feature: would I have this at prediction time?", "Leakage is the most common reason a model looks excellent offline and fails live. Results that seem too good usually are. Check the top features first."],
    ["The label is a modelling decision.", "Churned within 30 days or 90? Default defined how? Most weak models trace back to a vague or inconsistent target definition, not to the algorithm."],
    ["Look at the data, row by row.", "Open fifty raw records. Plot every variable. Duplicates, unit changes, placeholder values such as 999 or 1900-01-01, and columns that changed meaning half-way through are found by looking, not by modelling."],
    ["Pick the metric the business feels.", "RMSE punishes big misses, MAE treats all misses alike, and neither knows that under-forecasting costs more than over-forecasting. Translate error into money or time where you can."],
    ["Explaining and predicting are different jobs.", "A model that predicts well can have coefficients that mean nothing causally, and the reverse. Decide which you are doing and say so when you present."],
    ["Simple models win ties.", "A model people can read gets used, challenged, fixed and trusted. Take the complex one only when the gain is clear on honest validation."],
    ["Shipping is the half-way point.", "Inputs drift, upstream pipelines change, behaviour shifts. Monitor inputs and predictions, compare with actuals when they arrive, and agree a retraining plan before launch."]
  ];

  function pageHome() {
    renderNav("home");
    const wrap = el("div", { class: "page" });
    wrap.appendChild(el("header", { class: "hero" }, [
      el("h1", { text: "Regression Field Guide" }),
      el("p", { class: "lede", text: "Twenty regression models, each taught the way a working data scientist uses it: the vocabulary, a real scenario, where it came from, the maths in plain English, an interactive plot, the practical traps, and what experience teaches you about it." }),
      el("div", { class: "hero-stats", html: "<div><b>" + masteredCount() + " / " + MODELS.length + "</b><span>models mastered</span></div><div><b>" + MODELS.reduce((s, m) => s + m.quiz.length, 0) + "</b><span>scenario questions</span></div><div><b>" + (state.bestExam === null ? "–" : state.bestExam + "%") + "</b><span>best exam score</span></div>" }),
      el("p", { class: "hero-cta" }, [el("a", { class: "btn", href: "#/model/" + (MODELS.find((m) => !mastered(m)) || MODELS[0]).id, text: masteredCount() ? "Continue learning" : "Start with model 1" }), el("a", { class: "btn ghost", href: "#/exam", text: "Take the final exam" })])
    ]));

    if (window.PLOT_GUIDE) wrap.appendChild(el("a", { class: "callout", href: "#/plots", html: "<b>Find plots hard to read?</b> Start with the chapter <u>How to read plots</u>. It walks through every kind of picture used in this guide, one step at a time." }));

    const sec = el("section", {}, [el("h2", { text: "Which model? Start from the outcome" }), el("p", { class: "muted", text: "The type of thing you are predicting narrows the choice more than anything else. Find your outcome, then read the candidates." })]);
    const grid = el("div", { class: "guide" });
    GUIDE.forEach((g) => {
      grid.appendChild(el("div", { class: "guide-card" }, [el("h3", { text: g[0] }), el("div", { class: "chips" }, g[1].map((id) => el("a", { class: "chip", href: "#/model/" + id, text: byId[id].name.replace(" Regression", "").replace(" (XGBoost, LightGBM)", "") })))]));
    });
    sec.appendChild(grid); if (window.Figures) window.Figures.nodes("home", "home").forEach((x) => sec.appendChild(x)); wrap.appendChild(sec);

    const rules = el("section", {}, [el("h2", { text: "Ten rules from real projects" }), el("p", { class: "muted", text: "These apply to every model in this guide. They are what separates someone who knows the algorithms from someone who has shipped them." })]);
    const ol = el("ol", { class: "rules" });
    RULES.forEach((r) => ol.appendChild(el("li", { html: "<b>" + r[0] + "</b> " + r[1] })));
    rules.appendChild(ol); wrap.appendChild(rules);

    const all = el("section", {}, [el("h2", { text: "All twenty models" })]);
    FAMILIES.forEach((fam) => {
      all.appendChild(el("h3", { class: "fam-h", text: fam }));
      const g = el("div", { class: "cards" });
      MODELS.filter((m) => m.family === fam).forEach((m) => {
        g.appendChild(el("a", { class: "card" + (mastered(m) ? " done" : ""), href: "#/model/" + m.id }, [
          el("div", { class: "card-top" }, [el("span", { class: "tag", text: m.target }), el("span", { class: "card-check", text: mastered(m) ? "✓ mastered" : "" })]),
          el("h4", { text: m.name }), el("p", { text: m.tagline })
        ]));
      });
      all.appendChild(g);
    });
    wrap.appendChild(all);
    return wrap;
  }

  const SECTIONS = [["overview", "Overview"], ["terms", "Key terms"], ["example", "Real-world example"], ["history", "History"], ["math", "The math"], ["try", "Try it"], ["data", "Good data, bad data"], ["metrics", "Metrics"], ["practical", "Practical considerations"], ["field", "From the field"], ["code", "In code"], ["quiz", "Quiz"]];

  function section(id, title, kids) { return el("section", { id: "s-" + id, class: "m-sec" }, [el("h2", { text: title })].concat(kids)); }
  function bullets(items, cls) { const ul = el("ul", { class: cls }); items.forEach((t) => ul.appendChild(el("li", { html: t }))); return ul; }

  function pageModel(id) {
    const m = byId[id]; if (!m) return pageHome();
    renderNav(id);
    const figs = (w) => (window.Figures ? window.Figures.nodes(id, w) : []);
    const dataFigs = figs("data"), hasData = dataFigs.length > 0;
    const ex = (window.EXTRAS || {})[id] || {};
    const idx = MODELS.indexOf(m), wrap = el("div", { class: "page" });
    wrap.appendChild(el("header", { class: "m-head" }, [
      el("div", { class: "crumb", text: "Model " + (idx + 1) + " of " + MODELS.length + " · " + m.family }),
      el("h1", { text: m.name }),
      el("p", { class: "lede", text: m.tagline }),
      el("div", { class: "m-meta" }, [el("span", { class: "tag", text: "Predicts: " + m.target })])
    ]));
    const toc = el("nav", { class: "toc", "aria-label": "Sections" });
    SECTIONS.forEach((s) => { if (s[0] === "try" && !m.demo) return; if (s[0] === "data" && !hasData) return; if (s[0] === "metrics" && !ex.metrics) return; const b = el("button", { type: "button", text: s[1] }); b.addEventListener("click", () => { const t = document.getElementById("s-" + s[0]); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }); toc.appendChild(b); });
    wrap.appendChild(toc);

    wrap.appendChild(section("overview", "Overview", [el("div", { class: "two" }, [
      el("div", { class: "box use" }, [el("h3", { text: "Reach for it when" }), el("p", { text: m.use })]),
      el("div", { class: "box avoid" }, [el("h3", { text: "Think twice when" }), el("p", { text: m.avoid })])
    ])]));

    const termList = (terms) => { const dl = el("dl", { class: "terms" }); terms.forEach((t) => { dl.appendChild(el("dt", { html: t[0] })); dl.appendChild(el("dd", { html: t[1] })); }); return dl; };
    const termKids = ex.terms
      ? [el("h3", { text: "Start with the basics" }), el("p", { class: "muted", text: "Plain-language words you need before the model-specific vocabulary makes sense." }), termList(ex.terms), el("h3", { class: "terms-h", text: "Terms specific to this model" }), termList(m.terms)]
      : [termList(m.terms)];
    wrap.appendChild(section("terms", "Key terms", termKids.concat(figs("terms"))));

    wrap.appendChild(section("example", "Real-world example", [el("div", { class: "example" }, [
      el("h3", { text: m.example.title }), el("p", { html: m.example.body }),
      el("p", { class: "why", html: "<b>Why this model:</b> " + m.example.why })
    ])]));

    wrap.appendChild(section("history", "History", [el("div", { class: "prose", html: m.history })]));

    wrap.appendChild(section("math", "The math", [
      el("div", { class: "eq-label", text: "The model" }), el("div", { class: "eq", html: m.math.eq }),
      el("div", { class: "eq-label", text: "What it optimises" }), el("div", { class: "eq", html: m.math.cost }),
      el("h3", { text: "In plain English" }), el("div", { class: "prose", html: m.math.plain })
    ].concat(figs("math"))));

    if (m.demo && window.Playground && window.Playground.has(m.demo)) {
      const host = el("div", { class: "pg" });
      wrap.appendChild(section("try", "Try it", [host]));
      window.Playground.mount(host, m.demo);
    }

    if (hasData) wrap.appendChild(section("data", "Good data, bad data", [el("p", { class: "muted", text: "Plot your data before you fit anything. These are the pictures to look for, and the ones that should make you stop." })].concat(dataFigs)));

    if (ex.metrics) {
      const cards = ex.metrics.map((k) => el("div", { class: "metric" }, [
        el("h3", { html: k[0] }), el("p", { class: "metric-what", html: k[1] }),
        el("div", { class: "metric-row good", html: "<b>Healthy</b><span>" + k[2] + "</span>" }),
        el("div", { class: "metric-row bad", html: "<b>Bad example</b><span>" + k[3] + "</span>" }),
        el("div", { class: "metric-row fix", html: "<b>What to tweak</b><span>" + k[4] + "</span>" })
      ]));
      wrap.appendChild(section("metrics", "Metrics to evaluate", [el("p", { class: "muted", text: "What to measure after fitting this model, what a bad result looks like in real numbers, and which settings or data changes move it. Always judge a metric on data the model did not train on, and against a simple baseline." })].concat(cards)));
    }

    wrap.appendChild(section("practical", "Practical considerations", [bullets(m.practical, "checks")].concat(figs("practical"))));
    wrap.appendChild(section("field", "From the field", [
      el("p", { class: "muted", text: "What you learn from using this model on real projects, not from the textbook." }),
      bullets(m.field, "field")
    ]));

    const pre = el("pre", { class: "code" }); pre.appendChild(el("code", { text: m.code }));
    wrap.appendChild(section("code", "In code", [el("p", { class: "muted", text: "A realistic Python starting point. Column names are placeholders for your own data." }), pre]));

    const status = el("p", { class: "q-status" });
    const upd = () => { status.textContent = mastered(m) ? "✓ Both answered correctly. This model is marked as mastered." : "Answer both correctly to mark this model as mastered."; status.className = "q-status" + (mastered(m) ? " ok" : ""); renderNav(id); };
    const qs = el("div", { class: "q-list" });
    const build = () => { qs.innerHTML = ""; m.quiz.forEach((q, i) => qs.appendChild(quizCard(m, i, { label: "Scenario " + (i + 1) + " of " + m.quiz.length, onAnswer: upd }))); };
    build();
    const retry = el("button", { type: "button", class: "btn ghost", text: "Try these again" });
    retry.addEventListener("click", build);
    wrap.appendChild(section("quiz", "Quiz: which model fits?", [
      el("p", { class: "muted", text: "One of these scenarios suits this model. The other is a near miss where a different model is the better choice. Telling them apart is the skill." }),
      qs, status, retry
    ]));
    if (window.SCENARIOS && window.SCENARIOS[id]) wrap.appendChild(el("a", { class: "callout more", href: "#/practice/" + id, html: "<b>Want more practice?</b> See <u>" + window.SCENARIOS[id].length + " more real-world scenarios</u> where " + m.name + " is the right choice." }));
    upd();

    const prev = MODELS[idx - 1], next = MODELS[idx + 1];
    wrap.appendChild(el("div", { class: "pager" }, [
      prev ? el("a", { href: "#/model/" + prev.id, class: "btn ghost", text: "← " + prev.name }) : el("span"),
      next ? el("a", { href: "#/model/" + next.id, class: "btn", text: next.name + " →" }) : el("a", { href: "#/exam", class: "btn", text: "Take the final exam →" })
    ]));
    return wrap;
  }

  function pagePlots() {
    renderNav("plots");
    const GUIDE_P = window.PLOT_GUIDE || [];
    const wrap = el("div", { class: "page" }, [el("header", { class: "m-head" }, [
      el("div", { class: "crumb", text: "Chapter · " + GUIDE_P.length + " topics" }),
      el("h1", { text: "How to read plots" }),
      el("p", { class: "lede", text: "Every picture used in this guide, explained from scratch: what it shows, how to read it step by step, what a good and a bad one look like, and the mistake people most often make." })
    ])]);
    const toc = el("nav", { class: "toc", "aria-label": "Plot types" });
    GUIDE_P.forEach((g) => { const b = el("button", { type: "button", text: g.nav }); b.addEventListener("click", () => { const t = document.getElementById("s-" + g.id); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }); toc.appendChild(b); });
    wrap.appendChild(toc);
    GUIDE_P.forEach((g, i) => {
      const kids = [el("p", { html: g.what }), el("h3", { text: "How to read it" })];
      const ol = el("ol", { class: "steps" }); g.steps.forEach((t) => ol.appendChild(el("li", { html: t }))); kids.push(ol);
      if (g.terms) { const dl = el("dl", { class: "terms" }); g.terms.forEach((t) => { dl.appendChild(el("dt", { html: t[0] })); dl.appendChild(el("dd", { html: t[1] })); }); kids.push(el("h3", { text: "Words you need" })); kids.push(dl); }
      (window.Figures ? window.Figures.nodes("plots", g.id) : []).forEach((f) => kids.push(f));
      kids.push(el("div", { class: "box avoid trap" }, [el("h3", { text: "Common mistake" }), el("p", { html: g.trap })]));
      kids.push(el("details", { class: "check" }, [el("summary", { html: "<b>Check yourself.</b> " + g.check[0] }), el("p", { html: g.check[1] })]));
      wrap.appendChild(section(g.id, (i ? i + ". " : "") + g.title, kids));
    });
    wrap.appendChild(el("div", { class: "pager" }, [el("a", { href: "#/", class: "btn ghost", text: "← Start here" }), el("a", { href: "#/model/" + MODELS[0].id, class: "btn", text: MODELS[0].name + " →" })]));
    return wrap;
  }

  /* ---------- scenario practice: extra scenarios per model, kept apart from the mastery quizzes ---------- */
  const SC = window.SCENARIOS || {};
  const scItem = (id, i) => { const s = SC[id][i]; return { q: s[0], a: id, d: s[1].split(" "), why: s[2] }; };
  const short = (m) => m.name.replace(" Regression", "").replace(" (XGBoost, LightGBM)", "");

  function pagePractice(sel) {
    renderNav("practice");
    const pool = []; MODELS.forEach((m) => (SC[m.id] || []).forEach((s, i) => pool.push({ m, i })));
    const right = () => pool.filter((it) => (state.practice || {})[it.m.id + ":" + it.i] === true).length;

    if (sel && byId[sel] && SC[sel]) {
      const m = byId[sel], idx = MODELS.indexOf(m);
      const wrap = el("div", { class: "page" }, [el("header", { class: "m-head" }, [
        el("div", { class: "crumb" }, [el("a", { href: "#/practice", text: "Scenario practice" }), document.createTextNode(" · " + m.family)]),
        el("h1", { text: m.name }),
        el("p", { class: "lede", text: SC[sel].length + " situations where this is the model to reach for. Read each one, decide what makes it a fit, then open the explanation." }),
        el("div", { class: "m-meta" }, [el("span", { class: "tag", text: "Predicts: " + m.target })])
      ])]);
      wrap.appendChild(el("div", { class: "two sc-recap" }, [
        el("div", { class: "box use" }, [el("h3", { text: "Reach for it when" }), el("p", { text: m.use })]),
        el("div", { class: "box avoid" }, [el("h3", { text: "Think twice when" }), el("p", { text: m.avoid })])
      ]));
      const list = el("div", { class: "q-list sc-list" });
      SC[sel].forEach((s, i) => list.appendChild(el("div", { class: "q-card" }, [
        el("div", { class: "q-label", text: "Scenario " + (i + 1) + " of " + SC[sel].length }),
        el("p", { class: "q-text", text: s[0] }),
        el("details", { class: "check" }, [el("summary", { html: "<b>Why " + short(m) + " fits</b>" }), el("p", { text: s[2] }),
          el("p", { class: "sc-near", html: "<b>Easily confused with:</b> " + s[1].split(" ").map((d) => '<a href="#/model/' + d + '">' + short(byId[d]) + "</a>").join(", ") })])
      ])));
      wrap.appendChild(list);
      const prev = MODELS[idx - 1], next = MODELS[idx + 1];
      wrap.appendChild(el("div", { class: "pager" }, [
        prev ? el("a", { href: "#/practice/" + prev.id, class: "btn ghost", text: "← " + short(prev) }) : el("a", { href: "#/practice", class: "btn ghost", text: "← All scenarios" }),
        next ? el("a", { href: "#/practice/" + next.id, class: "btn", text: short(next) + " →" }) : el("a", { href: "#/practice", class: "btn", text: "Test yourself →" })
      ]));
      return wrap;
    }

    const wrap = el("div", { class: "page" }, [el("header", { class: "m-head" }, [
      el("div", { class: "crumb", text: pool.length + " extra scenarios · " + (pool.length / MODELS.length) + " per model" }),
      el("h1", { text: "Scenario practice" }),
      el("p", { class: "lede", text: "Real-world situations from many industries. Test yourself on a random mix, or study the scenarios for one model at a time. These do not affect which models are marked as mastered." })
    ])]);
    const quiz = el("section", { class: "m-sec" }, [el("h2", { text: "Test yourself: which model fits?" })]);
    const body = el("div", { class: "exam" }); quiz.appendChild(body); wrap.appendChild(quiz);

    function start(n) {
      const items = shuffle(pool).slice(0, n); let pos = 0, score = 0; const missed = [];
      function show() {
        body.innerHTML = "";
        if (pos >= items.length) return finish();
        const it = items[pos];
        body.appendChild(el("div", { class: "exam-bar", html: "<span>Scenario " + (pos + 1) + " of " + items.length + "</span><span>Score " + score + "</span><div class=\"bar\"><i style=\"width:" + (pos / items.length * 100) + "%\"></i></div>" }));
        const nextBtn = el("button", { type: "button", class: "btn", text: pos + 1 === items.length ? "See results" : "Next scenario" });
        nextBtn.hidden = true;
        nextBtn.addEventListener("click", () => { pos++; show(); window.scrollTo(0, 0); });
        body.appendChild(quizCard(it.m, it.i, { q: scItem(it.m.id, it.i), linkBack: true, onAnswer: (ok, q) => { if (ok) score++; else missed.push(q.a); nextBtn.hidden = false; nextBtn.focus(); } }));
        body.appendChild(nextBtn);
      }
      function finish() {
        body.appendChild(el("div", { class: "result" }, [
          el("div", { class: "result-n", text: score + " / " + items.length }),
          el("p", { text: score === items.length ? "A clean sweep." : "The models below are the ones you missed. Their scenario lists are a good place to go next." })
        ]));
        const uniq = missed.filter((v, i) => missed.indexOf(v) === i);
        if (uniq.length) body.appendChild(el("div", { class: "chips" }, uniq.map((id) => el("a", { class: "chip", href: "#/practice/" + id, text: short(byId[id]) }))));
        const again = el("button", { type: "button", class: "btn", text: "Start again" });
        again.addEventListener("click", intro); body.appendChild(again);
      }
      show();
    }
    function intro() {
      body.innerHTML = "";
      body.appendChild(el("p", { class: "muted", text: "Scenarios from all twenty models in random order, with feedback after every answer. So far you have answered " + right() + " of " + pool.length + " correctly." }));
      const row = el("div", { class: "hero-cta" });
      [[10, "Quick round: 10 scenarios"], [25, "Longer round: 25 scenarios"], [pool.length, "Everything: all " + pool.length]].forEach((o, i) => {
        const b = el("button", { type: "button", class: "btn" + (i ? " ghost" : ""), text: o[1] });
        b.addEventListener("click", () => start(o[0])); row.appendChild(b);
      });
      body.appendChild(row);
    }
    intro();

    const browse = el("section", { class: "m-sec" }, [el("h2", { text: "Study by model" }), el("p", { class: "muted", text: "Ten scenarios for each model, with the reason it fits and the models it is most easily confused with." })]);
    FAMILIES.forEach((fam) => {
      browse.appendChild(el("h3", { class: "fam-h", text: fam }));
      const g = el("div", { class: "cards" });
      MODELS.filter((m) => m.family === fam && SC[m.id]).forEach((m) => {
        const ok = SC[m.id].filter((s, i) => (state.practice || {})[m.id + ":" + i] === true).length;
        g.appendChild(el("a", { class: "card", href: "#/practice/" + m.id }, [
          el("div", { class: "card-top" }, [el("span", { class: "tag", text: SC[m.id].length + " scenarios" }), el("span", { class: "card-check", text: ok ? ok + " answered correctly" : "" })]),
          el("h4", { text: m.name }), el("p", { text: m.use })
        ]));
      });
      browse.appendChild(g);
    });
    wrap.appendChild(browse);
    return wrap;
  }

  function pageCompare() {
    renderNav("compare");
    const wrap = el("div", { class: "page" }, [el("header", { class: "m-head" }, [el("h1", { text: "Compare all models" }), el("p", { class: "lede", text: "One row per model: what it predicts, when to reach for it and when to think twice." })])]);
    const table = el("table", { class: "cmp" });
    table.appendChild(el("thead", { html: "<tr><th>Model</th><th>Predicts</th><th>Reach for it when</th><th>Think twice when</th></tr>" }));
    const tb = el("tbody");
    MODELS.forEach((m) => {
      tb.appendChild(el("tr", {}, [
        el("td", {}, [el("a", { href: "#/model/" + m.id, text: m.name }), el("div", { class: "cmp-fam", text: m.family })]),
        el("td", { text: m.target }), el("td", { text: m.use }), el("td", { text: m.avoid })
      ]));
    });
    table.appendChild(tb);
    wrap.appendChild(el("div", { class: "table-wrap" }, [table]));
    return wrap;
  }

  function pageExam() {
    renderNav("exam");
    const wrap = el("div", { class: "page" }, [el("header", { class: "m-head" }, [el("h1", { text: "Final exam" }), el("p", { class: "lede", text: "Scenarios from all twenty models, in random order. Read the outcome type and the constraints, then choose the model you would actually use." })])]);
    const body = el("div", { class: "exam" }); wrap.appendChild(body);
    const pool = []; MODELS.forEach((m) => m.quiz.forEach((q, i) => pool.push({ m, i })));

    function start(n) {
      const items = shuffle(pool).slice(0, n); let pos = 0, score = 0; const missed = [];
      function show() {
        body.innerHTML = "";
        if (pos >= items.length) return finish();
        const it = items[pos];
        body.appendChild(el("div", { class: "exam-bar", html: "<span>Question " + (pos + 1) + " of " + items.length + "</span><span>Score " + score + "</span><div class=\"bar\"><i style=\"width:" + (pos / items.length * 100) + "%\"></i></div>" }));
        const nextBtn = el("button", { type: "button", class: "btn", text: pos + 1 === items.length ? "See results" : "Next question" });
        nextBtn.hidden = true;
        nextBtn.addEventListener("click", () => { pos++; show(); window.scrollTo(0, 0); });
        body.appendChild(quizCard(it.m, it.i, { linkBack: true, onAnswer: (ok, q) => { if (ok) score++; else missed.push(q.a); nextBtn.hidden = false; nextBtn.focus(); } }));
        body.appendChild(nextBtn);
      }
      function finish() {
        const pct = Math.round(score / items.length * 100);
        if (state.bestExam === null || pct > state.bestExam) { state.bestExam = pct; save(); }
        renderNav("exam");
        body.appendChild(el("div", { class: "result" }, [
          el("div", { class: "result-n", text: score + " / " + items.length }),
          el("p", { text: pct >= 90 ? "Excellent. You are choosing models the way an experienced practitioner does." : pct >= 70 ? "Solid. Review the models below and try again." : "A good first pass. The models below are worth re-reading before another attempt." })
        ]));
        const uniq = missed.filter((v, i) => missed.indexOf(v) === i);
        if (uniq.length) {
          body.appendChild(el("h3", { text: "Models to review" }));
          body.appendChild(el("div", { class: "chips" }, uniq.map((id) => el("a", { class: "chip", href: "#/model/" + id, text: byId[id].name }))));
        }
        const again = el("button", { type: "button", class: "btn", text: "Start again" });
        again.addEventListener("click", intro); body.appendChild(again);
      }
      show();
    }
    function intro() {
      body.innerHTML = "";
      body.appendChild(el("p", { class: "muted", text: "You get feedback after every answer. Your best score is saved on this device." + (state.bestExam === null ? "" : " Best so far: " + state.bestExam + "%.") }));
      const row = el("div", { class: "hero-cta" });
      [[10, "Quick round: 10 questions"], [20, "Standard: 20 questions"], [pool.length, "Full exam: all " + pool.length]].forEach((o, i) => {
        const b = el("button", { type: "button", class: "btn" + (i ? " ghost" : ""), text: o[1] });
        b.addEventListener("click", () => start(o[0])); row.appendChild(b);
      });
      body.appendChild(row);
    }
    intro();
    return wrap;
  }

  /* ---------- router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, ""), parts = h.split("/");
    let page;
    if (parts[0] === "model") page = pageModel(parts[1]);
    else if (parts[0] === "plots") page = pagePlots();
    else if (parts[0] === "practice") page = pagePractice(parts[1]);
    else if (parts[0] === "compare") page = pageCompare();
    else if (parts[0] === "exam") page = pageExam();
    else page = pageHome();
    main.innerHTML = ""; main.appendChild(page);
    document.body.classList.remove("nav-open");
    window.scrollTo(0, 0);
    const on = nav.querySelector(".nav-model.on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
    main.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);
  route();
})();
