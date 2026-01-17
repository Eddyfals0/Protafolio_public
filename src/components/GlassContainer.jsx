import React, { useState, useEffect, useRef } from 'react';
import './GlassContainer.css';
import eddyImg from '../assets/eddy.png';

const CHARS = "ABCDEFGHIKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+<>?";

const HackerText = ({ text, isVisible, speed = 1, onComplete }) => {
    const [displayText, setDisplayText] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const iterationRef = useRef(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isVisible) {
            // Animación de APARECER (Reveal)
            setIsAnimating(true);
            iterationRef.current = 0;
            clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                setDisplayText(prev =>
                    text.split('').map((char, index) => {
                        if (index < iterationRef.current) return text[index];
                        if (char === ' ') return ' ';
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    }).join('')
                );

                if (iterationRef.current >= text.length) {
                    clearInterval(intervalRef.current);
                    setIsAnimating(false);
                    if (onComplete) onComplete();
                }

                iterationRef.current += (1 / 3) * speed; // Velocidad del reveal
            }, 30);
        } else {
            // Animación de DESAPARECER (Scramble out)
            setIsAnimating(true);
            iterationRef.current = 0;
            clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                setDisplayText(prev =>
                    text.split('').map((char, index) => {
                        if (index < iterationRef.current) return ''; // Desfallece de izq a der
                        if (char === ' ') return ' ';
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    }).join('')
                );

                if (iterationRef.current >= text.length) {
                    clearInterval(intervalRef.current);
                    setIsAnimating(false);
                    setDisplayText('');
                }

                iterationRef.current += (isVisible ? (1 / 3) * speed : (1 / 2) * speed); // Desaparición rápida (600ms aprox)
            }, 30);
        }

        return () => clearInterval(intervalRef.current);
    }, [isVisible, text, speed]);

    return <span>{displayText}</span>;
};

const WordHackerText = ({ text, isVisible, speed = 1 }) => {
    const [displayText, setDisplayText] = useState('');
    const iterationRef = useRef(0);
    const intervalRef = useRef(null);
    const words = text.split(' ');

    useEffect(() => {
        if (isVisible) {
            iterationRef.current = 0;
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setDisplayText(
                    words.map((word, index) => {
                        if (index < iterationRef.current) return word;
                        return word.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
                    }).join(' ')
                );
                if (iterationRef.current >= words.length) clearInterval(intervalRef.current);
                iterationRef.current += 1 * speed;
            }, 50);
        } else {
            setDisplayText('');
        }
        return () => clearInterval(intervalRef.current);
    }, [isVisible, text, speed]);

    return <span>{displayText}</span>;
};

const GlitchTitle = ({ text, isHovered }) => {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (isHovered) {
            // Iniciar efecto glitch
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);

            intervalRef.current = setInterval(() => {
                setDisplayText(prev =>
                    text.split('').map((char, index) => {
                        if (char === ' ') return ' ';
                        // Cambiar solo algunas letras aleatoriamente (15% de probabilidad)
                        if (Math.random() > 0.85) {
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        }
                        return char;
                    }).join('')
                );
            }, 50);

            // Detener después de 0.5 segundos y regresar a la normalidad
            timeoutRef.current = setTimeout(() => {
                clearInterval(intervalRef.current);
                setDisplayText(text);
            }, 500);
        } else {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
            setDisplayText(text);
        }

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
        };
    }, [isHovered, text]);

    return <span>{displayText}</span>;
};

const projectsData = [
    {
        title: "NetPredictor AI",
        date: "Diciembre 2025",
        tech: "Python, TensorFlow, FastAPI",
        desc: "Red neuronal profunda para la predicción de resultados deportivos con 94% de precisión.",
        link: "https://github.com/EduardoGuerra/NetPredictor"
    },
    {
        title: "AI Sage Trading",
        date: "Octubre 2025",
        tech: "LSTM, React, Node.js",
        desc: "Dashboard inteligente para el análisis y predicción de tendencias bursátiles.",
        link: "https://github.com/EduardoGuerra/AISageTrading"
    },
    {
        title: "Neural Vision",
        date: "Agosto 2025",
        tech: "PyTorch, OpenCV, CUDA",
        desc: "Sistema de reconocimiento de objetos en tiempo real para hardware de baja potencia.",
        link: "https://github.com/EduardoGuerra/NeuralVision"
    },
    {
        title: "Sentix NLP",
        date: "Junio 2025",
        tech: "Transformers, BERT, Flask",
        desc: "Análisis de sentimiento multilingüe para grandes volúmenes de datos de redes sociales.",
        link: "https://github.com/EduardoGuerra/Sentix"
    },
    {
        title: "BioLab ML",
        date: "Abril 2025",
        tech: "Scikit-learn, Pandas, R",
        desc: "Modelo predictivo para la identificación de patrones en secuencias genómicas.",
        link: "https://github.com/EduardoGuerra/BioLab"
    },
    {
        title: "CyberShield AI",
        date: "Febrero 2025",
        tech: "GANs, PyTorch, Wireshark",
        desc: "Detección de anomalías en tráfico de red mediante redes generativas adversarias.",
        link: "https://github.com/EduardoGuerra/CyberShield"
    },
    {
        title: "Aura Smart Home",
        date: "Enero 2025",
        tech: "IoT, MQTT, TensorFlow Lite",
        desc: "Sistema domótico inteligente con control por voz y aprendizaje de hábitos.",
        link: "https://github.com/EduardoGuerra/AuraHome"
    }
];

