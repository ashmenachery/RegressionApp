/* Models 17-20: gradient boosting, SVR, KNN, Bayesian linear */
window.MODELS = window.MODELS || [];
window.MODELS.push(
{
  id: `gbm`, name: `Gradient Boosted Regression (XGBoost, LightGBM)`, family: `Trees and ensembles`, target: `Continuous (and more)`,
  tagline: `Small trees added one after another, each correcting the errors left by those before it.`,
  use: `You want the best accuracy on structured, tabular data and can spend time on validation and tuning.`,
  avoid: `Data are very small or very noisy, the model must extrapolate a trend, or stakeholders need to read the model directly.`,
  demo: `gbm`,
  terms: [
    [`Boosting`, `Building a model in sequence, where each new piece concentrates on what the current model gets wrong. Reduces bias, unlike bagging, which reduces variance.`],
    [`Weak learner`, `A simple model that is only slightly better than guessing, typically a shallow tree with 4 to 64 leaves.`],
    [`Pseudo-residual`, `The negative gradient of the loss with respect to the current prediction. For squared error it is simply the ordinary residual.`],
    [`Learning rate (shrinkage, η)`, `The fraction of each new tree's prediction that is actually added. Smaller values need more trees and usually generalise better.`],
    [`Number of trees (boosting rounds)`, `Unlike a random forest, more is not always better. Too many rounds overfit.`],
    [`Early stopping`, `Monitoring error on a validation set and stopping when it has not improved for a set number of rounds.`],
    [`Subsampling`, `Using a random fraction of rows and of columns for each tree. Adds randomness that reduces overfitting and speeds up training.`],
    [`Histogram-based splitting`, `Bucketing each feature into a few hundred bins before searching for splits. The main reason modern libraries are fast.`],
    [`SHAP values`, `A method that attributes each individual prediction to the features that produced it. The standard tool for explaining boosted models.`]
  ],
  example: {
    title: `Estimating arrival times at scale`,
    body: `A ride-hailing platform must predict trip duration for millions of requests a day. Features include straight-line and routed distance, time of day, day of week, weather, live traffic indices, pickup and drop-off zones and recent trip times on the same corridor. Effects are nonlinear and heavily interactive: rain matters much more at rush hour in the city centre. LightGBM trained on 200 million trips, with early stopping on the most recent week, reduces mean absolute error by 18% compared with the previous linear model. Trained with a quantile objective, the same framework also produces the upper bound shown to riders.`,
    why: `Large tabular data, complex interactions, accuracy that translates directly into money, and a team equipped to tune and monitor the model.`
  },
  history: `<p>Boosting began as a theoretical question posed by Kearns and Valiant: can many weak learners be combined into a strong one? <b>Robert Schapire</b> proved in 1990 that they can, and with <b>Yoav Freund</b> developed <b>AdaBoost (1995–97)</b>, the first practical algorithm.</p>
<p><b>Jerome Friedman</b>, together with Hastie and Tibshirani, showed that AdaBoost was performing a kind of stagewise additive modelling, and in his 2001 paper "Greedy Function Approximation: A Gradient Boosting Machine" generalised it to any differentiable loss by fitting each tree to the gradient.</p>
<p>The method took over applied machine learning when <b>Tianqi Chen</b> released <b>XGBoost</b> in 2014 (paper with Carlos Guestrin, 2016). It added regularisation, second-order gradients and efficient engineering, and it dominated Kaggle competitions for years. Microsoft's <b>LightGBM</b> (2017) introduced histogram-based leaf-wise growth, and Yandex's <b>CatBoost</b> (2017) added principled handling of categorical features.</p>`,
  math: {
    eq: `F<sub>0</sub>(<b>x</b>) = ȳ &nbsp;&nbsp;&nbsp; F<sub>m</sub>(<b>x</b>) = F<sub>m−1</sub>(<b>x</b>) + η · <i>h</i><sub>m</sub>(<b>x</b>) &nbsp;&nbsp;&nbsp; final model: &nbsp; F<sub>M</sub>(<b>x</b>) = ȳ + η Σ<sub>m=1..M</sub> <i>h</i><sub>m</sub>(<b>x</b>)`,
    cost: `minimise &nbsp; Σ<sub>i</sub> L( <i>y</i><sub>i</sub>, F(<b>x</b><sub>i</sub>) ) + Σ<sub>m</sub> Ω(<i>h</i><sub>m</sub>) &nbsp;&nbsp; with &nbsp; Ω(<i>h</i>) = γ·(leaves) + ½ λ Σ (leaf weights)²
<br>at step <i>m</i>, fit tree <i>h</i><sub>m</sub> to pseudo-residuals &nbsp; <i>r</i><sub>i</sub> = − ∂L / ∂F(<b>x</b><sub>i</sub>) &nbsp; (= <i>y</i><sub>i</sub> − F<sub>m−1</sub>(<b>x</b><sub>i</sub>) for squared error)`,
    plain: `<p>Start with the simplest prediction, the average. Look at the errors. Fit a small tree to those errors, so the tree learns where the current model is too high and too low. Add a fraction of that tree's output to the model. Recompute the errors and repeat, hundreds or thousands of times.</p>
<p>The name comes from seeing this as gradient descent. Ordinary gradient descent adjusts parameters by stepping against the gradient of the loss. Boosting adjusts the <i>predictions themselves</i>: the residuals are the direction in which each prediction should move to lower the loss, and each tree is a step in that direction. With a different loss function, say absolute error, Poisson or quantile, only the definition of the pseudo-residual changes.</p>
<p>The learning rate is the step size. Taking only 5% of each tree's suggestion means no single tree dominates, and later trees can correct earlier ones. This makes the model better and slower, and creates the central trade-off between learning rate and number of trees.</p>
<p>XGBoost adds two refinements. It uses second derivatives as well as first, which gives better leaf values, and it puts explicit penalties on the number of leaves and the size of leaf values into the objective, so each tree is regularised as it is built.</p>`
  },
  practical: [
    `<b>Always use early stopping</b> with a validation set that resembles how the model will be used. Set a low learning rate (0.03 to 0.1) and let early stopping choose the number of trees.`,
    `<b>The parameters that matter most:</b> learning rate, tree size (num_leaves or max_depth), minimum samples per leaf, row and column subsampling. Tune those before anything else.`,
    `<b>Overfits more readily than a random forest,</b> especially on small or noisy data.`,
    `<b>No scaling needed; missing values are handled natively</b> by learning a default direction at each split.`,
    `<b>Cannot extrapolate,</b> like all tree models. Predictions are bounded by what was seen in training.`,
    `<b>Choose the objective to match the problem:</b> squared error, absolute or Huber for outliers, Poisson or Tweedie for counts and claims, quantile for intervals.`,
    `<b>Monotonic constraints</b> can force a feature's effect to only increase or only decrease, which often makes the model both more sensible and more acceptable to the business.`
  ],
  field: [
    `For structured business data, boosted trees are <b>the model to beat</b>. On most tabular problems they match or exceed deep learning with far less effort. If a project is about predicting a number or a probability from rows and columns, expect the final production model to be LightGBM, XGBoost or CatBoost.`,
    `<b>The model is rarely the bottleneck.</b> Going from default to tuned hyperparameters typically gains a few percent. A well-constructed feature, such as a customer's trailing 30-day average or a ratio the business already uses, can gain far more. So can fixing the label or the validation split. Spend your time accordingly.`,
    `<b>Your validation scheme is the project.</b> If you forecast the future, validate on a later period than you trained on. If you predict for new customers, hold out whole customers. Random splits on data with time or group structure produce numbers that collapse in production. Most "the model was great offline" stories end here.`,
    `<b>Target leakage is easy to create and boosting will find it.</b> Aggregates computed over a window that includes the outcome date, features back-filled after the event, target encodings computed on the full dataset: each yields spectacular validation scores. When results look too good, check the top features by importance first.`,
    `Shipping is the beginning. Feature distributions drift, upstream pipelines change silently, and a model trained on last year degrades. Monitor input distributions and prediction distributions, compare predictions with actuals as they arrive, and agree a retraining schedule before launch.`,
    `SHAP values make boosted models explainable enough for most stakeholders, but they describe the model, not the world. "The model's prediction rises with X" is not "raising X will raise the outcome".`
  ],
  code: `import lightgbm as lgb

# Validate on the most recent period, not a random split
model = lgb.LGBMRegressor(
    n_estimators=5000, learning_rate=0.05, num_leaves=63,
    min_child_samples=50, subsample=0.8, subsample_freq=1,
    colsample_bytree=0.8)
model.fit(X_train, y_train,
          eval_set=[(X_valid, y_valid)], eval_metric="l1",
          callbacks=[lgb.early_stopping(100), lgb.log_evaluation(200)])
print(model.best_iteration_)`,
  quiz: [
    { q: `A ride-hailing platform predicts trip duration from 200 features on hundreds of millions of rows. The relationships are nonlinear and interactive, the team has a tuning and monitoring pipeline, and accuracy is the priority.`,
      a: `gbm`, d: [`mlr`, `knn`, `svr`],
      why: `Large tabular data with complex interactions and a team able to tune: gradient boosted trees are the standard choice and usually the most accurate.` },
    { q: `Revenue grows in a straight line with the number of stores a chain operates. The largest value in the training data is 300 stores, and management needs a forecast for 500.`,
      a: `slr`, d: [`gbm`, `rf`, `tree`],
      why: `The forecast lies outside the training range. Every tree-based model predicts a flat value beyond its last split, so all three would return roughly the revenue at 300 stores. A linear model continues the trend.` }
  ]
},
{
  id: `svr`, name: `Support Vector Regression (SVR)`, family: `Kernels, neighbours and Bayes`, target: `Continuous`,
  tagline: `Fits a tube around the data. Errors inside the tube cost nothing; only points on or outside it shape the model.`,
  use: `A small or medium dataset, a smooth nonlinear relationship, and a tolerance within which errors do not matter.`,
  avoid: `Hundreds of thousands of rows or more, many irrelevant features, or a need to explain the model's reasoning.`,
  demo: `svr`,
  terms: [
    [`ε-insensitive loss`, `Errors smaller than ε cost zero. Larger errors cost in proportion to how far they exceed ε.`],
    [`ε-tube`, `The band of width ε on either side of the fitted function. The model tries to keep it as flat as possible while containing most points.`],
    [`Support vectors`, `The training points on or outside the tube. They alone determine the fitted function; points strictly inside could be deleted without changing it.`],
    [`C`, `The penalty on points outside the tube. Large C fits the training data closely; small C prefers a flatter, simpler function.`],
    [`Kernel`, `A function measuring similarity between two points. It lets a linear method fit nonlinear shapes by working implicitly in a higher-dimensional space.`],
    [`Kernel trick`, `The algorithm only ever needs similarities between pairs of points, so the higher-dimensional coordinates never have to be computed.`],
    [`RBF kernel and γ`, `The most common kernel, e<sup>−γ‖x − x′‖²</sup>. γ sets how quickly similarity falls off with distance: large γ gives wiggly fits, small γ smooth ones.`],
    [`Slack variables (ξ)`, `Measures of how far each point lies outside the tube.`]
  ],
  example: {
    title: `A soft sensor in a chemical plant`,
    body: `A refinery measures product purity with a laboratory test that takes four hours. Engineers want a continuous estimate from 30 temperature, pressure and flow sensors, so they can adjust the process in real time. There are 2,000 historical samples with lab results. The relationship is smooth and nonlinear, and the lab test itself is only accurate to ±0.3%, so differences smaller than that are meaningless. An RBF-kernel SVR with ε set to the lab's measurement error ignores noise inside that tolerance and achieves the accuracy needed.`,
    why: `Modest sample size, smooth nonlinear physics, scaled numeric inputs, and a natural tolerance that maps onto ε.`
  },
  history: `<p>Support vector machines came out of <b>Vladimir Vapnik</b>'s statistical learning theory, developed with Alexey Chervonenkis in the Soviet Union from the 1960s. After Vapnik moved to AT&amp;T Bell Labs, <b>Boser, Guyon and Vapnik (1992)</b> combined the maximum-margin classifier with the kernel trick, and <b>Cortes and Vapnik (1995)</b> introduced the soft margin that made it work on real, non-separable data.</p>
<p>The regression version followed immediately. Vapnik described it in 1995, and <b>Drucker, Burges, Kaufman, Smola and Vapnik</b> published "Support Vector Regression Machines" in 1996. <b>Smola and Schölkopf</b>'s tutorial became the standard reference, and the LIBSVM library (Chang and Lin, 2001) put it in everyone's hands. Kernel methods led machine learning research until deep learning and boosted trees displaced them in the 2010s.</p>`,
  math: {
    eq: `<i>f</i>(<b>x</b>) = <b>w</b><sup>T</sup>φ(<b>x</b>) + <i>b</i> = Σ<sub>i</sub> (α<sub>i</sub> − α<sub>i</sub>*) K(<b>x</b><sub>i</sub>, <b>x</b>) + <i>b</i> &nbsp;&nbsp;&nbsp; e.g. K(<b>x</b>, <b>x</b>′) = e<sup>−γ‖<b>x</b> − <b>x</b>′‖²</sup>`,
    cost: `minimise &nbsp; ½ ‖<b>w</b>‖² + C Σ<sub>i</sub> max( 0, |<i>y</i><sub>i</sub> − <i>f</i>(<b>x</b><sub>i</sub>)| − ε )`,
    plain: `<p>Least squares cares about every error, however small. SVR declares a tolerance: any prediction within ε of the truth is good enough and costs nothing. Outside that band, the cost grows linearly, not quadratically, so outliers have less pull than in least squares.</p>
<p>The objective has two parts. The first, ½‖w‖², asks for the flattest function possible, which is the regulariser. The second counts how far points fall outside the tube. C sets the balance between them.</p>
<p>The consequence is sparsity in the data. Points inside the tube have no effect on the solution. The function is built entirely from the points on the edge or outside, the support vectors. The prediction for a new point is a weighted sum of its similarities to those support vectors.</p>
<p>The kernel makes this nonlinear. A straight tube in the transformed space becomes a curved tube in the original one. The problem is a convex quadratic programme with a single global optimum, usually solved in its dual form by the SMO algorithm. Training cost grows roughly with the square to the cube of the number of rows, which is the method's practical limit.</p>`
  },
  practical: [
    `<b>Scale the features. Always.</b> Kernels are based on distance, so an unscaled feature with large values dominates everything.`,
    `<b>Scale or standardise the target too,</b> or set ε in the target's units. The default ε = 0.1 is meaningless if y is in thousands.`,
    `<b>Three hyperparameters to tune together:</b> C, ε and γ. Use a grid or random search on a log scale.`,
    `<b>Training time is the constraint.</b> Kernel SVR becomes impractical beyond tens of thousands of rows. LinearSVR or kernel approximations scale further.`,
    `<b>No native probability or interval output,</b> and no built-in handling of missing values or categories.`,
    `<b>Hard to interpret.</b> There are no coefficients with an RBF kernel, only support vectors and weights.`,
    `<b>Irrelevant features hurt,</b> because every feature contributes to the distance. Select or weight features first.`
  ],
  field: [
    `In current industry practice SVR is a <b>specialist tool</b>. On large tabular business data, boosted trees are faster, need less preprocessing and usually win. You will find SVR where datasets are small and signals smooth: chemometrics, spectroscopy, materials science, engineering soft sensors, some financial and energy forecasting.`,
    `When SVR underperforms, the cause is nearly always <b>unscaled inputs or untuned hyperparameters</b>. An SVR with default settings on raw features is not a fair baseline. If a colleague dismisses it on that basis, check the pipeline.`,
    `ε is a rare hyperparameter with a <b>physical meaning</b>. If your measurement instrument is accurate to ±0.5, set ε near 0.5. Telling a domain expert "the model ignores differences smaller than your measurement error" is an explanation they accept.`,
    `Put the scaler inside the cross-validation pipeline. With distance-based models, scaling on the full dataset before splitting leaks more than people expect.`,
    `The lasting contribution of this family is conceptual: maximum margin, the kernel trick and the idea that a model can be defined by a few critical data points. These ideas recur in Gaussian processes and in the theory of neural networks, so the method is worth understanding even if you rarely deploy it.`
  ],
  code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.model_selection import GridSearchCV

pipe = make_pipeline(StandardScaler(), SVR(kernel="rbf"))
grid = {"svr__C": [1, 10, 100, 1000],
        "svr__gamma": ["scale", 0.01, 0.1, 1],
        "svr__epsilon": [0.05, 0.1, 0.3, 1.0]}     # in units of y
search = GridSearchCV(pipe, grid, cv=5,
                      scoring="neg_mean_absolute_error").fit(X, y)
print(search.best_params_, len(search.best_estimator_[-1].support_))`,
  quiz: [
    { q: `An engineering team has 2,000 samples and 30 scaled sensor readings with a smooth nonlinear relationship to the target. Errors within ±0.5 do not matter and should not influence the fit. They would like the model to be determined by the subset of points at the edge of that tolerance.`,
      a: `svr`, d: [`slr`, `pois`, `ord`],
      why: `A tolerance band within which errors are ignored, and a model defined by the boundary points, is precisely the ε-insensitive loss and the support vectors of SVR.` },
    { q: `A dataset has 10 million rows and 500 features. A kernel method would take days to train. The team needs the best accuracy it can get in a few hours.`,
      a: `gbm`, d: [`svr`, `knn`, `slr`],
      why: `Kernel SVR scales poorly beyond tens of thousands of rows and KNN is slow and weak in 500 dimensions. Histogram-based gradient boosting handles this size comfortably and captures nonlinearity.` }
  ]
},
{
  id: `knn`, name: `K-Nearest Neighbours Regression`, family: `Kernels, neighbours and Bayes`, target: `Continuous`,
  tagline: `Predicts by finding the k most similar past cases and averaging their outcomes. No training step.`,
  use: `You have a few meaningful numeric features, plenty of data, and "similar cases have similar outcomes" is a fair description of the problem.`,
  avoid: `There are many features, especially irrelevant ones, or predictions must be fast at large scale, or you need to extrapolate.`,
  demo: `knn`,
  terms: [
    [`k`, `The number of neighbours averaged. Small k follows the data closely and is noisy; large k is smooth and may blur real structure.`],
    [`Distance metric`, `The definition of "near". Euclidean is the default. Manhattan, cosine and Gower (for mixed data types) are alternatives.`],
    [`Lazy learning`, `There is no fitting. The model stores the training data and does all its work at prediction time.`],
    [`Non-parametric`, `No fixed functional form and no fixed number of parameters. The model's complexity grows with the data.`],
    [`Distance weighting`, `Giving closer neighbours more influence, typically in proportion to 1/distance.`],
    [`Curse of dimensionality`, `As the number of features grows, all points become nearly equally far apart, and "nearest" stops being meaningful.`],
    [`KD-tree and ball tree`, `Data structures that find nearest neighbours without checking every point. Effective in low dimensions.`],
    [`Approximate nearest neighbours`, `Algorithms such as HNSW that find almost-nearest neighbours very quickly in large, high-dimensional datasets.`]
  ],
  example: {
    title: `Comparable sales`,
    body: `Property appraisers have always worked by "comps": find a few recently sold homes that are nearby and similar, and adjust. A valuation tool does the same with KNN. For a subject property it takes latitude, longitude, floor area, bedrooms and age, all scaled so that location and size have comparable weight, finds the 8 nearest sales from the past 12 months, and averages their prices with weights that fall off with distance. The output comes with its own justification: here are the eight properties this estimate is based on. Appraisers trust it because it mirrors their own method.`,
    why: `A handful of relevant features, a strongly local outcome, plenty of recent examples, and users who think in terms of similar cases.`
  },
  history: `<p>The nearest-neighbour rule was first set out by <b>Evelyn Fix and Joseph Hodges</b> in an unpublished 1951 technical report for the US Air Force School of Aviation Medicine. <b>Thomas Cover and Peter Hart</b> gave it a theoretical basis in 1967, proving that with unlimited data the one-nearest-neighbour classifier's error is at most twice the best achievable.</p>
<p>For regression, the closely related idea of a locally weighted average was proposed independently by <b>Èlizbar Nadaraya</b> and <b>Geoffrey Watson</b> in 1964 and is known as kernel regression. Charles Stone proved in 1977 that such methods are consistent under very general conditions. The idea has returned to prominence in modern AI as vector search: retrieving the nearest items in an embedding space.</p>`,
  math: {
    eq: `<i>ŷ</i>(<b>x</b>) = (1 / <i>k</i>) Σ<sub>i ∈ N<sub>k</sub>(<b>x</b>)</sub> <i>y</i><sub>i</sub> &nbsp;&nbsp;&nbsp; or weighted: &nbsp; <i>ŷ</i>(<b>x</b>) = Σ <i>w</i><sub>i</sub><i>y</i><sub>i</sub> / Σ <i>w</i><sub>i</sub>, &nbsp; <i>w</i><sub>i</sub> = 1 / d(<b>x</b>, <b>x</b><sub>i</sub>)
<br>distance: &nbsp; d(<b>x</b>, <b>x</b>′) = √ Σ<sub>j</sub> ( <i>x</i><sub>j</sub> − <i>x</i>′<sub>j</sub> )²`,
    cost: `no training objective. Choose <i>k</i> (and the metric) to minimise cross-validated error: &nbsp; CV(<i>k</i>) = (1 / <i>n</i>) Σ<sub>i</sub> ( <i>y</i><sub>i</sub> − <i>ŷ</i><sub>−i</sub>(<b>x</b><sub>i</sub>) )²`,
    plain: `<p>There is nothing to optimise during training, because there is no training. The data are the model. To predict, measure the distance from the new point to every stored point, take the k closest, and average their outcomes.</p>
<p>All the modelling decisions are therefore in three places: how many neighbours, what counts as distance, and which features go into that distance.</p>
<p>k is the bias–variance dial. With k = 1 the prediction copies the single closest example, noise included, and the fitted function jumps around. As k grows, the average steadies but starts to include points that are not really similar, flattening peaks and filling valleys. With k equal to the whole dataset you predict the overall mean for everyone. Cross-validation finds the value in between.</p>
<p>The curse of dimensionality is the method's limit. In two or three dimensions, the nearest neighbours of a point are genuinely close. In 100 dimensions, with a fixed amount of data, the nearest neighbour is almost as far away as the farthest. Every irrelevant feature adds noise to the distance, and soon the "neighbours" are arbitrary.</p>`
  },
  practical: [
    `<b>Scale features.</b> Distance is dominated by whichever feature has the largest numeric range.`,
    `<b>Choose k by cross-validation.</b> The square root of n is a rough starting point only.`,
    `<b>Feature selection matters more than for almost any other model.</b> Every feature is weighted equally in the distance, including the useless ones.`,
    `<b>Prediction is the expensive step.</b> Each query searches the stored data, which must be kept in memory.`,
    `<b>Cannot extrapolate,</b> and is biased near the edges of the data, where all the neighbours lie on one side.`,
    `<b>Categorical features need thought.</b> One-hot encoding makes all categories equally far apart. Gower distance or learned embeddings are options.`,
    `<b>Distance weighting usually helps</b> and makes the result less sensitive to the exact value of k.`
  ],
  field: [
    `Plain KNN on raw tabular features is rarely the production model. <b>The idea is everywhere.</b> Recommendation ("customers like you bought"), similar-case search in support and medicine, and retrieval for language models are all nearest-neighbour lookups in a learned embedding space, served by approximate search libraries such as FAISS and HNSW.`,
    `KNN's selling point to non-technical users is <b>explanation by example</b>. "Here are the five most similar past cases and what happened" is often more persuasive than a coefficient or a SHAP plot. Where a decision must be justified to a person, that matters.`,
    `Most of the work is <b>defining similarity</b>. Should a 10-year difference in age count the same as a 10-kilometre difference in location? There is no neutral answer. Scaling is an implicit choice of weights, and domain experts usually have opinions worth encoding.`,
    `KNN imputation is a common use: fill in a missing value from the rows most similar on the other columns. It works well, and it must be fitted on training data only. Imputing with the full dataset lets test rows inform training rows.`,
    `A KNN feature is a useful addition to a boosted model: "the average outcome of the 20 most similar past cases". Compute it out-of-fold, so that a row is never its own neighbour, or it leaks the target directly.`
  ],
  code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsRegressor
from sklearn.model_selection import GridSearchCV

pipe = make_pipeline(StandardScaler(), KNeighborsRegressor())
search = GridSearchCV(
    pipe,
    {"kneighborsregressor__n_neighbors": [3, 5, 8, 12, 20, 35],
     "kneighborsregressor__weights": ["uniform", "distance"]},
    cv=5, scoring="neg_mean_absolute_error").fit(X_train, y_train)

# Explain one prediction by showing its neighbours
dist, idx = search.best_estimator_[-1].kneighbors(
    search.best_estimator_[0].transform(X_new[:1]))`,
  quiz: [
    { q: `A valuation tool should price a home the way an appraiser does: find the five most similar recent sales nearby, judged on location, floor area and bedrooms, and average them. There are few features, a lot of local data, and no desire for a training phase.`,
      a: `knn`, d: [`mlr`, `logit`, `cox`],
      why: `Averaging the outcomes of the most similar cases, with no fitted equation, is the definition of K-nearest neighbours regression.` },
    { q: `A dataset has 300 features, most of them irrelevant. Distances between rows have become almost meaningless. The team wants a nonlinear model that is robust to junk features.`,
      a: `rf`, d: [`knn`, `slr`, `ord`],
      why: `KNN breaks down in high dimensions because irrelevant features swamp the distance. A random forest chooses features split by split and simply ignores the ones that do not help.` }
  ]
},
{
  id: `bayes`, name: `Bayesian Linear Regression`, family: `Kernels, neighbours and Bayes`, target: `Continuous (with uncertainty)`,
  tagline: `Linear regression where each coefficient is a probability distribution, combining prior knowledge with the data.`,
  use: `Data are scarce, you have real prior knowledge, or the decision depends on how uncertain the estimate is and not only on its value.`,
  avoid: `You have massive data and need only fast point predictions. The answer will be nearly the same as least squares at much greater cost.`,
  demo: `bayes`,
  terms: [
    [`Prior`, `What you believe about a parameter before seeing the data, expressed as a probability distribution.`],
    [`Likelihood`, `How probable the observed data are for each possible value of the parameters. The part of the model that listens to the data.`],
    [`Posterior`, `The updated belief after combining prior and likelihood. This is the result of a Bayesian analysis: a distribution, not a single number.`],
    [`Credible interval`, `A range containing the parameter with a stated probability, given the model and data. "There is a 95% probability the effect is between 2 and 5" is a valid reading.`],
    [`Posterior predictive distribution`, `The distribution of a new observation, accounting for both noise and uncertainty in the parameters.`],
    [`Conjugate prior`, `A prior that combines with the likelihood to give a posterior of the same family, so the answer has a formula. A normal prior with normal errors is the standard case.`],
    [`MCMC`, `Markov chain Monte Carlo. Algorithms that draw samples from a posterior that has no formula. NUTS, used by Stan and PyMC, is the usual one.`],
    [`Hierarchical model (partial pooling)`, `Groups have their own parameters, drawn from a shared distribution. Groups with little data borrow strength from the others.`],
    [`MAP estimate`, `The single most probable parameter value under the posterior. With a normal prior it equals the ridge estimate.`]
  ],
  example: {
    title: `Price sensitivity in a new market`,
    body: `A consumer goods company launches in a new country and after three months has 12 weekly observations of price and volume. A least-squares estimate of price elasticity is −3.9 with an interval from −8 to +0.5: useless, and the point estimate is implausible. But the company has estimated elasticity in 40 other markets, where it ranges from −1.2 to −2.6. Using that as a prior, the Bayesian estimate is −2.2 with a 90% credible interval of −3.0 to −1.5. The pricing team can also be told directly that there is a 97% probability that elasticity is more negative than −1, which is the threshold at which a price cut raises revenue.`,
    why: `Very little data, strong and legitimate prior information, and a decision that depends on the probability of crossing a threshold.`
  },
  history: `<p><b>Thomas Bayes</b>'s essay was published in 1763, two years after his death. <b>Pierre-Simon Laplace</b> independently developed the approach much further and applied it to astronomy and demography. For most of the 20th century it was eclipsed by the frequentist school of Fisher, Neyman and Pearson, partly on philosophical grounds and partly because the necessary integrals could not be computed.</p>
<p><b>Harold Jeffreys</b>, <b>Leonard Savage</b> and <b>Dennis Lindley</b> kept the theory alive. Lindley and Smith's 1972 paper "Bayes Estimates for the Linear Model" established the hierarchical linear model. The practical breakthrough was computational: <b>Gelfand and Smith (1990)</b> showed that Markov chain Monte Carlo could sample from almost any posterior. BUGS, then <b>Stan</b> (2012, built on the NUTS sampler of Hoffman and Gelman) and <b>PyMC</b>, turned Bayesian regression into an everyday tool.</p>`,
  math: {
    eq: `likelihood: &nbsp; <b>y</b> | β ~ N( <b>X</b>β, σ²<b>I</b> ) &nbsp;&nbsp;&nbsp; prior: &nbsp; β ~ N( <b>m</b><sub>0</sub>, <b>S</b><sub>0</sub> )
<br>posterior: &nbsp; β | <b>y</b> ~ N( <b>m</b><sub>n</sub>, <b>S</b><sub>n</sub> ) &nbsp; with &nbsp; <b>S</b><sub>n</sub> = ( <b>S</b><sub>0</sub><sup>−1</sup> + <b>X</b><sup>T</sup><b>X</b> / σ² )<sup>−1</sup>, &nbsp;&nbsp; <b>m</b><sub>n</sub> = <b>S</b><sub>n</sub>( <b>S</b><sub>0</sub><sup>−1</sup><b>m</b><sub>0</sub> + <b>X</b><sup>T</sup><b>y</b> / σ² )`,
    cost: `Bayes' rule: &nbsp; p(β | data) ∝ p(data | β) · p(β) &nbsp;&nbsp; (no single quantity is minimised; the whole posterior is the answer)
<br>prediction for new <b>x</b>*: &nbsp; <i>y</i>* ~ N( <b>x</b>*<sup>T</sup><b>m</b><sub>n</sub>, &nbsp; σ² + <b>x</b>*<sup>T</sup><b>S</b><sub>n</sub><b>x</b>* )`,
    plain: `<p>Ordinary regression returns one best line. Bayesian regression returns a distribution over all plausible lines, weighted by how well each agrees with both the data and what you knew beforehand.</p>
<p>The posterior mean is a <b>precision-weighted average</b> of the prior mean and the least-squares estimate. Precision is the inverse of variance: how sure each source is. With little data, the prior dominates. As data accumulate, X<sup>T</sup>X grows, the data dominate, and the result converges to least squares. The prior matters most exactly when you need it.</p>
<p>The connection to regularisation is exact. With a zero-centred normal prior, the most probable coefficient vector is the ridge estimate, with λ = σ²/τ² where τ² is the prior variance. A Laplace prior gives the lasso. Regularisation is prior belief stated in a different vocabulary.</p>
<p>The predictive variance has two parts. σ² is noise that no amount of data removes. The second term is uncertainty about the line, which shrinks as data arrive and grows as you move away from where the data are. So prediction intervals widen automatically when you extrapolate.</p>
<p>In this conjugate case everything has a formula. Change the likelihood or the prior and it does not, and the posterior is approximated by drawing thousands of samples with MCMC.</p>`
  },
  practical: [
    `<b>Choose weakly informative priors by default:</b> wide enough to let the data speak, narrow enough to exclude the absurd. Standardise predictors so that a prior like N(0, 1) has a consistent meaning.`,
    `<b>Run a prior predictive check.</b> Simulate outcomes from the prior alone. If the model thinks a house price of minus a billion is plausible, tighten the priors.`,
    `<b>Check the sampler.</b> R-hat near 1.00, adequate effective sample size and no divergent transitions. A model that has not converged gives meaningless numbers.`,
    `<b>Run a posterior predictive check.</b> Simulate data from the fitted model and compare with the real data. This is the Bayesian residual plot.`,
    `<b>With lots of data and vague priors, results match least squares.</b> The extra effort pays off with small samples, grouped data or real prior knowledge.`,
    `<b>Cost.</b> MCMC takes minutes to hours where OLS takes milliseconds. Variational inference is faster and less accurate.`,
    `<b>Report a sensitivity analysis.</b> Show that conclusions hold under reasonable alternative priors.`
  ],
  field: [
    `The real advantage in business is that the output <b>answers the question that was asked</b>. Decision makers want "what is the chance this is better than what we have?", and a posterior answers it directly. A p-value answers a different question that almost nobody outside statistics interprets correctly.`,
    `<b>Hierarchical models are where Bayesian regression earns its place.</b> Estimating an effect for 500 stores, 50 countries or 10,000 products, where some have plenty of data and some have almost none, is one of the most common real problems. Separate models are noisy for the small groups; one pooled model ignores real differences. Partial pooling does the sensible thing in between, automatically.`,
    `Priors are how you <b>encode business constraints</b>. Price elasticity should be negative. Advertising should not reduce sales. Marketing mix models use this heavily, because otherwise correlated channels produce coefficients with impossible signs. Be open about every such choice; a prior that determines the answer is an assumption, not a finding.`,
    `Expect the objection that priors are subjective. The honest reply is that every model has assumptions, and the Bayesian ones are written down where everyone can see and challenge them. Then show the sensitivity analysis.`,
    `Much production "Bayesian" work is approximate: empirical Bayes shrinkage for rates and rankings, Thompson sampling for bandits and A/B tests, bootstrap intervals used as stand-ins. Knowing the full method helps you judge when a shortcut is adequate.`
  ],
  code: `import bambi as bmb
import arviz as az

model = bmb.Model(
    "log_volume ~ log_price + promo",
    data=df,
    priors={"log_price": bmb.Prior("Normal", mu=-1.9, sigma=0.5)})
idata = model.fit(draws=2000, chains=4)      # NUTS via PyMC

print(az.summary(idata, var_names=["log_price", "promo"]))  # check r_hat
beta = idata.posterior["log_price"].values.ravel()
print("P(elasticity < -1) =", (beta < -1).mean())`,
  quiz: [
    { q: `A product has launched in a new city, and there are only 12 data points. The company has good estimates of the same effect from 40 other cities. Decision makers want a full probability statement, such as "the probability that the effect is greater than zero".`,
      a: `bayes`, d: [`mlr`, `rf`, `knn`],
      why: `Tiny data, strong prior information from elsewhere, and a request for direct probability statements about a parameter. Bayesian regression combines the prior with the data and returns a posterior distribution.` },
    { q: `A system must score 50 million rows with 300 features at low latency. Only point predictions are needed, and nobody will use uncertainty estimates.`,
      a: `gbm`, d: [`bayes`, `knn`, `svr`],
      why: `With massive data, the posterior would add heavy computation for an answer no one uses. KNN and kernel SVR do not scale to this size. Gradient boosting gives fast, accurate point predictions.` }
  ]
}
);
