/* Models 1-5: linear foundations + ridge */
window.MODELS = window.MODELS || [];
window.MODELS.push(
{
  id: `slr`, name: `Simple Linear Regression`, family: `Linear foundations`, target: `Continuous`,
  tagline: `One predictor, one straight line, and the vocabulary every other model borrows.`,
  use: `You have one numeric driver, a roughly straight-line relationship, and you want a slope you can say out loud: "each extra X is worth about this much Y".`,
  avoid: `Other variables obviously drive the outcome too (the slope will absorb their effect), or the scatterplot bends, fans out, or has a ceiling.`,
  demo: `simple`,
  terms: [
    [`Response and predictor`, `The response (y) is what you want to explain or predict. The predictor (x) is what you use to do it. Also called dependent and independent variable, target and feature.`],
    [`Slope (β<sub>1</sub>)`, `The expected change in y for a one-unit increase in x. Its units are "y-units per x-unit", which is why you should always check what one unit of x actually is.`],
    [`Intercept (β<sub>0</sub>)`, `The predicted y when x = 0. Often meaningless on its own (a house with zero square feet), but necessary for the line to sit in the right place.`],
    [`Residual`, `Observed minus predicted, e<sub>i</sub> = y<sub>i</sub> − ŷ<sub>i</sub>. Residuals are the model's mistakes on the data it saw. Plotting them is the single most useful diagnostic in regression.`],
    [`R²`, `The share of the variance in y that the line accounts for. For simple regression it equals the squared correlation. It measures fit on this data, not whether the model is right or useful.`],
    [`Homoscedasticity`, `The residuals have the same spread at every value of x. When the spread fans out (heteroscedasticity), the slope is still unbiased but its standard error and p-value are wrong.`],
    [`Extrapolation`, `Predicting outside the range of x you observed. The line keeps going forever; reality usually does not.`]
  ],
  example: {
    title: `Pricing a delivery promise`,
    body: `A regional courier wants to quote delivery times at checkout. An analyst pulls 4,000 completed deliveries and plots minutes against route distance. The cloud is a clean diagonal band. The fitted line says <b>12 minutes of fixed handling plus 2.1 minutes per kilometre</b>. Both numbers mean something to operations: the intercept is loading and parking time, the slope is average travel speed. The team ships it as a first version in an afternoon.`,
    why: `One dominant driver, a linear mechanism, and a business that needs two interpretable numbers more than it needs the last 5% of accuracy.`
  },
  history: `<p>The method of least squares was published by <b>Adrien-Marie Legendre in 1805</b> for fitting comet orbits. <b>Carl Friedrich Gauss</b> published his own account in 1809, claimed he had used it since 1795, and tied it to the normal distribution of errors. He had used it in 1801 to predict where the lost dwarf planet Ceres would reappear, which made the method famous.</p>
<p>The word "regression" came later and from a different field. In 1886 <b>Francis Galton</b> studied the heights of parents and their adult children and noticed that very tall parents had children who were tall, but less extreme. He called this "regression towards mediocrity". The name stuck to the line-fitting technique even though the technique has nothing to do with shrinking toward the average.</p>`,
  math: {
    eq: `<i>y</i><sub>i</sub> = β<sub>0</sub> + β<sub>1</sub><i>x</i><sub>i</sub> + ε<sub>i</sub>`,
    cost: `minimise &nbsp; SSE(β<sub>0</sub>, β<sub>1</sub>) = Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − β<sub>0</sub> − β<sub>1</sub><i>x</i><sub>i</sub> )²
<br>solution: &nbsp; β̂<sub>1</sub> = Σ(<i>x</i><sub>i</sub> − x̄)(<i>y</i><sub>i</sub> − ȳ) / Σ(<i>x</i><sub>i</sub> − x̄)² &nbsp;&nbsp; β̂<sub>0</sub> = ȳ − β̂<sub>1</sub>x̄`,
    plain: `<p>Draw any line through the cloud. For each point, measure the vertical gap to the line and square it. Add the squares up. Least squares picks the one line that makes this total as small as possible.</p>
<p>Squaring does two jobs: it stops positive and negative gaps cancelling, and it punishes big misses far more than small ones (a miss of 10 costs 100, a miss of 1 costs 1). That second property is why one wild outlier can drag the whole line toward itself.</p>
<p>No iteration is needed. The total squared error is a bowl-shaped function of the two coefficients, so setting its two derivatives to zero gives the bottom of the bowl in closed form. The slope is "how x and y move together" divided by "how much x moves at all". The line always passes through the point of averages (x̄, ȳ).</p>`
  },
  practical: [
    `<b>Plot before you fit.</b> A scatterplot tells you in two seconds whether a line is sensible. Anscombe's quartet has four datasets with identical slope, intercept and R² and completely different shapes.`,
    `<b>Then plot the residuals against x.</b> A curve means you are missing a nonlinear term. A funnel means unequal variance. Clusters mean a missing grouping variable.`,
    `<b>Outliers at the edges matter most.</b> A point far out on the x axis has high leverage: it can swing the slope alone. Check Cook's distance or simply refit without it and see what changes.`,
    `<b>Correlation is not the mechanism.</b> The slope describes association in this data. Ice cream sales predict drownings because summer drives both.`,
    `<b>Mind the range.</b> Report the range of x alongside the model. The line is an approximation that was only ever checked inside that range.`,
    `<b>A low R² can still be a useful model</b> if the slope is stable and the decision depends on the average effect. A high R² can still be a useless one if it comes from two trending time series.`
  ],
  field: [
    `In real work, simple regression is rarely the final model. It is the <b>first sanity check</b>. Before building anything complicated, fit the one-variable line and write the number down. Every later model has to beat it, and if a 200-feature model barely does, that is important news.`,
    `Stakeholders remember slopes, not R². "Each extra kilometre adds two minutes" gets repeated in meetings for a year. Make sure the unit is right before you say it. A slope per metre and a slope per kilometre differ by a factor of 1,000 and people will misquote it.`,
    `The most common real failure is <b>a line fitted through two different populations</b>. Weekday and weekend, old and new pricing, two warehouses. Each group has its own line and the pooled line describes neither. Colour the scatterplot by any grouping column you have before trusting the fit.`,
    `Two things that both grow over time will always look strongly related. If your x and y are both time series, fit on changes (this month minus last month) and see whether the relationship survives. Often it does not.`,
    `When someone asks "what happens if we double X?", check whether doubling X is inside your data. If nobody in the data ever had that much X, say plainly that the model cannot answer.`
  ],
  code: `import statsmodels.formula.api as smf

fit = smf.ols("minutes ~ distance_km", data=df).fit()
print(fit.summary())          # slope, CI, R-squared

# The two plots you should never skip
df.plot.scatter("distance_km", "minutes")
(df.assign(resid=fit.resid)
   .plot.scatter("distance_km", "resid"))`,
  quiz: [
    { q: `A café owner has 60 days of data: the daily high temperature and the revenue from iced drinks. The scatterplot is a straight, even band. She asks one question: "how much more do I sell per extra degree?"`,
      a: `slr`, d: [`poly`, `logit`, `knn`],
      why: `One numeric predictor, a straight-line pattern, and a request for a single interpretable slope. Simple linear regression answers exactly that question.` },
    { q: `The same owner now wants to know whether a loyalty promotion raised daily revenue. Promotions mostly ran on hot weekends, so she needs the promo effect separated from temperature, day of week and foot traffic.`,
      a: `mlr`, d: [`slr`, `logit`, `cox`],
      why: `The promo effect is tangled up with other drivers. Multiple linear regression estimates each effect while holding the others fixed. A one-variable line would credit the promotion with the effect of hot weekends.` }
  ]
},
{
  id: `mlr`, name: `Multiple Linear Regression`, family: `Linear foundations`, target: `Continuous`,
  tagline: `Several predictors at once, each coefficient read as "holding the others fixed".`,
  use: `You need to separate the effects of several drivers on a numeric outcome, and you need coefficients, confidence intervals and a model you can defend line by line.`,
  avoid: `You have more predictors than rows, predictors that are near-copies of each other, or relationships full of thresholds and interactions you cannot specify in advance.`,
  demo: null,
  terms: [
    [`Partial coefficient`, `β<sub>j</sub> is the expected change in y per unit of x<sub>j</sub> <i>with every other predictor in the model held constant</i>. Change the set of other predictors and the meaning of β<sub>j</sub> changes with it.`],
    [`Design matrix (X)`, `The table of predictors, one row per observation and one column per predictor, plus a column of ones for the intercept.`],
    [`Multicollinearity`, `Predictors that carry overlapping information. The model cannot tell their effects apart, so coefficients become unstable and standard errors balloon, even though predictions may stay fine.`],
    [`VIF`, `Variance inflation factor. How many times larger a coefficient's variance is because of correlation with the other predictors. Above roughly 5 to 10 deserves a look.`],
    [`Dummy variable`, `A 0/1 column that encodes a category. A category with k levels needs k − 1 dummies; the left-out level becomes the baseline every other level is compared to.`],
    [`Interaction term`, `A product of two predictors, letting the effect of one depend on the level of the other (a discount works better on weekends).`],
    [`Adjusted R²`, `R² with a penalty for each extra predictor. Plain R² never goes down when you add a column, even a column of random noise.`],
    [`Omitted variable bias`, `If a variable that affects y and is correlated with an included predictor is left out, the included predictor's coefficient absorbs its effect and is biased.`]
  ],
  example: {
    title: `What is a bedroom worth?`,
    body: `A property portal models sale price from floor area, bedrooms, age, distance to transit and neighbourhood. A simple regression of price on bedrooms says each bedroom is worth $85,000. In the multiple regression the same coefficient falls to $9,000, because bigger houses have more bedrooms and floor area was doing most of the work. A few neighbourhoods even show a negative bedroom coefficient: at a fixed floor area, one more bedroom means smaller rooms.`,
    why: `The business question is about the separate contribution of each factor. Only a model that includes them together can answer it.`
  },
  history: `<p>Gauss and Legendre already handled several unknowns at once in astronomy. The statistical form came at the end of the 19th century, when <b>George Udny Yule (1897)</b> and <b>Karl Pearson</b> extended Galton's two-variable regression to many variables and introduced the idea of a "partial" effect. Yule used it to study the causes of poverty in English districts, one of the first uses of regression to adjust for confounders in social data.</p>
<p><b>R. A. Fisher</b> in the 1920s supplied the inference machinery still printed in every regression summary: the t-test for a coefficient, the F-test, and the analysis of variance. The <b>Gauss–Markov theorem</b> gives the justification: under its assumptions, least squares has the smallest variance of any linear unbiased estimator.</p>`,
  math: {
    eq: `<i>y</i> = β<sub>0</sub> + β<sub>1</sub><i>x</i><sub>1</sub> + β<sub>2</sub><i>x</i><sub>2</sub> + … + β<sub>p</sub><i>x</i><sub>p</sub> + ε &nbsp;&nbsp;&nbsp; in matrix form: &nbsp; <b>y</b> = <b>X</b>β + ε`,
    cost: `minimise &nbsp; ‖<b>y</b> − <b>X</b>β‖² = Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − <b>x</b><sub>i</sub><sup>T</sup>β )²
<br>solution (normal equations): &nbsp; β̂ = (<b>X</b><sup>T</sup><b>X</b>)<sup>−1</sup> <b>X</b><sup>T</sup><b>y</b>`,
    plain: `<p>The idea is the same as with one predictor: choose the coefficients that make the sum of squared residuals smallest. Instead of a line through a 2-D cloud, you are fitting a flat plane (a hyperplane) through a cloud in many dimensions.</p>
<p>Geometrically, the fitted values are the <b>projection</b> of y onto the space spanned by the predictor columns: the closest point to y that can be built as a weighted sum of the columns. The residual vector is what is left over, and it is at right angles to every predictor.</p>
<p>The formula needs X<sup>T</sup>X to be invertible. When two columns are nearly the same, that matrix is nearly singular, the inverse blows up, and tiny changes in the data produce large changes in the coefficients. That is multicollinearity in one sentence, and it is the problem ridge regression was invented to fix. Software does not literally invert the matrix; it uses a QR or SVD decomposition, which is more stable.</p>`
  },
  practical: [
    `<b>Check the four assumptions with plots, not tests:</b> linearity (residuals vs fitted), constant variance (same plot, look for a funnel), independence (residuals in time or group order), roughly normal residuals (Q-Q plot, and this one matters least with large samples).`,
    `<b>Skewed money and size variables usually want a log.</b> Log the outcome and coefficients become approximate percentage effects. Log both sides and they become elasticities.`,
    `<b>Use robust standard errors by default</b> (HC3) and clustered ones when rows share a group such as the same customer or store. Ordinary standard errors are often too small in business data.`,
    `<b>Scale matters for reading, not for fitting.</b> OLS predictions do not change if you rescale a column, but comparing raw coefficients across features with different units is meaningless.`,
    `<b>Watch the dummy variable trap.</b> Including all k levels of a category plus an intercept makes the columns perfectly collinear.`,
    `<b>Roughly 10 to 20 observations per coefficient</b> is a reasonable floor for stable estimates. Count dummy columns and interactions, not just variable names.`
  ],
  field: [
    `<b>Coefficients flipping sign</b> when you add a feature is the most common "the model is broken" ticket. It almost always means two correlated predictors are splitting one effect. Check the correlation matrix and VIFs before defending either number.`,
    `Be explicit about which job you are doing. For <b>prediction</b>, collinearity is mostly harmless and you can throw in anything available at prediction time. For <b>explanation</b>, every included and excluded variable changes the meaning of the others, and you should be able to justify each one causally.`,
    `<b>Leakage looks like a great feature.</b> If a predictor is only known after the outcome happens (a "refund issued" flag when predicting order value), the model will be superb offline and useless live. For every column ask: would I have this value at the moment of prediction?`,
    `"Controlling for" a variable that is itself caused by your treatment removes part of the effect you wanted to measure. If you adjust for number of site visits when measuring an ad's effect on sales, you subtract the very path the ad works through.`,
    `Linear regression is still the workhorse behind pricing studies, marketing mix models, A/B test adjustment (CUPED) and most econometrics, because people can audit it. A model a regulator or finance lead can read often beats a slightly more accurate one they cannot.`
  ],
  code: `import statsmodels.formula.api as smf
from statsmodels.stats.outliers_influence import variance_inflation_factor

fit = smf.ols(
    "np.log(price) ~ sqft + bedrooms + age + C(neighbourhood)",
    data=df,
).fit(cov_type="HC3")            # robust standard errors
print(fit.summary())

X = fit.model.exog               # collinearity check
vifs = [variance_inflation_factor(X, i) for i in range(1, X.shape[1])]`,
  quiz: [
    { q: `An insurer must tell its regulator how annual claim cost changes with driver age while holding vehicle value, mileage and region fixed. There are 12 well-understood predictors, 50,000 policies, roughly linear relationships, and every coefficient needs a confidence interval.`,
      a: `mlr`, d: [`rf`, `knn`, `slr`],
      why: `Several predictors, a continuous outcome, plenty of data, and a hard requirement for interpretable "holding others fixed" effects with intervals. That is the home ground of multiple linear regression.` },
    { q: `A lab has 200 patients and expression levels for 5,000 genes. It wants to predict a continuous biomarker and end up with a short list of genes that matter.`,
      a: `lasso`, d: [`mlr`, `slr`, `knn`],
      why: `With far more predictors than rows, ordinary least squares has no unique solution. Lasso both regularises and sets most coefficients to exactly zero, giving the short list.` }
  ]
},
{
  id: `poly`, name: `Polynomial Regression`, family: `Linear foundations`, target: `Continuous`,
  tagline: `Still linear regression, but on x, x², x³… so the fitted line can bend.`,
  use: `The relationship is smooth and curved with one or two bends (rises then flattens, or peaks then falls) and you still want an equation.`,
  avoid: `You need to predict beyond the observed range, or you are tempted to keep raising the degree until the curve hits every point.`,
  demo: `poly`,
  terms: [
    [`Degree`, `The highest power of x in the model. Degree 2 allows one bend, degree 3 allows two. Each extra degree adds flexibility and variance.`],
    [`Feature expansion`, `Creating new columns (x², x³, x<sub>1</sub>x<sub>2</sub>) from existing ones. The model is still linear in its coefficients, which is why ordinary least squares still works.`],
    [`Overfitting`, `Fitting the noise in this particular sample instead of the underlying pattern. Training error keeps falling as degree rises while error on new data starts rising.`],
    [`Bias–variance trade-off`, `A too-simple model misses the pattern (bias). A too-flexible one changes drastically from sample to sample (variance). Test error is lowest somewhere in between.`],
    [`Runge's phenomenon`, `High-degree polynomials oscillate wildly near the edges of the data, even when they fit the middle well.`],
    [`Orthogonal polynomials`, `A re-expression of x, x², x³ as uncorrelated columns. The fitted curve is identical but the numerics are stable and the coefficients do not fight each other.`],
    [`Spline`, `A curve built from low-degree polynomial pieces joined smoothly at knots. Usually the better tool when you need more than a couple of bends.`]
  ],
  example: {
    title: `Finding the best fertiliser dose`,
    body: `An agronomy team runs 80 field plots with nitrogen rates from 0 to 300 kg/ha. Yield climbs quickly, flattens around 180, and falls slightly beyond 240 as the crop is over-fed. A straight line would say "more is always better". A quadratic captures the diminishing returns and gives a formula for the turning point, −β<sub>1</sub> / (2β<sub>2</sub>). Combined with the price of fertiliser, that yields the economically optimal dose rather than the yield-maximising one.`,
    why: `One predictor, a smooth single-peaked response grounded in biology, and a need for an explicit curve whose maximum can be computed.`
  },
  history: `<p>Fitting polynomials by least squares is nearly as old as least squares. <b>Joseph Diaz Gergonne</b> wrote in 1815 about how to design experiments for polynomial regression, which is often cited as the first paper on optimal experimental design. In the 20th century, <b>R. A. Fisher</b> promoted orthogonal polynomials for agricultural trials, and <b>Box and Wilson (1951)</b> built response surface methodology on second-degree polynomials to optimise chemical processes.</p>
<p>The warning label is also old. <b>Carl Runge (1901)</b> showed that high-degree polynomial fits through evenly spaced points oscillate ever more violently at the edges. That result is one reason splines (Schoenberg, 1946) took over for flexible curve fitting.</p>`,
  math: {
    eq: `<i>y</i> = β<sub>0</sub> + β<sub>1</sub><i>x</i> + β<sub>2</sub><i>x</i>² + … + β<sub>d</sub><i>x</i><sup>d</sup> + ε`,
    cost: `minimise &nbsp; Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − Σ<sub>k=0..d</sub> β<sub>k</sub> <i>x</i><sub>i</sub><sup>k</sup> )² &nbsp;&nbsp; (ordinary least squares on the expanded columns)`,
    plain: `<p>Nothing new happens in the optimiser. You build extra columns, x squared, x cubed and so on, then run ordinary multiple regression on them. "Linear" in linear regression refers to the coefficients, not to the shape of the curve.</p>
<p>What changes is the amount of freedom. A degree-d polynomial can pass exactly through d + 1 points. Give it enough degree and it will chase every noisy point, producing a curve with zero training error that is useless on new data.</p>
<p>So the real optimisation problem is choosing d. You do that with held-out data: fit each candidate degree on training folds, score on validation folds, and pick the degree where validation error bottoms out. In practice this is almost always 2 or 3.</p>`
  },
  practical: [
    `<b>Degree 2 or 3 is nearly always the ceiling.</b> If you need more bends than that, switch to splines or a tree-based model.`,
    `<b>Centre x before squaring it.</b> Raw x and x² are highly correlated. Subtracting the mean first removes most of that and makes the coefficients stable.`,
    `<b>Do not interpret individual coefficients.</b> "The effect of x holding x² fixed" is not a thing. Interpret the curve: plot it, report its slope at a few values and its turning point.`,
    `<b>Never extrapolate.</b> A quadratic that fits well up to x = 300 will curve off to plus or minus infinity soon after. The tails of a polynomial are determined by its highest power, not by your data.`,
    `<b>With several predictors, terms multiply.</b> Degree 3 on 20 features generates 1,770 columns. Combine with regularisation or choose interactions by hand.`,
    `<b>Choose degree by cross-validation,</b> never by training R², which always prefers the higher degree.`
  ],
  field: [
    `The classic production accident: a cubic term fits beautifully in backtesting, then one day an input arrives slightly outside the training range and the model returns a negative price or a 900% forecast. If you ship a polynomial, <b>clip inputs to the training range</b> and alert when clipping happens.`,
    `Quadratic terms earn their place in <b>pricing and marketing</b>, where diminishing returns are real: the second million of ad spend buys less than the first. Many teams use a log or a saturation curve instead because those cannot turn back downward the way a quadratic eventually does.`,
    `In dashboards and executive charts, a "trend line" is often a high-degree polynomial chosen because it looked good. Ask what degree it is before reading anything into the wiggle at the right-hand edge. That last wiggle is usually an artefact.`,
    `Age is the standard example of a variable that needs a squared term: earnings, health costs and many risks rise then fall, or fall then rise. Adding age² is a small change that often fixes a visibly curved residual plot.`
  ],
  code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score

for d in range(1, 7):                      # pick degree on held-out data
    model = make_pipeline(StandardScaler(),
                          PolynomialFeatures(d),
                          LinearRegression())
    rmse = -cross_val_score(model, X, y, cv=5,
               scoring="neg_root_mean_squared_error").mean()
    print(d, round(rmse, 3))`,
  quiz: [
    { q: `Crop yield rises with fertiliser, levels off, then drops when plots are over-fertilised. There is one predictor and 80 plots. The agronomist wants a smooth curve with an equation so she can calculate the best dose.`,
      a: `poly`, d: [`slr`, `logit`, `cox`],
      why: `A single smooth bend with one predictor is the textbook case for a quadratic. A straight line cannot have a maximum, and the other two model different kinds of outcome entirely.` },
    { q: `A demand model has 40 features and 2 million rows. The response shows sharp jumps, plateaus and interactions nobody can specify by hand. Only predictive accuracy matters.`,
      a: `gbm`, d: [`poly`, `slr`, `ord`],
      why: `Polynomials handle smooth curves in one or two variables. Abrupt thresholds and unknown interactions across 40 features are what boosted trees learn automatically.` }
  ]
},
{
  id: `step`, name: `Stepwise Regression`, family: `Linear foundations`, target: `Continuous`,
  tagline: `An automatic search that adds and drops predictors one at a time. Widely used, widely criticised.`,
  use: `You need a quick first-pass shortlist from a moderate number of candidate predictors, and you will validate the result on fresh data.`,
  avoid: `You plan to report the p-values or confidence intervals of the selected model as if the selection had never happened.`,
  demo: null,
  terms: [
    [`Forward selection`, `Start with no predictors. At each step add the one that improves the criterion most. Stop when nothing helps enough.`],
    [`Backward elimination`, `Start with all predictors. At each step remove the least useful one. Requires more rows than predictors.`],
    [`Bidirectional (stepwise)`, `Forward selection, but after each addition re-check whether any earlier predictor has become redundant and can be dropped.`],
    [`AIC and BIC`, `Scores that reward fit and penalise the number of parameters. AIC = 2k − 2 ln L. BIC = k ln n − 2 ln L, a heavier penalty that picks smaller models.`],
    [`Greedy search`, `Making the best-looking move at each step without looking ahead. Fast, but it can miss the best overall subset.`],
    [`Selection bias`, `Variables are chosen <i>because</i> they looked strong in this sample, so their coefficients are overstated and their p-values are too small.`],
    [`Best subset selection`, `Trying every combination of predictors. Exact but explodes: 30 predictors give over a billion subsets.`]
  ],
  example: {
    title: `Screening survey drivers`,
    body: `A hospital network has patient satisfaction scores and 25 operational measures per ward: staffing ratios, wait times, cleaning frequency and so on. Nobody knows which matter. An analyst runs forward selection with BIC and gets a five-variable model. She treats it as a <b>shortlist to investigate</b>, refits those five on the following quarter's data, and finds that three hold up. Those three go to the operations team.`,
    why: `A modest number of candidates, an exploratory goal, and a second dataset to confirm the findings. The procedure is used to generate hypotheses, not to prove them.`
  },
  history: `<p>The stepwise algorithm was written down by <b>M. A. Efroymson in 1960</b> while working at Esso Research, when a regression on a few dozen variables took serious computer time and trying all subsets was impossible. It shipped in BMDP, SAS and SPSS and became the default way a generation of analysts built models.</p>
<p>The criticism followed. Statisticians including <b>Frank Harrell</b> documented that stepwise selection inflates R², biases coefficients away from zero, produces p-values that are far too small and picks different variables on resamples of the same data. <b>Hirotugu Akaike's AIC (1973)</b> and <b>Gideon Schwarz's BIC (1978)</b> gave better stopping rules than p-value thresholds, and the lasso (1996) later offered a selection method without the worst of these problems.</p>`,
  math: {
    eq: `Model at step <i>t</i>: &nbsp; <i>y</i> = β<sub>0</sub> + Σ<sub>j ∈ S<sub>t</sub></sub> β<sub>j</sub><i>x</i><sub>j</sub> + ε &nbsp;&nbsp; where S<sub>t</sub> is the current set of chosen predictors`,
    cost: `find the subset S that minimises &nbsp; AIC(S) = <i>n</i> ln( SSE<sub>S</sub> / <i>n</i> ) + 2|S|
<br>or &nbsp; BIC(S) = <i>n</i> ln( SSE<sub>S</sub> / <i>n</i> ) + |S| ln <i>n</i>`,
    plain: `<p>There are two layers of optimisation. Inside each candidate model, the coefficients are found by ordinary least squares. Around that sits a search over which predictors to include.</p>
<p>The search is greedy. Forward selection asks "which single variable, added now, lowers the score most?", adds it, and repeats. The score has two parts pulling in opposite directions: a fit term that improves as you add variables, and a penalty that grows with each one. You stop when no move lowers the total.</p>
<p>Because each step commits to the locally best choice, the path depends on small differences. Two correlated predictors can be nearly tied; whichever wins by a hair gets in and blocks the other. Resample the data and the other may win. This instability is the method's core weakness.</p>`
  },
  practical: [
    `<b>The printed p-values are not valid.</b> They are computed as though you had specified this model in advance. After a search over many candidates they are optimistic, often dramatically.`,
    `<b>Do the selection inside cross-validation.</b> If you select variables on all the data and then cross-validate the chosen model, the test folds have already been used and the error estimate is too low.`,
    `<b>Check stability with a bootstrap.</b> Rerun the procedure on 100 resamples and count how often each variable is picked. Variables chosen 30% of the time are not findings.`,
    `<b>Prefer AIC or BIC to p-value thresholds</b> for entering and leaving, and prefer BIC when you want a compact model.`,
    `<b>Correlated predictors make the choice arbitrary.</b> The selected one stands in for its whole group. Do not conclude the others are unimportant.`,
    `<b>Consider the alternatives first:</b> lasso or elastic net for automated selection, or domain knowledge for a pre-specified model.`
  ],
  field: [
    `You will meet stepwise models in the wild: older credit scorecards, clinical risk scores, SAS codebases at banks and insurers. Knowing its weaknesses lets you ask the right review question: <b>"was this validated on data the selection never saw?"</b>`,
    `The pattern that causes real damage is <b>pre-screening on the full dataset</b>: keep the 20 features most correlated with the target, then cross-validate. With enough candidate features this produces impressive validation scores from pure noise. Any step that looks at the target belongs inside the cross-validation loop.`,
    `When an executive asks "which factors matter?", stepwise gives a clean-looking list, and that is its appeal and its danger. A dropped variable was not shown to be irrelevant. It was just less useful <i>given the ones already in</i>. Say this explicitly or the list will be read as a causal ranking.`,
    `In practice most experienced modellers have replaced it with regularised regression or tree-based importance plus a hold-out check. Where it survives usefully is as a fast screen when there are tens of candidates, not thousands, and an expert reviews the output.`
  ],
  code: `from sklearn.feature_selection import SequentialFeatureSelector
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import cross_val_score

# Selection lives INSIDE the pipeline, so each CV fold
# selects on its own training part only.
model = make_pipeline(
    SequentialFeatureSelector(LinearRegression(),
                              n_features_to_select=5,
                              direction="forward"),
    LinearRegression())
print(cross_val_score(model, X, y, cv=5, scoring="r2").mean())`,
  quiz: [
    { q: `An analyst in a long-established SAS shop has 15 candidate predictors and 5,000 rows. For an exploratory first pass she is asked for an automated procedure that adds and removes predictors one at a time by AIC until it reaches a compact least-squares model, which will then be checked on next quarter's data.`,
      a: `step`, d: [`ridge`, `knn`, `cox`],
      why: `Adding and removing predictors one at a time against AIC is the definition of stepwise regression. The planned check on new data is what makes this an acceptable use.` },
    { q: `You have 2,000 candidate predictors and want variable selection that comes from a single convex optimisation, shrinks coefficients as it selects, and is tuned by cross-validating one penalty parameter.`,
      a: `lasso`, d: [`step`, `ridge`, `mlr`],
      why: `The L1 penalty does selection and shrinkage in one convex problem controlled by one parameter. Stepwise is a greedy discrete search, ridge never sets coefficients to zero, and OLS does no selection.` }
  ]
},
{
  id: `ridge`, name: `Ridge Regression (L2)`, family: `Regularised linear models`, target: `Continuous`,
  tagline: `Least squares with a penalty on large coefficients. Trades a little bias for a lot of stability.`,
  use: `Predictors are many or highly correlated, you believe most of them carry some signal, and you care more about stable predictions than about a short variable list.`,
  avoid: `You need a sparse model with variables removed, or unbiased coefficients with classical confidence intervals.`,
  demo: `ridge`,
  terms: [
    [`Regularisation`, `Adding a penalty to the loss function that discourages complex models. The fit gets slightly worse on training data and usually better on new data.`],
    [`L2 penalty`, `λ times the sum of squared coefficients. It punishes large coefficients heavily and small ones barely at all, so everything shrinks but nothing reaches exactly zero.`],
    [`λ (alpha in scikit-learn)`, `The penalty strength. λ = 0 is ordinary least squares. As λ grows, coefficients shrink toward zero and the model approaches predicting the mean.`],
    [`Shrinkage`, `Pulling estimates toward zero (or toward each other). Shrunken estimates are biased but have lower variance.`],
    [`Standardisation`, `Putting predictors on the same scale before fitting. Essential here because the penalty treats all coefficients alike, and a coefficient's size depends on its feature's units.`],
    [`Effective degrees of freedom`, `A measure of how many parameters the penalised model is "really" using. It falls smoothly from p toward 0 as λ increases.`],
    [`Regularisation path`, `The curve each coefficient traces as λ goes from large to small. Reading it shows which coefficients are stable and which swing around.`]
  ],
  example: {
    title: `Reading chemistry from a spectrum`,
    body: `A food lab predicts the protein content of grain from near-infrared spectra: 300 absorbance readings per sample, and neighbouring wavelengths correlate at 0.99. There are only 150 samples. Ordinary least squares cannot even be computed with more columns than rows, and on a subset it gives coefficients of +4,000 and −3,998 on adjacent wavelengths. Ridge spreads the weight smoothly across groups of related wavelengths and predicts new samples within the lab's tolerance.`,
    why: `Many correlated predictors that all carry part of the signal, fewer rows than columns, and no need to discard any wavelength.`
  },
  history: `<p><b>Arthur Hoerl and Robert Kennard</b> introduced ridge regression in a pair of 1970 Technometrics papers. They were chemical engineers at DuPont dealing with correlated process variables whose least-squares coefficients were unstable and sometimes had the wrong sign. Adding a small constant to the diagonal of X<sup>T</sup>X fixed the instability. The name comes from Hoerl's earlier "ridge analysis" of response surfaces.</p>
<p>The same mathematics had appeared independently in the Soviet Union, where <b>Andrey Tikhonov (1943)</b> used it to stabilise ill-posed inverse problems. Outside statistics it is still called Tikhonov regularisation. In machine learning it reappears as "weight decay" in neural networks.</p>`,
  math: {
    eq: `<i>ŷ</i> = β<sub>0</sub> + Σ<sub>j</sub> β<sub>j</sub><i>x</i><sub>j</sub> &nbsp;&nbsp; (same model as linear regression)`,
    cost: `minimise &nbsp; Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − ŷ<sub>i</sub> )² + λ Σ<sub>j=1..p</sub> β<sub>j</sub>²
<br>solution: &nbsp; β̂<sub>ridge</sub> = (<b>X</b><sup>T</sup><b>X</b> + λ<b>I</b>)<sup>−1</sup> <b>X</b><sup>T</sup><b>y</b>`,
    plain: `<p>Ridge asks the model to do two things at once: fit the data, and keep the coefficients small. λ sets the exchange rate between those goals.</p>
<p>Why does small help? When two predictors are nearly identical, least squares can fit equally well with coefficients (1, 1) or (1001, −999). The data cannot tell these apart, and noise decides. The penalty breaks the tie in favour of the small, even split. It costs a little fit and removes most of the wobble.</p>
<p>There is still a closed-form solution. Adding λ to the diagonal of X<sup>T</sup>X guarantees the matrix can be inverted, even with more predictors than rows. Ridge shrinks most strongly along directions in which the data vary least, which are exactly the directions least squares estimates worst. The intercept is not penalised. λ is chosen by cross-validation.</p>`
  },
  practical: [
    `<b>Always standardise the predictors first.</b> Otherwise a feature measured in millimetres is penalised differently from the same feature in kilometres.`,
    `<b>Search λ on a log scale</b> (for example 0.001 to 1,000). RidgeCV does this efficiently using a leave-one-out shortcut.`,
    `<b>Ridge keeps every feature.</b> If you need to hand someone a list of 10 variables, it will not give you one.`,
    `<b>Correlated features share the weight.</b> Two near-duplicates each get about half the coefficient either would get alone. Good for stability, confusing if you read coefficients one by one.`,
    `<b>Coefficients are biased toward zero on purpose,</b> so standard p-values and confidence intervals do not apply.`,
    `<b>It works when p &gt; n,</b> where ordinary least squares fails outright.`
  ],
  field: [
    `Ridge is the <b>quiet default</b> of applied modelling. If you one-hot encode a few categorical variables you already have dozens of correlated columns, and a small L2 penalty costs nothing and prevents the occasional absurd coefficient. Many practitioners never fit unpenalised linear models at all.`,
    `The most common silent bug: <b>fitting the scaler on all the data</b> before splitting. The scaling statistics then contain information from the test set. Put the scaler and the model in one pipeline so that each cross-validation fold scales using its own training rows.`,
    `With high-cardinality categories (thousands of stores, SKUs or zip codes), ridge behaves like a simple hierarchical model: levels with little data are pulled toward the overall average and levels with lots of data keep their own estimate. That is usually exactly what you want.`,
    `When a stakeholder wants "the drivers", do not sort ridge coefficients and present the top ten. With correlated inputs the ranking is partly arbitrary. Group related features and report the group's combined effect, or use a selection method built for that question.`,
    `scikit-learn's LogisticRegression applies an L2 penalty by default (C = 1). Many people have fitted ridge-penalised models for years without knowing it, and been puzzled why their coefficients differ from statsmodels.`
  ],
  code: `import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import RidgeCV

model = make_pipeline(
    StandardScaler(),                         # scale inside the pipeline
    RidgeCV(alphas=np.logspace(-3, 3, 50)))   # lambda chosen by CV
model.fit(X_train, y_train)
print(model[-1].alpha_, model.score(X_test, y_test))`,
  quiz: [
    { q: `A lab predicts a chemical concentration from 300 spectrometer wavelengths. Adjacent wavelengths correlate at 0.99 and there are only 150 samples. Every wavelength carries a little signal, there is no need to drop any, and the goal is stable prediction.`,
      a: `ridge`, d: [`mlr`, `step`, `lasso`],
      why: `Dense signal across many highly correlated predictors with p greater than n is where ridge is strongest. It keeps all predictors and shares weight among correlated ones. Lasso would pick one wavelength per group somewhat arbitrarily.` },
    { q: `In a similar problem the predictors come in tightly correlated groups, most groups are irrelevant, and you want a sparse model that keeps or drops each correlated group together.`,
      a: `enet`, d: [`ridge`, `lasso`, `mlr`],
      why: `Elastic net mixes the L1 penalty (sparsity) with the L2 penalty (grouping of correlated predictors). Ridge alone is never sparse; lasso alone picks one member of each group and discards the rest.` }
  ]
}
);
