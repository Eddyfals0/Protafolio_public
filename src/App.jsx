import { useEffect, useState, useRef } from 'react'
import ParticleBackground from './components/ParticleBackground'
import GlassContainer from './components/GlassContainer'

function App() {
    const cursorRef = useRef(null);
    const mousePos = useRef({ x: -100, y: -100 });
    const [isExploded, setIsExploded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isOutside, setIsOutside] = useState(false);
    const lerpPos = useRef({ x: -100, y: -100 });

    useEffect(() => {
        let lastMove = Date.now();
        let frameId;
        let prevPos = { x: -100, y: -100 };

        const handleMouseMove = (e) => {
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
            lastMove = Date.now();
        };

        const handleMouseLeave = () => setIsOutside(true);
        const handleMouseEnter = (e) => {
            setIsOutside(false);
            // reset lerp to current mouse pos to avoid "flying in" from far away
            lerpPos.current.x = e.clientX;
            lerpPos.current.y = e.clientY;
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
        };
        const handleBigBang = () => setIsExploded(true);

        const updateCursor = () => {
            const el = cursorRef.current;
            if (!el) {
                frameId = requestAnimationFrame(updateCursor);
                return;
            }

            // If outside, don't perform calculations or style updates
            if (isOutside) {
                el.style.opacity = '0';
                el.style.visibility = 'hidden';
                frameId = requestAnimationFrame(updateCursor);
                return;
            }

            // LERP Movement
            const LERP_FACTOR = 0.15; // Suavizado
            lerpPos.current.x += (mousePos.current.x - lerpPos.current.x) * LERP_FACTOR;
            lerpPos.current.y += (mousePos.current.y - lerpPos.current.y) * LERP_FACTOR;

            const now = Date.now();
            const stillTime = now - lastMove;
            const THRESHOLD = 10000;
            const exploded = isExploded;

            const isActive = stillTime > THRESHOLD && !exploded;
            const progress = isActive ? Math.min(1, (stillTime - THRESHOLD) / 10000) : 0;

            let color = exploded ? '#00e5ff' : 'white';
            if (isActive) {
                if (progress < 0.3) {
                    const p = progress / 0.3;
                    color = `rgb(255, 255, ${Math.floor(255 * (1 - p))})`;
                } else {
                    const p = (progress - 0.3) / 0.7;
                    const r = 255 - Math.floor((255 - 139) * p);
                    const g = Math.floor(255 * (1 - p));
                    color = `rgb(${r}, ${g}, 0)`;
                }
            }

            const size = exploded ? 5 : (isActive ? 6 + (progress * 44) : 6);
            const vibeFreq = exploded ? 0.005 : (0.01 + progress * 0.05);
            const vibeAmp = exploded ? 1 : progress * 4;
            const vibX = (isActive || exploded) ? Math.sin(now * vibeFreq) * vibeAmp : 0;
            const vibY = (isActive || exploded) ? Math.cos(now * (vibeFreq * 1.2)) * vibeAmp : 0;

            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.backgroundColor = color;

            // Ocultar si está sobre hover
            el.style.opacity = isHovering ? '0' : '1';
            el.style.visibility = isHovering ? 'hidden' : 'visible';

            const shadow = exploded
                ? '0 0 15px #00e5ff, 0 0 30px #00e5ff'
                : (isActive ? `0 0 ${10 + progress * 60}px ${color}` : 'none');
            el.style.boxShadow = shadow;

            const { x, y } = lerpPos.current;
            el.style.transform = `translate3d(calc(${x}px - 50% + ${vibX}px), calc(${y}px - 50% + ${vibY}px), 0) scale(${isHovering ? 0 : 1})`;

            frameId = requestAnimationFrame(updateCursor);
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);
        window.addEventListener('big-bang', handleBigBang);
        frameId = requestAnimationFrame(updateCursor);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            window.removeEventListener('big-bang', handleBigBang);
            cancelAnimationFrame(frameId);
        };
    }, [isExploded, isHovering, isOutside]);

    return (
        <>
            <div
                ref={cursorRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    willChange: 'transform, opacity',
                }}
            />
            <div className="main-frame">
                <div className="main-content">
                    <GlassContainer
                        isExploded={isExploded}
                        isMinimized={isMinimized}
                        setIsMinimized={setIsMinimized}
                        setIsHovering={setIsHovering}
                    />
                </div>
            </div>
            <ParticleBackground />
        </>
    );
}

export default App;
