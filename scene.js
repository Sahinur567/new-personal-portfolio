// Three.js Scene Setup for Premium 3D Portfolio
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent background
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Futuristic Particles Geometry (Cybernetic Sphere)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 4000; // Increased density for premium feel
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    // Store original positions for mouse repulsion physics
    const originalPosArray = new Float32Array(particlesCount * 3);
    
    const color1 = new THREE.Color('#fca5a5'); // Light red/pink
    const color2 = new THREE.Color('#991b1b'); // Deep premium red
    
    for(let i = 0; i < particlesCount * 3; i+=3) {
        // Random points on a sphere
        const r = 3 + (Math.random() * 0.5); // Slight variation in radius
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

        // Mix colors based on position
        const mixedColor = color1.clone().lerp(color2, Math.random());
        colorsArray[i] = mixedColor.r;
        colorsArray[i+1] = mixedColor.g;
        colorsArray[i+2] = mixedColor.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    // Save base color for scroll shifting
    const baseColorsAttribute = particlesGeometry.attributes.color.clone();

    // Materials
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.015,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });

    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Add some faint ambient lines (Wireframe Sphere)
    const wireframeGeometry = new THREE.IcosahedronGeometry(2.5, 2);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0xef4444, // Red glow
        wireframe: true,
        transparent: true,
        opacity: 0.05
    });
    const wireframeSphere = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframeSphere);

    // Mouse Interaction for Repulsion
    let mouse = new THREE.Vector2(-9999, -9999);
    let targetX = 0;
    let targetY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    
    // Raycaster for 3D mouse interaction
    const raycaster = new THREE.Raycaster();

    document.addEventListener('mousemove', (event) => {
        // For scene rotation
        targetX = (event.clientX - windowHalfX) * 0.001;
        targetY = (event.clientY - windowHalfY) * 0.001;

        // For raycasting
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Handle Scroll for Parallax and Color Shifting
    let scrollY = window.scrollY;
    let maxScroll = document.body.scrollHeight - window.innerHeight;
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        maxScroll = document.body.scrollHeight - window.innerHeight;
    });

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

        // Constant Slow Rotation
        particlesMesh.rotation.y += 0.001;
        wireframeSphere.rotation.y -= 0.001;
        
        // Scroll Parallax
        particlesMesh.position.y = -scrollY * 0.0015;
        wireframeSphere.position.y = -scrollY * 0.0015;

        // 2. Mouse Repulsion Physics
        raycaster.setFromCamera(mouse, camera);
        // We find where the ray intersects the Z plane of the sphere
        let planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        let intersectionPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeZ, intersectionPoint);

        const positions = particlesGeometry.attributes.position.array;
        const colors = particlesGeometry.attributes.color.array;
        
        // Calculate scroll ratio for color shifting
        let scrollRatio = Math.min(scrollY / maxScroll, 1.0) || 0;

        for(let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            
            // Get original position
            const ox = originalPosArray[i3];
            const oy = originalPosArray[i3+1];
            const oz = originalPosArray[i3+2];

            // Current position
            let cx = positions[i3];
            let cy = positions[i3+1];
            let cz = positions[i3+2];

            // Transform point to world space to check against mouse
            let point = new THREE.Vector3(cx, cy, cz);
            point.applyMatrix4(particlesMesh.matrixWorld);

            // Distance from mouse intersection
            let dx = point.x - intersectionPoint.x;
            let dy = point.y - intersectionPoint.y;
            let distSq = dx*dx + dy*dy;
            
            // Repulsion force
            if(distSq < 1.5) {
                let force = (1.5 - distSq) * 0.05;
                cx += dx * force;
                cy += dy * force;
            }

            // Spring back to original position
            cx += (ox - cx) * 0.1;
            cy += (oy - cy) * 0.1;
            cz += (oz - cz) * 0.1;

            // Apply wave breathing effect to Z based on time
            cz = oz + Math.sin(elapsedTime * 2 + ox) * 0.05;

            positions[i3] = cx;
            positions[i3+1] = cy;
            positions[i3+2] = cz;

            // 3. Scroll Color Shifting (Shift towards a deeper blue/teal as you scroll down)
            const baseR = baseColorsAttribute.array[i3];
            const baseG = baseColorsAttribute.array[i3+1];
            const baseB = baseColorsAttribute.array[i3+2];
            
            // Target color shift (e.g., towards deep crimson #7f1d1d)
            const targetR = 0.50;
            const targetG = 0.11;
            const targetB = 0.11;

            colors[i3] = baseR + (targetR - baseR) * scrollRatio;
            colors[i3+1] = baseG + (targetG - baseG) * scrollRatio;
            colors[i3+2] = baseB + (targetB - baseB) * scrollRatio;
        }

        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.color.needsUpdate = true;

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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
});
