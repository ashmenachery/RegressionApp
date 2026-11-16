/* "How to read plots" chapter: the text for each plot type and the figures that go with it.
   Figures are registered under the id "plots"; each figure's `where` is the section id. */
(function () {
  const F = window.Fits, G = window.Figures, H = G.h, P = H.P, cloud = H.cloud;
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const T10 = [0, 2, 4, 6, 8, 10].map((v) => [v, String(v)]);
  const PCT = [[0, "0%"], [0.5, "50%"], [1, "100%"]];

  /* ---------- small helpers ---------- */
  function normals(seed, n, mean, sd) { const r = F.rng(seed), a = []; for (let i = 0; i < n; i++) a.push(mean + sd * F.normal(r)); return a; }
  function bins(vals, lo, hi, nb) {
    const w = (hi - lo) / nb, c = new Array(nb).fill(0);
    vals.forEach((v) => { if (v >= lo && v < hi) c[Math.floor((v - lo) / w)]++; });
    return { w, bars: c.map((k, i) => [lo + (i + 0.5) * w, k]), top: Math.max.apply(null, c) };
  }
  function histPanel(vals, lo, hi, nb, o) {
    const b = bins(vals, lo, hi, nb);
    const p = P(Object.assign({ x: [lo, hi], y: [0, b.top * 1.18], yl: "How many" }, o));
    p.bars(b.bars, b.w);
    return { p, b };
  }
  function quart(s, q) { const i = (s.length - 1) * q, a = Math.floor(i), b = Math.ceil(i); return s[a] + (s[b] - s[a]) * (i - a); }
  function boxStats(vals) {
    const s = vals.slice().sort((a, b) => a - b), q1 = quart(s, 0.25), med = quart(s, 0.5), q3 = quart(s, 0.75), iqr = q3 - q1;
    const inl = s.filter((v) => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);
    return { q1, med, q3, lo: inl[0], hi: inl[inl.length - 1], out: s.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr) };
  }
  function drawBox(p, xc, hw, vals) {
    const b = boxStats(vals);
    p.seg(xc, b.lo, xc, b.q1, "fg-mark").seg(xc, b.q3, xc, b.hi, "fg-mark");
    p.seg(xc - hw / 2, b.lo, xc + hw / 2, b.lo, "fg-mark").seg(xc - hw / 2, b.hi, xc + hw / 2, b.hi, "fg-mark");
    p.rect(xc - hw, b.q1, xc + hw, b.q3, "fg-box").seg(xc - hw, b.med, xc + hw, b.med, "fg-ink");
    p.pts(b.out.map((v) => ({ x: xc, y: v })), "fg-pt-hollow", 3.6);
    return b;
  }
  const r0 = (v) => String(Math.round(v));

  /* ================= the text ================= */
  window.PLOT_GUIDE = [
    {
      id: "basics", nav: "Start here", title: "Five questions to ask of any plot",
      what: "A plot is a table of numbers turned into a picture. Every plot, however complicated it looks, can be read with the same five questions, asked in the same order. Do not look at the shapes first. Read the words first.",
      steps: [
        "<b>What is along the bottom?</b> Read the label of the horizontal axis (the x-axis) and its numbers. That is the thing being compared, usually the cause or the input.",
        "<b>What is up the side?</b> Read the label of the vertical axis (the y-axis) and its numbers. That is the thing being measured, usually the result or the outcome.",
        "<b>What is one mark?</b> Decide what a single dot, bar or line stands for. One dot is often one row of data: one house, one customer, one day.",
        "<b>What do the colours and line styles mean?</b> Read the legend. Never guess.",
        "<b>Only now, look at the shape.</b> First the overall pattern (going up? going down? flat? curved?), then the exceptions (anything far from the rest)."
      ],
      terms: [
        ["x-axis", "The horizontal line along the bottom. Further right means a bigger value of whatever its label says."],
        ["y-axis", "The vertical line up the side. Higher means a bigger value of whatever its label says."],
        ["Tick labels", "The small numbers along each axis. They tell you the value at that position."],
        ["Legend", "The key that says what each colour, dot style or line style stands for."],
        ["Data point", "One mark on the plot. Its left-right position gives one number and its up-down position gives another."]
      ],
      trap: "Looking at the picture before reading the axis labels. The same cloud of dots means something completely different depending on what the axes are.",
      check: ["In the first picture, find the dot furthest to the right. What does its position tell you?", "Furthest right means it is the largest house in the data (read the x-axis). How high up it sits tells you its price (read the y-axis). Position left-to-right and position bottom-to-top are two separate facts about the same house."]
    },
    {
      id: "scatter", nav: "Scatter plot", title: "Scatter plot",
      what: "A scatter plot shows two numbers for every row of data. Each dot is one row. It answers one question: when one thing is bigger, does the other tend to be bigger, smaller, or neither? It is the most important plot in regression, because a regression line is drawn through a scatter plot.",
      steps: [
        "Read both axis labels so you know which two things are being compared.",
        "Squint at the whole cloud. Does it tilt upwards from left to right, tilt downwards, or look like a shapeless blob?",
        "Judge how tight the cloud is. A narrow band means one value predicts the other well. A wide cloud means it only gives a rough idea.",
        "Check whether the tilt is straight or bends.",
        "Look for dots sitting far away from all the others. Those are outliers, and they deserve a second look."
      ],
      trap: "Assuming that a clear upward cloud proves one thing causes the other. The plot shows that they move together. It cannot tell you why.",
      check: ["A scatter plot of ice-cream sales against temperature shows a tight cloud rising from bottom-left to top-right. Say what it means in one sentence.", "On hotter days, more ice cream is sold, and because the cloud is tight, temperature alone predicts sales quite well."]
    },
    {
      id: "line", nav: "Fitted line", title: "Scatter plot with a fitted line",
      what: "The line is the model's summary of the dots: for any value along the bottom, the height of the line is the model's prediction. Three things are worth reading from it: how steep it is, where it starts, and how far the dots sit from it.",
      steps: [
        "<b>Make a prediction.</b> Pick a value on the x-axis, go straight up until you hit the line, then go straight left to the y-axis. The number you land on is the prediction.",
        "<b>Read the slope.</b> Pick two places on the line. See how far the line climbs (the rise) while you move right (the run). Rise divided by run is the slope: how much the outcome changes for each one-unit step in the input.",
        "<b>Read the intercept.</b> It is the height of the line where x is zero.",
        "<b>Look at the gaps.</b> The vertical distance from a dot to the line is that row's error, called a residual. Small gaps everywhere mean the line describes the data well."
      ],
      trap: "Judging the slope by how steep the line looks. Steepness on screen depends on how the axes are stretched. Always work the slope out from the numbers on the axes.",
      check: ["A line passes through (2, 40) and (6, 60). What is the slope, and what does it mean?", "The line rises by 20 while x increases by 4, so the slope is 20 ÷ 4 = 5. Each extra unit of x goes with 5 more units of the outcome."]
    },
    {
      id: "hist", nav: "Histogram", title: "Histogram",
      what: "A histogram shows one number only, and how its values are spread out. The range of values is cut into equal slices along the bottom, and the height of each bar says how many rows fall in that slice. Use it to see what is typical, how much things vary, and whether there are unusual values.",
      steps: [
        "Read the x-axis: it shows the values themselves (for example, minutes).",
        "Read the y-axis: it is a count, not a measurement. A tall bar means \"many rows have a value around here\".",
        "Find the tallest bars. That is where typical values live.",
        "See how wide the pile is. A wide pile means values vary a lot.",
        "Look at the shape: is it symmetric, does it have a long tail on one side, does it have two separate humps?"
      ],
      trap: "Reading a histogram like a scatter plot or a bar chart over time. Left-to-right is not time, and a tall bar is not a large value. It is a common value.",
      check: ["A histogram of salaries has tall bars on the left and a long, low tail stretching to the right. What does that say?", "Most people earn a fairly low salary and a few people earn far more. The average will be pulled up by those few, so the median is a better description of the typical person."]
    },
    {
      id: "box", nav: "Box plot", title: "Box plot",
      what: "A box plot is a histogram squeezed into five numbers. It is used when you want to compare several groups side by side, where stacking several histograms would be hard to read.",
      steps: [
        "<b>Find the line inside the box.</b> That is the median: half of the values are below it and half are above.",
        "<b>Look at the box.</b> It holds the middle half of the data. A tall box means the group varies a lot; a short box means its values are similar.",
        "<b>Look at the whiskers.</b> They reach out to the smallest and largest ordinary values.",
        "<b>Look for separate dots.</b> These are outliers: values unusually far from the rest.",
        "<b>Compare groups</b> by comparing the height of their median lines first, then the size of their boxes."
      ],
      trap: "Thinking a bigger box means more data. Box size shows how spread out the values are, not how many there are.",
      check: ["Two boxes sit side by side. Box A's median line is higher than the whole of box B. What can you say?", "A typical value in group A is higher than at least three quarters of the values in group B. The groups are clearly different."]
    },
    {
      id: "resid", nav: "Residual plot", title: "Residual plot",
      what: "A residual is one row's error: the real value minus the model's prediction. A residual plot throws the line away and shows only the errors. It is the standard way to check whether a regression model can be trusted. Unusually, the picture you hope for is a boring one.",
      steps: [
        "The x-axis is the model's prediction. The y-axis is the error for that prediction.",
        "Find the dashed line at zero. A dot on it was predicted perfectly. A dot above it means the real value was higher than predicted; below, lower.",
        "Ask: is the cloud centred on the zero line all the way across? If it drifts above and below in a curve, the model is missing a bend.",
        "Ask: is the cloud the same height all the way across? If it fans out, the model's errors grow for larger predictions.",
        "If you see no pattern at all, that is the good outcome."
      ],
      trap: "Looking for a nice upward trend, as in a scatter plot. In a residual plot any visible pattern is bad news. Shapeless is what you want.",
      check: ["A residual plot looks like a smile: dots above zero on the left and right, below zero in the middle. What is wrong?", "The model predicts too low at both ends and too high in the middle, so the real relationship is curved and a straight line is not enough."]
    },
    {
      id: "pva", nav: "Predicted vs actual", title: "Predicted against actual",
      what: "This plot puts the real value along the bottom and the model's prediction up the side, one dot per row. If the model were perfect, every dot would sit on the diagonal line where predicted equals actual. It works for any model, however complicated, which is why you will see it everywhere.",
      steps: [
        "Find the dashed diagonal. It marks \"prediction = truth\".",
        "A dot above the diagonal was predicted too high. A dot below was predicted too low.",
        "See how tightly the dots hug the diagonal. Tighter means more accurate.",
        "Check both ends. Dots that fall away from the diagonal at one end mean the model is consistently wrong for small or for large values."
      ],
      trap: "Being reassured because the cloud tilts upwards. Almost any model produces an upward cloud. What matters is whether it follows the diagonal, especially at the extremes.",
      check: ["On the right-hand side of the plot, nearly every dot is below the diagonal. What is the model doing?", "It is under-predicting the largest values. When the truth is big, the model's guess is too small."]
    },
    {
      id: "band", nav: "Uncertainty band", title: "A line with a shaded band",
      what: "A model's prediction is never exact. The shaded band around a line shows the range the model considers plausible. The line is the best guess; the band is the honest \"give or take\".",
      steps: [
        "Read the line as the single best prediction.",
        "Pick a value on the x-axis and go straight up. The bottom and top edges of the band at that point are the low and high ends of the plausible range.",
        "A narrow band means the model is confident there. A wide band means it is unsure.",
        "Notice where the band widens. This usually happens where there is little data, and beyond the edge of the data."
      ],
      trap: "Reading only the line and ignoring the band. If the band at your point of interest runs from 20 to 80, a prediction of 50 tells you very little.",
      check: ["A forecast line continues smoothly to the right, but the band around it gets wider and wider. What does that tell you?", "The further ahead the forecast goes, the less certain it is. The line still gives the best guess, but the true value could fall in an increasingly large range."]
    },
    {
      id: "scurve", nav: "Probability curve", title: "Probability (S-shaped) curve",
      what: "When the outcome is yes or no, the dots can only sit in two rows: along the top (yes) or along the bottom (no). The model draws an S-shaped curve between them. The height of the curve is the chance of a yes. You will meet this plot with logistic regression.",
      steps: [
        "The y-axis is a probability from 0% to 100%, not a measured amount.",
        "Dots on the top row are rows where the answer was yes; dots on the bottom row are no.",
        "Pick a value on the x-axis, go up to the curve, then across to the y-axis: that is the predicted chance of a yes.",
        "Find where the curve crosses 50%. Left of that point a no is more likely; right of it a yes is more likely.",
        "A steep curve means the input separates yes from no sharply. A gentle curve means there is a wide zone of doubt."
      ],
      trap: "Expecting the dots to lie on the curve. They cannot: each dot is a single yes or no, while the curve is a chance. Judge the curve by whether yes-dots become more common as it rises.",
      check: ["At x = 3 the curve is at a height of 0.2. What does that mean?", "For a row with x = 3 the model gives a 20% chance of a yes, so about one in five such rows would be expected to be a yes."]
    },
    {
      id: "coef", nav: "Coefficient chart", title: "Coefficient bar chart",
      what: "A regression model gives each input a number, its coefficient, saying how strongly and in which direction that input moves the prediction. A coefficient chart shows those numbers as bars so you can compare them at a glance.",
      steps: [
        "Find the zero line. Everything is read relative to it.",
        "A bar going up from zero means: more of this input raises the prediction.",
        "A bar going down from zero means: more of this input lowers the prediction.",
        "The length of the bar is the strength of the effect. A bar that barely leaves zero means the input hardly matters.",
        "If thin lines (error bars) are drawn and they cross zero, the model is not sure the effect is real."
      ],
      trap: "Comparing bar lengths when the inputs are in different units. A coefficient per metre and a coefficient per year cannot be compared unless the inputs were first put on a common scale (standardised).",
      check: ["In a model of house prices, the bar for \"distance to the city centre\" points down. What does that say?", "Houses further from the centre are predicted to be cheaper, once the other inputs in the model are held the same."]
    },
    {
      id: "curve", nav: "Error curve", title: "Training and validation error curve",
      what: "This plot helps choose how complicated a model should be. The x-axis is not data: it is a setting of the model, from simple on the left to complicated on the right. Two lines show the model's error on the data it learned from (training) and on fresh data it has never seen (validation).",
      steps: [
        "Lower is better: the y-axis is error.",
        "Follow the training line. It nearly always falls as the model gets more complicated, because a complicated model can memorise.",
        "Follow the validation line. It falls at first, then turns and rises.",
        "The lowest point of the validation line is the best setting.",
        "Left of that point the model is too simple (underfitting). Right of it, the model is memorising noise (overfitting): the gap between the two lines opens up."
      ],
      trap: "Choosing the setting where the training error is lowest. Training error rewards memorising. Only the validation line tells you how the model will do on new data.",
      check: ["Training error is tiny and validation error is large. What is happening?", "The model is overfitting. It has memorised the data it was given and does badly on anything new. A simpler setting is needed."]
    },
    {
      id: "surv", nav: "Survival curve", title: "Survival curve",
      what: "A survival curve shows how long things last: customers before they cancel, machines before they fail, patients before an event. It starts at 100% and steps downwards each time someone has the event. You will meet it with Cox regression.",
      steps: [
        "The x-axis is time since the start. The y-axis is the share who have not yet had the event.",
        "Pick a time, go up to the curve and across: that is the percentage still remaining at that time.",
        "Find where the curve crosses 50% and read down to the x-axis. That is the median lifetime: half last longer, half shorter.",
        "A curve that drops quickly means the event happens soon. A curve that stays high means things last.",
        "When two curves are drawn, the higher one is the group that lasts longer."
      ],
      trap: "Reading the curve as the number of events at each moment. Its height is the share still remaining, so it can only go down or stay level.",
      check: ["At 6 months, the curve for plan A is at 70% and for plan B at 40%. What does that mean?", "Six months after signing up, 70% of plan A customers are still subscribed but only 40% of plan B customers are. Plan A keeps its customers longer."]
    },
    {
      id: "axis", nav: "Axis traps", title: "Before you trust any plot: check the axes",
      what: "The same numbers can be made to look dramatic or dull by changing where an axis starts and stops. This is the most common way plots mislead, sometimes by accident and sometimes on purpose.",
      steps: [
        "Look at the bottom number on the y-axis. Does it start at zero or somewhere else?",
        "If bars do not start at zero, do not compare their heights by eye. Read the numbers instead.",
        "Work out the real size of a difference from the tick labels, then decide whether it matters.",
        "When comparing two plots, check that they use the same axis range. If not, similar-looking shapes may be very different in size."
      ],
      trap: "Trusting your eyes over the tick labels. Your eyes compare heights; the truth is in the numbers on the axis.",
      check: ["A bar chart shows store B's bar twice as tall as store A's. The y-axis runs from 95 to 100. Is B's value double A's?", "No. If the axis starts at 95, a bar twice as tall could mean 96 against 97, a difference of about one percent."]
    }
  ];

  /* ================= the figures ================= */
  G.add("plots", () => {
    const figs = [];

    /* ----- basics: how to read one point ----- */
    {
      const pts = cloud(71, 34, (x) => 40 + 1.6 * x, 32, [55, 245]);
      const tx = [50, 100, 150, 200, 250].map((v) => [v, String(v)]), ty = [0, 100, 200, 300, 400, 500].map((v) => [v, String(v)]);
      const a = P({ w: 640, h: 330, x: [40, 262], y: [0, 520], tx, ty, xl: "x-axis: size of the house (square metres)", yl: "y-axis: price (thousands)", alt: "A scatter plot of house size against price with one house picked out" });
      let pick = pts[0]; pts.forEach((p) => { if (Math.abs(p.x - 185) < Math.abs(pick.x - 185)) pick = p; });
      a.seg(pick.x, 0, pick.x, pick.y, "fg-ref").seg(40, pick.y, pick.x, pick.y, "fg-ref").pts(pts).pts([pick], "fg-pt2", 5).ring([pick]);
      a.text(pick.x, pick.y, "One dot = one house", { a: "end", dx: 8, dy: -18, cls: "fg-tb" });
      a.text(pick.x, 0, "1. Straight down: " + r0(pick.x) + " m²", { dx: 8, dy: -10, cls: "fg-tb" });
      a.text(40, pick.y, "2. Straight across: about " + r0(pick.y / 10) * 10 + " thousand", { dx: 8, dy: -8, cls: "fg-tb" });
      figs.push({ where: "basics", title: "Reading a single point", lead: "Every dot carries two numbers. Drop straight down to the bottom axis for one, and go straight across to the side axis for the other.", legend: [["pt", "One house"], ["pt2", "The house being read"], ["ref", "Guide lines to the axes"]], panels: [{ p: a, c: "This house is about " + r0(pick.x) + " square metres and sold for about " + r0(pick.y / 10) * 10 + " thousand. Now look at the whole cloud: dots further right also tend to be higher, so bigger houses tend to cost more." }] });
    }

    /* ----- scatter ----- */
    {
      const mk = (d, xl, yl, alt) => P({ xl, yl, alt }).pts(d);
      figs.push({ where: "scatter", title: "The four patterns you will see most", panels: [
        { v: "note", b: "Pattern 1", h: "Rising (positive)", p: mk(cloud(72, 40, (x) => 1.5 + 0.72 * x, 0.8), "Hours studied", "Exam score", "A cloud of dots rising to the right"), c: "The cloud climbs from bottom-left to top-right. More of one goes with more of the other." },
        { v: "note", b: "Pattern 2", h: "Falling (negative)", p: mk(cloud(73, 40, (x) => 8.6 - 0.7 * x, 0.8), "Age of car (years)", "Resale price", "A cloud of dots falling to the right"), c: "The cloud slopes from top-left to bottom-right. More of one goes with less of the other." },
        { v: "note", b: "Pattern 3", h: "No relationship", p: mk(cloud(74, 40, () => 5, 1.9), "Shoe size", "Exam score", "A shapeless cloud of dots"), c: "A shapeless blob. Knowing one value tells you nothing about the other." },
        { v: "note", b: "Pattern 4", h: "Curved", p: mk(cloud(75, 44, (x) => 8.2 - 0.26 * (x - 5.2) * (x - 5.2), 0.55), "Driving speed", "Fuel economy", "A cloud of dots that rises and then falls"), c: "Rises, then falls. There is a clear relationship, but a straight line cannot describe it." }
      ] });
      const tight = cloud(76, 40, (x) => 1.5 + 0.7 * x, 0.35), loose = cloud(77, 40, (x) => 1.5 + 0.7 * x, 1.7);
      const base = cloud(78, 32, (x) => 1.5 + 0.7 * x, 0.55), odd = { x: 8.3, y: 1.4 };
      const o = mk(base, "x", "y", "A rising cloud with one dot far below it").pts([odd], "fg-pt2", 4.5).ring([odd]);
      o.text(odd.x, odd.y, "outlier", { a: "end", dx: -11, dy: 4, cls: "fg-tb" });
      figs.push({ where: "scatter", title: "Then judge the tightness, and look for outliers", panels: [
        { v: "note", b: "Strong", h: "A tight band", p: mk(tight, "x", "y", "Dots in a narrow rising band"), c: "The dots stay close to an invisible line. If you know x, you can predict y closely." },
        { v: "note", b: "Weak", h: "A wide cloud", p: mk(loose, "x", "y", "Dots in a wide rising cloud"), c: "Same upward direction, but for any x the y values vary a lot. Predictions will be rough." },
        { v: "bad", b: "✗ Look closer", h: "One dot far from the rest", p: o, c: "An outlier may be a typing error, a special case, or the most interesting row you have. Find out which before going further." }
      ] });
    }

    /* ----- fitted line ----- */
    {
      const pts = cloud(79, 26, (x) => 30 + 5 * x, 6.5), o = F.ols(pts);
      const ty = [0, 20, 40, 60, 80, 100].map((v) => [v, String(v)]);
      const a = P({ w: 640, h: 330, x: [0, 10], y: [0, 105], tx: T10, ty, xl: "Years of experience", yl: "Salary (thousands)", alt: "A fitted line through salary data with the slope, intercept and one residual marked" });
      let far = null; pts.forEach((p) => { if (p.x > 1.5 && p.x < 7.5 && (!far || p.y - o.f(p.x) > far.y - o.f(far.x))) far = p; });
      a.seg(far.x, far.y, far.x, o.f(far.x), "fg-res").line(o.f).pts(pts);
      const xa = 5, xb = 8, ya = o.f(xa), yb = o.f(xb);
      a.seg(xa, ya, xb, ya, "fg-mark").seg(xb, ya, xb, yb, "fg-mark");
      a.text((xa + xb) / 2, ya, "run: 3 years to the right", { a: "middle", dy: 16 }).text(xb, (ya + yb) / 2, "rise: " + r0(yb - ya) + " thousand", { dx: 8, dy: 18 });
      a.text(xb, ya, "Slope = " + r0(yb - ya) + " ÷ 3 ≈ " + r0((yb - ya) / 3) + " thousand per year", { a: "end", dx: 30, dy: 36, cls: "fg-tb" });
      a.pts([{ x: 0, y: o.b0 }], "fg-pt2", 4.5).text(0, o.b0, "Intercept: the line starts at about " + r0(o.b0), { dx: 10, dy: 20, cls: "fg-tb" });
      a.text(far.x, far.y, "Residual: gap from dot to line", { a: "end", dx: -9, dy: 2, cls: "fg-tb" });
      figs.push({ where: "line", title: "Slope, intercept and residual on one picture", legend: [["pt", "One person"], ["fit", "The fitted line (the model's prediction)"], ["res", "A residual"]], panels: [{ p: a, c: "In words: someone with no experience is predicted to earn about " + r0(o.b0) + " thousand, and each extra year adds about " + r0(o.b1) + " thousand. Individual people sit above or below the line; those gaps are the residuals." }] });

      const px = 7, g = P({ x: [0, 10], y: [0, 105], tx: T10, ty, xl: "Years of experience", yl: "Salary (thousands)", alt: "Guide lines from 7 years up to the line and across to the salary axis" });
      g.seg(px, 0, px, o.f(px), "fg-ref").seg(0, o.f(px), px, o.f(px), "fg-ref").line(o.f).pts([{ x: px, y: o.f(px) }], "fg-pt2", 4.5);
      g.text(px, 6, "start at 7", { dx: 7 }).text(0.3, o.f(px), "read " + r0(o.f(px)), { dy: -8, cls: "fg-tb" });
      const same = cloud(80, 24, (x) => 3 + 0.4 * x, 0.5);
      const s1 = P({ x: [0, 10], y: [0, 10], tx: T10, ty: [[0, "0"], [5, "5"], [10, "10"]], xl: "x", yl: "y", alt: "A line that looks flat" }).pts(same).line(F.ols(same).f);
      const s2 = P({ x: [0, 10], y: [2.5, 8], tx: T10, ty: [[3, "3"], [5, "5"], [7, "7"]], xl: "x", yl: "y", alt: "The same line drawn on a narrower axis, looking steep" }).pts(same).line(F.ols(same).f);
      figs.push({ where: "line", title: "Using the line, and not being fooled by it", panels: [
        { v: "good", b: "✓ How to predict", h: "Up to the line, then across", p: g, c: "For 7 years of experience: go up from 7 to the line, then left to the axis. The prediction is about " + r0(o.f(px)) + " thousand." },
        { v: "note", b: "Same data", h: "Looks gentle", p: s1, c: "The y-axis runs from 0 to 10, so the line looks nearly flat." },
        { v: "note", b: "Same data", h: "Looks steep", p: s2, c: "Exactly the same dots and line with the y-axis zoomed to 3–8. The slope has not changed. Only the numbers tell you that." }
      ] });
    }

    /* ----- histogram ----- */
    {
      const v = normals(81, 220, 30, 5.5), hp = histPanel(v, 10, 50, 8, { w: 640, h: 300, tx: [10, 20, 30, 40, 50].map((x) => [x, String(x)]), ty: [], xl: "Delivery time (minutes)", yl: "Number of deliveries", alt: "A histogram of delivery times" });
      const tk = [0, 20, 40, 60, 80].filter((t) => t <= hp.b.top * 1.15).map((t) => [t, String(t)]);
      hp.p.o.ty = tk; hp.p.m.l = 44;
      let big = hp.b.bars[0]; hp.b.bars.forEach((b) => { if (b[1] > big[1]) big = b; });
      hp.p.text(big[0], big[1], "Tallest bar: " + big[1] + " deliveries took " + (big[0] - 2.5) + "–" + (big[0] + 2.5) + " min", { a: "middle", dy: -8, cls: "fg-tb" });
      const few = hp.b.bars[6];
      hp.p.text(few[0] - 2.3, few[1], "Short bar: only " + few[1] + " this slow", { dy: -10 });
      figs.push({ where: "hist", title: "What a bar means", lead: "Each bar covers a 5-minute slice. Its height is how many deliveries fell in that slice.", panels: [{ p: hp.p, c: "Typical deliveries take 25 to 35 minutes, because that is where the tall bars are. Very fast and very slow deliveries are rare, because the bars at the edges are short." }] });

      const r = F.rng(82), skew = [], two = [];
      for (let i = 0; i < 260; i++) { skew.push(1 + 1.9 * -Math.log(1 - r()) + 0.3 * F.normal(r)); two.push(r() < 0.5 ? 3 + 0.8 * F.normal(r) : 7.2 + 0.8 * F.normal(r)); }
      const hx = { tx: T10, xl: "Value" };
      figs.push({ where: "hist", title: "Three shapes worth recognising", panels: [
        { v: "note", b: "Shape 1", h: "Symmetric (a bell)", p: histPanel(normals(83, 260, 5, 1.3), 0, 10, 12, Object.assign({ alt: "A symmetric bell-shaped histogram" }, hx)).p, c: "One hump in the middle, falling away evenly on both sides. The average sits at the peak and describes a typical value well." },
        { v: "note", b: "Shape 2", h: "Skewed (a long tail)", p: histPanel(skew, 0, 10, 12, Object.assign({ alt: "A histogram with a long tail to the right" }, hx)).p, c: "Most values are small, with a few very large ones. Incomes, prices and waiting times look like this. The average is pulled towards the tail." },
        { v: "note", b: "Shape 3", h: "Two humps", p: histPanel(two, 0, 10, 12, Object.assign({ alt: "A histogram with two separate humps" }, hx)).p, c: "Two separate peaks usually mean two different groups have been mixed together, for example weekday and weekend customers." }
      ] });
    }

    /* ----- box plot ----- */
    {
      const v = normals(84, 46, 30, 5.5).concat([52, 55.5]);
      const a = P({ w: 640, h: 340, x: [0, 10], y: [10, 60], ty: [10, 20, 30, 40, 50, 60].map((t) => [t, String(t)]), tx: [[1.6, "Every delivery as a dot"], [4.3, "The same data as a box plot"]], yl: "Delivery time (minutes)", alt: "Raw data points next to the box plot that summarises them" });
      const r = F.rng(85); a.pts(v.map((y) => ({ x: 1.6 + (r() - 0.5) * 1.3, y })), "fg-pt", 3);
      const b = drawBox(a, 4.3, 0.55, v), L = 5.15;
      a.text(L, b.out[b.out.length - 1], "Outliers: unusually far from the rest", { dy: 12 });
      a.text(L, b.hi, "Top whisker: largest ordinary value", { dy: 4 });
      a.text(L, b.q3, "Top of box: 75% of values are below here", { dy: 4 });
      a.text(L, b.med, "Line: the median, the middle value (" + r0(b.med) + ")", { dy: 4, cls: "fg-tb" });
      a.text(L, b.q1, "Bottom of box: 25% of values are below here", { dy: 4 });
      a.text(L, b.lo, "Bottom whisker: smallest ordinary value", { dy: 4 });
      figs.push({ where: "box", title: "Where the box comes from", lead: "Sort the values from smallest to largest, then mark the points that cut them into quarters.", panels: [{ p: a, c: "The box holds the middle half of all deliveries: here, between about " + r0(b.q1) + " and " + r0(b.q3) + " minutes. The line inside is the median delivery." }] });

      const c = P({ w: 640, h: 280, x: [0, 4], y: [10, 60], ty: [10, 20, 30, 40, 50, 60].map((t) => [t, String(t)]), tx: [[1, "Store A"], [2, "Store B"], [3, "Store C"]], yl: "Delivery time (minutes)", alt: "Three box plots comparing delivery times at three stores" });
      drawBox(c, 1, 0.3, normals(86, 60, 26, 3)); drawBox(c, 2, 0.3, normals(87, 60, 36, 3.2)); drawBox(c, 3, 0.3, normals(88, 60, 30, 8));
      figs.push({ where: "box", title: "Comparing groups", panels: [{ p: c, c: "Store A is fastest: its median line is lowest. Store B is slowest, and its box does not overlap A's at all, so the difference is clear. Store C has a middling median but a much taller box: its delivery times are unpredictable, sometimes fast and sometimes very slow." }] });
    }

    /* ----- residual plot ----- */
    {
      const pts = cloud(89, 26, (x) => 1.6 + 0.68 * x, 0.9), o = F.ols(pts);
      const a = P({ xl: "x", yl: "y", alt: "A fitted line with a vertical bar from each dot to the line" });
      pts.forEach((p) => a.seg(p.x, p.y, p.x, o.f(p.x)));
      a.line(o.f).pts(pts);
      const res = pts.map((p) => ({ x: o.f(p.x), y: p.y - o.f(p.x) })), yr = Math.max.apply(null, res.map((q) => Math.abs(q.y))) * 1.2;
      const b = P({ x: H.dom(res.map((q) => q.x), 0.06), y: [-yr, yr], ty: [[0, "0"]], xl: "Predicted value", yl: "Residual (error)", alt: "The same residuals plotted around a zero line" });
      res.forEach((q) => b.seg(q.x, 0, q.x, q.y));
      b.hline(0, "fg-ref").pts(res);
      b.text(b.xd[1], yr * 0.82, "real value was higher than predicted", { a: "end", cls: "fg-tm" }).text(b.xd[1], -yr * 0.86, "real value was lower than predicted", { a: "end", cls: "fg-tm" });
      figs.push({ where: "resid", title: "How a residual plot is made", lead: "Take the fitted line and lay it flat. Each grey bar keeps its length and direction; everything else is removed.", legend: [["pt", "One row"], ["fit", "Fitted line"], ["res", "Residual"], ["ref", "Zero error"]], panels: [
        { v: "note", b: "Step 1", h: "The fit, with its errors", p: a, c: "Each grey bar is one residual: the gap between a dot and the line." },
        { v: "note", b: "Step 2", h: "Only the errors", p: b, c: "The line has become the flat dashed line at zero. Dots above it were under-predicted, dots below were over-predicted." }
      ] });
      const rf = H.residFig("resid"); rf.title = "The three pictures to recognise"; rf.lead = "";
      figs.push(rf);
    }

    /* ----- predicted vs actual ----- */
    {
      const mk = (seed, fn, noise) => { const r = F.rng(seed), a = []; for (let i = 0; i < 46; i++) { const x = 0.8 + 8.4 * r(); a.push({ x, y: fn(x) + noise * F.normal(r) }); } return a; };
      const pn = (d) => P({ xl: "Actual value", yl: "Predicted value", alt: "Predicted values against actual values with a diagonal reference line" }).line((x) => x, "fg-ref").pts(d);
      const g = pn(mk(90, (x) => x, 0.55));
      g.text(2.2, 8.6, "predicted too high", { a: "middle", cls: "fg-tm" }).text(7.6, 1.2, "predicted too low", { a: "middle", cls: "fg-tm" });
      figs.push({ where: "pva", title: "Three versions of the same plot", legend: [["pt", "One row"], ["ref", "Perfect prediction (predicted = actual)"]], panels: [
        { v: "good", h: "Hugging the diagonal", p: g, c: "Dots are close to the line along its whole length, with about as many above as below. The model is accurate and fair across the range." },
        { v: "bad", h: "Tilted away from the diagonal", p: pn(mk(91, (x) => 2.6 + 0.48 * x, 0.5)), c: "On the left the dots are above the line (small values predicted too high); on the right they are below (large values predicted too low). The model pulls everything towards the middle." },
        { v: "bad", h: "A wide cloud", p: pn(mk(92, (x) => x, 1.9)), c: "Centred on the diagonal, so not biased, but individual predictions miss by a lot. The model is right on average and unreliable for any single row." }
      ] });
    }

    /* ----- uncertainty band ----- */
    {
      const fit = (pts) => { const o = F.ols(pts), n = pts.length, xb = F.mean(pts.map((p) => p.x)), sxx = pts.reduce((s, p) => s + (p.x - xb) ** 2, 0), s = Math.sqrt(pts.reduce((t, p) => t + (p.y - o.f(p.x)) ** 2, 0) / (n - 2)); return { o, pred: (x) => 2 * s * Math.sqrt(1 + 1 / n + (x - xb) ** 2 / sxx), mean: (x) => 2 * s * Math.sqrt(1 / n + (x - xb) ** 2 / sxx) }; };
      const d1 = cloud(93, 40, (x) => 2 + 0.6 * x, 0.8), f1 = fit(d1);
      const a = P({ tx: T10, ty: [[0, "0"], [5, "5"], [10, "10"]], xl: "x", yl: "y", alt: "A fitted line with a shaded band containing nearly all the dots" });
      const gx = 6, lo = f1.o.f(gx) - f1.pred(gx), hi = f1.o.f(gx) + f1.pred(gx);
      a.band((x) => f1.o.f(x) - f1.pred(x), (x) => f1.o.f(x) + f1.pred(x)).line(f1.o.f).pts(d1).seg(gx, lo, gx, hi, "fg-mark");
      a.text(gx, hi, "high end ≈ " + hi.toFixed(1), { a: "middle", dy: -8, cls: "fg-tb" }).text(gx, lo, "low end ≈ " + lo.toFixed(1), { a: "middle", dy: 17, cls: "fg-tb" });
      const d2 = cloud(94, 14, (x) => 2 + 0.6 * x, 0.9, [0.5, 4.5]), f2 = fit(d2);
      const b = P({ tx: T10, ty: [[0, "0"], [5, "5"], [10, "10"]], xl: "x", yl: "y", alt: "A band that is narrow where there is data and flares out where there is none" });
      b.band((x) => f2.o.f(x) - f2.mean(x), (x) => f2.o.f(x) + f2.mean(x)).line(f2.o.f).pts(d2);
      b.text(2.5, 0.8, "data here: narrow", { a: "middle", cls: "fg-tm" }).text(8, 0.8, "no data: wide", { a: "middle", cls: "fg-tm" });
      figs.push({ where: "band", title: "Reading the band", legend: [["pt", "Observed data"], ["fit", "Best prediction"], ["band", "Plausible range"]], panels: [
        { v: "note", b: "Reading a range", h: "Low end, best guess, high end", p: a, c: "At x = 6 the best prediction is " + f1.o.f(gx).toFixed(1) + ", but a new point could reasonably fall anywhere from about " + lo.toFixed(1) + " to " + hi.toFixed(1) + ". Nearly all the dots sit inside the band, as they should." },
        { v: "bad", b: "✗ Be careful here", h: "The band flares where data runs out", p: b, c: "All the data is on the left. The line carries on to the right, but the band opens wide: the model is guessing. Predictions out there deserve little trust." }
      ] });
    }

    /* ----- probability curve ----- */
    {
      const r = F.rng(95), pts = [];
      for (let i = 0; i < 44; i++) { const x = 0.4 + 9.2 * r(); pts.push({ x, y: r() < sig(1.15 * (x - 4.8)) ? 1 : 0 }); }
      const m = F.logistic(pts), half = -m.b0 / m.b1, gx = 6, gp = m.f(gx);
      const a = P({ w: 640, h: 310, x: [0, 10], y: [-0.12, 1.14], tx: T10, ty: PCT, xl: "Hours studied", yl: "Chance of passing", alt: "Pass and fail dots with an S-shaped probability curve" });
      a.seg(gx, -0.12, gx, gp, "fg-ref").seg(0, gp, gx, gp, "fg-ref").seg(half, -0.12, half, 0.5, "fg-ref").line(m.f).pts(pts).pts([{ x: gx, y: gp }], "fg-pt2", 4.5);
      a.text(0.2, 1, "passed (yes)", { dy: -9, cls: "fg-tm" }).text(9.8, 0, "failed (no)", { a: "end", dy: -9, cls: "fg-tm" });
      a.text(0.2, gp, "at 6 hours: " + r0(gp * 100) + "% chance", { dy: -7, cls: "fg-tb" });
      a.text(half, 0.5, "50% at about " + half.toFixed(1) + " hours", { a: "end", dx: -8, dy: 4, cls: "fg-tb" });
      figs.push({ where: "scurve", title: "Dots in two rows, and a curve between them", legend: [["pt", "One student (top row passed, bottom row failed)"], ["fit", "Predicted chance of passing"]], panels: [{ p: a, c: "On the left, nearly all dots are on the bottom row and the curve is near 0%. On the right, nearly all are on the top row and the curve is near 100%. In between, both outcomes happen and the curve climbs through the middle." }] });
    }

    /* ----- coefficient chart ----- */
    {
      const names = ["Size", "Bedrooms", "Garden", "Age", "Distance"], vals = [1.7, 0.6, 0.06, -0.7, -1.2];
      const a = P({ w: 640, h: 300, x: [0.4, 5.6], y: [-1.7, 2.2], tx: names.map((n, i) => [i + 1, n]), ty: [[-1, "−1"], [0, "0"], [1, "1"], [2, "2"]], yl: "Coefficient (effect on price)", alt: "A bar chart of five coefficients, some above zero and some below" });
      a.hline(0, "fg-axis").bars(vals.map((v, i) => [i + 1, v]), 0.62);
      a.text(1, 1.7, "raises the price most", { a: "middle", dy: -8, cls: "fg-tb" }).text(3, 0.06, "almost no effect", { a: "middle", dy: -10, cls: "fg-tb" }).text(5, -1.2, "lowers the price most", { a: "middle", dy: 16, cls: "fg-tb" });
      a.text(5.55, 0, "zero line", { a: "end", dy: -5, cls: "fg-tm" });
      figs.push({ where: "coef", title: "A model of house prices, one bar per input", lead: "All inputs were put on the same scale first, so the bar lengths can be compared.", panels: [{ p: a, c: "Bigger houses and more bedrooms push the predicted price up. Older houses and houses further from the centre push it down. Having a garden makes almost no difference in this model." }] });
    }

    /* ----- error curve ----- */
    {
      const te = H.curve(97, 120), degs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], sets = []; for (let k = 0; k < 31; k++) sets.push(H.curve(300 + k, 22));
      const mid = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];   // median over 31 training samples keeps the curves smooth
      const e1 = degs.map((d) => ({ x: d, y: mid(sets.map((tr) => F.rmse(tr, F.poly(tr, d).f))) })), e2 = degs.map((d) => ({ x: d, y: mid(sets.map((tr) => F.rmse(te, F.poly(tr, d).f))) }));
      let best = e2[0]; e2.forEach((q) => { if (q.y < best.y) best = q; });
      const top = Math.min(Math.max.apply(null, e2.map((q) => q.y)), best.y * 3.2) * 1.08;
      const a = P({ w: 640, h: 310, x: [0.5, 10.5], y: [0, top], tx: degs.map((d) => [d, String(d)]), ty: [[0, "0"]], xl: "Model complexity (simple → complicated)", yl: "Error (lower is better)", alt: "Training error falling steadily while validation error falls and then rises" });
      a.vline(best.x).line(e1, "fg-fit1").pts(e1, "fg-pt", 3).line(e2, "fg-fit").pts(e2, "fg-pt2", 3).ring([best]);
      a.text(best.x, best.y, "Lowest validation error: the best setting", { dx: best.x > 6 ? -10 : 10, a: best.x > 6 ? "end" : "start", dy: 24, cls: "fg-tb" });
      a.text(0.7, top * 0.06, "← too simple", { cls: "fg-tm" }).text(10.3, top * 0.94, "too complicated →", { a: "end", cls: "fg-tm" });
      figs.push({ where: "curve", title: "Two lines, one decision", legend: [["fit1", "Training error (data the model learned from)"], ["fit", "Validation error (data it has never seen)"]], panels: [{ p: a, c: "The blue line keeps falling: a more complicated model always fits its own data better. The orange line falls, bottoms out at complexity " + best.x + ", then climbs as the model starts memorising noise. Choose the bottom of the orange line." }] });
    }

    /* ----- survival curve ----- */
    {
      const sim = (seed, scale) => { const r = F.rng(seed), a = []; for (let i = 0; i < 70; i++) { const t = -Math.log(1 - r()) * scale, c = 3 + 9 * r(); a.push({ t: Math.min(t, c, 9.99), e: t < c && t < 9.99 }); } return a; };
      const A = H.km(sim(98, 9)), B = H.km(sim(99, 3.6));
      const med = (k) => { for (const q of k) if (q[1] <= 0.5) return q[0]; return null; };
      const mb = med(B), at = (k, t) => { let s = 1; for (const q of k) if (q[0] <= t) s = q[1]; return s; };
      const a = P({ w: 640, h: 310, x: [0, 10], y: [0, 1.06], tx: T10, ty: PCT, xl: "Months since signing up", yl: "Share still subscribed", alt: "Two survival curves stepping downwards, one much faster than the other" });
      if (mb !== null) a.seg(0, 0.5, mb, 0.5, "fg-ref").seg(mb, 0, mb, 0.5, "fg-ref");
      a.steps(A, "fg-fit1").steps(B, "fg-fit");
      a.text(9.8, at(A, 9.8), "Plan A", { a: "end", dy: -8, cls: "fg-tb" }).text(9.8, at(B, 9.8), "Plan B", { a: "end", dy: -8, cls: "fg-tb" });
      if (mb !== null) a.text(mb, 0, "half of plan B has left by month " + mb.toFixed(1), { dx: 8, dy: -9, cls: "fg-tb" });
      figs.push({ where: "surv", title: "Two groups of customers", legend: [["fit1", "Plan A"], ["fit", "Plan B"]], panels: [{ p: a, c: "Both curves start at 100% and step down each time a customer cancels. Plan B drops much faster. At month 4, about " + r0(at(A, 4) * 100) + "% of plan A customers remain against about " + r0(at(B, 4) * 100) + "% of plan B." }] });
    }

    /* ----- axis traps ----- */
    {
      const vals = [96, 98, 97, 99], tx = ["A", "B", "C", "D"].map((n, i) => [i + 1, "Store " + n]);
      const mk = (y, ty, alt) => { const p = P({ x: [0.4, 4.6], y, tx, ty: ty.map((t) => [t, String(t)]), yl: "Satisfaction score", alt }); p.bars(vals.map((v, i) => [i + 1, v]), 0.6); vals.forEach((v, i) => p.text(i + 1, v, String(v), { a: "middle", dy: -6 })); return p; };
      figs.push({ where: "axis", title: "The same four numbers, drawn twice", panels: [
        { v: "good", b: "✓ Honest", h: "Axis starts at zero", p: mk([0, 112], [0, 50, 100], "Four bars of almost equal height"), c: "The four stores score 96, 98, 97 and 99. Drawn from zero, the bars are almost the same height, which is the truth: the stores barely differ." },
        { v: "bad", b: "✗ Misleading", h: "Axis starts at 95", p: mk([95, 99.9], [95, 97, 99], "The same four bars looking very different in height"), c: "Identical numbers, but the axis starts at 95. Store D now looks four times as good as store A. Only the tick labels reveal the trick." }
      ] });
    }

    return figs;
  });
})();
