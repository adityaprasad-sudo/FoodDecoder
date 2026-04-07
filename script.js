    //NOTE: This Javascript is written with the help of claude because i am not really good in 
    // javascript so to fix bugs and make it seamless and easy to understand claude has been 
    // used PLease dont cuss me if something is off.


document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_IMAGE_API = "https://ambitiouspotato-backendforfooddecoder.hf.space/analyze";
    const BACKEND_TEXT_API  = "https://ambitiouspotato-backendforfooddecoder.hf.space/analyze_text";
    const DUMMY_API_KEY     = "shiggaapi";


    const blob = document.getElementById('blob');
    document.addEventListener('mousemove', (e) => {
        const {clientX: x, clientY: y} = e;
        blob.animate({
            left: `${x}px`,
            top: `${y}px`
        }, { duration: 3000, fill: "forwards" });
    });

    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.fade-in-up').forEach(el => scrollObserver.observe(el));
    const tiltCont = document.getElementById('tiltcont');
    const tiltstack = document.getElementById('tiltstack');
    tiltCont.addEventListener('mousemove', (e) => {
            const rect = tiltCont.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const rotateX = (y / rect.height) * -15; 
            const rotateY = (x / rect.width) * 15;  
            
            tiltstack.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        tiltCont.addEventListener('mouseleave', () => {
            tiltstack.style.transform = `rotateX(0deg) rotateY(0deg)`;
            tiltstack.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        });

        tiltCont.addEventListener('mouseenter', () => {
            tiltstack.style.transition = 'transform 0.1s ease-out';
        });

    document.querySelectorAll('.interactive-card').forEach(card => {
        const glare = card.querySelector('.glare');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const rx = ((y - rect.height/2) / (rect.height/2)) * -10;
            const ry = ((x - rect.width/2)  / (rect.width/2))  *  10;
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
            if (glare) glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4), transparent 60%)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1,1,1)';
            if (glare) glare.style.opacity = '0';
            card.style.transition = 'transform 0.5s ease-out';
            setTimeout(() => card.style.transition = 'transform 0.1s ease-out', 500);
        });
    });

    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width  / 2;
            const y = e.clientY - rect.top  - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translate(0,0) scale(1)');
    });

    const openBtn      = document.getElementById('openScannerBtn');
    const closeBtn     = document.getElementById('closeScannerBtn');
    const modal        = document.getElementById('scannerModal');
    const viewport     = document.querySelector('.camera-viewport');
    const statusText   = document.getElementById('scannerStatus');
    const mockResults  = document.getElementById('mockResults');
    const imageInput   = document.getElementById('imageInput');
    const processingUI = document.getElementById('processingUI');

    let html5QrCode = null;


    const formatAIText = (text) => {
        if (!text) return "No summary provided.";
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-dark);font-weight:700;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    const showError = (title, message, icon = '😕') => {
        viewport.style.display    = 'none';
        processingUI.classList.remove('active');
        mockResults.classList.add('show');

        mockResults.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 30px 10px 10px;
                text-align: center;
            ">
                <div style="
                    font-size: 3.5rem;
                    margin-bottom: 20px;
                    animation: fadeUp 0.4s ease;
                ">${icon}</div>

                <h3 style="
                    font-size: 1.3rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    margin-bottom: 10px;
                    color: var(--text-dark);
                ">${title}</h3>

                <p style="
                    font-size: 0.95rem;
                    color: var(--text-muted);
                    line-height: 1.6;
                    max-width: 280px;
                    margin-bottom: 30px;
                ">${message}</p>

                <div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
                    <button
                        class="primary-btn"
                        id="retryBtn"
                        style="width:100%;"
                    >Try Again</button>
                    <label
                        for="imageInput"
                        class="secondary-btn"
                        style="width:100%; cursor:pointer;"
                    >Upload a Photo Instead</label>
                </div>
            </div>
        `;

        document.getElementById('retryBtn').addEventListener('click', startScanningSequence);
    };

    const generateInteractiveReport = (healthsum, ingredientsList, issuesList, benefitsList, healthScore) => {
        modal.querySelector('.scanner-container').scrollTop = 0;

        const safeIngredients = Array.isArray(ingredientsList) ? ingredientsList : [ingredientsList];
        const safeIssues      = Array.isArray(issuesList)      ? issuesList      : [issuesList];
        const safeBenefits    = Array.isArray(benefitsList)    ? benefitsList    : [benefitsList];

        const ingredientsHTML = safeIngredients.map(i => `<li style="margin-bottom:4px;">${i}</li>`).join('');

        const pillStyle = (bg) => `
            display: block;
            width: 100%;
            background: ${bg};
            color: white;
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 0.85rem;
            font-weight: 500;
            line-height: 1.5;
            margin-bottom: 8px;
            word-break: break-word;
            white-space: normal;
            box-sizing: border-box;
        `;

        const issuesHTML = safeIssues.length > 0 && safeIssues[0] !== ""
            ? safeIssues.map(i => `<div style="${pillStyle('#ff9500')}">⚠️ ${i}</div>`).join('')
            : `<div style="${pillStyle('#34c759')}">✅ No major issues detected</div>`;

        const benefitsHTML = safeBenefits.length > 0 && safeBenefits[0] !== ""
            ? safeBenefits.map(b => `<div style="${pillStyle('#34c759')}">✨ ${b}</div>`).join('')
            : `<p style="font-size:0.85rem;color:#86868b;">No notable health benefits found.</p>`;

        let scoreColor = "#ff3b30";
        if (healthScore >= 7) scoreColor = "#34c759";
        else if (healthScore >= 4) scoreColor = "#ff9500";

        mockResults.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
                <div>
                    <h3 style="font-size:1.5rem;margin-bottom:5px;letter-spacing:-0.02em;">Analysis Complete</h3>
                    <p style="color:#86868b;font-size:0.9rem;">Powered by Gemini AI</p>
                </div>
                <div style="text-align:right;background:#f5f5f7;padding:10px 15px;border-radius:16px;">
                    <span style="font-size:0.7rem;color:#86868b;text-transform:uppercase;font-weight:700;display:block;margin-bottom:2px;">Health Score</span>
                    <span style="font-size:2.2rem;font-weight:800;color:${scoreColor};line-height:1;letter-spacing:-0.05em;">${healthScore}</span>
                    <span style="font-size:1rem;color:#86868b;font-weight:600;">/10</span>
                </div>
            </div>

            <div style="background:var(--bg-color);border-radius:16px;padding:20px;text-align:left;margin-bottom:20px;border:1px solid rgba(0,0,0,0.05);">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <span style="font-size:1.2rem;">🧠</span>
                    <h4 style="font-size:1rem;margin:0;font-weight:600;">AI Verdict</h4>
                </div>
                <p style="font-size:0.95rem;line-height:1.6;color:var(--text-dark);">${formatAIText(healthsum)}</p>
            </div>

            <div style="text-align:left;margin-bottom:20px;width:100%;overflow:hidden;">
                <h4 style="font-size:0.85rem;color:#86868b;margin-bottom:10px;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Positive Traits</h4>
                <div style="width:100%;">${benefitsHTML}</div>
            </div>

            <div style="text-align:left;margin-bottom:25px;width:100%;overflow:hidden;">
                <h4 style="font-size:0.85rem;color:#86868b;margin-bottom:10px;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">Potential Concerns</h4>
                <div style="width:100%;">${issuesHTML}</div>
            </div>

            <div style="border:1px solid var(--secondary-gray);border-radius:16px;overflow:hidden;text-align:left;margin-bottom:20px;">
                <button class="accordion-header" style="width:100%;padding:15px;background:white;border:none;text-align:left;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                    <span>🥗 View Ingredients</span><span class="icon">▼</span>
                </button>
                <div class="accordion-content" style="display:none;padding:15px;background:#fafafa;font-size:0.85rem;color:#555;border-top:1px solid var(--secondary-gray);max-height:200px;overflow-y:auto;">
                    <ul style="padding-left:20px;margin:0;">${ingredientsHTML}</ul>
                </div>
            </div>

            <button class="secondary-btn" id="resetScannerBtnDynamic" style="width:100%;padding:16px;font-weight:600;">Scan Another Item</button>
        `;

        const accContent = mockResults.querySelector('.accordion-content');
        const accIcon    = mockResults.querySelector('.icon');
        mockResults.querySelector('.accordion-header').addEventListener('click', () => {
            const hidden = accContent.style.display === 'none';
            accContent.style.display = hidden ? 'block' : 'none';
            accIcon.innerText = hidden ? '▲' : '▼';
        });

        document.getElementById('resetScannerBtnDynamic').addEventListener('click', () => {
            mockResults.classList.remove('show');
            startScanningSequence();
        });
    };

    imageInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        modal.classList.add('active');
        viewport.style.display = 'none';
        mockResults.classList.remove('show');
        processingUI.classList.add('active');

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("api_key", DUMMY_API_KEY);

            const response = await fetch(BACKEND_IMAGE_API, { method: "POST", body: formData });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            processingUI.classList.remove('active');
            mockResults.classList.add('show');
            generateInteractiveReport(
                data.health_summary, data.ingredients,
                data.potential_issues, data.health_benefits, data.health_score
            );
        } catch (error) {
            console.error(error);
            showError(
                "Analysis Failed",
                "We couldn't read the food label from this image. Please try a clearer photo with the ingredients list visible.",
                "📷"
            );
        }

        imageInput.value = "";
    });

    const startScanningSequence = () => {
        viewport.style.display = 'block';
        processingUI.classList.remove('active');
        mockResults.classList.remove('show');
        statusText.innerText = "Initializing Camera...";

        if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, aspectRatio: window.innerWidth / 400, qrbox: (viewportWidth, viewportHeight) => {return{width: viewportWidth * 0.75, height: 150}; } },

            async (decodedText) => {
                await html5QrCode.stop();
                viewport.style.display = 'none';
                processingUI.classList.add('active');

                try {
                    const offRes  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
                    const offData = await offRes.json();

                    if (offData.status !== 1 || !offData.product?.ingredients_text) {
                        processingUI.classList.remove('active');
                        mockResults.classList.add('show');
                        showError(
                            "Product Not Found",
                            "Sorry, this food item isn't available in our database yet. Try uploading a photo of the ingredients label instead — our AI can read it directly!",
                            "🔍"
                        );
                        return;
                    }

                    const aiRes  = await fetch(BACKEND_TEXT_API, {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({
                            ingredients: offData.product.ingredients_text,
                            api_key: DUMMY_API_KEY
                        })
                    });

                    if (!aiRes.ok) throw new Error("AI service error");

                    const aiData = await aiRes.json();
                    processingUI.classList.remove('active');
                    mockResults.classList.add('show');
                    generateInteractiveReport(
                        aiData.health_summary, aiData.ingredients,
                        aiData.potential_issues, aiData.health_benefits, aiData.health_score
                    );

                } catch (err) {
                    console.error(err);
                    showError(
                        "Connection Error",
                        "We had trouble reaching our servers. Please check your internet connection and try again.",
                        "📡"
                    );
                }
            },


            () => { statusText.innerText = "Align barcode within frame..."; }
        )
        .catch(err => {
            console.error(err);
            showError(
                "Camera Access Denied",
                "We need camera permission to scan barcodes. Please allow access and try again, or upload a photo instead.",
                "📵"
            );
        });
    };

    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        startScanningSequence();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (html5QrCode?.isScanning) html5QrCode.stop();
    });

    modal.querySelector('.scanner-backdrop').addEventListener('click', () => {
        modal.classList.remove('active');
        if (html5QrCode?.isScanning) html5QrCode.stop();
    });
});
