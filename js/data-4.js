/* Models 14-16: Cox, decision tree, random forest */
window.MODELS = window.MODELS || [];
window.MODELS.push(
{
  id: `cox`, name: `Cox Proportional Hazards Regression`, family: `Beyond the mean`, target: `Time until an event`,
  tagline: `Models how predictors change the rate at which an event happens over time, including cases where it has not happened yet.`,
  use: `The outcome is a duration (time to churn, failure, death, default, conversion) and some subjects have not had the event by the time you analyse the data.`,
  avoid: `The effect of a predictor clearly changes over time, or all you need is a yes/no prediction over one fixed, fully observed window.`,
  demo: null,
  terms: [
    [`Survival time`, `The time from a defined starting point until the event. "Survival" is the field's name; the event can be anything, including good things.`],
    [`Censoring`, `You know a subject lasted at least this long, but not when (or whether) the event happens. A customer who is still subscribed today is right-censored.`],
    [`Hazard function h(t)`, `The instantaneous rate of the event at time t among those who have not had it yet. Loosely: the risk right now, given survival so far.`],
    [`Survival function S(t)`, `The probability of not having had the event by time t.`],
    [`Hazard ratio`, `e<sup>β</sup>. The factor by which the hazard is multiplied per unit of a predictor. A hazard ratio of 0.7 means a 30% lower event rate at every moment.`],
    [`Baseline hazard h<sub>0</sub>(t)`, `The hazard over time for a subject with all predictors at zero. The Cox model leaves its shape completely unspecified.`],
    [`Risk set`, `Everyone still under observation and event-free just before a given event time.`],
    [`Proportional hazards assumption`, `Hazard ratios are constant over time. The curves for two groups may rise and fall, but one is always the same multiple of the other.`],
    [`Concordance index`, `The share of comparable pairs in which the subject with the higher predicted risk had the event first. 0.5 is random; 1 is perfect ordering.`]
  ],
  example: {
    title: `When do subscribers cancel?`,
    body: `A streaming service wants to understand churn. Of 80,000 customers who joined in the past two years, 60% are still subscribed, so their final lifetimes are unknown. Dropping them would leave only the people who quit, a badly biased sample. Calling them "not churned" in a logistic model would treat someone who joined last week the same as a two-year loyalist. A Cox model uses every customer for exactly as long as they were observed. It finds that annual billing has a hazard ratio of 0.45 and that customers who used the product on three or more days in their first week have a hazard ratio of 0.6.`,
    why: `A time-to-event outcome with heavy censoring, and a question about which factors speed up or slow down the event.`
  },
  history: `<p><b>Sir David Cox</b> published "Regression Models and Life-Tables" in 1972. Before it, analysing survival with covariates meant assuming a specific shape for the hazard over time, such as exponential or Weibull. Cox's insight was that you could estimate the effects of covariates without specifying that shape at all, by considering only the <i>order</i> in which events occurred. He formalised the argument as "partial likelihood" in 1975.</p>
<p>The paper became one of the most cited in all of science. Combined with the <b>Kaplan–Meier estimator (1958)</b>, it gave clinical trials their standard analysis, and the hazard ratio became the headline number in medical research. The same model is now used in engineering reliability, credit risk, customer analytics and labour economics.</p>`,
  math: {
    eq: `<i>h</i>(<i>t</i> | <b>x</b>) = <i>h</i><sub>0</sub>(<i>t</i>) · e<sup>β<sub>1</sub><i>x</i><sub>1</sub> + … + β<sub>p</sub><i>x</i><sub>p</sub></sup>
<br>hazard ratio between two subjects: &nbsp; e<sup>(<b>x</b><sub>a</sub> − <b>x</b><sub>b</sub>)<sup>T</sup>β</sup> &nbsp; (the baseline cancels, so it does not depend on <i>t</i>)`,
    cost: `maximise the partial likelihood: &nbsp; L(β) = Π<sub>i: event</sub> [ e<sup><b>x</b><sub>i</sub><sup>T</sup>β</sup> / Σ<sub>j ∈ R(<i>t</i><sub>i</sub>)</sub> e<sup><b>x</b><sub>j</sub><sup>T</sup>β</sup> ]
<br>where R(<i>t</i><sub>i</sub>) is the risk set: everyone still being followed just before time <i>t</i><sub>i</sub>`,
    plain: `<p>The model has two parts multiplied together. The baseline hazard describes how risk changes over time for everyone: perhaps high in the first month, then low. The exponential part scales that curve up or down for each individual according to their predictors.</p>
<p>The clever step is in the fitting. At each moment when an event happens, ask: of everyone who was still at risk at that moment, how likely was it to be this particular person? The answer is that person's risk score divided by the sum of the risk scores of everyone in the risk set. The baseline hazard appears in both the numerator and the denominator and cancels out. Multiply these fractions over all events and choose the β that makes the product largest.</p>
<p>This is why censoring is handled so naturally. A censored subject is never the numerator, since they did not have an event, but they are counted in the denominator of every risk set up to the time they left. They contribute the information "survived at least this long" and nothing more.</p>
<p>It also explains why the model is called semi-parametric: the covariate effects have a parametric form, while the time pattern is left free. The log partial likelihood is concave and is maximised by Newton's method.</p>`
  },
  practical: [
    `<b>Check proportional hazards.</b> Use Schoenfeld residual tests and plots. If a hazard ratio drifts over time, stratify on that variable or add a time interaction.`,
    `<b>Define time zero and the event precisely.</b> From sign-up or from first payment? Does a pause count as churn? Most errors in survival analysis are definitional.`,
    `<b>Censoring must be unrelated to risk.</b> If the sickest patients are the ones who drop out of the study, estimates are biased.`,
    `<b>Sample size is counted in events,</b> not rows. About 10 to 20 events per coefficient. A million customers with 80 churns support a very small model.`,
    `<b>Features that change over time need the time-varying format</b> (one row per subject per interval). Using the final value of a feature as if it were known at the start is leakage.`,
    `<b>The model ranks risk.</b> To get actual survival probabilities you must also estimate the baseline hazard, which software does with the Breslow estimator.`,
    `<b>Competing events</b> (a customer who moves abroad cannot cancel for price) need competing-risks methods, not simple censoring.`
  ],
  field: [
    `The most common mistake in churn work is to turn a duration into a yes/no label and fit a classifier. The moment you see <b>"some of them have not done it yet"</b>, you have a censoring problem. Recent sign-ups look loyal only because they have not had time to leave.`,
    `<b>Immortal time bias</b> catches experienced analysts. "Customers who redeemed a loyalty reward churn less" is partly an illusion: to redeem a reward you had to survive long enough to earn one. Any feature defined by something that happens during follow-up must enter as a time-varying covariate, starting from when it happened.`,
    `Start with <b>Kaplan–Meier curves by segment</b> before any regression. They show the shape of the problem, whether hazards look proportional, and they are the chart stakeholders understand: "after 12 months, 70% of annual-plan customers remain against 40% of monthly".`,
    `Translate hazard ratios before presenting them. "Hazard ratio 0.6" means little to a product manager. "Median lifetime rises from 7 months to 11" or "12-month retention goes from 48% to 63%" is the same result in terms people can use.`,
    `<b>Left truncation</b> appears whenever your data start part-way through. If the database only contains customers who were active on the day it was created, everyone who churned before that is missing, and long-lived customers are over-represented. Use delayed-entry methods (the entry argument in lifelines).`,
    `When hazards are clearly not proportional or relationships are nonlinear, the next tools are random survival forests and gradient boosting with a Cox objective, evaluated with the concordance index and calibration at fixed horizons.`
  ],
  code: `from lifelines import CoxPHFitter, KaplanMeierFitter

# duration = months observed; churned = 1 if event seen, 0 if censored
cph = CoxPHFitter()
cph.fit(df[["duration", "churned", "annual_plan",
            "active_days_wk1", "price_tier"]],
        duration_col="duration", event_col="churned")
cph.print_summary()                  # exp(coef) = hazard ratios
cph.check_assumptions(df, p_value_threshold=0.05)

surv = cph.predict_survival_function(df.head(3), times=[6, 12, 24])`,
  quiz: [
    { q: `A subscription business studies the time until customers cancel. Sixty percent of customers are still active, so their eventual lifetime is unknown. The team wants to know how plan type and onboarding activity change the cancellation rate, without assuming how that rate varies over time.`,
      a: `cox`, d: [`logit`, `mlr`, `pois`],
      why: `Time-to-event data with censoring, and a wish to leave the time pattern unspecified. Cox regression estimates hazard ratios from the ordering of events and uses censored customers correctly.` },
    { q: `A manufacturer records the number of machine failures per month at each factory. Mean and variance are close, and factories run different numbers of machine-hours.`,
      a: `pois`, d: [`cox`, `logit`, `mlr`],
      why: `The outcome is a count per period, equidispersed, with differing exposure. Poisson regression with log(machine-hours) as an offset models the failure rate.` }
  ]
},
{
  id: `tree`, name: `Decision Tree Regression`, family: `Trees and ensembles`, target: `Continuous`,
  tagline: `A flowchart of yes/no questions. Each leaf predicts the average outcome of the training rows that land in it.`,
  use: `You need rules a person can read and follow, or a quick look at which variables and thresholds split the data.`,
  avoid: `You need the best accuracy, smooth predictions, or a model that stays the same when the data change slightly.`,
  demo: `tree`,
  terms: [
    [`Node, split, leaf`, `A node asks a question such as "is distance below 12 km?". The split sends rows left or right. A leaf is an end point that holds a prediction.`],
    [`Recursive binary partitioning`, `Split the data in two, then split each part again, and so on. The result divides the predictor space into rectangles.`],
    [`Impurity (MSE)`, `For regression, the variance of the outcome within a node. A good split produces two children that are each more uniform than the parent.`],
    [`Greedy algorithm`, `Each split is the best available at that moment, with no look-ahead. Fast, but not guaranteed to find the best overall tree.`],
    [`Depth`, `The number of questions from root to the deepest leaf. The main control on complexity.`],
    [`Pruning`, `Growing a large tree and then cutting back branches that do not improve performance enough to justify their complexity.`],
    [`Cost-complexity parameter (ccp_alpha)`, `The price charged per leaf during pruning. Larger values give smaller trees.`],
    [`High variance`, `Small changes in the training data can produce a very different tree. The central weakness of single trees.`]
  ],
  example: {
    title: `A one-page rule for call handling`,
    body: `A contact-centre manager wants team leaders to estimate handling time for incoming issues so they can balance queues by hand. The rule has to fit on a laminated card. A regression tree of depth 3 on call reason, customer tenure and product gives eight leaves, for example: "billing dispute, tenure under 6 months: 14 minutes"; "password reset: 3 minutes". The first split, on call reason, accounts for most of the variation. A boosted model would be about 15% more accurate, and nobody on the floor could apply it.`,
    why: `The people using the model must be able to read it and carry it out themselves, and transparency is worth more than the lost accuracy.`
  },
  history: `<p>The first regression tree program was <b>AID (Automatic Interaction Detection)</b>, written by <b>James Morgan and John Sonquist</b> at the University of Michigan in 1963 to find interactions in survey data without specifying them in advance. It was criticised for overfitting, since it had no principled way to decide when to stop.</p>
<p>The modern method comes from <b>Leo Breiman, Jerome Friedman, Richard Olshen and Charles Stone</b>, whose 1984 book <i>Classification and Regression Trees</i> (CART) introduced cost-complexity pruning with cross-validation and surrogate splits for missing values. In parallel, <b>Ross Quinlan</b> developed ID3 (1986) and C4.5 (1993) in the machine learning community, using information gain as the splitting criterion.</p>`,
  math: {
    eq: `<i>f</i>(<b>x</b>) = Σ<sub>m=1..M</sub> <i>c</i><sub>m</sub> · 1[ <b>x</b> ∈ R<sub>m</sub> ] &nbsp;&nbsp;&nbsp; where &nbsp; <i>c</i><sub>m</sub> = mean of <i>y</i><sub>i</sub> for training points in region R<sub>m</sub>`,
    cost: `at each node choose feature <i>j</i> and threshold <i>s</i> to minimise
<br>Σ<sub><i>x</i><sub>i</sub> ∈ left</sub> ( <i>y</i><sub>i</sub> − ȳ<sub>left</sub> )² + Σ<sub><i>x</i><sub>i</sub> ∈ right</sub> ( <i>y</i><sub>i</sub> − ȳ<sub>right</sub> )²
<br>then prune to minimise &nbsp; SSE(T) + α · |leaves of T|`,
    plain: `<p>The model is a set of boxes. Every observation falls into exactly one box, and the prediction for a box is the average outcome of the training rows inside it. The prediction surface is a staircase, flat within each box and jumping at the edges.</p>
<p>Building it is a search for cuts. At a node, the algorithm tries every feature and every possible threshold, and for each one measures how much squared error remains if both sides are predicted by their own average. It keeps the best cut, then repeats inside each side.</p>
<p>Finding the best possible tree overall is computationally intractable, so the greedy shortcut is universal. Left alone, the process continues until every leaf holds one observation, which is a perfect memorisation of the training data. You prevent that by limiting depth, requiring a minimum number of rows per leaf, or pruning: grow a large tree, then remove branches whose improvement in fit is smaller than a penalty α per leaf, with α chosen by cross-validation.</p>
<p>Because splits depend only on the ordering of values, trees are unaffected by scaling or any monotone transformation of a feature, and outliers in the predictors have little influence.</p>`
  },
  practical: [
    `<b>Control depth or leaf size.</b> An unconstrained tree memorises the training data. Tune max_depth, min_samples_leaf or ccp_alpha by cross-validation.`,
    `<b>No scaling needed,</b> and no need to transform skewed predictors.`,
    `<b>Trees cannot extrapolate.</b> Beyond the largest value seen in training, the prediction is flat at the last leaf's average.`,
    `<b>Predictions are step functions.</b> A smooth linear trend takes many splits to approximate and the result still has jumps.`,
    `<b>Interactions come for free.</b> A split on B inside the branch where A is high is an interaction, found without your specifying it.`,
    `<b>Categorical variables with many levels are favoured</b> by the split search because they offer more candidate splits. Be suspicious when an ID-like column appears near the root.`,
    `<b>Unstable.</b> Refit on a slightly different sample and the top split may change, altering the entire tree.`
  ],
  field: [
    `In practice single trees are used for <b>explanation, not prediction</b>. The useful workflow is to fit a shallow tree during exploration to see which variables and thresholds matter, then build the real model with an ensemble. A depth-3 tree often tells you in a minute what would take an hour of plotting.`,
    `A shallow tree is a very good <b>leakage detector</b>. If the first split yields nearly pure leaves on one feature, that feature probably contains the answer: a status code set after the outcome, an ID that encodes time, a field filled in only for one class.`,
    `Stakeholders love tree diagrams and tend to read them as stable truths. Before presenting "the three segments", refit on a few bootstrap samples. If the structure changes each time, say so, or present the consistent parts only.`,
    `Trees are the standard way to build a <b>surrogate explanation</b> for a complex model: train a shallow tree to predict the black-box model's outputs, and use it to describe roughly what the model is doing. Report how well the surrogate matches, since a poor match makes the explanation fiction.`,
    `Operational rules, clinical triage protocols and eligibility criteria often are decision trees, hand-written. A tree learned from data, checked by a domain expert, is a strong way to draft or revise them.`
  ],
  code: `from sklearn.tree import DecisionTreeRegressor, export_text
from sklearn.model_selection import GridSearchCV

search = GridSearchCV(
    DecisionTreeRegressor(random_state=0),
    {"max_depth": [2, 3, 4, 6, 8],
     "min_samples_leaf": [20, 50, 100]},
    cv=5, scoring="neg_root_mean_squared_error").fit(X_train, y_train)

tree = search.best_estimator_
print(export_text(tree, feature_names=list(X_train.columns)))`,
  quiz: [
    { q: `A call-centre manager needs a rule set that fits on one page and that team leaders apply by hand, such as "if tenure is under 6 months and the plan is basic, expect 9 minutes". Transparency matters more than accuracy.`,
      a: `tree`, d: [`rf`, `gbm`, `svr`],
      why: `Only a single decision tree gives a short list of if-then rules a person can follow. The ensembles and SVR are more accurate and cannot be written on a card.` },
    { q: `The same team later finds that the single tree's structure and predictions change a lot each time it is retrained on a new month. They no longer need a one-page rule. They want stable, accurate predictions with very little tuning.`,
      a: `rf`, d: [`tree`, `slr`, `ord`],
      why: `Averaging many trees grown on bootstrap samples removes most of the single tree's instability. Random forests work well at default settings.` }
  ]
},
{
  id: `rf`, name: `Random Forest Regression`, family: `Trees and ensembles`, target: `Continuous`,
  tagline: `Hundreds of deep trees, each grown on a random resample with random feature subsets, averaged together.`,
  use: `You have tabular data with nonlinearities and interactions and want a strong, robust model that works with almost no tuning.`,
  avoid: `You must extrapolate beyond the training range, need a compact fast model, or need the last few percent of accuracy that boosting provides.`,
  demo: `rf`,
  terms: [
    [`Ensemble`, `A model made by combining many models. The combination is usually more accurate and more stable than any member.`],
    [`Bootstrap sample`, `A sample of n rows drawn with replacement from the n training rows. About 63% of the distinct rows appear; the rest are left out.`],
    [`Bagging`, `Bootstrap aggregating: fit the same kind of model on many bootstrap samples and average the predictions. Reduces variance.`],
    [`Random feature subset (max_features)`, `At each split only a random subset of features is considered. This makes the trees differ from each other, which is what makes averaging effective.`],
    [`Out-of-bag (OOB) error`, `Each tree is tested on the rows left out of its bootstrap sample. Aggregated, this gives an honest error estimate without a separate validation set.`],
    [`Decorrelation`, `Making the trees' errors less alike. Averaging helps only to the extent that the things being averaged disagree.`],
    [`Permutation importance`, `Shuffle one feature's values and measure how much the model's error rises. A more reliable measure than the built-in impurity importance.`],
    [`Partial dependence`, `A plot of the model's average prediction as one feature is varied, showing the shape of that feature's effect.`]
  ],
  example: {
    title: `Valuing homes for a lender`,
    body: `A mortgage lender wants automated valuations for refinancing decisions. The data have 60 features: size, age, condition scores, location, school ratings, recent nearby sales. Effects are nonlinear and interact: an extra bathroom is worth more in a large house, and age matters differently in historic districts. A linear model needs weeks of manual feature work to capture this. A random forest with default settings, fitted in a few minutes, reduces median error by a third. Out-of-bag error gives a trustworthy performance estimate immediately, and permutation importance confirms that the model relies on sensible features.`,
    why: `Mixed tabular features with unknown nonlinearities and interactions, limited time for tuning, and a need for a dependable result.`
  },
  history: `<p>The pieces came together through the 1990s. <b>Tin Kam Ho</b> at Bell Labs proposed "random decision forests" in 1995, building trees on random subsets of features. <b>Leo Breiman</b> introduced bagging in 1996, and Amit and Geman explored randomised split selection in 1997.</p>
<p>Breiman combined bootstrap sampling with random feature selection at each split in his <b>2001 paper "Random Forests"</b>, added out-of-bag error estimation and variable importance, and with Adele Cutler trademarked the name. Breiman had come to statistics after years as a consultant, and argued in "Statistical Modeling: The Two Cultures" (2001) that the field should take algorithmic prediction as seriously as it took parametric models. Random forests were his main evidence.</p>`,
  math: {
    eq: `<i>f̂</i>(<b>x</b>) = (1 / B) Σ<sub>b=1..B</sub> T<sub>b</sub>(<b>x</b>) &nbsp;&nbsp;&nbsp; each T<sub>b</sub> a deep tree grown on bootstrap sample <i>b</i>, considering <i>m</i> random features per split`,
    cost: `each tree: the usual greedy squared-error splits (no global loss is optimised jointly)
<br>variance of the average: &nbsp; ρσ² + (1 − ρ)σ² / B &nbsp;&nbsp; (σ² = variance of one tree, ρ = correlation between trees)`,
    plain: `<p>A single deep tree has low bias, since it can fit almost any pattern, and high variance, since it changes a great deal from sample to sample. Averaging attacks the variance. If you could average many independent trees, the noise would cancel and the signal would remain.</p>
<p>You cannot get independent trees from one dataset, but you can get different ones. Each tree sees a different bootstrap resample. More importantly, at each split it may only choose among a random handful of features. Without that restriction, every tree would begin with the same strong predictor and they would all look alike.</p>
<p>The variance formula shows what matters. The second term shrinks toward zero as you add trees. The first term, ρσ², does not. It depends on how correlated the trees are. Random feature selection lowers ρ, at a small cost in each tree's individual accuracy, and the trade is nearly always worth it.</p>
<p>There is no loss function minimised across the whole forest and no training iterations that can go too far. More trees never overfit. They only cost time, with improvement flattening out after a few hundred.</p>`
  },
  practical: [
    `<b>Defaults are good.</b> The settings that matter most are max_features (try about a third of the features for regression, or the square root) and min_samples_leaf (raise it for noisy data).`,
    `<b>More trees never hurt accuracy.</b> Use 300 to 1,000 and stop when OOB error flattens.`,
    `<b>Use OOB error</b> as a free validation estimate, unless your data have time or group structure, in which case it is optimistic.`,
    `<b>Cannot extrapolate.</b> Predictions are averages of training outcomes, so they never go beyond the range seen in training.`,
    `<b>Built-in impurity importance is biased</b> toward continuous and high-cardinality features. Use permutation importance on held-out data.`,
    `<b>Correlated features share importance.</b> Two near-duplicates each look half as important as either would alone.`,
    `<b>Models are large and prediction is slower</b> than for boosted trees, because the trees are deep and numerous.`
  ],
  field: [
    `The random forest is the practitioner's <b>first serious model</b> on a new tabular dataset. It needs no scaling, tolerates junk features and outliers, and rarely gives a silly answer. In an afternoon it tells you roughly how predictable the target is, which sets expectations for everything that follows.`,
    `Because it cannot extrapolate, a forest <b>fails quietly on trending data</b>. Train on house prices up to last year and it will never predict a price above the highest it has seen. For anything with growth, inflation or drift, model a ratio or a change instead of the raw level, or combine a linear trend with a forest on the residuals.`,
    `Random row splits are the usual source of over-optimistic results. If the same customer, patient or store appears in both training and test data, the forest partly memorises them. <b>Split by group, and by time if you are forecasting</b>, so that validation mirrors how the model will be used.`,
    `Permutation importance tells you what the model uses, not what causes the outcome. And when features are correlated, shuffling one creates impossible combinations the model never saw. For communicating drivers, use SHAP values or grouped permutation, and describe them as associations.`,
    `Quantile regression forests give prediction intervals nearly for free by keeping the full distribution of outcomes in each leaf instead of only the mean. Useful when the business needs a range.`
  ],
  code: `from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import permutation_importance

rf = RandomForestRegressor(n_estimators=500, max_features=0.33,
                           min_samples_leaf=5, oob_score=True,
                           n_jobs=-1, random_state=0).fit(X_train, y_train)
print("OOB R2:", rf.oob_score_)

imp = permutation_importance(rf, X_valid, y_valid,
                             n_repeats=10, random_state=0)
top = imp.importances_mean.argsort()[::-1][:10]`,
  quiz: [
    { q: `A team must predict house prices from 60 mixed features with nonlinear effects and interactions, using 20,000 rows. They have one afternoon, want a strong and robust baseline with almost no tuning, and would like an error estimate without setting aside a validation set.`,
      a: `rf`, d: [`mlr`, `knn`, `svr`],
      why: `Random forests handle nonlinearity and interactions automatically, work well at default settings and provide out-of-bag error as a built-in validation estimate.` },
    { q: `A team has 5 million rows of tabular data with missing values and a mature tuning pipeline. They are willing to tune extensively to get the best possible accuracy.`,
      a: `gbm`, d: [`rf`, `tree`, `knn`],
      why: `When you can afford careful tuning, gradient boosted trees usually beat random forests on tabular data. Modern libraries handle missing values natively and scale to millions of rows.` }
  ]
}
);
