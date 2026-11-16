/* Models 6-10: lasso, elastic net, logistic, multinomial, ordinal */
window.MODELS = window.MODELS || [];
window.MODELS.push(
{
  id: `lasso`, name: `Lasso Regression (L1)`, family: `Regularised linear models`, target: `Continuous`,
  tagline: `A penalty on absolute coefficient size that sets the unhelpful ones to exactly zero.`,
  use: `You have many candidate predictors, you believe only some matter, and you want the model to choose them for you while it fits.`,
  avoid: `Predictors come in highly correlated groups and you need to know which specific ones matter, or you need classical confidence intervals.`,
  demo: `lasso`,
  terms: [
    [`L1 penalty`, `λ times the sum of the absolute values of the coefficients. Unlike the squared penalty, its pull toward zero does not weaken as a coefficient gets small, so coefficients land exactly on zero.`],
    [`Sparsity`, `Most coefficients are exactly zero. A sparse model is cheaper to run, easier to explain and needs fewer inputs collected.`],
    [`Soft thresholding`, `The basic lasso operation: move a coefficient toward zero by a fixed amount, and if that would cross zero, set it to zero.`],
    [`Coordinate descent`, `The standard fitting algorithm. Update one coefficient at a time with the others held fixed, cycling until nothing changes.`],
    [`Regularisation path`, `The sequence of models from large λ (everything zero) to small λ (nearly least squares). Variables enter the model one by one along the way.`],
    [`One-standard-error rule`, `Choose the largest λ whose cross-validated error is within one standard error of the best. Gives a simpler model at no reliable cost in accuracy.`],
    [`Selection consistency`, `Whether the method picks the truly relevant variables as data grow. Lasso manages this only when relevant and irrelevant predictors are not too correlated.`]
  ],
  example: {
    title: `Which of 800 signals actually predict demand?`,
    body: `A retailer forecasts weekly store sales and has assembled 800 candidate features: weather, local events, competitor prices, web traffic, dozens of lags. Each feed costs money to license and engineering time to maintain. A cross-validated lasso keeps 34 features with non-zero coefficients and predicts as well as the full model. The team cancels four data contracts and the production pipeline shrinks by an order of magnitude.`,
    why: `Many candidates, a belief that most are noise, and a concrete payoff for every feature removed.`
  },
  history: `<p><b>Robert Tibshirani</b> introduced the lasso in 1996 in "Regression Shrinkage and Selection via the Lasso". The name stands for Least Absolute Shrinkage and Selection Operator. He was motivated by Leo Breiman's "non-negative garrote" and wanted a method with the stability of ridge and the interpretability of subset selection. An L1 penalty had been used a decade earlier in geophysics (Santosa and Symes, 1986) to recover sparse seismic signals.</p>
<p>The lasso became practical at scale with two algorithms: <b>least angle regression</b> (Efron, Hastie, Johnstone, Tibshirani, 2004), which computes the entire path at the cost of one least-squares fit, and <b>coordinate descent</b> as implemented in the glmnet package (Friedman, Hastie, Tibshirani, 2010). The same L1 idea underlies compressed sensing.</p>`,
  math: {
    eq: `<i>ŷ</i> = β<sub>0</sub> + Σ<sub>j</sub> β<sub>j</sub><i>x</i><sub>j</sub> &nbsp;&nbsp; (same linear model)`,
    cost: `minimise &nbsp; (1 / 2<i>n</i>) Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − ŷ<sub>i</sub> )² + λ Σ<sub>j=1..p</sub> |β<sub>j</sub>|
<br>one-coefficient update: &nbsp; β<sub>j</sub> ← S(ρ<sub>j</sub>, λ) = sign(ρ<sub>j</sub>) · max( |ρ<sub>j</sub>| − λ, 0 )`,
    plain: `<p>Ridge charges for the square of each coefficient; lasso charges for its absolute value. The difference looks small and changes everything.</p>
<p>Under a squared penalty, shrinking a coefficient from 0.1 to 0 saves almost nothing (0.01), so ridge never bothers to go all the way. Under an absolute penalty, every unit of shrinkage saves the same amount no matter how small the coefficient already is. If a predictor's contribution to the fit is worth less than λ, the cheapest thing to do is switch it off completely.</p>
<p>The geometric picture: the penalty confines the coefficients to a diamond rather than ridge's circle. The diamond has corners on the axes, and the best-fitting point on a diamond is very often a corner, where some coefficients are zero.</p>
<p>The absolute value has a kink at zero, so there is no closed-form solution. Coordinate descent handles it: take one coefficient, compute ρ<sub>j</sub>, the least-squares coefficient it would get against the current residual, then shrink that by λ, to zero if necessary. Cycle through all coefficients until they settle.</p>`
  },
  practical: [
    `<b>Standardise first,</b> for the same reason as ridge. An unscaled feature with small numeric values needs a large coefficient and gets penalised unfairly.`,
    `<b>Among correlated predictors, lasso picks one more or less at random</b> and zeros the rest. The choice can change with a different random split.`,
    `<b>It selects at most n variables</b> when there are more predictors than rows.`,
    `<b>Surviving coefficients are shrunk too.</b> A common remedy is to refit ordinary least squares on the selected variables ("relaxed" or post-lasso), validated on held-out data.`,
    `<b>Use LassoCV</b> and look at the whole path, not just the winning λ. A feature that enters early and stays is more trustworthy than one that appears at the very end.`,
    `<b>Zero does not mean "no effect".</b> It means the variable added nothing beyond those already selected, at this sample size.`
  ],
  field: [
    `Lasso earns its keep in practice less through accuracy than through <b>fewer inputs</b>. Every feature in a production model is a pipeline that can break, a data contract to maintain and a column to monitor. A model with 30 features that is 1% worse than one with 800 is usually the better engineering decision.`,
    `Do not present the selected set as "the true drivers". Run the selection on 50 bootstrap resamples and report how often each feature is chosen. A feature picked in 95% of runs is solid. One picked in 40% is interchangeable with something else. This is called <b>stability selection</b> and it changes the conversation with stakeholders.`,
    `A frequent pattern: use lasso as a <b>screening step</b>, then give the surviving features to a gradient boosted model. It works, but remember that lasso only sees linear effects. A feature whose effect is U-shaped or purely interactive can be discarded by the screen.`,
    `One-hot encoded categories interact badly with lasso: it zeros individual levels, leaving you with "region = North-East matters, the other regions do not", which is hard to explain. Group lasso or target encoding handles this more gracefully.`,
    `If someone computes p-values on the lasso-selected variables using the same data, the result is wrong for the same reason as with stepwise selection. Use a separate hold-out for inference or methods designed for post-selection inference.`
  ],
  code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LassoCV
import numpy as np

model = make_pipeline(StandardScaler(),
                      LassoCV(cv=5, n_alphas=100, max_iter=10000))
model.fit(X_train, y_train)

lasso = model[-1]
kept = np.flatnonzero(lasso.coef_)
print(f"lambda={lasso.alpha_:.4f}, kept {kept.size} of {X_train.shape[1]}")`,
  quiz: [
    { q: `A marketing team has 800 candidate features and believes only a handful matter. They want a linear model that automatically sets the rest to zero so they can stop paying for those data feeds.`,
      a: `lasso`, d: [`ridge`, `knn`, `mlr`],
      why: `The goal is automatic variable selection in a linear model under a sparsity assumption. Lasso's L1 penalty produces exact zeros. Ridge shrinks but keeps all 800.` },
    { q: `Set penalties aside for a moment. The outcome is whether a customer churned (yes or no), there are 12 well-understood predictors and 100,000 rows, and the stakeholder wants odds ratios.`,
      a: `logit`, d: [`lasso`, `ridge`, `slr`],
      why: `The type of outcome decides the model family first. A binary outcome with a request for odds ratios is logistic regression. Lasso and ridge as defined here model a continuous response.` }
  ]
},
{
  id: `enet`, name: `Elastic Net Regression`, family: `Regularised linear models`, target: `Continuous`,
  tagline: `A blend of the lasso and ridge penalties: sparse like one, stable with correlated predictors like the other.`,
  use: `You want variable selection but your predictors are correlated in groups, or you have far more predictors than rows.`,
  avoid: `You have a handful of clean predictors and plenty of data. Two tuning parameters are more than that problem needs.`,
  demo: `enet`,
  terms: [
    [`Mixing parameter (l1_ratio, α)`, `The share of the penalty that is L1. 1 is pure lasso, 0 is pure ridge. Typical useful values sit between 0.1 and 0.9.`],
    [`Grouping effect`, `Strongly correlated predictors receive similar coefficients and tend to enter or leave the model together, instead of one being picked arbitrarily.`],
    [`Two-parameter tuning`, `Both the overall strength λ and the mix must be chosen, normally by cross-validating over a grid.`],
    [`p ≫ n`, `Many more predictors than observations. Common in genomics, text and sensor data, and the situation elastic net was designed for.`],
    [`Double shrinkage`, `Coefficients are shrunk by both penalties. The original paper rescaled them to compensate; modern software leaves this to cross-validation.`],
    [`Warm start`, `Using the solution at one λ as the starting point for the next. Makes computing the whole path nearly as cheap as one fit.`]
  ],
  example: {
    title: `Gene signatures that survive a resample`,
    body: `A cancer research group has expression levels for 20,000 genes in 300 tumours and wants a signature that predicts drug response. Genes work in pathways, so dozens of them move together. Lasso returns one gene per pathway, and a different one each time the data are resampled, which makes the biologists distrust the result. Elastic net with a mix of 0.5 selects 12 pathways and keeps the co-expressed genes within each. The signature is stable across resamples and maps onto known biology.`,
    why: `Extreme p ≫ n with correlated groups, and a need for selections that are both sparse and reproducible.`
  },
  history: `<p><b>Hui Zou and Trevor Hastie</b> published the elastic net in 2005, when Zou was a PhD student at Stanford. They identified three lasso limitations: it selects at most n variables when p &gt; n, it picks one variable from a correlated group and ignores the others, and when predictors are highly correlated ridge often predicts better. Adding a ridge term to the lasso penalty addressed all three.</p>
<p>The name is their image of "a stretchable fishing net that retains all the big fish". The method spread quickly in genomics, and the <b>glmnet</b> package (2010) made it fast enough for routine use across linear, logistic, Poisson and Cox models.</p>`,
  math: {
    eq: `<i>ŷ</i> = β<sub>0</sub> + Σ<sub>j</sub> β<sub>j</sub><i>x</i><sub>j</sub>`,
    cost: `minimise &nbsp; (1 / 2<i>n</i>) Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − ŷ<sub>i</sub> )² + λ [ α Σ<sub>j</sub> |β<sub>j</sub>| + ½ (1 − α) Σ<sub>j</sub> β<sub>j</sub>² ]
<br>one-coefficient update: &nbsp; β<sub>j</sub> ← S(ρ<sub>j</sub>, λα) / ( 1 + λ(1 − α) )`,
    plain: `<p>The penalty is a weighted sum of the lasso penalty and the ridge penalty. α decides the weights and λ scales the whole thing.</p>
<p>The update rule shows both effects in one line. The numerator is the lasso step: shrink by a fixed amount and snap to zero if small. The denominator is the ridge step: divide what remains by a number greater than one.</p>
<p>The ridge part is what creates the grouping effect. When two predictors are nearly identical, the L1 penalty is indifferent between giving all the weight to one of them or splitting it. The squared penalty is not indifferent: splitting is cheaper, since 0.5² + 0.5² is less than 1². So correlated predictors share the coefficient, and they come into the model together.</p>
<p>The constraint region is a diamond with slightly rounded edges and corners that are still sharp, so you keep exact zeros.</p>`
  },
  practical: [
    `<b>Tune both parameters.</b> ElasticNetCV accepts a list of l1_ratio values; try something like 0.1, 0.5, 0.7, 0.9, 0.95, 1.`,
    `<b>Naming is a trap.</b> scikit-learn calls the strength <i>alpha</i> and the mix <i>l1_ratio</i>. glmnet calls the strength <i>lambda</i> and the mix <i>alpha</i>. Check which library the number came from.`,
    `<b>Standardise the predictors</b> before fitting, as with ridge and lasso.`,
    `<b>If cross-validation picks a mix of 1, use lasso;</b> if it drifts to 0, use ridge. Elastic net includes both as special cases, so it is a safe default search.`,
    `<b>Cross-validated error is often flat</b> across a wide range of mixes. When it is, prefer the sparser model.`,
    `<b>Still a linear model.</b> No penalty will find a nonlinear effect or an interaction you did not put in the columns.`
  ],
  field: [
    `In practice elastic net is the <b>default penalised linear model</b> for wide data. People who "use lasso" in production are often running elastic net with a mix around 0.9, because a small ridge component makes the optimiser converge faster and the selected set less jumpy.`,
    `It is the standard tool in <b>marketing mix modelling and text regression</b> where columns are numerous and correlated by construction: TV and radio spend rise together, and the words "interest" and "rate" appear together.`,
    `The same penalty extends to other outcomes without new ideas: penalised logistic, Poisson and Cox models are all one argument away in glmnet or scikit-learn. Learn the penalty once and reuse it everywhere.`,
    `Report selection as groups. If the model keeps eight correlated web-traffic features, the honest summary is "web traffic matters", not eight separate findings.`,
    `When the tuning grid is large and data are big, fit the path once per mix with warm starts instead of refitting from scratch at every grid point. It is the difference between minutes and hours.`
  ],
  code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import ElasticNetCV

model = make_pipeline(
    StandardScaler(),
    ElasticNetCV(l1_ratio=[.1, .5, .7, .9, .95, 1],  # the mix
                 n_alphas=100, cv=5, max_iter=10000))
model.fit(X_train, y_train)
enet = model[-1]
print(enet.l1_ratio_, enet.alpha_, (enet.coef_ != 0).sum())`,
  quiz: [
    { q: `A genomics team has 20,000 genes and 300 patients. Genes act in correlated pathways. Lasso keeps one gene per pathway and picks a different one on every resample. The team wants a sparse model that keeps correlated genes together.`,
      a: `enet`, d: [`lasso`, `ridge`, `step`],
      why: `Sparse selection plus stable handling of correlated groups is the reason elastic net exists. Its L2 component makes correlated predictors share coefficients and enter together.` },
    { q: `An experiment report needs unbiased effect estimates with standard confidence intervals. There are 8 predictors with low correlation and 100,000 rows.`,
      a: `mlr`, d: [`enet`, `lasso`, `ridge`],
      why: `With few predictors, low correlation and abundant data there is nothing for a penalty to fix, and penalised coefficients are deliberately biased. Ordinary multiple regression gives unbiased estimates and valid intervals.` }
  ]
},
{
  id: `logit`, name: `Logistic Regression`, family: `Categorical outcomes`, target: `Binary (yes / no)`,
  tagline: `Models the probability of a yes/no outcome by making the log-odds a linear function of the predictors.`,
  use: `The outcome has two classes, you want calibrated probabilities, and you need to explain how each factor moves the odds.`,
  avoid: `The outcome is a time until something happens with incomplete follow-up, or the class boundary is highly nonlinear and you only care about accuracy.`,
  demo: `logit`,
  terms: [
    [`Odds`, `p / (1 − p). A probability of 0.8 is odds of 4 to 1. Odds run from 0 to infinity, which is easier to model than a probability stuck between 0 and 1.`],
    [`Logit (log-odds)`, `The natural log of the odds. It runs from minus to plus infinity, so it can be set equal to a linear combination of predictors.`],
    [`Sigmoid`, `The S-shaped function 1 / (1 + e<sup>−z</sup>) that converts a log-odds value z back to a probability between 0 and 1.`],
    [`Odds ratio`, `e<sup>β</sup>. The factor by which the odds are multiplied for a one-unit increase in the predictor. An odds ratio of 1.5 means 50% higher odds, not 50% higher probability.`],
    [`Maximum likelihood`, `Choosing the coefficients under which the observed outcomes would have been most probable.`],
    [`Log loss (cross-entropy)`, `The negative log-likelihood. It penalises confident wrong predictions very heavily.`],
    [`Decision threshold`, `The probability above which you act. 0.5 is a convention, not a rule; the right value depends on the costs of the two kinds of error.`],
    [`Calibration`, `Whether predicted probabilities match observed frequencies. Of the cases given 20%, about 20% should turn out positive.`]
  ],
  example: {
    title: `A credit scorecard`,
    body: `A lender must decide on personal-loan applications and justify declines to applicants and to its regulator. It models default within 12 months from debt-to-income ratio, payment history, account age and utilisation. The fitted model reads as a table: each additional missed payment in the past year multiplies the odds of default by 1.8. The coefficients are converted to points and summed into a score. Every decision can be traced to specific factors.`,
    why: `A binary outcome, a legal requirement for explanation, and a need for probabilities that can be turned into pricing and cut-offs.`
  },
  history: `<p>The logistic curve was introduced by the Belgian mathematician <b>Pierre-François Verhulst</b> between 1838 and 1847 to describe population growth that levels off. It was rediscovered in 1920 by Pearl and Reed for the same purpose.</p>
<p>Its use for binary outcomes came from bioassay. <b>Joseph Berkson</b> proposed it in 1944 as an alternative to Bliss's probit model and coined the word "logit". Probit advocates resisted for years. <b>David Cox's 1958 paper</b> put logistic regression on a firm footing, and the Framingham Heart Study's use of it in the 1960s to estimate cardiovascular risk made it the standard tool of epidemiology. <b>Nelder and Wedderburn (1972)</b> then showed that it is one member of the family of generalised linear models.</p>`,
  math: {
    eq: `P(<i>y</i> = 1 | <b>x</b>) = <i>p</i> = 1 / ( 1 + e<sup>−(β<sub>0</sub> + β<sub>1</sub><i>x</i><sub>1</sub> + … + β<sub>p</sub><i>x</i><sub>p</sub>)</sup> )
<br>equivalently: &nbsp; ln( <i>p</i> / (1 − <i>p</i>) ) = β<sub>0</sub> + β<sub>1</sub><i>x</i><sub>1</sub> + … + β<sub>p</sub><i>x</i><sub>p</sub>`,
    cost: `minimise log loss: &nbsp; − Σ<sub>i</sub> [ <i>y</i><sub>i</sub> ln <i>p</i><sub>i</sub> + (1 − <i>y</i><sub>i</sub>) ln(1 − <i>p</i><sub>i</sub>) ]
<br>gradient: &nbsp; <b>X</b><sup>T</sup>( <b>p</b> − <b>y</b> )`,
    plain: `<p>A straight line cannot model a probability directly, because lines run past 0 and 1. So the model is linear in the log-odds instead, and the sigmoid squeezes the result back into a probability.</p>
<p>The loss asks: how surprised is the model by what actually happened? If it gave a 99% chance to an event that occurred, the penalty is tiny. If it gave 1%, the penalty is large. Summing this surprise over all rows and making it as small as possible is maximum likelihood.</p>
<p>There is no formula for the answer, so it is found by iteration. The loss is convex, a single bowl, so any sensible method reaches the same minimum. The classic algorithm is Newton's method, which in this setting is called <b>iteratively reweighted least squares</b>: repeatedly solve a weighted linear regression in which uncertain observations (p near 0.5) get the most weight. It usually converges in under ten steps. The gradient has a simple form: predictions minus outcomes, weighted by the predictors.</p>`
  },
  practical: [
    `<b>Accuracy misleads on imbalanced data.</b> If 2% of cases are positive, always predicting "no" is 98% accurate. Use precision and recall, PR-AUC, or expected cost.`,
    `<b>Choose the threshold from costs.</b> If a missed fraud costs 50 times a false alarm, your cut-off should be far below 0.5.`,
    `<b>Perfect separation breaks the fit.</b> If some predictor splits the classes perfectly, its coefficient heads to infinity and the software warns about convergence. Add a penalty or use Firth's correction.`,
    `<b>Linearity is assumed on the log-odds scale.</b> Check continuous predictors with binned plots or spline terms.`,
    `<b>Odds ratios are not risk ratios.</b> They are close only when the outcome is rare. Translate to probabilities at realistic baseline values for non-technical readers.`,
    `<b>Roughly 10 to 20 events of the rarer class per coefficient</b> is the usual minimum for stable estimates.`
  ],
  field: [
    `In production you are usually asked for a <b>probability someone will act on</b>, not a class label. That makes calibration the property that matters. Plot predicted against observed rates in ten bins before anything ships. Logistic regression is typically well calibrated out of the box, which is one reason it survives against more accurate models.`,
    `<b>Resampling breaks calibration.</b> If you undersample the majority class or use SMOTE, the model's probabilities are inflated because it was trained on a world where positives are more common. Either correct the intercept afterwards or, better, keep the real data and move the threshold.`,
    `Logistic regression is the <b>baseline that boosted trees must beat</b>, and on small or noisy tabular data the margin is often embarrassingly small. If a complex model does not clearly win on a time-based hold-out, ship the simple one.`,
    `<b>Define the label with care.</b> "Churned" within 30 days or 90? Counted from which date? Using which information? Most bad classifiers are the result of a sloppy label definition or of features computed after the label date, not of the wrong algorithm.`,
    `Remember that scikit-learn's LogisticRegression is <b>L2-penalised by default</b>. If you need plain maximum likelihood estimates and standard errors for reporting, use statsmodels or set the penalty to none.`
  ],
  code: `import numpy as np
import statsmodels.formula.api as smf
from sklearn.calibration import calibration_curve

fit = smf.logit("default ~ dti + missed_payments + utilisation",
                data=train).fit()
print(np.exp(fit.params))             # odds ratios
print(np.exp(fit.conf_int()))         # and their intervals

p = fit.predict(test)                 # check calibration on new data
obs, pred = calibration_curve(test["default"], p, n_bins=10)`,
  quiz: [
    { q: `A bank wants to predict whether a loan defaults within a fixed 12-month window (yes or no). Every loan in the data has been observed for the full 12 months. The regulator requires each factor's effect on the odds to be explainable.`,
      a: `logit`, d: [`mlr`, `pois`, `svr`],
      why: `A two-class outcome with complete follow-up and a requirement for interpretable odds effects is the standard use of logistic regression.` },
    { q: `A hospital wants to understand how long it takes until a discharged patient is readmitted. When the study ends, many patients have not been readmitted, so their true time is unknown.`,
      a: `cox`, d: [`logit`, `mlr`, `pois`],
      why: `This is time-to-event data with censoring. Logistic regression would discard the timing and mishandle patients with short follow-up. Cox regression uses each patient's follow-up for as long as it lasted.` }
  ]
},
{
  id: `mnl`, name: `Multinomial Logistic Regression`, family: `Categorical outcomes`, target: `3+ unordered categories`,
  tagline: `Logistic regression extended to several unordered classes, with one set of coefficients per class.`,
  use: `The outcome is one of three or more categories with no natural order, and you want class probabilities and interpretable effects.`,
  avoid: `The categories have an order (use an ordinal model), or there are hundreds of classes with little data in each.`,
  demo: null,
  terms: [
    [`Softmax`, `The function that turns a score for each class into probabilities that are positive and sum to 1: exponentiate each score and divide by the total.`],
    [`Reference category`, `One class is chosen as the baseline, with its coefficients fixed at zero. All other coefficients are comparisons against it.`],
    [`Relative risk ratio`, `e<sup>β</sup>. How a one-unit change in a predictor multiplies the odds of being in a given class <i>rather than the reference class</i>.`],
    [`IIA`, `Independence of irrelevant alternatives. The model assumes the odds between any two options do not depend on what other options exist.`],
    [`One-vs-rest`, `An alternative approach: fit a separate binary model for each class against all the others. Simpler, but the probabilities need renormalising.`],
    [`Categorical cross-entropy`, `The loss: minus the log of the probability the model assigned to the class that actually occurred, summed over observations.`],
    [`Confusion matrix`, `A K × K table of actual against predicted class. Shows which classes are being mistaken for which.`]
  ],
  example: {
    title: `How do people get to work?`,
    body: `A city transport agency surveys 12,000 commuters who travel by car, bus, train or bicycle. It models the choice from income, distance, parking cost and age. With car as the reference, the model reports that each extra dollar of daily parking multiplies the odds of choosing the train over the car by 1.12. The agency uses the fitted probabilities to forecast how mode shares would shift under a new parking levy.`,
    why: `Four categories with no ordering, a need for the probability of each, and policy questions about how predictors shift those probabilities.`
  },
  history: `<p>The extension of the logit model to several categories was worked out in the 1960s by <b>David Cox (1966)</b> and <b>Henri Theil (1969)</b>, among others. Its best-known development came from economics. <b>Daniel McFadden</b> derived the model from a theory of individual choice, in which each person picks the option with the highest utility, and published his "conditional logit" in 1973.</p>
<p>He used it to forecast ridership for San Francisco's BART rail system before it opened, predicting a 6.3% share against an official forecast of 15%; the actual figure was 6.2%. McFadden shared the 2000 Nobel Prize in economics for this work. In machine learning the same model is known as softmax regression and forms the output layer of nearly every neural network classifier.</p>`,
  math: {
    eq: `P(<i>y</i> = <i>k</i> | <b>x</b>) = e<sup><b>x</b><sup>T</sup>β<sub>k</sub></sup> / Σ<sub>j=1..K</sub> e<sup><b>x</b><sup>T</sup>β<sub>j</sub></sup> &nbsp;&nbsp;&nbsp; with β<sub>ref</sub> = 0
<br>equivalently: &nbsp; ln( P(<i>y</i> = <i>k</i>) / P(<i>y</i> = ref) ) = <b>x</b><sup>T</sup>β<sub>k</sub>`,
    cost: `minimise &nbsp; − Σ<sub>i</sub> Σ<sub>k</sub> 1[<i>y</i><sub>i</sub> = <i>k</i>] · ln P(<i>y</i><sub>i</sub> = <i>k</i> | <b>x</b><sub>i</sub>)`,
    plain: `<p>Each class gets its own linear score. Softmax exponentiates the scores, so they are all positive, and divides by their sum, so they add to one. The class with the highest score gets the highest probability.</p>
<p>Only differences between scores matter. Adding the same constant to every class's score changes nothing, so one class is pinned at zero to make the solution unique. With K classes and p predictors you estimate (K − 1) × (p + 1) coefficients, which adds up fast.</p>
<p>The loss looks only at the probability given to the correct class and takes its log. The model is rewarded for putting probability on what actually happened. As with binary logistic regression the loss is convex and is minimised iteratively, usually with a quasi-Newton method such as L-BFGS.</p>
<p>Because every coefficient is "versus the reference", a positive coefficient for one class does not guarantee that class's probability rises: another class may be rising faster. Predicted probabilities tell the story more reliably than the coefficients.</p>`
  },
  practical: [
    `<b>Pick a meaningful reference category,</b> usually the most common or the status quo. Every coefficient is read against it.`,
    `<b>Parameters multiply with classes.</b> Rare classes with few observations give unstable coefficients. Merge them or add a penalty.`,
    `<b>IIA can fail badly</b> when two options are close substitutes. The classic example is the red bus and the blue bus: the model treats them as two distinct alternatives and takes share from the car to give to the second bus.`,
    `<b>Report effects as changes in predicted probability</b> at representative values. Tables of coefficients against a reference class confuse most audiences.`,
    `<b>Evaluate per class.</b> Overall accuracy can hide a class the model never predicts. Look at the confusion matrix and per-class recall.`,
    `<b>If the categories have an order, do not use this model.</b> It ignores the order and spends parameters relearning it.`
  ],
  field: [
    `Many real "multiclass" problems are something else in disguise. Support tickets with several possible tags are <b>multi-label</b>, not multiclass. A product hierarchy is <b>hierarchical</b>. A satisfaction scale is <b>ordinal</b>. Check the structure of the outcome before reaching for softmax.`,
    `An "Other" category that lumps unrelated things together is very hard to predict and drags down every metric. It is often better to model the named classes and route low-confidence predictions to a person.`,
    `Class shares drift. A triage model trained when 10% of tickets were billing-related will be miscalibrated when a pricing change pushes that to 30%. Monitor the predicted class distribution against the actual one every week.`,
    `With 50 or more classes, mistakes are not equally bad. Confusing two similar product categories is cheap; confusing a fraud report with a compliment is not. Agree a <b>cost matrix</b> with the business and evaluate against it, not against plain accuracy.`,
    `For pure prediction on tabular data, gradient boosting with a multiclass objective often wins. Multinomial logit stays in use where the coefficients are the product, as in choice modelling and pricing studies.`
  ],
  code: `import statsmodels.formula.api as smf

# Outcome coded 0..K-1; class 0 (car) is the reference
fit = smf.mnlogit("mode ~ income + distance_km + parking_cost",
                  data=df).fit()
print(fit.summary())

# Effects as changes in probability, not log-odds
print(fit.get_margeff().summary())`,
  quiz: [
    { q: `Commuters choose between car, bus, train and bicycle. A planner wants to know how income and distance change the probability of each choice.`,
      a: `mnl`, d: [`logit`, `ord`, `pois`],
      why: `Four categories with no natural ordering and a need for each category's probability. Multinomial logistic regression is built for exactly this.` },
    { q: `A survey asks customers to rate satisfaction as very dissatisfied, dissatisfied, neutral, satisfied or very satisfied. The analyst wants to model the rating from service attributes.`,
      a: `ord`, d: [`mnl`, `mlr`, `logit`],
      why: `The categories are ordered, but the distances between them are unknown. Ordinal regression uses the order without pretending the scale is numeric. A multinomial model would throw the order away.` }
  ]
},
{
  id: `ord`, name: `Ordinal Regression`, family: `Categorical outcomes`, target: `Ordered categories`,
  tagline: `For ranked categories: uses the order without assuming the steps between levels are equal.`,
  use: `The outcome is a rating, grade, stage or severity level, where order matters but "satisfied minus neutral" is not a real number.`,
  avoid: `The categories are not truly ordered, or predictors affect the low end of the scale differently from the high end.`,
  demo: null,
  terms: [
    [`Ordinal variable`, `Categories with a meaningful order but unknown spacing: bronze, silver, gold. You know gold beats silver; you do not know by how much.`],
    [`Cumulative probability`, `P(y ≤ k), the probability of being in category k or any category below it. The model works with these instead of individual category probabilities.`],
    [`Thresholds (cut-points)`, `Estimated boundaries θ<sub>1</sub> &lt; θ<sub>2</sub> &lt; … that slice an underlying continuous scale into the observed categories.`],
    [`Latent variable`, `An unobserved continuous quantity (true satisfaction, true severity) that the categories are assumed to be a coarse reading of.`],
    [`Proportional odds assumption`, `Each predictor has the same effect on the odds at every cut-point. One coefficient per predictor, however many categories there are.`],
    [`Cumulative odds ratio`, `e<sup>β</sup>. The factor by which the odds of being in a higher category (above any given cut-point) change per unit of the predictor.`],
    [`Brant test`, `A check on the proportional odds assumption that compares the coefficients from separate binary models at each cut-point.`]
  ],
  example: {
    title: `Predicting a credit rating`,
    body: `A fixed-income team wants to anticipate agency ratings (AAA, AA, A, BBB, BB, B) for unrated issuers using leverage, interest coverage, profitability and size. The grades are ordered, but the step from BBB to BB, which crosses from investment grade to junk, is far more consequential than the step from AA to A. An ordered logit estimates one coefficient per ratio plus five thresholds. Interest coverage has a cumulative odds ratio of 1.6: each additional turn of coverage raises the odds of a higher grade by 60%, at every boundary.`,
    why: `Ordered categories with unequal gaps. Linear regression on codes 1 to 6 would assume equal steps; a multinomial model would ignore the order and need five times the coefficients.`
  },
  history: `<p>Models for ordered categories grew out of bioassay, where responses such as "none, mild, severe" were common. <b>Walker and Duncan (1967)</b> described a cumulative logit model for ordered outcomes. The decisive paper was <b>Peter McCullagh's "Regression Models for Ordinal Data" (1980)</b>, which set out the proportional odds model and the proportional hazards alternative within the framework of generalised linear models.</p>
<p>In parallel, economists <b>McKelvey and Zavoina (1975)</b> developed the ordered probit model to study congressional voting. The two versions differ only in the assumed distribution of the latent variable and nearly always give the same conclusions.</p>`,
  math: {
    eq: `ln( P(<i>y</i> ≤ <i>k</i>) / P(<i>y</i> &gt; <i>k</i>) ) = θ<sub>k</sub> − <b>x</b><sup>T</sup>β &nbsp;&nbsp;&nbsp; for <i>k</i> = 1, …, K − 1
<br>P(<i>y</i> = <i>k</i>) = σ(θ<sub>k</sub> − <b>x</b><sup>T</sup>β) − σ(θ<sub>k−1</sub> − <b>x</b><sup>T</sup>β)`,
    cost: `minimise &nbsp; − Σ<sub>i</sub> ln P(<i>y</i><sub>i</sub> = observed category | <b>x</b><sub>i</sub>) &nbsp;&nbsp; subject to θ<sub>1</sub> &lt; θ<sub>2</sub> &lt; … &lt; θ<sub>K−1</sub>`,
    plain: `<p>Picture a hidden continuous scale, such as true satisfaction. People's positions on it depend on the predictors through one linear score. The survey question only records which of several bands they fall in. The model estimates both the score and the positions of the band boundaries.</p>
<p>Formally it is a stack of binary logistic regressions, one for each way of splitting the scale into "at or below k" versus "above k". The key simplification is that every one of these shares the <b>same slope coefficients</b>; only the intercepts (thresholds) differ. That is the proportional odds assumption, and it is why the model is so economical: one β per predictor, not K − 1.</p>
<p>The probability of a specific category is the difference between two neighbouring cumulative probabilities. Fitting maximises the likelihood of the observed categories, iteratively, with the thresholds kept in order. The spacing of the thresholds is learned from the data, which is how the model avoids assuming equal steps.</p>
<p>The minus sign in front of the score is a convention so that a positive β means "higher categories more likely". Some software uses the opposite sign; check before interpreting.</p>`
  },
  practical: [
    `<b>Test the proportional odds assumption.</b> Fit separate binary models at each cut-point and compare coefficients. If a predictor's effect clearly differs, use a partial proportional odds model.`,
    `<b>Do not run linear regression on the category codes</b> when there are few levels. It assumes equal spacing and predicts impossible values like 5.7 on a 5-point scale.`,
    `<b>Sparse end categories cause unstable thresholds.</b> If almost nobody answers "very dissatisfied", consider merging it with its neighbour.`,
    `<b>Check the sign convention</b> of your software before telling anyone which direction an effect goes.`,
    `<b>Present predicted probabilities for each category</b> at a few realistic profiles. They communicate far better than cumulative odds ratios.`,
    `<b>Evaluate with order-aware metrics</b> such as mean absolute error in categories or quadratic weighted kappa. Being off by one level is not as bad as being off by four.`
  ],
  field: [
    `Ordinal outcomes are everywhere in business and badly handled almost everywhere: survey scales, app-store stars, risk grades, ticket priority, disease stage, lead quality. The two common mistakes are averaging the codes as if they were measurements and collapsing to "top-two box" and throwing most of the information away.`,
    `With seven or more levels and reasonably symmetric data, plain linear regression often gives the same practical conclusions and is much easier to explain. Fit both. If they agree, present the simple one and keep the ordinal model as the check.`,
    `<b>Star ratings are not a neutral scale.</b> They pile up at 5 with a second bump at 1, because the people who bother to rate are delighted or angry. Who responds is as important as how they respond; a model of ratings is a model of raters.`,
    `In risk grading the business usually cares about <b>one boundary</b> more than the others, such as investment grade or "needs manual review". Proportional odds can mask a predictor that matters specifically there. Fit a separate binary model at that boundary as a cross-check.`,
    `Python support is thinner than R's. statsmodels has OrderedModel, and the mord package offers scikit-learn-style estimators. Many practitioners use R's MASS::polr or the ordinal package for this specific model.`
  ],
  code: `import numpy as np
from statsmodels.miscmodels.ordinal_model import OrderedModel

# rating must be an ordered categorical
df["rating"] = df["rating"].astype(grades_dtype)   # ordered=True

fit = OrderedModel(df["rating"],
                   df[["leverage", "coverage", "margin"]],
                   distr="logit").fit(method="bfgs")
print(fit.summary())                 # slopes + thresholds
print(np.exp(fit.params[:3]))        # cumulative odds ratios`,
  quiz: [
    { q: `A ratings agency assigns grades AAA, AA, A, BBB, BB and B. An analyst wants to predict the grade from financial ratios. The order clearly matters, but the gaps between grades are not equal.`,
      a: `ord`, d: [`mnl`, `mlr`, `pois`],
      why: `Ordered categories with unequal spacing. Ordinal regression uses the order and estimates the spacing through its thresholds, instead of assuming it (linear regression) or ignoring it (multinomial).` },
    { q: `A hospital's intake system must route each incoming case to one of four departments: cardiology, neurology, orthopaedics or dermatology.`,
      a: `mnl`, d: [`ord`, `mlr`, `logit`],
      why: `The departments have no meaningful order, so an ordinal model's assumption does not hold. With more than two unordered classes, multinomial logistic regression is the match.` }
  ]
}
);
