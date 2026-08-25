document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // 0. Preloader
    // =========================================================================
    const fill = document.getElementById('pl-fill');
    const preloader = document.getElementById('preloader');

    setTimeout(() => {
        fill.style.width = '100%';
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                initAll();
            }, 800);
        }, 400);
    }, 100);

    function initAll() {
        initGSAPAnimations();
        init3DParallax();
        init3DCardTilt();
    }

    // =========================================================================
    // 1. Custom Cursor
    // =========================================================================
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const isTouch = matchMedia('(pointer: coarse)').matches;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    if (!isTouch && dot && ring) {
        document.body.classList.add('custom-cursor-active');
        document.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
        });
        function renderCursor() {
            dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
            rx += (mx - rx) * 0.15;
            ry += (my - ry) * 0.15;
            ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
            requestAnimationFrame(renderCursor);
        }
        renderCursor();
    }

    // =========================================================================
    // 2. Magnetic Buttons
    // =========================================================================
    const magnets = document.querySelectorAll('.magnetic');
    magnets.forEach(magnet => {
        magnet.addEventListener('mousemove', function (e) {
            const pos = magnet.getBoundingClientRect();
            const x = e.clientX - pos.left - pos.width / 2;
            const y = e.clientY - pos.top - pos.height / 2;
            gsap.to(magnet, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: "power2.out" });
        });
        magnet.addEventListener('mouseleave', function () {
            gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        });
    });

    // =========================================================================
    // 3. Navbar & Mobile Menu
    // =========================================================================
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // =========================================================================
    // 4. GSAP Animations + Image Sequence
    // =========================================================================
    gsap.registerPlugin(ScrollTrigger);

    function initGSAPAnimations() {
        // --- Hero entrance ---
        const heroTl = gsap.timeline();
        heroTl
            .from(".subtitle", { opacity: 0, y: 30, duration: 1.2, ease: "expo.out" })
            .from(".title", { opacity: 0, y: 40, duration: 1.5, ease: "expo.out" }, "-=1.0")
            .from(".description", { opacity: 0, y: 25, duration: 1.2, ease: "expo.out" }, "-=1.0")
            .from(".cta-group", { opacity: 0, y: 25, duration: 1.2, ease: "expo.out" }, "-=1.0")
            .from(".db-item", { opacity: 0, y: 35, stagger: 0.1, duration: 1.2, ease: "expo.out" }, "-=0.8");

        // --- IMAGE SEQUENCE (Full 3D Background) ---
        const seqCanvas = document.getElementById("sequence-canvas");
        if (seqCanvas) {
            const ctx = seqCanvas.getContext("2d");
            const frameCount = 300;
            const currentFrame = i => `assets/sequence/ezgif-frame-${(i + 1).toString().padStart(3, '0')}.jpg`;

            const images = [];
            const seq = { frame: 0 };

            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                img.src = currentFrame(i);
                images.push(img);
            }

            function setupCanvas() {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                seqCanvas.width = vw * dpr;
                seqCanvas.height = vh * dpr;
                seqCanvas.style.width = vw + 'px';
                seqCanvas.style.height = vh + 'px';
            }

            function renderSeq() {
                const img = images[seq.frame];
                if (!img || !img.complete || !img.naturalWidth) return;

                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const cw = seqCanvas.width / dpr;
                const ch = seqCanvas.height / dpr;

                // Cover-fit rendering
                const imgR = img.naturalWidth / img.naturalHeight;
                const canR = cw / ch;
                let dw, dh, dx, dy;

                if (imgR > canR) {
                    dh = ch; dw = ch * imgR;
                    dx = (cw - dw) / 2; dy = 0;
                } else {
                    dw = cw; dh = cw / imgR;
                    dx = 0; dy = (ch - dh) / 2;
                }

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.clearRect(0, 0, cw, ch);
                ctx.drawImage(img, dx, dy, dw, dh);
            }

            images[0].onload = () => { setupCanvas(); renderSeq(); };

            // Scrub sequence on scroll - finishes as Services section is reached
            gsap.to(seq, {
                frame: frameCount - 1,
                snap: "frame",
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    endTrigger: ".services",
                    end: "top top",
                    scrub: 0.5
                },
                onUpdate: renderSeq
            });

            // Fade out sequence canvas when entering Services section
            gsap.to("#sequence-canvas, .seq-overlay", {
                opacity: 0,
                ease: "none",
                scrollTrigger: {
                    trigger: ".services",
                    start: "top 90%",
                    end: "top 30%",
                    scrub: true
                }
            });

            let lastW = window.innerWidth;
            window.addEventListener('resize', () => {
                if (window.innerWidth !== lastW) {
                    lastW = window.innerWidth;
                    setupCanvas();
                    renderSeq();
                }
            });
        }

        // --- Hero parallax: content moves faster than sequence ---
        gsap.to(".hero-content", {
            y: -120,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "top top",
                end: "60% top",
                scrub: true
            }
        });

        gsap.to(".data-bar", {
            y: -80,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                start: "30% top",
                end: "70% top",
                scrub: true
            }
        });

        // --- Section reveals with 3D depth ---
        gsap.from(".services .section-header", {
            scrollTrigger: { trigger: ".services", start: "top 80%" },
            opacity: 0, y: 50, rotateX: 8, duration: 1, ease: "power3.out"
        });
        gsap.from(".service-card", {
            scrollTrigger: { trigger: ".services-grid", start: "top 85%" },
            opacity: 0, y: 60, rotateX: 5, duration: 0.8, stagger: 0.12, ease: "power3.out"
        });

        gsap.from(".work .section-header", {
            scrollTrigger: { trigger: ".work", start: "top 80%" },
            opacity: 0, y: 50, rotateX: 8, duration: 1, ease: "power3.out"
        });
        gsap.from(".project-card", {
            scrollTrigger: { trigger: ".projects-grid", start: "top 85%" },
            opacity: 0, scale: 0.93, y: 60, rotateX: 4, duration: 0.9, stagger: 0.15, ease: "power3.out"
        });

        gsap.from(".video-card", {
            scrollTrigger: { trigger: ".video-grid", start: "top 85%" },
            opacity: 0, y: 50, stagger: 0.2, duration: 1, ease: "expo.out"
        });

        gsap.from(".contact-container", {
            scrollTrigger: { trigger: ".contact", start: "top 80%" },
            opacity: 0, y: 60, duration: 1, ease: "expo.out"
        });
    }

    // =========================================================================
    // 5. 3D Mouse Parallax — Content reacts to mouse for depth
    // =========================================================================
    function init3DParallax() {
        if (isTouch) return;

        let mouseX = 0, mouseY = 0;
        let targetMX = 0, targetMY = 0;

        document.addEventListener('mousemove', e => {
            // Normalize to -1 to 1
            targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
            targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        const heroContent = document.querySelector('.hero-content');
        const dataBar = document.querySelector('.data-bar');
        const seqCanvas = document.getElementById('sequence-canvas');

        function animateParallax() {
            mouseX += (targetMX - mouseX) * 0.04;
            mouseY += (targetMY - mouseY) * 0.04;

            // Hero content moves opposite to mouse (foreground depth)
            if (heroContent) {
                heroContent.style.transform = `translate(${mouseX * -12}px, ${mouseY * -8}px)`;
            }
            if (dataBar) {
                dataBar.style.transform = `translate(${mouseX * -6}px, ${mouseY * -4}px)`;
            }

            // Sequence canvas shifts subtly with mouse (background depth)
            if (seqCanvas) {
                seqCanvas.style.transform = `translate(${mouseX * 5}px, ${mouseY * 4}px)`;
            }

            requestAnimationFrame(animateParallax);
        }
        animateParallax();
    }

    // =========================================================================
    // 6. 3D Card Tilt on Hover
    // =========================================================================
    function init3DCardTilt() {
        if (isTouch) return;

        const cards = document.querySelectorAll('.service-card, .project-card, .video-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -8;
                const rotateY = ((x - centerX) / centerX) * 8;

                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
    }

    // =========================================================================
    // 7. Contact Form AJAX
    // =========================================================================
    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    if (contactForm) {
        contactForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const data = new FormData(contactForm);
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Sending...";

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    formStatus.innerText = "Thanks! Your message has been sent successfully.";
                    formStatus.style.color = "var(--text-primary)";
                    formStatus.style.display = "block";
                    contactForm.reset();
                } else {
                    formStatus.innerText = "Oops! There was a problem submitting your form.";
                    formStatus.style.color = "var(--accent-primary)";
                    formStatus.style.display = "block";
                }
            } catch (error) {
                formStatus.innerText = "Oops! There was a problem submitting your form.";
                formStatus.style.color = "var(--accent-primary)";
                formStatus.style.display = "block";
            } finally {
                submitBtn.innerText = originalBtnText;
            }
        });
    }
});
