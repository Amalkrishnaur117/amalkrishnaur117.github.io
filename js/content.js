window.scenarios = [
            // 1. Double Correction
            {
                id: 1,
                title: "The Double Correction Bug",
                difficulty: "Easy",
                desc: "Training loss is huge. Model predicts only 'Attack'. Investigation needed.",
                clues: [
                    "Batch Composition: 5751 Benign, 5751 Attack (Balanced)",
                    "Gradient Norms: Benign=5751, Attack=33,000,000 (!!)",
                    "Loss starts at 0.7 and jumps to 5000 in Epoch 1."
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Learning rate is too high",
                        correct: false,
                        feedback: "Incorrect. While a high LR can cause instability, the clue shows 'Gradient Norms: Benign=5751, Attack=33,000,000'. This massive disparity suggests a structural issue with how gradients are calculated, not just the step size."
                    },
                    {
                        id: "h2",
                        text: "We balanced data (SMOTE) AND used Class Weights",
                        correct: true,
                        feedback: "Correct! We are correcting for imbalance twice: once by adding samples (SMOTE), and again by multiplying the loss (Class Weights)."
                    },
                    {
                        id: "h3",
                        text: "The dataset labels are inverted",
                        correct: false,
                        feedback: "Incorrect. Inverted labels would cause the model to learn the opposite class, but wouldn't necessarily cause the gradient explosion (33 million) seen in the clues."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Double Correction Impact</h4>
                    <p>When we use SMOTE, $N_{benign} \approx N_{attack}$. If we <em>also</em> keep Class Weights ($W_{attack} \gg 1$), here is the gradient:</p>
                    <div class=\"equation-box\">
                        $$ \∇_{attack} = N_{attack} \times W_{attack} \times Error $$
                    </div>
                    <p>Substituting values ($N=5751, W=5751$):</p>
                    <div class=\"equation-box\">
                        $$ ∇_{attack} = 5751 \times 5751 \times (1) \approx 33,000,000 $$
                    </div>
                    <p>The benign gradient is only $5751 \times 1 = 5751$. The attack gradient is <strong>5000x stronger</strong>, forcing the model to always predict Attack.</p>
                ",
                config: { smote: true, weights: true },
                check: (cfg) => cfg.weights === false,
                options: [ { id: "opt2", label: "Remove Class Weights", action: "weights", val: false, type: "toggle" } ]
            },
            // 2. Wrong Dataset
            {
                id: 2,
                title: "The Wrong Dataset",
                difficulty: "Easy",
                desc: "Applied SMOTE, but training is still failing. Loss doesn't decrease.",
                clues: [
                    "Batch Inspection: [0, 0, 0, 0, 0...] (Mostly Benign)",
                    "Gradient Norm: Benign dominates.",
                    "Dataset object name: 'X_train' (Original)"
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "We are iterating over the original dataset, not the SMOTE one",
                        correct: true,
                        feedback: "Correct! The code is likely loading `X_train` instead of `X_train_resampled`."
                    },
                    {
                        id: "h2",
                        text: "SMOTE didn't generate enough samples",
                        correct: false,
                        feedback: "Incorrect. SMOTE generates samples based on the configuration. The clue 'Batch Inspection: Mostly Benign' suggests the samples exist but aren't getting into the batches."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Expected Batch Composition</h4>
                    <p>The Probability of drawing an attack sample $P(A)$ depends on the dataset source.</p>
                    <div class=\"equation-box\">
                        $$ E[k] = B \times P(A) $$
                    </div>
                    <p>If using Original Dataset ($P(A) = 0.01$, $B=32$):</p>
                    <div class=\"equation-box\">
                        $$ E[k] = 32 \times 0.01 = 0.32 \text{ samples/batch} $$
                    </div>
                    <p>We expect <strong>zero</strong> attack samples in most batches. Gradients for the attack class effectively vanish.</p>
                ",
                config: { dataset: "X_train" },
                check: (cfg) => cfg.dataset === "X_train_smote",
                options: [ { id: "opt_ds2", label: "Switch to X_train_smote", action: "dataset", val: "X_train_smote", type: "set" } ]
            },
            // 3. Shuffle Catastrophe
            {
                id: 3,
                title: "Shuffle Catastrophe",
                difficulty: "Easy",
                desc: "Loss oscillates wildly. First it learns Benign, then it forgets and learns Attack.",
                clues: [
                    "Batch 1-50: 100% Benign. Batch 51-100: 100% Attack.",
                    "Gradient direction flips completely halfway through epoch.",
                    "Shuffle flag is set to False."
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Data is sorted by label and Shuffle is OFF",
                        correct: true,
                        feedback: "Correct! Sequential learning causes Catastrophic Forgetting."
                    },
                    {
                        id: "h2",
                        text: "Batch size is too small",
                        correct: false,
                        feedback: "Incorrect. Small batch sizes cause random noise, but not the systematic oscillation 'First Benign, then Attack' described in the clues."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Catastrophic Forgetting</h4>
                    <p>Standard Gradient Descent updates weights iteratively:</p>
                    <div class=\"equation-box\">
                        $$ θ_t = θ_{t-1} - η ∇ L(B_t) $$
                    </div>
                    <p>If $B_t$ is all Benign, $∇ L \approx ∇_{benign}$. The model moves deep into the Benign minima.</p>
                    <p>Later, when $B_t$ is all Attack, it must "unlearn" everything to move to the Attack minima. Without mixing ($E[∇ B_t] \approx ∇_{total}$), convergence is impossible.</p>
                ",
                config: { shuffle: false },
                check: (cfg) => cfg.shuffle === true,
                options: [ { id: "opt_shuf", label: "Enable Shuffle", action: "shuffle", val: true, type: "toggle" } ]
            },
            // 4. LR Explosion
            {
                id: 4,
                title: "Learning Rate Explosion",
                difficulty: "Medium",
                desc: "Loss goes to NaN at epoch 5.",
                clues: [
                    "Loss History: 0.6 -> 5.4 -> 450 -> NaN",
                    "Gradient norms are increasing every step.",
                    "Learning Rate is 1.0"
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Learning Rate is higher than 2/Lipschitz Constant",
                        correct: true,
                        feedback: "Correct! The step size is too large for the curvature of the loss surface."
                    },
                    {
                        id: "h2",
                        text: "Dataset has NaN values",
                        correct: false,
                        feedback: "Incorrect. While NaNs in data cause NaNs in loss, the loss history '0.6 -> 5.4 -> 450 -> NaN' shows a clear explosion, typical of unstable feedback loops."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Stability Condition</h4>
                    <p>Using Taylor Expansion of the loss function $f(x)$:</p>
                    <div class=\"equation-box\">
                        $$ f(x - η g) \approx f(x) - η ||g||^2 + η^2/2 g^T H g $$
                    </div>
                    <p>If $η$ is too large (specifically $η > 2/λ_{max}$ where $λ_{max}$ is the largest eigenvalue of the Hessian), the quadratic term dominates the reduction term.</p>
                    <p>The step overshoots the minima, increasing the gradient norm, leading to divergence.</p>
                ",
                config: { lr: 1.0 },
                check: (cfg) => cfg.lr === 0.001,
                options: [ { id: "opt_lr1", label: "Set LR = 0.001", action: "lr", val: 0.001, type: "set" } ]
            },
            // 5. Full Batch
            {
                id: 5,
                title: "Full Batch Trap",
                difficulty: "Medium",
                desc: "Training is extremely slow. Loss decreases but model lands in local minima.",
                clues: [
                    "Updates per Epoch: 1",
                    "Batch Size: 1000 (Total Dataset Size)",
                    "Loss Curve: Very smooth, but stuck at 0.4."
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Batch Size is too large, removing stochastic noise",
                        correct: true,
                        feedback: "Correct! We lost the noise needed to escape saddle points."
                    },
                    {
                        id: "h2",
                        text: "Learning rate is too low",
                        correct: false,
                        feedback: "Incorrect. Low LR would cause slow convergence, but sticking exactly at a loss of 0.4 with a smooth curve often indicates getting stuck in a saddle point or local minimum due to lack of stochastic noise."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Stochastic Noise & Escape</h4>
                    <p>SGD relies on the variance of the gradient estimator to escape saddle points:</p>
                    <div class=\"equation-box\">
                        $$ g_{stochastic} = ∇ L_{true} + ε, \quad ε \sim N(0, Σ) $$
                    </div>
                    <p>When Batch Size = Dataset Size, $ε = 0$. The optimization follows the exact deterministic path of steepest descent.</p>
                    <p>In non-convex deep learning landscapes, this path often leads to saddle points or poor local minima that noise would have helped jump over.</p>
                ",
                config: { batch_size: 1000 },
                check: (cfg) => cfg.batch_size === 32,
                options: [ { id: "opt_b1", label: "Set Batch Size = 32", action: "batch_size", val: 32, type: "set" } ]
            },
            // 6. Test Contamination
            {
                id: 6,
                title: "Test Contamination",
                difficulty: "Medium",
                desc: "Test Recall 99%, Real World Recall 5%.",
                clues: [
                    "Preprocessing: SMOTE applied to 'entire_dataset' before split.",
                    "Test Set contains synthetic samples.",
                    "Nearest Neighbor check: Test samples are copies of Train samples."
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Data Leakage: SMOTE applied before Train/Test split",
                        correct: true,
                        feedback: "Correct! The test set is contaminated with synthetic copies of training data."
                    },
                    {
                        id: "h2",
                        text: "Model is overfitting",
                        correct: false,
                        feedback: "Incorrect. Overfitting usually shows a gap between Train and Test accuracy. Here, Test Recall is 99% (high), but Real World is 5%. The Test set itself is misleading."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Distribution Mismatch</h4>
                    <p>We assume Test Set comes from $P_{real}(x)$.</p>
                    <p>If we SMOTE before split, Test Set comes from $P_{synthetic}(x | x_{train})$.</p>
                    <div class=\"equation-box\">
                        $$ P_{test}(x) \neq P_{deployment}(x) $$
                    </div>
                    <p>The metric $Accuracy_{test}$ measures the model's ability to recognize interpolation artifacts (memorization), not its ability to generalize to the real manifold.</p>
                ",
                config: { smote_test: true },
                check: (cfg) => cfg.smote_test === false,
                options: [ { id: "opt_test", label: "Clean Test Set", action: "smote_test", val: false, type: "toggle" } ]
            },
            // 7. Wrong Loss
            {
                id: 7,
                title: "Wrong Loss Function",
                difficulty: "Medium",
                desc: "Model learns very slowly when predictions are confident but wrong (e.g., pred=0.01, target=1).",
                clues: [
                    "Loss Function: MSE (Mean Squared Error)",
                    "Output Activation: Sigmoid",
                    "Gradient at error: 0.0001 (Vanishing)"
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "MSE with Sigmoid causes vanishing gradients",
                        correct: true,
                        feedback: "Correct! The derivative of Sigmoid kills the gradient when confident."
                    },
                    {
                        id: "h2",
                        text: "Learning rate too low",
                        correct: false,
                        feedback: "Incorrect. The clue mentions 'Gradient at error: 0.0001'. The issue is the gradient magnitude itself is vanishing due to the mathematical properties of the functions, not the step size."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Derivative of MSE vs CE</h4>
                    <p>For MSE $L = (y-\sigma(z))^2$, the gradient is:</p>
                    <div class=\"equation-box\">
                        $$ ∂ L / ∂ z = (y-\sigma(z)) \cdot σ'(z) $$
                    </div>
                    <p>If the model is confident but wrong (e.g., $z=-10, σ(z) \approx 0, y=1$), then $σ'(-10) \approx 0$. <strong>The gradient kills itself.</strong></p>
                    <p>For Cross Entropy, the $σ'$ term cancels out, leaving just $(y-\sigma(z))$, which is large (1.0). This is why we use CE for classification.</p>
                ",
                config: { loss: "MSE" },
                check: (cfg) => cfg.loss === "CrossEntropy",
                options: [ { id: "opt_ce", label: "Use CrossEntropy", action: "loss", val: "CrossEntropy", type: "set" } ]
            },
            // 8. Vanishing Gradients
            {
                id: 8,
                title: "Vanishing Gradients",
                difficulty: "Hard",
                desc: "10-layer network. First layers not learning. Last layers learning fine.",
                clues: [
                    "Layer 10 Gradient: 0.5",
                    "Layer 1 Gradient: 1e-7",
                    "Activation: Sigmoid everywhere"
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Chain rule multiplication of small derivatives (Sigmoid)",
                        correct: true,
                        feedback: "Correct! Multiplying many numbers < 1 results in a number close to 0."
                    },
                    {
                        id: "h2",
                        text: "Backprop implementation bug",
                        correct: false,
                        feedback: "Incorrect. Deep Learning frameworks (PyTorch/TF) handle backprop correctly. The clues show a decay '0.5 -> ... -> 1e-7', which is a theoretical property of deep Sigmoid networks."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Chain Rule Multiplication</h4>
                    <p>The gradient at layer 1 is the product of all downstream derivatives:</p>
                    <div class=\"equation-box\">
                        $$ ∇_1 = ∇_{10} ∏_{i=1}^{10} σ'(z_i) W_i $$
                    </div>
                    <p>The max derivative of Sigmoid is $0.25$.</p>
                    <div class=\"equation-box\">
                        $$ 0.25^{10} \approx 0.0000009 $$
                    </div>
                    <p>The signal decays exponentially with depth. Using ReLU (deriv=1) fixes this.</p>
                ",
                config: { activation: "Sigmoid" },
                check: (cfg) => cfg.activation === "ReLU",
                options: [ { id: "opt_relu", label: "Switch to ReLU", action: "activation", val: "ReLU", type: "set" } ]
            },
            // 9. Label Leakage
            {
                id: 9,
                title: "Label Leakage",
                difficulty: "Hard",
                desc: "Train Acc 100%, Test Acc 50% (Random). Feature 'Timestamp' suspiciously predictive.",
                clues: [
                    "Correlation(Timestamp, Label) = 1.0",
                    "Data was collected sequentially: Attacks in afternoon, Benign in morning.",
                    "Model relies entirely on Timestamp."
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Model learned a spurious correlation (Timestamp)",
                        correct: true,
                        feedback: "Correct! The model found a shortcut that works in training but not in reality."
                    },
                    {
                        id: "h2",
                        text: "Not enough training data",
                        correct: false,
                        feedback: "Incorrect. The model has 100% Training Accuracy. The issue is that it fails on the Test set (50%), specifically relying on the 'Timestamp' feature."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: Mutual Information</h4>
                    <p>The goal is to maximize $I(Y; X_{causal})$.</p>
                    <p>Here, $I(Y; X_{timestamp}) = H(Y)$ (Perfect predictor). Gradient Descent is greedy; it will use the easiest feature.</p>
                    <div class=\"equation-box\">
                        $$ win_{θ} L(f(X_{time}), Y) \rightarrow 0 $$
                    </div>
                    <p>However, in the test set (or real world), $P(Y|X_{time})$ changes. The causal link is broken. The feature must be dropped.</p>
                ",
                config: { remove_feat: false },
                check: (cfg) => cfg.remove_feat === true,
                options: [ { id: "opt_leak", label: "Drop 'Timestamp'", action: "remove_feat", val: true, type: "toggle" } ]
            },
            // 10. Perfect Storm
            {
                id: 10,
                title: "The Perfect Storm",
                difficulty: "Hard",
                desc: "Multiple bugs active. Fix them all.",
                clues: [
                    "LR=1.0 (Explosion)",
                    "Shuffle=False (Oscillation)",
                    "Weights=True + SMOTE (Overcorrection)"
                ],
                hypotheses: [
                    {
                        id: "h1",
                        text: "Combination of Unstable LR, No Shuffle, and Double Weights",
                        correct: true,
                        feedback: "Correct! All three issues must be resolved."
                    },
                    {
                        id: "h2",
                        text: "Just needs more epochs",
                        correct: false,
                        feedback: "Incorrect. The clues show 'Explosion' and 'Oscillation'. Training longer won't fix unstable dynamics or conflicting configurations."
                    }
                ],
                mathProof: "\
                    <h4>Derivation: System Stability</h4>
                    <p>We need to satisfy multiple constraints simultaneously:</p>
                    <ol>
                        <li>$\eta < 2/\lambda$ (Stability)</li>
                        <li>$E[\nabla_{batch}] = \nabla_{true}$ (Shuffle)</li>
                        <li>$\nabla_{ratio} \approx 1$ (Balanced Weights)</li>
                    </ol>
                    <p>Failure in any one causes the loss $L(\theta)$ to diverge or stall.</p>
                ",
                config: { lr: 1.0, shuffle: false, weights: true },
                check: (cfg) => cfg.lr === 0.001 && cfg.shuffle === true && cfg.weights === false,
                options: [
                    { id: "opt_ps1", label: "Fix LR", action: "lr", val: 0.001, type: "set" },
                    { id: "opt_ps2", label: "Enable Shuffle", action: "shuffle", val: true, type: "set" },
                    { id: "opt_ps3", label: "Remove Weights", action: "weights", val: false, type: "set" }
                ]
            }
        ];

window.archData = {
            'neuron': {
                diagram: "\
                    <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%;\">
                        <div>
                            <div style=\"text-align:center; margin-bottom: 1rem;"><i class=\"fa-solid fa-circle\" style=\"font-size:3rem; color:var(--primary)\"></i><p>Single Neuron Decision Boundary</p></div>
                            <div style=\"background: rgba(0,0,0,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; height: 250px;\">
                                <canvas id=\"neuronCanvas\" width=\"250\" height=\"250\"></canvas>
                            </div>
                        </div>
                        <div>
                            <h4>Controls</h4>
                            <div class=\"control-group\">
                                <div class=\"control-header\"><span>Weight 1 ($w_1$)</span><span id=\"val-w1\">1.0</span></div>
                                <input type=\"range\" min=\"-5\" max=\"5\" step=\"0.1\" value=\"1\" id=\"slider-w1\" oninput=\"drawNeuronViz()\">
                            </div>
                            <div class=\"control-group\">
                                <div class=\"control-header\"><span>Weight 2 ($w_2$)</span><span id=\"val-w2\">1.0</span></div>
                                <input type=\"range\" min=\"-5\" max=\"5\" step=\"0.1\" value=\"1\" id=\"slider-w2\" oninput=\"drawNeuronViz()\">
                            </div>
                            <div class=\"control-group\">
                                <div class=\"control-header\"><span>Bias ($b$)</span><span id=\"val-b\">0.0</span></div>
                                <input type=\"range\" min=\"-5\" max=\"5\" step=\"0.1\" value=\"0\" id=\"slider-b\" oninput=\"drawNeuronViz()\">
                            </div>
                            <p style=\"font-size: 0.8rem; color: var(--text-muted)\">Boundary: $w_1 x_1 + w_2 x_2 + b = 0$</p>
                        </div>
                    </div>
                ",
                math: "\
                    <h4>1. The Probabilistic Model</h4>
                    <p>We treat classification as predicting the probability $P(y=1|x)$. We model this with the Bernoulli distribution:</p>
                    <div class=\"equation-box\">$$ P(y|x) = Θ^y (1-Θ)^{1-y} $$</div>
                    
                    <h4>2. Maximum Likelihood Estimation</h4>
                    <p>We want to find weights $W$ that maximize the likelihood over the dataset $∏ P(y_i|x_i)$.</p>
                    
                    <h4>3. Deriving the Loss</h4>
                    <p>Taking the negative logarithm ($-\log ℓ$) converts the product to a sum and gives us <strong>Binary Cross-Entropy</strong>:</p>
                    <div class=\"equation-box\">$$ ℓ(θ) = -\sum [y  Θ) + (1-y)  (1-Θ))] $$</div>
                "
            },
            'mlp': {
                diagram: '<div style=\"text-align:center"><i class=\"fa-solid fa-network-wired\" style=\"font-size:3rem; color:var(--accent)\"></i><p>Input &rarr; Hidden Layers &rarr; Softmax Output</p></div>',
                math: "\
                    <h4>1. Universal Approximation</h4>
                    <p>An MLP with one hidden layer can approximate any continuous function, given enough neurons.</p>
                    
                    <h4>2. Multi-Class: The Categorical Distribution</h4>
                    <p>For $K$ classes, we generalize Bernoulli to the Categorical distribution using the <strong>Softmax</strong> function to normalize logits into probabilities.</p>
                    <div class=\"equation-box\">$$ Θ_k = \frac{e^{z_k}}{\sum e^{z_j}} $$</div>

                    <h4>3. Cross-Entropy Loss</h4>
                    <p>Minimizing the KL-Divergence between the true distribution (one-hot) and predicted distribution yields:</p>
                    <div class=\"equation-box\">$$ ℓ = -\sum_{k=1}^K y_k  Θ_k) $$</div>
                "
            },
            'cnn': {
                diagram: '<div style=\"text-align:center"><i class=\"fa-solid fa-layer-group\" style=\"font-size:3rem; color:var(--warning)\"></i><p>Filters sliding over Input (Spatial)</p></div>',
                math: "\
                    <h4>1. The Prior: Spatial Invariance</h4>
                    <p>We assume that a feature (e.g., an edge) is useful regardless of where it appears in the image. This implies <strong>Weight Sharing</strong>.</p>
                    
                    <h4>2. Convolution as Sparsity</h4>
                    <p>A convolution is mathematically equivalent to a matrix multiplication where the weight matrix is <strong>Toeplitz</strong> (diagonal-constant) and extremely sparse.</p>
                    <div class=\"equation-box\">$$ (f * g)[n] = \sum_{m=-M}^M f[n-m]g[m] $$</div>
                    <p>This \"Hard Constraint\" acts as a powerful regularizer, forcing the model to learn local, translation-invariant features.</p>
                "
            },
            'rnn': {
                diagram: '<div style=\"text-align:center"><i class=\"fa-solid fa-arrow-rotate-right\" style=\"font-size:3rem; color:var(--benign)\"></i><p>Hidden state $h_t$ feeds into $h_{t+1}$</p></div>',
                math: "\
                    <h4>1. Backpropagation Through Time (BPTT)</h4>
                    <p>The gradient depends on the product of matrices over time:</p>
                    <div class=\"equation-box\">$$ ∂ L / ∂ h_0 = (∂ L / ∂ h_T) ∏_{t=1}^T (∂ h_t / ∂ h_{t-1}) $$
                    </div>
                    
                    <h4>2. The Vanishing Gradient Problem</h4>
                    <p>If the singular values of the recurrent weight matrix $|W| < 1$, the product decays exponentially to zero. If $|W| > 1$, it explodes.</p>
                    
                    <h4>3. The LSTM Solution</h4>
                    <p>LSTMs introduce an <strong>Additive Update</strong> path for the cell state:</p>
                    <div class=\"equation-box\">$$ C_t = f_t C_{t-1} + i_t rC_t $$</div>
                    <p>The derivative $∂ C_t / ∂ C_{t-1}$ contains a term $1$, creating a \"gradient superhighway\" that prevents vanishing.</p>
                "
            },
            'bayesian': {
                diagram: '<div style=\"text-align:center"><i class=\"fa-solid fa-dice\" style=\"font-size:3rem; color:#fff\"></i><p>Weights are Distributions $P(\theta)$</p></div>',
                math: "\
                    <h4>1. Weights as Random Variables</h4>
                    <p>Instead of a single number, each weight is a Gaussian distribution $\theta \sim \mathcal{N}(\mu, \sigma)$. We want to find the posterior $P(\theta|\mathcal{D})$.</p>
                    
                    <h4>2. The Objective: ELBO</h4>
                    <p>Calculating the true posterior is intractable. We approximate it using Variational Inference by minimizing the <strong>Evidence Lower Bound (ELBO)</strong>:</p>
                    <div class=\"equation-box\">$$ ℓ = ℎ[\log P(\mathcal{D}|\theta)] - D_{KL}(Q(\theta)||P(\theta)) $$</div>
                    <p><strong>Term 1 (Likelihood):</strong> Fit the data well.</p>
                    <p><strong>Term 2 (Complexity):</strong> Stay close to the prior (regularization).</p>
                "
            },
            'transformer': {
                diagram: '<div style=\"text-align:center"><i class=\"fa-solid fa-arrows-to-circle\" style=\"font-size:3rem; color:var(--accent)\"></i><p>Multi-Head Attention & Feed-Forward Blocks</p></div>',
                math: "\
                    <h4>1. The Attention Mechanism</h4>
                    <p>Unlike RNNs, Transformers process all tokens in parallel. They determine which tokens are relevant to each other using Queries ($Q$), Keys ($K$), and Values ($V$).</p>
                    <div class=\"equation-box\">$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V $$</div>
                    
                    <h4>2. Multi-Head Attention</h4>
                    <p>The model performs this \"Self-Attention\" multiple times in parallel to capture different types of relationships (e.g., grammar vs. meaning).</p>
                    
                    <h4>3. Quadratic Complexity</h4>
                    <p>Since every token attends to every other token, the cost is $O(N^2)$ where $N$ is sequence length. This is why long context windows are computationally expensive.</p>
                "
            }
        };