const ProjectItem = ({ project, index, setIsHovering }) => {
    const [localHover, setLocalHover] = useState(false);

    return (
        <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`project-item p-line-${index + 1}`}
            onMouseEnter={() => {
                setIsHovering(true);
                setLocalHover(true);
            }}
            onMouseLeave={() => {
                setIsHovering(false);
                setLocalHover(false);
            }}
        >
            <h3 className="project-title-large">
                <GlitchTitle text={project.title} isHovered={localHover} />
            </h3>
            <div className="project-meta">
                <span className="project-date">{project.date}</span>
                <span className="project-tech-bold">{project.tech}</span>
            </div>
            <p className="project-desc-simple">{project.desc}</p>
        </a>
    );
};

const contactData = [
    { name: "GitHub", link: "https://github.com/Eddyfals0", pos: { top: '15%', right: '10%' } },
    { name: "Instagram", link: "https://www.instagram.com/eddy_falso/", pos: { top: '55%', right: '35%' } },
    { name: "LinkedIn", link: "https://www.linkedin.com/in/eduardo-guerra-eddyfals0", pos: { top: '80%', right: '5%' } }
];

const ContactItem = ({ social, index, setIsHovering }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <a
            href={social.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`contact-link c-link-${index + 1}`}
            style={{ top: social.pos.top, right: social.pos.right }}
            onMouseEnter={() => {
                setIsHovering(true);
                setIsHovered(true);
            }}
            onMouseLeave={() => {
                setIsHovering(false);
                setIsHovered(false);
            }}
        >
            <GlitchTitle text={social.name} isHovered={isHovered} />
        </a>
    );
};

const GlassContainer = ({ isExploded, isMinimized, setIsMinimized, setIsHovering }) => {
    const [activeItem, setActiveItem] = useState('Home');
    const [displayMode, setDisplayMode] = useState(isMinimized ? 'corner' : 'centered');
    const [contentVisible, setContentVisible] = useState(true);
    const [sectionVisible, setSectionVisible] = useState(true); // Control para secciones derecha
    const [glitchState, setGlitchState] = useState('none'); // 'none', 'out', 'in'
    const menuItems = ['Home', 'About me', 'Proyectos', 'Contact'];

    // Consolidamos toda la lógica de navegación en handleMenuClick para evitar retrasos dobles
    const handleMenuClick = (item) => {
        if (item === activeItem) return;

        const isGoingToHome = item === 'Home';
        const isComingFromHome = activeItem === 'Home';
        const isChangingMode = isGoingToHome || isComingFromHome;

        if (isChangingMode) {
            // 1. Iniciamos desaparición rápida (600ms)
            setContentVisible(false);
            setSectionVisible(false);
            setGlitchState('out');

            setTimeout(() => {
                setActiveItem(item);
                const targetMode = isGoingToHome ? 'centered' : 'corner';
                setDisplayMode(targetMode);
                setIsMinimized(!isGoingToHome);

                // 2. Aparece el otro inmediatamente
                setContentVisible(true);
                setSectionVisible(true);
                setGlitchState('in');
                setTimeout(() => setGlitchState('none'), 500);
            }, 600);
        } else {
            // Cambio lateral súper rápido (500ms)
            setSectionVisible(false);

            setTimeout(() => {
                setActiveItem(item);
                setSectionVisible(true);
            }, 500);
        }
    };

    return (
        <div className={`glass-container ${displayMode}`}>
            <div className={`content ${!contentVisible ? 'hidden' : ''}`}>
                <h1
                    className="name"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <img
                        src={eddyImg}
                        alt="EDDY"
                        className={`eddy-logo ${glitchState === 'out' ? 'glitch-out' : glitchState === 'in' ? 'glitch-in' : ''}`}
                    />
                </h1>
                <p
                    className="subtitle"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <HackerText text="Machine Learning" isVisible={contentVisible} speed={1.5} />
                </p>

                <nav className="menu">
                    {menuItems.map((item) => (
                        <div
                            key={item}
                            className={`menu-item ${activeItem === item ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item)}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <span className="text">
                                <HackerText text={item} isVisible={contentVisible} speed={2} />
                            </span>
                            <div className="dot"></div>
                            <div className="hover-box"></div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* SECCIÓN CONTACTO: Links esparcidos con GLITCH */}
            <div className={`contact-container ${displayMode === 'corner' && activeItem === 'Contact' && sectionVisible ? 'visible' : ''}`}>
                {contactData.map((social, index) => (
                    <ContactItem
                        key={index}
                        social={social}
                        index={index}
                        setIsHovering={setIsHovering}
                    />
                ))}
            </div>

            {/* BIO DESCRIPCIÓN: Solo sección derecha usa sectionVisible */}
            <div className={`bio-container ${displayMode === 'corner' && activeItem === 'About me' && sectionVisible ? 'visible' : ''}`}>
                <div className="bio-line line-1">
                    <h2 className="bio-name">Eduardo Guerra Bedolla</h2>
                </div>
                <div className="bio-inner-text">
                    {[
                        "Estudiante de Ciencias de la Computación BUAP,",
                        "desarrollador y apasionado de ML y tecnologías emergentes.",
                        "Amante de la programación, ganador de algunos hackatones",
                        "y arquitecto de sistemas inteligentes transformando datos en impacto."
                    ].map((line, i) => (
                        <div key={i} className={`bio-line line-${i + 2}`}>
                            <p className="bio-text">{line}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN PROYECTOS: Solo sección derecha usa sectionVisible */}
            <div className={`projects-container ${displayMode === 'corner' && activeItem === 'Proyectos' && sectionVisible ? 'visible' : ''}`}>
                <div className="projects-scrollbox">
                    {projectsData.map((project, index) => (
                        <ProjectItem
                            key={index}
                            project={project}
                            index={index}
                            setIsHovering={setIsHovering}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GlassContainer;
