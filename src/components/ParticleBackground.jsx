import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

        const CONFIG = {
            PARTICLE_COUNT: 20000,
            EDGE_RATIO: 0.15,
            ORBIT_DISTANCE_RATIO: 0.75,
            CIRCLE_SIZE_RATIO: 0.65,
            ORBIT_SPEED: 0.000005,
            PARTICLE_WAVE_SPEED: 0.0008,
            PARTICLE_WAVE_AMP: 12,
            COLORS: ['#252525', '#303030', '#3a3a3a', '#454545', '#505050'],
            MOUSE_RADIUS: 75, // Circunferencia mucho más corta y precisa
            MOUSE_PUSH: 5.0,
            FRICTION: 0.93,
            BLACK_HOLE_THRESHOLD: 10000, // 10 segundos de espera
            EXPLOSION_THRESHOLD: 22000, // 22 segundos para la gran explosión
            SUCTION_FORCE: 0.15
        };

        let width, height, centerX, centerY, minDim, dpr;
        let orbitAngle = 0;
        let targetMouseX = -1000;
        let targetMouseY = -1000;
        let prevMouseX = -1000;
        let prevMouseY = -1000;
        let mouseStillTime = 0;
        let lastTime = performance.now();
        let mode = 'orbit'; // 'orbit' o 'scatter'
        let explosionFlash = 0;

        // Estructuras de datos optimizadas
        const particles = new Float32Array(CONFIG.PARTICLE_COUNT * 8); // x, y, ox, oy, px, py, size, heat
        const pGroup = new Uint8Array(CONFIG.PARTICLE_COUNT);
        const pColorIndex = new Uint8Array(CONFIG.PARTICLE_COUNT);

        // Agrupamos por color para iterar solo una vez por color
        const colorGroups = Array.from({ length: CONFIG.COLORS.length }, () => []);

        const resize = () => {
            const oldWidth = width;
            const oldHeight = height;

            dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;

            // Ajustar resolución interna para evitar aliasing
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            centerX = width / 2;
            centerY = height / 2;
            minDim = Math.min(width, height);
            ctx.imageSmoothingEnabled = true; // Habilitamos para mayor fluidez de movimiento

            // Responsividad post-explosión: Escalar partículas si ya están dispersas
            if (mode === 'scatter' && oldWidth && oldHeight) {
                const scaleX = width / oldWidth;
                const scaleY = height / oldHeight;
                for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
                    const idx = i * 8;
                    particles[idx] *= scaleX;
                    particles[idx + 1] *= scaleY;
                }
            }
        };

        const initParticles = () => {
            resize();
            const edgeCount = Math.floor(CONFIG.PARTICLE_COUNT * CONFIG.EDGE_RATIO);

            // Limpiar grupos de colores
            colorGroups.forEach(g => g.length = 0);
            mode = 'orbit';

            for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
                const idx = i * 8;
                pGroup[i] = i % 2;

                let angle = Math.random() * Math.PI * 2;
                let isEdge = i < edgeCount;
                let radius = isEdge ? (0.98 + Math.random() * 0.02) : Math.sqrt(Math.random()) * 0.98;

                const cIdx = Math.floor(Math.random() * CONFIG.COLORS.length);
                pColorIndex[i] = cIdx;
                colorGroups[cIdx].push(i); // Guardamos el índice real

                particles[idx] = Math.cos(angle) * radius; // x
                particles[idx + 1] = Math.sin(angle) * radius; // y
                particles[idx + 2] = 0; // ox
                particles[idx + 3] = 0; // oy
                particles[idx + 4] = Math.random() * Math.PI * 2; // px
                particles[idx + 5] = Math.random() * Math.PI * 2; // py
                // Partículas más grandes y visibles
                particles[idx + 6] = isEdge ? 3.2 : 2.2;
                particles[idx + 7] = 0; // heat (0 a 1)
            }
        };

        let animationFrameId;

        const explode = () => {
            explosionFlash = 1.0;
            mode = 'scatter';

            for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
                const idx = i * 8;

                // Reducir cantidad post-explosión: Solo el 30% sobrevive
                if (Math.random() > 0.3) {
                    particles[idx + 7] = -1;
                    continue;
                }

                // Spread inicial
                particles[idx] = targetMouseX + (Math.random() - 0.5) * 40;
                particles[idx + 1] = targetMouseY + (Math.random() - 0.5) * 40;

                const isSpecial = Math.random() < 0.1; // Más partículas de colores pero pequeñas
                const angle = Math.random() * Math.PI * 2;

                let force = (Math.random() * 15 + 1) * (isSpecial ? 2.5 : 1);

                particles[idx + 2] = Math.cos(angle) * force;
                particles[idx + 3] = Math.sin(angle) * force;

                // Drift/Movimiento extra
                particles[idx + 4] = Math.random() * Math.PI * 2;
                particles[idx + 5] = Math.random() * Math.PI * 2;

                if (isSpecial) {
                    particles[idx + 6] = 2.0; // Más pequeñas para que no se vean cuadradas
                    const colorType = Math.floor(Math.random() * 4);
                    particles[idx + 7] = 2 + colorType;
                } else {
                    particles[idx + 6] = 1.8; // Muy sutiles
                    particles[idx + 7] = 0;
                }
            }
        };

        const animate = (currentTime) => {
            // Calcular delta time para un movimiento suave e independiente de los FPS
            const dt = currentTime - lastTime;
            lastTime = currentTime;

            const distMoved = Math.sqrt(Math.pow(targetMouseX - prevMouseX, 2) + Math.pow(targetMouseY - prevMouseY, 2));
            if (distMoved < 2.0 && targetMouseX > 0) {
                mouseStillTime += dt;
            } else {
                // Ya no reiniciamos automáticamente al mover el mouse si estamos en modo scatter
                mouseStillTime = 0;
            }
            prevMouseX = targetMouseX;
            prevMouseY = targetMouseY;

            const isEventActive = mouseStillTime > CONFIG.BLACK_HOLE_THRESHOLD;
            const eventProgress = isEventActive ? Math.min(1, (mouseStillTime - CONFIG.BLACK_HOLE_THRESHOLD) / 10000) : 0;

            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, width, height);

            orbitAngle += CONFIG.ORBIT_SPEED * dt;
            const maxRadius = minDim * CONFIG.CIRCLE_SIZE_RATIO;
            const orbitDist = minDim * CONFIG.ORBIT_DISTANCE_RATIO;

            const dynamicRadius = isEventActive ? CONFIG.MOUSE_RADIUS + eventProgress * (minDim * 2) : CONFIG.MOUSE_RADIUS;
            const radiusLimitSq = dynamicRadius * dynamicRadius;

            const cCos = Math.cos(orbitAngle) * orbitDist;
            const cSin = Math.sin(orbitAngle) * orbitDist;
            const centers = [
                { x: centerX + cCos, y: centerY + cSin },
                { x: centerX - cCos, y: centerY - cSin }
            ];

            const margin = mode === 'orbit' ? (width < 600 ? 15 : 35) : -500;
            const limitW = width - margin;
            const limitH = height - margin;

            let particlesSwallowed = 0;

            for (let c = 0; c < CONFIG.COLORS.length; c++) {
                const group = colorGroups[c];
                const baseHex = CONFIG.COLORS[c].replace('#', '');
                let rBase, gBase, bBase;
                if (baseHex.length === 3) {
                    rBase = parseInt(baseHex[0] + baseHex[0], 16);
                    gBase = parseInt(baseHex[1] + baseHex[1], 16);
                    bBase = parseInt(baseHex[2] + baseHex[2], 16);
                } else {
                    rBase = parseInt(baseHex.substring(0, 2), 16);
                    gBase = parseInt(baseHex.substring(2, 4), 16);
                    bBase = parseInt(baseHex.substring(4, 6), 16);
                }

                ctx.fillStyle = CONFIG.COLORS[c];
                ctx.beginPath();

                for (let j = 0; j < group.length; j++) {
                    const i = group[j];
                    const idx = i * 8;

                    // Si la partícula ya fue tragada, no hacer nada y contarla
                    if (particles[idx + 7] === -1) {
                        particlesSwallowed++;
                        continue;
                    }

                    const center = centers[pGroup[i]];
                    const heat = particles[idx + 7];

                    const waveAmp = CONFIG.PARTICLE_WAVE_AMP * Math.max(0, 1 - heat * 1.5);
                    const waveX = Math.sin(currentTime * CONFIG.PARTICLE_WAVE_SPEED + particles[idx + 4]) * waveAmp;
                    const waveY = Math.cos(currentTime * CONFIG.PARTICLE_WAVE_SPEED + particles[idx + 5]) * waveAmp;

                    let baseDrawX = mode === 'orbit' ? (center.x + (particles[idx] * maxRadius) + waveX) : (particles[idx]);
                    let baseDrawY = mode === 'orbit' ? (center.y + (particles[idx + 1] * maxRadius) + waveY) : (particles[idx + 1]);

                    let ox = particles[idx + 2];
                    let oy = particles[idx + 3];
                    const dx = (baseDrawX + ox) - targetMouseX;
                    const dy = (baseDrawY + oy) - targetMouseY;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq) || 1;

                    // ABSORCIÓN: Si está muy cerca del centro, desaparece (se marca con -1)
                    if (mode === 'orbit' && isEventActive && dist < 20) {
                        particles[idx + 7] = -1;
                        particlesSwallowed++;
                        continue;
                    }

                    if (distSq < radiusLimitSq && mode === 'orbit') {
                        const ratio = 1 - dist / dynamicRadius;
                        if (isEventActive) {
                            particles[idx + 7] = Math.min(1, particles[idx + 7] + 0.005);
                        } else {
                            particles[idx + 7] = Math.max(0, particles[idx + 7] - 0.008);
                        }

                        if (heat > 0.4) {
                            const suctionRatio = (heat - 0.4) * 2.5;
                            const suction = suctionRatio * (CONFIG.SUCTION_FORCE + eventProgress * 5.0) * ratio;
                            ox -= (dx / dist) * suction * dt;
                            oy -= (dy / dist) * suction * dt;
                        } else {
                            const pushEffect = ratio * ratio * CONFIG.MOUSE_PUSH;
                            ox += (dx / dist) * pushEffect;
                            oy += (dy / dist) * pushEffect;
                        }
                    } else if (mode === 'orbit') {
                        particles[idx + 7] = Math.max(0, particles[idx + 7] - 0.008);
                    }

                    // Suavizar el retorno: Si no estamos en modo evento (mouse movido), usar fricción alta (lento retorno)
                    const baseFriction = isEventActive ? CONFIG.FRICTION : 0.965;
                    // Fricción constante en scatter para evitar parpadeos "horribles"
                    const frictionVal = mode === 'scatter' ? 0.96 : (heat > 0.9 ? 0.98 : baseFriction);
                    const frameFriction = Math.pow(frictionVal, dt / 16.6);
                    ox *= frameFriction;
                    oy *= frameFriction;
                    particles[idx + 2] = ox;
                    particles[idx + 3] = oy;

                    if (mode === 'scatter') {
                        // En modo scatter, p[idx+2/3] es velocidad. Actualizamos posición.
                        // Añadimos un pequeño "drift" u ondulación para que se vea vivo
                        const drift = Math.sin(currentTime * 0.002 + particles[idx + 4]) * 0.5;
                        particles[idx] += particles[idx + 2] + drift;
                        particles[idx + 1] += particles[idx + 3] + drift;
                        baseDrawX = particles[idx];
                        baseDrawY = particles[idx + 1];
                    }

                    const finalX = baseDrawX + ox;
                    const finalY = baseDrawY + oy;

                    // ABSORCIÓN POST-MOVIMIENTO: Verificar si tras moverse cayó dentro o cruzó el agujero negro
                    if (mode === 'orbit' && isEventActive) {
                        const fdx = finalX - targetMouseX;
                        const fdy = finalY - targetMouseY;
                        // Si está dentro del radio de absorción tras el movimiento, adios.
                        if (fdx * fdx + fdy * fdy < 400) { // 20^2
                            particles[idx + 7] = -1;
                            particlesSwallowed++;
                            continue;
                        }
                    }

                    if (heat <= 0 && finalX > margin && finalX < limitW && finalY > margin && finalY < limitH) {
                        ctx.rect(finalX, finalY, particles[idx + 6], particles[idx + 6]);
                    }
                }
                ctx.fill();

                for (let j = 0; j < group.length; j++) {
                    const i = group[j];
                    const idx = i * 8;
                    const heat = particles[idx + 7];

                    if (heat > 0) {
                        let finalX, finalY;

                        if (mode === 'scatter') {
                            finalX = particles[idx];
                            finalY = particles[idx + 1];
                        } else {
                            const waveAmp = CONFIG.PARTICLE_WAVE_AMP * Math.max(0, 1 - heat * 1.5);
                            const baseDrawXHeat = (centers[pGroup[i]].x + (particles[idx] * maxRadius) + Math.sin(currentTime * CONFIG.PARTICLE_WAVE_SPEED + particles[idx + 4]) * waveAmp);
                            const baseDrawYHeat = (centers[pGroup[i]].y + (particles[idx + 1] * maxRadius) + Math.cos(currentTime * CONFIG.PARTICLE_WAVE_SPEED + particles[idx + 5]) * waveAmp);
                            finalX = baseDrawXHeat + particles[idx + 2];
                            finalY = baseDrawYHeat + particles[idx + 3];
                        }

                        if (finalX > margin && finalX < limitW && finalY > margin && finalY < limitH) {
                            if (heat >= 2.0) {
                                // Colores especiales de explosión
                                if (heat >= 5) ctx.fillStyle = '#39ff14'; // Lime
                                else if (heat >= 4) ctx.fillStyle = '#ffd700'; // Gold
                                else if (heat >= 3) ctx.fillStyle = '#ff00ff'; // Magenta
                                else ctx.fillStyle = '#00ffff'; // Cyan
                            } else {
                                const r = Math.round(rBase + (255 - rBase) * heat);
                                const g = Math.round(gBase * (1 - heat));
                                const b = Math.round(bBase * (1 - heat));
                                ctx.fillStyle = `rgb(${r},${g},${b})`;
                            }
                            ctx.fillRect(finalX, finalY, particles[idx + 6], particles[idx + 6]);
                        }
                    }
                }
            }

            // TRIGGER DE EXPLOSIÓN: Solo cuando la gran mayoría han desaparecido
            if (mode === 'orbit' && isEventActive && particlesSwallowed > CONFIG.PARTICLE_COUNT * 0.90) {
                explode();
                window.dispatchEvent(new CustomEvent('big-bang'));
            }

            if (explosionFlash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${explosionFlash})`;
                ctx.fillRect(0, 0, width, height);
                explosionFlash -= 0.03; // Desvanecimiento más rápido para ver las partículas
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        resize();
        initParticles();
        animationFrameId = requestAnimationFrame(animate);

        const handleResize = () => resize();
        const handleMouseMove = (e) => { targetMouseX = e.clientX; targetMouseY = e.clientY; };
        const handleMouseLeave = () => { targetMouseX = -1000; targetMouseY = -1000; };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />;
};

export default ParticleBackground;
