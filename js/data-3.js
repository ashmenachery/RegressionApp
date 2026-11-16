/* Models 11-13: Poisson, negative binomial, quantile */
window.MODELS = window.MODELS || [];
window.MODELS.push(
{
  id: `pois`, name: `Poisson Regression`, family: `Count outcomes`, target: `Counts (0, 1, 2, …)`,
  tagline: `For counts of events. Models the log of the expected count, so effects multiply instead of add.`,
  use: `The outcome is a count of events in a fixed window of time, space or exposure, and its variance is roughly equal to its mean.`,
  avoid: `The counts are much more spread out than a Poisson allows, or there are far more zeros than the model expects.`,
  demo: `pois`,
  terms: [
    [`Count data`, `Non-negative whole numbers: calls per hour, defects per batch, claims per policy. Never negative, often small, usually right-skewed.`],
    [`Log link`, `The model sets the log of the expected count equal to the linear predictor. This guarantees positive predictions and makes effects multiplicative.`],
    [`Rate ratio (IRR)`, `e<sup>β</sup>. The factor by which the expected count is multiplied per one-unit increase in the predictor. An IRR of 1.2 means 20% more events.`],
    [`Exposure and offset`, `When units are observed for different lengths of time or have different sizes, add log(exposure) with its coefficient fixed at 1. The model then describes a rate per unit of exposure.`],
    [`Equidispersion`, `The Poisson distribution's defining restriction: the variance equals the mean.`],
    [`Overdispersion`, `Variance greater than the mean. Very common in real data. Coefficients stay roughly right but standard errors are too small.`],
    [`Deviance`, `The GLM analogue of the residual sum of squares: twice the gap in log-likelihood between your model and a perfect fit.`],
    [`GLM`, `Generalised linear model. A family that covers linear, logistic, Poisson and others by combining a distribution for the outcome with a link function.`]
  ],
  example: {
    title: `Staffing a contact centre`,
    body: `A bank's contact centre needs to forecast calls arriving in each half-hour slot to schedule agents. Calls come independently from a huge customer base, the classic Poisson setting. The model includes hour of day, day of week, a month-end indicator and a flag for the day statements are issued. Effects are multiplicative and read naturally: Mondays have 1.25 times the calls of a typical day, and statement days 1.4 times, so a statement Monday has about 1.75 times. The forecast feeds a queueing calculation that turns expected calls into required agents.`,
    why: `A true count outcome, with effects that scale the base rate up or down and predictions that must not go negative.`
  },
  history: `<p><b>Siméon Denis Poisson</b> derived the distribution in 1837 as a limit of the binomial for rare events, in a book on probability in court verdicts. It attracted little notice until <b>Ladislaus Bortkiewicz</b> showed in 1898 that deaths by horse kick in the Prussian cavalry, year by year and corps by corps, followed it closely. That example is still in most textbooks.</p>
<p>Poisson regression in its modern form arrived with <b>John Nelder and Robert Wedderburn's 1972 paper</b> on generalised linear models. They showed that linear, logistic and Poisson regression are the same idea with different distributions and link functions, and that one algorithm fits them all. The GLIM software and later McCullagh and Nelder's book made the approach standard. Actuaries have used it ever since for claim frequency.</p>`,
  math: {
    eq: `<i>y</i><sub>i</sub> ~ Poisson(μ<sub>i</sub>), &nbsp;&nbsp; ln μ<sub>i</sub> = β<sub>0</sub> + β<sub>1</sub><i>x</i><sub>i1</sub> + … + β<sub>p</sub><i>x</i><sub>ip</sub> &nbsp; [ + ln(exposure<sub>i</sub>) ]
<br>so &nbsp; μ<sub>i</sub> = exposure<sub>i</sub> · e<sup><b>x</b><sub>i</sub><sup>T</sup>β</sup> &nbsp;&nbsp; and &nbsp; Var(<i>y</i><sub>i</sub>) = μ<sub>i</sub>`,
    cost: `minimise the negative log-likelihood: &nbsp; Σ<sub>i</sub> [ μ<sub>i</sub> − <i>y</i><sub>i</sub> ln μ<sub>i</sub> ] &nbsp;&nbsp; (constants dropped)
<br>gradient: &nbsp; <b>X</b><sup>T</sup>( μ − <b>y</b> )`,
    plain: `<p>Fitting a straight line to counts fails in two ways: it can predict negative counts, and it assumes the scatter is the same at every level, when counts scatter more as they get larger. Poisson regression fixes both. It models the log of the mean, so the mean is always positive, and it builds in the fact that variance grows with the mean.</p>
<p>Because the model is linear on the log scale, effects multiply on the count scale. Raising a predictor by one unit multiplies the expected count by e<sup>β</sup>, whatever the starting level. This matches how rates usually behave: a promotion raises traffic by 20%, not by a fixed 50 visits at both small and large stores.</p>
<p>The loss is the Poisson negative log-likelihood. As with logistic regression it is convex and has no closed-form minimum, so it is fitted by iteratively reweighted least squares. The gradient takes the same form: predicted minus observed, weighted by the predictors.</p>
<p>The offset is the piece most often forgotten. If one store was open 30 days and another 7, comparing raw counts is meaningless. Adding log(days) with a fixed coefficient of 1 converts the model to events per day.</p>`
  },
  practical: [
    `<b>Check for overdispersion first.</b> Divide the Pearson chi-square by the residual degrees of freedom. A value well above 1 (say 1.5 or more) means the Poisson standard errors are too small.`,
    `<b>If it is overdispersed,</b> use a negative binomial model, a quasi-Poisson fit, or at minimum robust standard errors.`,
    `<b>Use an offset whenever exposure differs</b> between rows: days observed, policy-years, population, machine-hours, kilometres driven.`,
    `<b>Do not log-transform the count and run OLS.</b> log(0) is undefined, adding 1 is arbitrary, and the back-transformed predictions are biased.`,
    `<b>Too many zeros?</b> If there are far more zeros than the fitted model predicts, look at zero-inflated or hurdle models.`,
    `<b>Predictions are expected counts,</b> not whole numbers. A prediction of 2.4 is a mean; the actual value will be 0, 1, 2, 3 and so on with Poisson probabilities.`
  ],
  field: [
    `Real count data are <b>almost never equidispersed</b>. Customers, stores and machines differ in ways your features do not capture, and that unexplained variation shows up as extra variance. Treat Poisson as the starting point and expect to move to negative binomial or robust errors.`,
    `The <b>forgotten offset</b> is the classic production bug. A model of "claims per policy" that ignores the fact that some policies were active for two months learns that new customers are safe. Whenever rows cover different amounts of time or volume, ask where the exposure went.`,
    `Insurance pricing runs on this model. Claim <b>frequency</b> is a Poisson GLM, claim <b>severity</b> is a gamma GLM, and price is their product. Regulators accept it because every rating factor has a visible multiplicative effect. Gradient boosting with a Poisson objective is now common too, often benchmarked against the GLM.`,
    `For demand forecasting of slow-moving items, where most days sell 0, 1 or 2 units, Poisson or negative binomial likelihoods beat squared-error models clearly, because they understand that the outcome is a small whole number and cannot be negative.`,
    `Poisson regression with robust standard errors is also a respected way to estimate <b>multiplicative effects on any non-negative outcome</b>, including revenue with many zeros. Economists call this PPML. It needs only the mean to be correctly specified, not the distribution.`
  ],
  code: `import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf

fit = smf.glm("claims ~ age_band + vehicle_group + region",
              data=df,
              family=sm.families.Poisson(),
              offset=np.log(df["policy_years"])).fit()   # exposure
print(np.exp(fit.params))                 # rate ratios

# Overdispersion check: should be close to 1
print(fit.pearson_chi2 / fit.df_resid)`,
  quiz: [
    { q: `A support centre wants to model the number of calls arriving per hour for staffing. The mean and variance of hourly counts are about equal, and hour-of-day and day-of-week effects scale the volume up or down proportionally.`,
      a: `pois`, d: [`mlr`, `logit`, `ord`],
      why: `A count outcome with mean roughly equal to variance and multiplicative effects is the textbook Poisson regression setting.` },
    { q: `An insurer models the number of claims per policy. The variance of the counts is six times the mean, and the Poisson model's standard errors look implausibly small.`,
      a: `nb`, d: [`pois`, `mlr`, `logit`],
      why: `Variance far above the mean is overdispersion. The negative binomial adds a dispersion parameter to absorb it, giving honest standard errors. Poisson would stay overconfident.` }
  ]
},
{
  id: `nb`, name: `Negative Binomial Regression`, family: `Count outcomes`, target: `Overdispersed counts`,
  tagline: `Poisson regression with an extra parameter that lets the variance exceed the mean.`,
  use: `You are modelling counts and the variance is clearly larger than the mean: many low values and a long tail of very high ones.`,
  avoid: `The counts really are equidispersed (Poisson is simpler), or the excess variance comes from a separate process generating zeros.`,
  demo: null,
  terms: [
    [`Overdispersion`, `Variance greater than the mean. In count data it usually arises because units differ in their underlying rates in ways the predictors do not explain.`],
    [`Dispersion parameter (α)`, `Controls the extra variance: Var(y) = μ + αμ². As α approaches 0 the model becomes Poisson. Some software reports θ = 1/α instead.`],
    [`Poisson–gamma mixture`, `The model's origin story: each unit has its own Poisson rate, and those rates vary across units following a gamma distribution.`],
    [`NB2 and NB1`, `Two variance forms. NB2 has variance μ + αμ² (the usual default). NB1 has variance μ(1 + α), proportional to the mean.`],
    [`Unobserved heterogeneity`, `Real differences between units that are not captured by any column in your data.`],
    [`Zero inflation`, `More zeros than even a negative binomial expects, typically because some units can never have the event at all.`],
    [`Likelihood ratio test`, `Compares the Poisson and negative binomial fits to test whether α is really greater than zero.`]
  ],
  example: {
    title: `Who uses the emergency department?`,
    body: `A health insurer models the number of emergency visits per member per year to plan care-management outreach. Most members have zero visits and a few have more than thirty. The mean is 0.4 and the variance is 3.1. A Poisson model fits the average well but claims a precision it does not have: nearly every predictor is "significant". The negative binomial estimates α = 2.6, widens the confidence intervals by a factor of two to three, and several apparent effects disappear. The rate ratios that remain, such as 1.9 for members with a chronic respiratory condition, are ones the clinical team can act on.`,
    why: `Counts with a heavy right tail and unmeasured differences between people, where the honesty of the uncertainty matters as much as the point estimate.`
  },
  history: `<p>The distribution dates back to Pascal and Montmort in the early 1700s, as the number of failures before a fixed number of successes. Its role in count modelling began with <b>Major Greenwood and George Udny Yule in 1920</b>. Studying accidents among women in British munitions factories, they found that a Poisson fitted poorly and showed that if workers differ in "accident proneness" following a gamma distribution, the counts follow a negative binomial.</p>
<p>As a regression model it came into use in the 1980s. <b>Hausman, Hall and Griliches (1984)</b> applied it to patent counts, and <b>Cameron and Trivedi (1986)</b> set out the NB1 and NB2 forms and tests for overdispersion. <b>Joseph Hilbe</b>'s textbooks later made it routine in health and social research.</p>`,
  math: {
    eq: `<i>y</i><sub>i</sub> | λ<sub>i</sub> ~ Poisson(λ<sub>i</sub>), &nbsp;&nbsp; λ<sub>i</sub> = μ<sub>i</sub> · <i>g</i><sub>i</sub>, &nbsp;&nbsp; <i>g</i><sub>i</sub> ~ Gamma(mean 1, variance α)
<br>ln μ<sub>i</sub> = <b>x</b><sub>i</sub><sup>T</sup>β &nbsp;&nbsp;&nbsp; E[<i>y</i><sub>i</sub>] = μ<sub>i</sub> &nbsp;&nbsp;&nbsp; Var(<i>y</i><sub>i</sub>) = μ<sub>i</sub> + α μ<sub>i</sub>²`,
    cost: `minimise the negative log-likelihood (with <i>r</i> = 1/α):
<br>− Σ<sub>i</sub> [ ln Γ(<i>y</i><sub>i</sub> + <i>r</i>) − ln Γ(<i>r</i>) − ln <i>y</i><sub>i</sub>! + <i>r</i> ln( <i>r</i> / (<i>r</i> + μ<sub>i</sub>) ) + <i>y</i><sub>i</sub> ln( μ<sub>i</sub> / (<i>r</i> + μ<sub>i</sub>) ) ]`,
    plain: `<p>Poisson regression assumes that two units with the same predictor values have exactly the same underlying rate. In reality they do not. One customer with a given profile calls support twice a year and another, identical on paper, calls twenty times.</p>
<p>The negative binomial model admits this. It gives each unit a hidden multiplier on its rate, with average 1, and lets those multipliers vary. Averaging over the hidden multipliers gives a distribution with the same mean as Poisson and a larger variance. One extra parameter, α, measures how much the hidden rates vary.</p>
<p>The mean structure is unchanged: still a log link, still rate ratios, still offsets for exposure. What changes is how much the model trusts each observation. Large counts are expected to be noisy, so they pull on the fit less than they would under Poisson, and the reported standard errors grow to reflect the real uncertainty.</p>
<p>Fitting maximises the likelihood over β and α together. Software typically alternates: fit β given α as a weighted regression, then update α, and repeat.</p>`
  },
  practical: [
    `<b>Fit Poisson first, then test.</b> Compare the two with a likelihood ratio test or AIC, and look at the estimated α with its interval.`,
    `<b>Coefficients are read exactly as in Poisson:</b> exponentiate for rate ratios. Mostly the estimates are similar and the intervals are wider.`,
    `<b>Keep the offset.</b> Varying exposure needs handling here just as before.`,
    `<b>Know your software's parameterisation.</b> statsmodels reports α; R's glm.nb reports θ = 1/α. Large θ means little overdispersion.`,
    `<b>It does not fix excess zeros from a separate cause.</b> If many units can never have the event, use a zero-inflated or hurdle negative binomial.`,
    `<b>Small samples estimate α poorly.</b> With a few dozen rows, Poisson with robust standard errors may be the more stable choice.`
  ],
  field: [
    `In applied work, <b>negative binomial is usually the default count model</b> and Poisson the special case. Anything driven by human behaviour is overdispersed: purchases, visits, complaints, incidents, citations, crashes per road segment.`,
    `Overdispersion is often a sign of a <b>missing variable</b>. Before accepting a large α, ask what distinguishes the heavy users. Adding one good feature, such as a prior-period count, can cut α sharply and improve the model far more than changing the distribution did.`,
    `The practical cost of ignoring overdispersion is <b>false discoveries</b>. A team runs Poisson, sees twenty "significant" effects with tiny p-values, and launches programmes on that basis. Half vanish under the negative binomial. If someone shows you a count model with suspiciously strong results, ask which distribution and which standard errors.`,
    `Decide whether <b>zeros are structural</b>. In a model of claims, customers without the relevant cover will always show zero. They are not low-risk, they are not at risk. Remove them or model them explicitly, or they distort every coefficient.`,
    `For inventory and intermittent demand, the negative binomial's wide right tail matters directly: safety stock is set from a high quantile of the predictive distribution, and Poisson's tail is too thin, leading to stockouts on the items with lumpy demand.`
  ],
  code: `import numpy as np
import statsmodels.formula.api as smf

nb = smf.negativebinomial(
        "er_visits ~ age + chronic_resp + prior_year_visits",
        data=df, offset=np.log(df["member_months"])).fit()
print(nb.summary())                       # 'alpha' row = dispersion
print(np.exp(nb.params.drop("alpha")))    # rate ratios

pois = smf.poisson("er_visits ~ age + chronic_resp + prior_year_visits",
                   data=df, offset=np.log(df["member_months"])).fit()
print(pois.aic, nb.aic)                   # compare the two`,
  quiz: [
    { q: `A health plan models emergency visits per patient per year. Most patients have 0 or 1 visit and a few have more than 30. The variance is far above the mean, and the team wants rate ratios with trustworthy confidence intervals.`,
      a: `nb`, d: [`pois`, `mlr`, `ord`],
      why: `Counts with a long right tail and variance much greater than the mean are overdispersed. Negative binomial regression keeps the rate-ratio interpretation and gives intervals that reflect the real spread.` },
    { q: `A logistics company promises delivery dates. It does not want the average delivery time. It wants the time by which 90% of deliveries arrive, as a function of distance and load.`,
      a: `quant`, d: [`nb`, `mlr`, `logit`],
      why: `The target is a specific percentile of a continuous outcome, not its mean and not a count. Quantile regression models the 90th percentile directly.` }
  ]
},
{
  id: `quant`, name: `Quantile Regression`, family: `Beyond the mean`, target: `A chosen percentile`,
  tagline: `Models the median or any other percentile of the outcome instead of its average.`,
  use: `You care about the tails or the typical case rather than the mean, the spread of the outcome changes with the predictors, or outliers are distorting a mean-based fit.`,
  avoid: `The mean is what the decision depends on and the residuals are well behaved. Ordinary regression is then more efficient.`,
  demo: `quant`,
  terms: [
    [`Quantile (τ)`, `The value below which a fraction τ of the outcomes fall. τ = 0.5 is the median, τ = 0.9 the 90th percentile.`],
    [`Conditional quantile`, `The τ-th percentile of the outcome for given predictor values. Quantile regression models this as a linear function of the predictors.`],
    [`Pinball (check) loss`, `An asymmetric absolute-error loss. For τ = 0.9, under-predicting costs nine times as much as over-predicting by the same amount.`],
    [`Median regression (LAD)`, `The τ = 0.5 case, which minimises the sum of absolute errors. Far less sensitive to outliers than least squares.`],
    [`Heteroscedasticity`, `The spread of the outcome changes with the predictors. Quantile lines at different τ fan out or converge, and the pattern is itself the finding.`],
    [`Quantile crossing`, `Separately fitted lines for different τ can cross, implying that the 90th percentile is below the 80th. A warning sign to check for.`],
    [`Prediction interval`, `Fitting, say, τ = 0.05 and τ = 0.95 gives a 90% interval for an individual outcome without assuming normal errors.`]
  ],
  example: {
    title: `A delivery promise you can keep`,
    body: `An online grocer shows an estimated arrival time at checkout. A least-squares model predicts the average, which means roughly half of orders arrive late. The team fits a quantile regression at τ = 0.9 on distance, basket size, time of day and rain. The predicted time is now one that 90% of comparable orders beat. They also notice that the gap between the median and the 90th percentile widens sharply in rain: the typical delivery is barely affected, but the bad ones get much worse. That insight leads to a rain-specific buffer rather than a blanket one.`,
    why: `The business promise is about a percentile, and the spread of the outcome depends on the predictors.`
  },
  history: `<p>Minimising absolute rather than squared errors is older than least squares. <b>Roger Boscovich</b> proposed it in 1757 for estimating the shape of the Earth, and <b>Laplace</b> developed it further. It lost out to least squares for 150 years largely because it was harder to compute by hand.</p>
<p><b>Roger Koenker and Gilbert Bassett</b> generalised median regression to any quantile in their 1978 Econometrica paper "Regression Quantiles", using the tilted absolute-value loss and linear programming to fit it. Koenker's later work and his R package quantreg made it standard in labour economics (for studying wage inequality), ecology (limiting factors) and medicine (growth charts).</p>`,
  math: {
    eq: `Q<sub>τ</sub>(<i>y</i> | <b>x</b>) = β<sub>0</sub>(τ) + β<sub>1</sub>(τ)<i>x</i><sub>1</sub> + … + β<sub>p</sub>(τ)<i>x</i><sub>p</sub> &nbsp;&nbsp; (a separate set of coefficients for each τ)`,
    cost: `minimise &nbsp; Σ<sub>i</sub> ρ<sub>τ</sub>( <i>y</i><sub>i</sub> − <b>x</b><sub>i</sub><sup>T</sup>β ) &nbsp;&nbsp; where &nbsp; ρ<sub>τ</sub>(<i>u</i>) = τ·<i>u</i> if <i>u</i> ≥ 0, &nbsp; (τ − 1)·<i>u</i> if <i>u</i> &lt; 0`,
    plain: `<p>Start with a fact about plain numbers: the value that minimises the sum of squared distances to a set of points is their mean, and the value that minimises the sum of absolute distances is their median. Regression inherits this. Least squares models the conditional mean; least absolute deviations models the conditional median.</p>
<p>To get other percentiles, tilt the loss. With τ = 0.9, a point above the line costs 0.9 per unit and a point below costs 0.1 per unit. The line is pushed upward until it is balanced, which happens when about 90% of the points are below it.</p>
<p>The loss is made of straight pieces with a kink at zero, so calculus does not give a formula. The problem is a <b>linear programme</b>, solved by simplex or interior-point methods. A property of the solution is that the fitted line passes exactly through as many points as there are coefficients.</p>
<p>Each τ is a separate fit with its own coefficients. Comparing them is where the value lies: a predictor with a coefficient of 2 at the median and 9 at the 90th percentile mostly affects the worst cases.</p>`
  },
  practical: [
    `<b>Extreme quantiles need a lot of data.</b> Estimating the 99th percentile from 500 rows rests on about five observations.`,
    `<b>Check for crossing</b> when you fit several quantiles. If lines cross inside the range of your data, sort the predictions or use a method that enforces ordering.`,
    `<b>No distributional assumption about errors,</b> and invariant to monotone transformations: the median of log(y) is the log of the median of y. The same is not true of means.`,
    `<b>Standard errors come from the bootstrap</b> or specialised formulas, and are larger in the tails.`,
    `<b>Evaluate with the pinball loss and with coverage:</b> for τ = 0.9, check that about 90% of held-out outcomes fall below the prediction.`,
    `<b>The same loss works in other learners.</b> Gradient boosting with a quantile objective gives nonlinear quantile models.`
  ],
  field: [
    `Much of what businesses call "forecasting" is really a <b>quantile decision</b>. How much stock to hold, how much capacity to provision, what delivery date to promise, how much cash to reserve: each has unequal costs for being too high and too low, and the right answer is a percentile, not the mean. Asking "what does it cost to be wrong in each direction?" tells you which τ to fit.`,
    `The <b>newsvendor rule</b> makes this concrete. If running out costs 9 for each unit short and overstocking costs 1 for each unit over, the profit-maximising order quantity is the 90th percentile of demand. Quantile regression gives that directly.`,
    `Always <b>back-test coverage by segment</b>. A 90% model that covers 90% overall may cover 99% of easy cases and 60% of hard ones. Check by region, product, weekday and any group the business cares about.`,
    `Median regression is a cheap robustness check for any linear model. If the OLS and median coefficients differ a lot, a handful of extreme rows are driving your result and you should find out which.`,
    `Service-level and latency work lives in the tails: p95 and p99 response times, not averages. A change that improves the mean can worsen the 99th percentile, and only a model of the tail will show it.`
  ],
  code: `import statsmodels.formula.api as smf

model = smf.quantreg("minutes ~ distance_km + basket_items + rain", df)
for tau in (0.5, 0.9):
    fit = model.fit(q=tau)
    print(tau, fit.params.round(2).to_dict())

# Coverage check on held-out data: should be close to 0.90
p90 = model.fit(q=0.9).predict(test)
print((test["minutes"] <= p90).mean())`,
  quiz: [
    { q: `Paediatricians need growth charts showing the 5th, 50th and 95th percentile of children's weight at each age. The spread of weights widens as children get older.`,
      a: `quant`, d: [`mlr`, `pois`, `logit`],
      why: `The targets are percentiles and the spread changes with the predictor. Quantile regression models each percentile directly and lets the lines fan out, with no assumption of constant variance.` },
    { q: `An analyst wants the average effect of advertising spend on weekly revenue. There is one predictor, a straight-line relationship, well-behaved residuals, and a standard confidence interval is required.`,
      a: `slr`, d: [`quant`, `cox`, `mnl`],
      why: `The question concerns the mean, with one predictor and no problems in the residuals. Simple linear regression is the most direct and most efficient choice.` }
  ]
}
);
