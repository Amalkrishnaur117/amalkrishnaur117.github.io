        // --- GLOBAL STATE ---
        window.state = {
            benign: 990,
            attack: 10,
            theta: 0.01,
            smote: false,
            training: false,
            activeScenarioId: null,
            completedScenarios: [],
            currentScenarioConfig: {},
            selectedHypothesis: null
        };

        // --- CHART.JS SETUP ---
        const ctx = document.getElementById('lossChart').getContext('2d');
        const lossChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Benign', borderColor: '#10b981', data: [] }, { label: 'Attack', borderColor: '#ef4444', data: [] }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { display:false }, y: { min: 0 } } }
        });

        // --- GAME LOGIC ---
        function selectScenario(id) {
            const sc = window.scenarios.find(s => s.id === id);
            window.state.activeScenarioId = id;
            window.state.currentScenarioConfig = { ...sc.config };
            
            // Reset UI
            document.querySelectorAll('.workflow-step').forEach(el => {
                el.classList.remove('active', 'completed');
            });
            document.getElementById('step-1').classList.add('active');
            
            document.getElementById('scenario-list').style.display = 'none';
            document.getElementById('active-scenario').style.display = 'block';
            
            document.getElementById('sc-title').innerText = sc.title;
            document.getElementById('sc-diff').innerText = sc.difficulty;
            document.getElementById('sc-desc').innerText = sc.desc;
            
            // Clear previous state
            document.getElementById('clue-box').style.display = 'none';
            document.getElementById('hypothesis-list').innerHTML = '';
            document.getElementById('math-proof-content').style.display = 'none';
            document.getElementById('math-proof-content').innerHTML = '';
            document.getElementById('btn-prove').disabled = true;
            document.getElementById('sc-diagnosis').style.display = 'none';
            document.getElementById('hypothesis-feedback').style.display = 'none';

            // Render Hypotheses
            sc.hypotheses.forEach(h => {
                const div = document.createElement('div');
                div.className = 'hypothesis-opt';
                div.innerText = h.text;
                div.onclick = () => {
                    document.querySelectorAll('.hypothesis-opt').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                    window.state.selectedHypothesis = h;
                    document.getElementById('btn-prove').disabled = false;
                    document.getElementById('hypothesis-feedback').style.display = 'none'; // Hide prev feedback
                };
                document.getElementById('hypothesis-list').appendChild(div);
            });
            
            // Render Fix Options
            const optsUI = document.getElementById('sc-options');
            optsUI.innerHTML = '';
            sc.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline';
                btn.style.marginRight = '5px';
                btn.innerText = opt.label;
                btn.onclick = () => {
                    if(opt.type === 'toggle') window.state.currentScenarioConfig[opt.action] = !window.state.currentScenarioConfig[opt.action];
                    else window.state.currentScenarioConfig[opt.action] = opt.val;
                    
                    checkFix();
                };
                optsUI.appendChild(btn);
            });
        }

        function revealClue(idx) {
            const sc = window.scenarios.find(s => s.id === window.state.activeScenarioId);
            const box = document.getElementById('clue-box');
            box.style.display = 'block';
            box.innerText = "> " + sc.clues[idx];
            
            // Auto advance logic (simplified)
            if(document.getElementById('step-1').classList.contains('active')) {
                document.getElementById('step-1').classList.add('completed');
                document.getElementById('step-2').classList.add('active');
            }
        }

        function proveHypothesis() {
            if(!window.state.selectedHypothesis) return;
            
            const feedbackBox = document.getElementById('hypothesis-feedback');
            feedbackBox.style.display = 'block';

            if(window.state.selectedHypothesis.correct) {
                // Correct path
                feedbackBox.className = 'diagnosis-box success';
                feedbackBox.innerHTML = `<strong>Correct!</strong> ${window.state.selectedHypothesis.feedback || "That explains the symptoms."}`;

                const sc = window.scenarios.find(s => s.id === window.state.activeScenarioId);
                document.getElementById('step-2').classList.remove('active');
                document.getElementById('step-2').classList.add('completed');
                document.getElementById('step-3').classList.add('active');
                
                const panel = document.getElementById('math-proof-content');
                panel.style.display = 'block';
                panel.innerHTML = sc.mathProof;
                if(window.MathJax) MathJax.typesetPromise();
            } else {
                // Incorrect path
                feedbackBox.className = 'diagnosis-box error';
                feedbackBox.innerHTML = `<strong>Incorrect.</strong> ${window.state.selectedHypothesis.feedback || "Review the clues and try again."}`;
            }
        }

        function unlockFix() {
            document.getElementById('step-3').classList.remove('active');
            document.getElementById('step-3').classList.add('completed');
            document.getElementById('step-4').classList.add('active');
        }

        function checkFix() {
            const sc = window.scenarios.find(s => s.id === window.state.activeScenarioId);
            const passed = sc.check(window.state.currentScenarioConfig);
            const diag = document.getElementById('sc-diagnosis');
            diag.style.display = 'block';
            
            if(passed) {
                diag.className = 'diagnosis-box success';
                diag.innerHTML = `<strong><i class="fa-solid fa-check"></i> Fixed!</strong> The system is stable.`;
                if (!window.state.completedScenarios.includes(sc.id)) {
                    window.state.completedScenarios.push(sc.id);
                    initScenarios();
                }
            } else {
                diag.className = 'diagnosis-box error';
                diag.innerHTML = `Still failing. Check the configuration.`;
            }
        }

        function closeScenario() {
            document.getElementById('scenario-list').style.display = 'grid';
            document.getElementById('active-scenario').style.display = 'none';
        }

        function initScenarios() {
            const list = document.getElementById('scenario-list');
            list.innerHTML = "";
            window.scenarios.forEach(sc => {
                const isDone = window.state.completedScenarios.includes(sc.id);
                const card = document.createElement('div');
                card.className = 'card scenario-card';
                card.innerHTML = `
                    <h3>${sc.title} ${isDone ? '<i class="fa-solid fa-check-circle" style="color:var(--benign)"></i>' : ''}</h3>
                    <span class="difficulty ${sc.difficulty.toLowerCase()}">${sc.difficulty}</span>
                    <p>${sc.desc.substring(0, 50)}...</p>
                    <small style="color: var(--primary)">Start Debugging &rarr;</small>
                `;
                card.onclick = () => selectScenario(sc.id);
                list.appendChild(card);
            });
            const pct = (window.state.completedScenarios.length / window.scenarios.length) * 100;
            document.getElementById('mastery-bar').style.width = pct + '%';
            document.getElementById('mastery-text').innerText = `${window.state.completedScenarios.length}/${window.scenarios.length} Scenarios`;
        }

        function updateLab() {
             // 1. Read Inputs
            window.state.benign = parseInt(document.getElementById('slider-benign').value);
            window.state.attack = parseInt(document.getElementById('slider-attack').value);
            window.state.theta = parseFloat(document.getElementById('slider-theta').value);
            window.state.smote = document.getElementById('check-smote').checked;

            // 2. SMOTE Logic (Virtual)
            let n0 = window.state.benign;
            let n1 = window.state.attack;
            
            if (window.state.smote) {
                // If SMOTE is on, virtually balance the dataset for calc purposes
                n1 = n0; 
                // Visual feedback that numbers changed conceptually
                document.getElementById('val-attack').innerHTML = `${window.state.attack} <span style='font-size:0.8em'>(SMOTE -> ${n1})</span>`;
            } else {
                document.getElementById('val-attack').innerText = window.state.attack;
            }
            document.getElementById('val-benign').innerText = n0;

            // 3. Update Ratio Text
            document.getElementById('val-theta').innerText = window.state.theta.toFixed(2);

            // 4. Calculate Gradients (First Principles: pred - target)
            // Target Benign = 0, Target Attack = 1
            const pred = window.state.theta;
            
            // Grad Benign = N * (pred - 0)
            const gradBenign = n0 * (pred - 0);
            
            // Grad Attack = N * (pred - 1)
            const gradAttack = n1 * (pred - 1);

            const netGrad = gradBenign + gradAttack;

            // Update detailed math blocks
            document.getElementById('calc-benign-math').innerHTML = `${n0} * ${(pred).toFixed(2)}`;
            document.getElementById('res-benign-math').innerText = gradBenign.toFixed(1);
            
            document.getElementById('calc-attack-math').innerHTML = `${n1} * ${(pred - 1).toFixed(2)}`;
            document.getElementById('res-attack-math').innerText = gradAttack.toFixed(1);
            
            document.getElementById('res-net-math').innerText = netGrad.toFixed(1);

            // 6. Update Visual Bars (Scale logic: max possible grad is N*1)
            const maxVal = Math.max(Math.abs(gradBenign), Math.abs(gradAttack)) * 1.2 || 1;
            
            const netPercent = Math.min((Math.abs(netGrad) / maxVal) * 100, 100);
            const netBar = document.getElementById('bar-net');
            netBar.style.width = netPercent + '%';
            netBar.innerText = netGrad.toFixed(1);
            
            if (netGrad > 0) { netBar.className = 'grad-fill benign'; netBar.style.justifyContent = 'flex-end'; } 
            else { netBar.className = 'grad-fill attack'; netBar.style.justifyContent = 'flex-start'; } 
            
            // 7. Live Analysis Logic
            const analysisBox = document.getElementById('live-analysis');
            if (Math.abs(netGrad) < (maxVal * 0.05) && n1 < n0 * 0.1 && !window.state.smote) {
                analysisBox.innerHTML = "<strong>⚠️ Cancellation Detected:</strong> The benign gradient (positive) is almost perfectly cancelling the attack gradient (negative). The model will stop learning.";
                analysisBox.style.borderColor = "var(--warning)";
            } else if (netGrad > (maxVal * 0.5)) {
                analysisBox.innerHTML = "<strong>Benign Dominance:</strong> The model is being pulled strongly towards predicting 'Benign' for everything.";
                analysisBox.style.borderColor = "var(--benign)";
            } else if (netGrad < -(maxVal * 0.5)) {
                 analysisBox.innerHTML = "<strong>Attack Dominance:</strong> The gradients are forcing the model towards predicting 'Attack'.";
                 analysisBox.style.borderColor = "var(--attack)";
            } else {
                analysisBox.innerHTML = "<strong>Balanced Training:</strong> Gradients are competing, which allows learning.";
                analysisBox.style.borderColor = "var(--text-muted)";
            }
        }

        let trainingInterval;
        function startTraining() {
            if (window.state.training) return;
            window.state.training = true;
            document.getElementById('trainBtn').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Training...';
            
            lossChart.data.labels = [];
            lossChart.data.datasets[0].data = [];
            lossChart.data.datasets[1].data = [];
            lossChart.update();

            let epoch = 0;
            let currentTheta = 0.5;
            const lr = 0.001;

            trainingInterval = setInterval(() => {
                epoch++;
                if (epoch > 50) {
                    window.state.training = false;
                    clearInterval(trainingInterval);
                    document.getElementById('trainBtn').innerHTML = '<i class="fa-solid fa-play"></i> Start Training';
                    return;
                }

                let n0 = window.state.benign;
                let n1 = window.state.smote ? window.state.benign : window.state.attack;
                let g0 = n0 * (currentTheta - 0);
                let g1 = n1 * (currentTheta - 1);
                let net = g0 + g1;

                currentTheta = Math.max(0, Math.min(1, currentTheta - (lr * net)));
                const eps = 1e-5;
                const p = Math.max(eps, Math.min(1-eps, currentTheta));
                const loss0 = -Math.log(1-p);
                const loss1 = -Math.log(p);

                lossChart.data.labels.push(epoch);
                lossChart.data.datasets[0].data.push(loss0);
                lossChart.data.datasets[1].data.push(loss1);
                lossChart.update('none'); 

                document.getElementById('slider-theta').value = currentTheta;
                updateLab();

            }, 400);
        }

        function showSection(id, el) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            if (el) el.classList.add('active');

            // Trigger MathJax re-render for the newly shown section
            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise();
            }

            // Trigger canvas renders
            if(id === 'math-calculus') {
                if(typeof drawGradViz === 'function') drawGradViz();
                if(typeof drawLineIntViz === 'function') drawLineIntViz();
                if(typeof drawVectorFieldViz === 'function') drawVectorFieldViz();
            }
        }

        function showMathTab(tabId, el) {
            document.querySelectorAll('.math-tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(tabId).style.display = 'block';
            
            // Handle active state for the tab buttons
            const parent = el.parentElement;
            parent.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
        }

        function showArch(archId) {
            const data = window.archData[archId];
            if (!data) return;

            document.getElementById('arch-diagram').innerHTML = data.diagram;
            document.getElementById('arch-math').innerHTML = data.math;
            if(window.MathJax) MathJax.typesetPromise();
            
            // Trigger specific viz if needed
            if(archId === 'neuron') {
                setTimeout(drawNeuronViz, 50); // Small delay for DOM to render
            }
        }

        window.onload = function() {
            updateLab();
            initScenarios();
            
            // Initialize Visualizations from math-viz.js
            if(typeof updateMatrixViz === 'function') updateMatrixViz();
            if(typeof drawGradViz === 'function') drawGradViz();
            if(typeof drawProbViz === 'function') drawProbViz();
            if(typeof setVectorMode === 'function') {
                setVectorMode('sink'); 
                drawVectorFieldViz();
            }
            if(typeof setDistMode === 'function') setDistMode('bernoulli');
            if(typeof initSpanViz === 'function') {
                initSpanViz();
                drawSpanViz();
            }
        };