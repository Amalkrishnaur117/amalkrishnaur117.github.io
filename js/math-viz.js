        // --- MATRIX VIZ ---
        function updateMatrixViz() {
            const a = parseFloat(document.getElementById('slider-ma').value);
            const b = parseFloat(document.getElementById('slider-mb').value);
            const c = parseFloat(document.getElementById('slider-mc').value);
            const d = parseFloat(document.getElementById('slider-md').value);

            document.getElementById('val-ma').innerText = a.toFixed(1);
            document.getElementById('val-mb').innerText = b.toFixed(1);
            document.getElementById('val-mc').innerText = c.toFixed(1);
            document.getElementById('val-md').innerText = d.toFixed(1);

            const canvas = document.getElementById('matrixCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const center = w / 2;
            const scale = 40;

            ctx.clearRect(0, 0, w, h);

            // Draw original grid (faint)
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            for(let i = -5; i <= 5; i++) {
                ctx.beginPath();
                ctx.moveTo(center + i*scale, 0); ctx.lineTo(center + i*scale, h);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, center + i*scale); ctx.lineTo(w, center + i*scale);
                ctx.stroke();
            }

            // Draw transformed grid
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            for(let i = -5; i <= 5; i++) {
                // Vertical lines (transformed)
                // (i, -5) to (i, 5)
                let x1 = a*i + b*(-5); let y1 = c*i + d*(-5);
                let x2 = a*i + b*(5); let y2 = c*i + d*(5);
                ctx.beginPath();
                ctx.moveTo(center + x1*scale, center - y1*scale);
                ctx.lineTo(center + x2*scale, center - y2*scale);
                ctx.stroke();

                // Horizontal lines (transformed)
                // (-5, i) to (5, i)
                x1 = a*(-5) + b*i; y1 = c*(-5) + d*i;
                x2 = a*(5) + b*i; y2 = c*(5) + d*i;
                ctx.beginPath();
                ctx.moveTo(center + x1*scale, center - y1*scale);
                ctx.lineTo(center + x2*scale, center - y2*scale);
                ctx.stroke();
            }

            // Basis vectors
            ctx.lineWidth = 3;
            // Vector i (1,0) -> (a, c)
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(center + a*scale, center - c*scale);
            ctx.stroke();

            // Vector j (0,1) -> (b, d)
            ctx.strokeStyle = '#10b981';
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(center + b*scale, center - d*scale);
            ctx.stroke();

            // Analysis
            const det = a*d - b*c;
            const desc = document.getElementById('matrix-desc');
            if(Math.abs(det) < 0.01) desc.innerText = "Determinant ≈ 0: Dimension Collapse!";
            else if(a === 1 && b === 0 && c === 0 && d === 1) desc.innerText = "Identity Matrix: No change.";
            else if(a === d && b === -c && Math.abs(a*a + b*b - 1) < 0.01) desc.innerText = "Rotation Matrix.";
            else desc.innerText = `Determinant: ${det.toFixed(2)}`;
        }

        // --- GRADIENT DESCENT VIZ ---
        let gradState = { x: 2.0, trace: [] };

        function drawGradViz() {
            const canvas = document.getElementById('gradCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            
            // Coordinate system: X from -3 to 3, Y from -2 to 10
            const mapX = (x) => (x + 3) / 6 * w;
            const mapY = (y) => h - (y + 2) / 12 * h;

            ctx.clearRect(0, 0, w, h);

            // 1. Draw Function f(x) = x^2 + 3sin(2x)
            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            for(let px = 0; px <= w; px++) {
                const x = (px / w) * 6 - 3;
                const y = x*x + 3*Math.sin(2*x);
                if (px===0) ctx.moveTo(px, mapY(y));
                else ctx.lineTo(px, mapY(y));
            }
            ctx.stroke();

            // 2. Draw Current Point
            const cx = gradState.x;
            const cy = cx*cx + 3*Math.sin(2*cx);
            
            ctx.beginPath();
            ctx.fillStyle = '#ef4444';
            ctx.arc(mapX(cx), mapY(cy), 6, 0, Math.PI*2);
            ctx.fill();

            // 3. Draw Tangent Line (Gradient)
            const deriv = 2*cx + 6*Math.cos(2*cx); // f'(x) = 2x + 6cos(2x)
            const tangentLen = 1.0;
            // Point (x,y) to (x+dx, y+dy) where dy/dx = deriv
            const x1 = cx - tangentLen;
            const y1 = cy - deriv * tangentLen;
            const x2 = cx + tangentLen;
            const y2 = cy + deriv * tangentLen;
            
            ctx.beginPath();
            ctx.strokeStyle = '#f59e0b'; // Warning color for slope
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.moveTo(mapX(x1), mapY(y1));
            ctx.lineTo(mapX(x2), mapY(y2));
            ctx.stroke();
            ctx.setLineDash([]);

            // UI Updates
            const lrEl = document.getElementById('slider-lr');
            if (lrEl) {
                const lr = parseFloat(lrEl.value);
                document.getElementById('val-lr').innerText = lr.toFixed(2);
                document.getElementById('grad-x').innerText = cx.toFixed(3);
                document.getElementById('grad-g').innerText = deriv.toFixed(3);
                document.getElementById('grad-u').innerText = (-lr * deriv).toFixed(3);
            }
        }

        function stepGradient() {
            const lr = parseFloat(document.getElementById('slider-lr').value);
            const cx = gradState.x;
            const deriv = 2*cx + 6*Math.cos(2*cx);
            gradState.x = cx - lr * deriv;
            
            // Constrain to view
            if(gradState.x > 3) gradState.x = 3;
            if(gradState.x < -3) gradState.x = -3;
            
            drawGradViz();
        }

        function resetGradient() {
            gradState.x = 2.0; // Start back at the right hill
            drawGradViz();
        }

        // --- PROBABILITY VIZ ---
        const probData = [-1.5, -0.8, -0.2, 0.1, 0.3, 0.5, 1.2, 1.8]; // Fixed "Toy" Dataset

        function drawProbViz() {
            const canvas = document.getElementById('probCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            const mu = parseFloat(document.getElementById('slider-mu').value);
            const sigma = parseFloat(document.getElementById('slider-sigma').value);

            // Mapping: X [-4, 4] -> [0, w], Y [0, 0.5] -> [h, 0]
            const mapX = (x) => (x + 4) / 8 * w;
            const mapY = (y) => h - (y / 0.5) * h;

            ctx.clearRect(0, 0, w, h);

            // 1. Draw Data Points (Histogram-ish)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; // Blue
            probData.forEach(x => {
                const px = mapX(x);
                ctx.fillRect(px - 2, mapY(0.05), 4, mapY(0) - mapY(0.05));
            });

            // 2. Draw Gaussian Curve (Model)
            ctx.beginPath();
            ctx.strokeStyle = '#ef4444'; // Red
            ctx.lineWidth = 2;
            const gaussian = (x, m, s) => (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - m) / s, 2));

            for (let px = 0; px <= w; px++) {
                const x = (px / w) * 8 - 4;
                const y = gaussian(x, mu, sigma);
                if (px === 0) ctx.moveTo(px, mapY(y));
                else ctx.lineTo(px, mapY(y));
            }
            ctx.stroke();

            // 3. Calculate Log-Likelihood
            let ll = 0;
            probData.forEach(x => {
                const prob = gaussian(x, mu, sigma);
                // Avoid log(0)
                ll += Math.log(Math.max(prob, 1e-10));
                
                // Draw "height" lines for each point
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.moveTo(mapX(x), mapY(0));
                ctx.lineTo(mapX(x), mapY(prob));
                ctx.stroke();
            });

            // UI Updates
            document.getElementById('val-mu').innerText = mu.toFixed(1);
            document.getElementById('val-sigma').innerText = sigma.toFixed(1);
            
            const llBox = document.getElementById('val-ll');
            llBox.innerText = ll.toFixed(2);
            
            const feedback = document.getElementById('ll-feedback');
            // True parameters roughly mean=0.2, sigma=1.0 for the toy data
            if (ll > -10.5) {
                 llBox.style.color = 'var(--benign)';
                 feedback.innerText = "Excellent fit! High likelihood.";
            } else {
                 llBox.style.color = 'var(--text-muted)';
                 feedback.innerText = "Adjust parameters to fit the blue bars.";
            }
        }

        // --- DISTRIBUTION ZOO ---
        let distMode = 'bernoulli';
        let distParams = { p: 0.5, n: 10, lambda: 3 };

        function setDistMode(mode) {
            distMode = mode;
            const controls = document.getElementById('dist-controls');
            let html = '';

            if (mode === 'bernoulli') {
                html = `
                    <div class="control-group">
                        <div class="control-header"><span>Probability ($p$)</span><span id="dist-val-p">${distParams.p}</span></div>
                        <input type="range" min="0" max="1" step="0.05" value="${distParams.p}" oninput="updateDistParam('p', this.value)">
                    </div>`;
                document.getElementById('dist-desc').innerText = "Bernoulli(p): Single trial (0 or 1). P(1)=p.";
            } else if (mode === 'binomial') {
                html = `
                    <div class="control-group">
                        <div class="control-header"><span>Trials ($n$)</span><span id="dist-val-n">${distParams.n}</span></div>
                        <input type="range" min="1" max="20" step="1" value="${distParams.n}" oninput="updateDistParam('n', this.value)">
                    </div>
                    <div class="control-group">
                        <div class="control-header"><span>Probability ($p$)</span><span id="dist-val-p">${distParams.p}</span></div>
                        <input type="range" min="0" max="1" step="0.05" value="${distParams.p}" oninput="updateDistParam('p', this.value)">
                    </div>`;
                document.getElementById('dist-desc').innerText = "Binomial(n, p): Number of successes in n trials.";
            } else if (mode === 'poisson') {
                html = `
                    <div class="control-group">
                        <div class="control-header"><span>Rate ($\lambda$)</span><span id="dist-val-lambda">${distParams.lambda}</span></div>
                        <input type="range" min="0.1" max="10" step="0.1" value="${distParams.lambda}" oninput="updateDistParam('lambda', this.value)">
                    </div>`;
                document.getElementById('dist-desc').innerText = "Poisson(λ): Number of events in fixed interval.";
            }
            
            controls.innerHTML = html;
            drawDistViz();
        }

        function updateDistParam(key, val) {
            distParams[key] = parseFloat(val);
            if(document.getElementById(`dist-val-${key}`))
                document.getElementById(`dist-val-${key}`).innerText = distParams[key];
            drawDistViz();
        }

        function drawDistViz() {
            const canvas = document.getElementById('distCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            
            ctx.clearRect(0, 0, w, h);
            
            // Calculate PMF Data
            let data = [];
            // Factorial Helper
            const fact = (n) => n <= 1 ? 1 : n * fact(n-1);
            const comb = (n, k) => fact(n) / (fact(k) * fact(n-k));

            if (distMode === 'bernoulli') {
                data = [
                    { x: 0, p: 1 - distParams.p },
                    { x: 1, p: distParams.p }
                ];
            } else if (distMode === 'binomial') {
                const { n, p } = distParams;
                for(let k=0; k<=n; k++) {
                    const prob = comb(n, k) * Math.pow(p, k) * Math.pow(1-p, n-k);
                    data.push({ x: k, p: prob });
                }
            } else if (distMode === 'poisson') {
                const { lambda } = distParams;
                // Cutoff at plausible max (e.g., lambda + 4*sqrt(lambda)) or fixed 15
                const maxK = Math.ceil(lambda + 4 * Math.sqrt(lambda)) + 2; 
                for(let k=0; k<=maxK; k++) {
                    const prob = (Math.pow(lambda, k) * Math.exp(-lambda)) / fact(k);
                    data.push({ x: k, p: prob });
                }
            }

            // Draw Bar Chart
            const maxVal = Math.max(...data.map(d => d.p)) || 1;
            const count = data.length;
            const barW = (w / count) * 0.8;
            const stepX = w / count;

            // Draw Bars (PMF)
            ctx.fillStyle = '#3b82f6';
            data.forEach((d, i) => {
                const barH = (d.p / maxVal) * (h * 0.8);
                const x = i * stepX + (stepX - barW)/2;
                const y = h - barH;
                
                ctx.fillRect(x, y, barW, barH);
                
                // Label
                ctx.fillStyle = '#94a3b8';
                ctx.font = '12px monospace';
                ctx.fillText(d.x, x + barW/2 - 4, h - 5);
                ctx.fillStyle = '#3b82f6';
            });

            // Draw CDF Line (Overlay)
            ctx.beginPath();
            ctx.strokeStyle = '#f59e0b'; // Orange
            ctx.lineWidth = 2;
            let cumSum = 0;
            data.forEach((d, i) => {
                cumSum += d.p;
                const x = i * stepX + stepX/2;
                const y = h - (cumSum * (h * 0.8)); // CDF is 0-1 mapped to height
                if (i===0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                
                // Dot
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI*2);
                ctx.fill();
            });
            ctx.stroke();
        }

        // --- SPAN VIZ ---
        let spanState = {
            u: { x: 1, y: 0 },
            v: { x: 0, y: 1 },
            dragging: null
        };

        function initSpanViz() {
            const canvas = document.getElementById('spanCanvas');
            if(!canvas) return;
            
            // Event Listeners for Dragging
            canvas.addEventListener('mousedown', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left) / canvas.width * 8 - 4; // Map mouse to [-4, 4]
                const my = -((e.clientY - rect.top) / canvas.height * 7 - 3.5); // Map mouse to [-3.5, 3.5]
                
                // Check dist to u
                const du = Math.sqrt((mx - spanState.u.x)**2 + (my - spanState.u.y)**2);
                const dv = Math.sqrt((mx - spanState.v.x)**2 + (my - spanState.v.y)**2);
                
                if (du < 0.5) spanState.dragging = 'u';
                else if (dv < 0.5) spanState.dragging = 'v';
            });
            
            canvas.addEventListener('mousemove', (e) => {
                if (!spanState.dragging) return;
                const rect = canvas.getBoundingClientRect();
                const mx = (e.clientX - rect.left) / canvas.width * 8 - 4;
                const my = -((e.clientY - rect.top) / canvas.height * 7 - 3.5);
                
                if (spanState.dragging === 'u') { spanState.u.x = mx; spanState.u.y = my; }
                if (spanState.dragging === 'v') { spanState.v.x = mx; spanState.v.y = my; }
                drawSpanViz();
            });
            
            canvas.addEventListener('mouseup', () => spanState.dragging = null);
            canvas.addEventListener('mouseleave', () => spanState.dragging = null);
        }

        function drawSpanViz() {
            const canvas = document.getElementById('spanCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const cx = w/2;
            const cy = h/2;
            const scale = w/8; // 4 units each side

            const toScreen = (x, y) => ({ sx: cx + x*scale, sy: cy - y*scale });

            ctx.clearRect(0, 0, w, h);

            // 1. Draw Grid (Linear Combinations)
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            
            const range = 8;
            for(let i = -range; i <= range; i++) {
                // Lines parallel to v (varying u coeff)
                // Start: i*u - range*v, End: i*u + range*v
                let s = toScreen(i*spanState.u.x - range*spanState.v.x, i*spanState.u.y - range*spanState.v.y);
                let e = toScreen(i*spanState.u.x + range*spanState.v.x, i*spanState.u.y + range*spanState.v.y);
                ctx.beginPath(); ctx.moveTo(s.sx, s.sy); ctx.lineTo(e.sx, e.sy); ctx.stroke();
                
                // Lines parallel to u (varying v coeff)
                s = toScreen(-range*spanState.u.x + i*spanState.v.x, -range*spanState.u.y + i*spanState.v.y);
                e = toScreen(range*spanState.u.x + i*spanState.v.x, range*spanState.u.y + i*spanState.v.y);
                ctx.beginPath(); ctx.moveTo(s.sx, s.sy); ctx.lineTo(e.sx, e.sy); ctx.stroke();
            }

            // 2. Draw Vectors
            const drawVec = (vec, color) => {
                const head = toScreen(vec.x, vec.y);
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                ctx.lineWidth = 3;
                
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(head.sx, head.sy); ctx.stroke();
                ctx.beginPath(); ctx.arc(head.sx, head.sy, 6, 0, Math.PI*2); ctx.fill();
            };

            drawVec(spanState.u, '#ef4444'); // Red
            drawVec(spanState.v, '#10b981'); // Green

            // 3. Updates
            document.getElementById('val-u').innerText = `${spanState.u.x.toFixed(1)}, ${spanState.u.y.toFixed(1)}`;
            document.getElementById('val-v').innerText = `${spanState.v.x.toFixed(1)}, ${spanState.v.y.toFixed(1)}`;

            // Check Independence (Determinant)
            const det = spanState.u.x * spanState.v.y - spanState.u.y * spanState.v.x;
            const status = document.getElementById('span-status');
            if (Math.abs(det) < 0.1) {
                status.innerText = "⚠️ Span: Line (Linearly Dependent!)";
                status.style.color = "var(--warning)";
                status.style.border = "1px solid var(--warning)";
            } else {
                status.innerText = "Span: 2D Plane (Independent)";
                status.style.color = "var(--benign)";
                status.style.border = "1px solid var(--benign)";
            }
        }

        // --- VECTOR FIELD VIZ ---
        let vecMode = 'sink';
        let particles = [];

        function setVectorMode(mode) {
            vecMode = mode;
            // Reset particles
            particles = [];
            for(let i=0; i<30; i++) {
                particles.push({
                    x: (Math.random() - 0.5) * 4, 
                    y: (Math.random() - 0.5) * 4,
                    age: Math.random() * 50
                });
            }
        }

        function drawVectorFieldViz() {
            const canvas = document.getElementById('vectorCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            // Coord Map: [-2, 2] -> Screen
            const mapX = (x) => (x + 2) / 4 * w;
            const mapY = (y) => h - (y + 2) / 4 * h;
            const scale = w / 4; // Pixels per unit

            ctx.clearRect(0, 0, w, h);

            // Field Definition
            const getField = (x, y) => {
                if (vecMode === 'sink') return { x: -x, y: -y, div: -2 }; // Converging
                if (vecMode === 'saddle') return { x: x, y: -y, div: 0 }; // Divergence Free (mostly)
                if (vecMode === 'curl') return { x: -y, y: x, div: 0 };   // Rotation
                return { x: 0, y: 0, div: 0 };
            };

            // 1. Draw Background (Divergence Map)
            const gridSize = 20;
            for(let py=0; py<h; py+=gridSize) {
                for(let px=0; px<w; px+=gridSize) {
                    const x = (px/w)*4 - 2;
                    const y = ((h-py)/h)*4 - 2;
                    const f = getField(x,y);
                    
                    ctx.fillStyle = `rgba(0,0,0,0)`;
                    if(f.div < -0.1) ctx.fillStyle = `rgba(239, 68, 68, 0.1)`; // Red tint
                    if(f.div > 0.1) ctx.fillStyle = `rgba(16, 185, 129, 0.1)`; // Green tint
                    
                    ctx.fillRect(px, py, gridSize, gridSize);
                }
            }

            // 2. Draw Arrows (The Derivative Field)
            ctx.strokeStyle = '#94a3b8';
            ctx.fillStyle = '#94a3b8';
            ctx.lineWidth = 1;
            const step = 0.4;
            for(let x=-2; x<=2; x+=step) {
                for(let y=-2; y<=2; y+=step) {
                    const f = getField(x,y);
                    const mag = Math.sqrt(f.x*f.x + f.y*f.y);
                    if(mag < 0.01) continue;
                    
                    // Normalize for drawing (fixed length arrows often look cleaner)
                    const drawLen = 0.25; 
                    const dx = (f.x / mag) * drawLen;
                    const dy = (f.y / mag) * drawLen;

                    const sx = mapX(x);
                    const sy = mapY(y);
                    const ex = mapX(x + dx);
                    const ey = mapY(y + dy);

                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                    
                    // Arrowhead
                    const angle = Math.atan2(ey-sy, ex-sx);
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex - 5*Math.cos(angle-Math.PI/6), ey - 5*Math.sin(angle-Math.PI/6));
                    ctx.lineTo(ex - 5*Math.cos(angle+Math.PI/6), ey - 5*Math.sin(angle+Math.PI/6));
                    ctx.fill();
                }
            }

            // 3. Draw Particles (Integration / Flow)
            ctx.fillStyle = '#3b82f6'; // Blue particles
            particles.forEach(p => {
                const sx = mapX(p.x);
                const sy = mapY(p.y);
                
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI*2);
                ctx.fill();

                // Update Position (Euler Integration)
                const dt = 0.02;
                const f = getField(p.x, p.y);
                p.x += f.x * dt;
                p.y += f.y * dt;
                p.age += 1;

                // Reset if out of bounds or too old
                if(Math.abs(p.x) > 2 || Math.abs(p.y) > 2 || p.age > 200) {
                    p.x = (Math.random() - 0.5) * 4;
                    p.y = (Math.random() - 0.5) * 4;
                    p.age = 0;
                }
            });

            requestAnimationFrame(drawVectorFieldViz);
        }

        // --- NEURON VIZ ---
        function drawNeuronViz() {
            const canvas = document.getElementById('neuronCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            const w1 = parseFloat(document.getElementById('slider-w1').value);
            const w2 = parseFloat(document.getElementById('slider-w2').value);
            const b = parseFloat(document.getElementById('slider-b').value);

            document.getElementById('val-w1').innerText = w1.toFixed(1);
            document.getElementById('val-w2').innerText = w2.toFixed(1);
            document.getElementById('val-b').innerText = b.toFixed(1);

            // Coordinate System: [-2, 3]
            const mapX = (x) => (x + 2) / 5 * w;
            const mapY = (y) => h - (y + 2) / 5 * h;

            ctx.clearRect(0, 0, w, h);

            // 1. Draw Decision Background (Sigmoid)
            const imgData = ctx.createImageData(w, h);
            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    const x1 = (px / w) * 5 - 2;
                    const x2 = ((h - py) / h) * 5 - 2;
                    const z = w1*x1 + w2*x2 + b;
                    const sigmoid = 1 / (1 + Math.exp(-z));
                    
                    const idx = (py * w + px) * 4;
                    // Blue (Pos) vs Red (Neg)
                    imgData.data[idx] = 59;     // R
                    imgData.data[idx + 1] = 130; // G
                    imgData.data[idx + 2] = 246; // B
                    imgData.data[idx + 3] = sigmoid * 100; // Alpha based on confidence
                    
                    if (sigmoid < 0.5) {
                        imgData.data[idx] = 239; // R
                        imgData.data[idx+1] = 68;
                        imgData.data[idx+2] = 68;
                        imgData.data[idx+3] = (1-sigmoid) * 100;
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);

            // 2. Draw Data Points (AND Gate Logic for example)
            const points = [
                {x:0, y:0, l:0}, {x:0, y:1, l:0}, {x:1, y:0, l:0}, {x:1, y:1, l:1}
            ];

            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(mapX(p.x), mapY(p.y), 8, 0, Math.PI*2);
                ctx.fillStyle = p.l === 1 ? '#3b82f6' : '#ef4444';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
            });

            // 3. Draw Decision Boundary Line
            ctx.beginPath();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            
            const drawLine = (x_start, x_end) => {
                if (Math.abs(w2) < 0.01) {
                    const x_vert = -b/w1;
                    ctx.moveTo(mapX(x_vert), 0);
                    ctx.lineTo(mapX(x_vert), h);
                } else {
                    const y_start = -(w1*x_start + b)/w2;
                    const y_end = -(w1*x_end + b)/w2;
                    ctx.moveTo(mapX(x_start), mapY(y_start));
                    ctx.lineTo(mapX(x_end), mapY(y_end));
                }
            };
            drawLine(-2, 3);
            ctx.stroke();
        }