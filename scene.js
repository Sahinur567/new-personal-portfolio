// Three.js Scene Setup for Premium 3D Portfolio - High-Performance Engine
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        powerPreference: "high-performance",
        antialias: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    // Futuristic Particles Geometry (Cybernetic Sphere)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2200; // Balanced density, buttery smooth 120 FPS
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    const originalPosArray = new Float32Array(particlesCount * 3);
    
    const color1 = new THREE.Color('#fca5a5'); // Light crimson tint
    const color2 = new THREE.Color('#991b1b'); // Deep premium red
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const r = 3 + (Math.random() * 0.5);
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        posArray[i] = x;
        posArray[i+1] = y;
        posArray[i+2] = z;

        originalPosArray[i] = x;
        originalPosArray[i+1] = y;
        originalPosArray[i+2] = z;

        const mixedColor = color1.clone().lerp(color2, Math.random());
        colorsArray[i] = mixedColor.r;
        colorsArray[i+1] = mixedColor.g;
        colorsArray[i+2] = mixedColor.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    const baseColorsAttribute = particlesGeometry.attributes.color.clone();

    // Materials
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.016,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
    });

    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Ambient wireframe sphere
    const wireframeGeometry = new THREE.IcosahedronGeometry(2.5, 2);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        wireframe: true,
        transparent: true,
        opacity: 0.05
    });
    const wireframeSphere = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframeSphere);

    // Mouse Interaction for Repulsion
    const mouse = new THREE.Vector2(-9999, -9999);
    let targetX = 0;
    let targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let hasMouseMoved = false;
    
    // Pre-allocated static objects to completely eliminate garbage collection churn
    const raycaster = new THREE.Raycaster();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectionPoint = new THREE.Vector3();
    const tempPoint = new THREE.Vector3();

    document.addEventListener('mousemove', (event) => {
        hasMouseMoved = true;
        targetX = (event.clientX - windowHalfX) * 0.001;
        targetY = (event.clientY - windowHalfY) * 0.001;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    let scrollY = window.scrollY;
    let maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    let lastScrollRatio = -1;
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    }, { passive: true });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // 1. Smooth Mouse Rotation (Parallax)
        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
        wireframeSphere.rotation.y += 0.05 * (targetX - wireframeSphere.rotation.y);
        wireframeSphere.rotation.x += 0.05 * (targetY - wireframeSphere.rotation.x);

        // Constant Slow Ambient Rotation
        particlesMesh.rotation.y += 0.001;
        wireframeSphere.rotation.y -= 0.001;
        
        // Scroll Parallax
        const scrollParallaxY = -scrollY * 0.0015;
        particlesMesh.position.y = scrollParallaxY;
        wireframeSphere.position.y = scrollParallaxY;

        // 2. Mouse Repulsion Physics
        const checkRepulsion = hasMouseMoved && Math.abs(mouse.x) <= 1 && Math.abs(mouse.y) <= 1;
        if (checkRepulsion) {
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(planeZ, intersectionPoint);
        }

        const positions = particlesGeometry.attributes.position.array;
        const colors = particlesGeometry.attributes.color.array;
        const scrollRatio = Math.min(scrollY / maxScroll, 1.0) || 0;
        const updateColors = Math.abs(scrollRatio - lastScrollRatio) > 0.001;
        if (updateColors) lastScrollRatio = scrollRatio;

        const matrix = particlesMesh.matrixWorld;
        const ix = intersectionPoint.x;
        const iy = intersectionPoint.y;

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            
            const ox = originalPosArray[i3];
            const oy = originalPosArray[i3+1];
            const oz = originalPosArray[i3+2];

            let cx = positions[i3];
            let cy = positions[i3+1];
            let cz = positions[i3+2];

            // Zero-allocation repulsion check
            if (checkRepulsion) {
                tempPoint.set(cx, cy, cz).applyMatrix4(matrix);
                const dx = tempPoint.x - ix;
                const dy = tempPoint.y - iy;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < 1.5) {
                    const force = (1.5 - distSq) * 0.05;
                    cx += dx * force;
                    cy += dy * force;
                }
            }

            // Spring back
            cx += (ox - cx) * 0.1;
            cy += (oy - cy) * 0.1;
            cz = oz + Math.sin(elapsedTime * 2 + ox) * 0.05;

            positions[i3] = cx;
            positions[i3+1] = cy;
            positions[i3+2] = cz;

            // Scroll Color Shifting (only if scroll ratio changed)
            if (updateColors) {
                const baseR = baseColorsAttribute.array[i3];
                const baseG = baseColorsAttribute.array[i3+1];
                const baseB = baseColorsAttribute.array[i3+2];
                colors[i3] = baseR + (0.50 - baseR) * scrollRatio;
                colors[i3+1] = baseG + (0.11 - baseG) * scrollRatio;
                colors[i3+2] = baseB + (0.11 - baseB) * scrollRatio;
            }
        }

        particlesGeometry.attributes.position.needsUpdate = true;
        if (updateColors) {
            particlesGeometry.attributes.color.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
