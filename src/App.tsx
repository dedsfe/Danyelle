import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
  type Variants,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const SPLASH_TEXT = "Danyelle Vieira";
const SPLASH_LETTERS = Array.from(SPLASH_TEXT);
const SPLASH_ITEM_DURATION_SECONDS = 2.55;
const SPLASH_START_DELAY_SECONDS = 0.12;
const SPLASH_STAGGER_SECONDS = 0.06;
const SPLASH_ITEM_COUNT = SPLASH_LETTERS.length + 1;
const HERO_PHRASES = [
  "continuam vivos",
  "ficam para sempre",
  "ninguém esquece",
];
const JELLY_PRESS = { scaleX: 1.035, scaleY: 0.88 };
const JELLY_SPRING: Transition = {
  type: "spring",
  stiffness: 115,
  damping: 18,
  mass: 1,
};
const WORKS_SENTENCE =
  "Um evento não acaba quando termina. Ele acaba quando alguém assiste de novo.";
const WORKS_WORDS = WORKS_SENTENCE.split(" ");
// Placeholder: cada slot vira um vídeo quando o material da Danyelle chegar.
const WORKS_SLOTS = [
  { angle: -25, width: 15, height: 8.6, position: "38% center" },
  { angle: 35, width: 10.5, height: 18.6, position: "60% center" },
  { angle: 150, width: 15, height: 8.6, position: "24% center" },
  { angle: 215, width: 10.5, height: 18.6, position: "72% center" },
];
// Órbita elíptica: larga o bastante para não passar por cima da frase,
// baixa o bastante para o card do topo não ser cortado pela seção anterior.
const WORKS_RADIUS_X = 50;
const WORKS_RADIUS_Y = 33;
// A cena inteira é uma linha do tempo em svh. Cada fase declara quanto scroll
// ocupa, e os tempos viram progresso 0..1 por `phase()` — assim dá para esticar
// uma fase sem reescrever nenhum keyframe das outras.
const WORKS_PHASES = {
  // anel → órbita → o escolhido cresce até tomar a tela
  scene: 320,
  // o texto sobe por cima do vídeo cheio e fica sustentado
  hold: 190,
  // o vídeo encolhe até o tamanho da imagem do header
  shrink: 170,
  // carrossel horizontal com os outros eventos
  rail: 340,
} as const;
const WORKS_TRACK_VH = Object.values(WORKS_PHASES).reduce((a, b) => a + b, 0);
const WORKS_PHASE_STARTS = {
  scene: 0,
  hold: WORKS_PHASES.scene,
  shrink: WORKS_PHASES.scene + WORKS_PHASES.hold,
  rail: WORKS_PHASES.scene + WORKS_PHASES.hold + WORKS_PHASES.shrink,
} as const;
// phase("hold", 0.5) → progresso global no meio da fase de sustentação.
function phase(name: keyof typeof WORKS_PHASES, point: number) {
  return (WORKS_PHASE_STARTS[name] + point * WORKS_PHASES[name]) /
    WORKS_TRACK_VH;
}
const WORKS_RING_START = phase("scene", 0.02);
const WORKS_RING_END = phase("scene", 0.4);
const WORKS_OUTRO_BRAND = "Danyelle Vieira";
const WORKS_OUTRO_LINES = [
  "Cobertura de eventos que você",
  "vai querer rever amanhã.",
];
// Placeholder: vira a lista real de eventos quando o material chegar.
const WORKS_EVENTS = [
  {
    title: "Casamento Marina & Téo",
    meta: "Recife · 2025",
    position: "50% center",
  },
  {
    title: "Réveillon Praia do Forte",
    meta: "Bahia · 2025",
    position: "38% center",
  },
  { title: "15 anos da Helena", meta: "Olinda · 2024", position: "62% center" },
  {
    title: "Corporativo Vértice",
    meta: "Recife · 2024",
    position: "24% center",
  },
];
// Mesma medida da imagem do header: min(100%, 84rem) em 16/9.
const WORKS_CARD_MAX_REM = 84;
const WORKS_CARD_VIEWPORT_RATIO = 0.88;
const COLOR_SHIFT_MESSAGE = "VIVA DE NOVO";
const COLOR_SHIFT_TRACK_VH = 420;
const COLOR_SHIFT_LINES = [
  "Um evento",
  "não acaba",
  "quando termina.",
  "Ele vive",
  "de novo.",
] as const;
const EDITORIAL_PROJECTS = [
  {
    title: "Casamentos",
    description:
      "Do silêncio antes do sim à pista cheia: uma narrativa que acompanha o dia inteiro sem interromper o que está acontecendo.",
    action: "Conversar sobre casamento",
    image: "/event-poster.jpg",
    position: "46% center",
  },
  {
    title: "Celebrações",
    description:
      "Aniversários, formaturas e encontros que pedem ritmo, espontaneidade e lembranças prontas para serem revividas.",
    action: "Planejar uma celebração",
    image: "/event-poster.jpg",
    position: "68% center",
  },
  {
    title: "Marcas & encontros",
    description:
      "Conteúdo ágil para eventos de marca, lançamentos e experiências presenciais, com atenção às pessoas e à atmosfera.",
    action: "Falar sobre um projeto",
    image: "/event-poster.jpg",
    position: "28% center",
  },
  {
    title: "Bastidores",
    description:
      "Os gestos, preparativos e detalhes que acontecem fora do palco principal e completam a memória de cada evento.",
    action: "Registrar os bastidores",
    image: "/event-poster.jpg",
    position: "82% center",
  },
] as const;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function readViewport() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const rem =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const cardWidth = Math.min(
    width * WORKS_CARD_VIEWPORT_RATIO,
    WORKS_CARD_MAX_REM * rem,
  );

  return {
    width,
    height,
    rem,
    vmin: Math.min(width, height) / 100,
    cardWidth,
    cardHeight: (cardWidth * 9) / 16,
    // Mesmo respiro do gap entre cards do carrossel.
    gap: Math.min(Math.max(width * 0.024, 16), 40),
    // clamp(1.25rem, 2vw, 2rem), igual à borda da imagem do header.
    cardRadius: Math.min(Math.max(width * 0.02, 1.25 * rem), 2 * rem),
  };
}

// Os tamanhos da cena precisam virar px para interpolar entre vmin, tela cheia
// e a medida exata da imagem do header.
function useViewport() {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const handleResize = () => setViewport(readViewport());

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
}
const SPLASH_DURATION_MS = Math.ceil(
  (SPLASH_START_DELAY_SECONDS +
    (SPLASH_ITEM_COUNT - 1) * SPLASH_STAGGER_SECONDS +
    SPLASH_ITEM_DURATION_SECONDS +
    0.12) *
    1000,
);

function splashItemTransition(index: number) {
  return {
    delay: SPLASH_START_DELAY_SECONDS + index * SPLASH_STAGGER_SECONDS,
    duration: SPLASH_ITEM_DURATION_SECONDS,
    times: [0, 0.13, 0.77, 1],
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

const phraseVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.028 },
  },
  exit: {
    transition: { staggerChildren: 0.018 },
  },
};

const phraseLetterVariants: Variants = {
  hidden: { opacity: 0, y: "0.28em", filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: "-0.22em",
    filter: "blur(8px)",
    transition: { duration: 0.24, ease: [0.64, 0, 0.78, 0] },
  },
};

function RotatingPhrase({ reduceMotion }: { reduceMotion: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrase = HERO_PHRASES[phraseIndex];

  useEffect(() => {
    if (reduceMotion) return;

    const interval = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % HERO_PHRASES.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  if (reduceMotion) {
    return <span className="hero-rotating">{phrase}</span>;
  }

  return (
    <span className="hero-rotating-shell" aria-label={phrase}>
      <AnimatePresence mode="wait">
        <motion.span
          aria-hidden="true"
          className="hero-rotating"
          key={phrase}
          variants={phraseVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {Array.from(phrase).map((letter, index) => (
            <motion.span
              className="hero-copy-letter"
              variants={phraseLetterVariants}
              key={`${phrase}-${letter}-${index}`}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function setJellyPointerOrigin(event: ReactPointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
  const y = ((event.clientY - bounds.top) / bounds.height) * 100;

  event.currentTarget.style.transformOrigin = `${x}% ${y}%`;
}

function setJellyKeyboardOrigin(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key === "Enter" || event.key === " ") {
    event.currentTarget.style.transformOrigin = "50% 50%";
  }
}

function FloatingNav({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.nav
      className="floating-nav"
      aria-label="Navegação principal"
      style={{ x: "-50%" }}
      initial={reduceMotion ? false : { opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        bounce: 0,
        duration: 0.48,
        delay: reduceMotion ? 0 : 0.08,
      }}
    >
      <motion.a
        className="nav-avatar"
        href="https://www.instagram.com/danyellevieiracc"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir o Instagram de Danyelle Vieira"
        onPointerDown={setJellyPointerOrigin}
        onKeyDown={setJellyKeyboardOrigin}
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.025,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                  mass: 0.7,
                },
              }
        }
        whileTap={reduceMotion ? undefined : JELLY_PRESS}
        transition={reduceMotion ? undefined : JELLY_SPRING}
      >
        <img src="/danyelle-avatar-v2.png" alt="" />
      </motion.a>

      <motion.div
        className="nav-pill"
        onPointerDown={setJellyPointerOrigin}
        onKeyDown={setJellyKeyboardOrigin}
        whileTap={reduceMotion ? undefined : JELLY_PRESS}
        transition={reduceMotion ? undefined : JELLY_SPRING}
      >
        <a href="#trabalhos">Trabalhos</a>
        <a href="#servicos">Serviços</a>
        <a
          href="https://www.instagram.com/danyellevieiracc"
          target="_blank"
          rel="noreferrer"
        >
          Contato
        </a>
      </motion.div>
    </motion.nav>
  );
}

function Hero({ reduceMotion }: { reduceMotion: boolean }) {
  const [showShowreelCursor, setShowShowreelCursor] = useState(false);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawCursorX = useMotionValue(0);
  const rawCursorY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, {
    stiffness: 180,
    damping: 26,
    mass: 0.7,
  });
  const rotateY = useSpring(rawRotateY, {
    stiffness: 180,
    damping: 26,
    mass: 0.7,
  });
  const cursorX = useSpring(rawCursorX, {
    stiffness: 650,
    damping: 42,
    mass: 0.45,
  });
  const cursorY = useSpring(rawCursorY, {
    stiffness: 650,
    damping: 42,
    mass: 0.45,
  });

  function handleFramePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    const horizontal = pointerX / bounds.width - 0.5;
    const vertical = pointerY / bounds.height - 0.5;

    rawCursorX.set(Math.min(Math.max(pointerX, 112), bounds.width - 112));
    rawCursorY.set(Math.min(Math.max(pointerY, 42), bounds.height - 42));
    setShowShowreelCursor(true);

    if (reduceMotion) return;

    rawRotateX.set(vertical * -3.2);
    rawRotateY.set(horizontal * 4);
  }

  function resetFrameTilt() {
    rawRotateX.set(0);
    rawRotateY.set(0);
    setShowShowreelCursor(false);
  }

  return (
    <header className="hero">
      <motion.div
        className="hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="hero-title">
          <a
            className="hero-handle"
            href="https://www.instagram.com/danyellevieiracc"
            target="_blank"
            rel="noreferrer"
          >
            @danyellevieiracc
          </a>
          <span className="hero-copy-line">
            <span>momentos que&nbsp;</span>
            <RotatingPhrase reduceMotion={reduceMotion} />
          </span>
        </h1>

        <div className="hero-actions" id="servicos">
          <motion.a
            className="primary-action"
            href="#trabalhos"
            onPointerDown={setJellyPointerOrigin}
            onKeyDown={setJellyKeyboardOrigin}
            whileTap={reduceMotion ? undefined : JELLY_PRESS}
            transition={reduceMotion ? undefined : JELLY_SPRING}
          >
            Ver coberturas
            <span className="action-arrow" aria-hidden="true">
              ↘
            </span>
          </motion.a>
        </div>
      </motion.div>

      <motion.figure
        className="showcase"
        onPointerEnter={handleFramePointerMove}
        onPointerMove={handleFramePointerMove}
        onPointerLeave={resetFrameTilt}
        style={{ rotateX, rotateY, transformPerspective: 1400 }}
        initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: reduceMotion ? 0 : 0.16,
          duration: 0.85,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <img
          className="showcase-poster"
          src="/event-poster.jpg"
          alt="Convidados brindando durante um evento"
          fetchPriority="high"
          decoding="async"
        />

        <AnimatePresence>
          {showShowreelCursor && (
            <motion.div
              aria-hidden="true"
              className="showcase-cursor-anchor"
              style={{
                x: reduceMotion ? rawCursorX : cursorX,
                y: reduceMotion ? rawCursorY : cursorY,
              }}
            >
              <motion.div
                className="showcase-cursor"
                style={{ x: "-50%", y: "-50%" }}
                initial={{ opacity: 0, scale: 0.78 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.84 }}
                transition={{ type: "spring", bounce: 0, duration: 0.24 }}
              >
                <img
                  className="showcase-cursor-orb"
                  src="/findmy-orb-512.png"
                  srcSet="/findmy-orb-256.png 256w, /findmy-orb-512.png 512w, /findmy-orb-1024.png 1024w"
                  sizes="52px"
                  alt=""
                  decoding="async"
                />
                <span className="showcase-cursor-pause">
                  <i />
                  <i />
                </span>
                <span className="showcase-cursor-label">Assistir</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.figure>
    </header>
  );
}

function WorksWord({
  word,
  index,
  progress,
}: {
  word: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const span =
    (WORKS_RING_END - WORKS_RING_START) / (WORKS_WORDS.length + 1.2);
  const start = WORKS_RING_START + index * span;
  const opacity = useTransform(progress, [start, start + span * 2.2], [0.13, 1]);

  return (
    <motion.span className="works-word" style={{ opacity }}>
      {word}{" "}
    </motion.span>
  );
}

function WorksCard({
  slot,
  orbitAngle,
}: {
  slot: (typeof WORKS_SLOTS)[number];
  orbitAngle: MotionValue<number>;
}) {
  // Posição na elipse: o card anda pela órbita mas nunca gira junto.
  const x = useTransform(
    orbitAngle,
    (value) =>
      `${Math.cos(((value + slot.angle) * Math.PI) / 180) * WORKS_RADIUS_X}vmin`,
  );
  const y = useTransform(
    orbitAngle,
    (value) =>
      `${Math.sin(((value + slot.angle) * Math.PI) / 180) * WORKS_RADIUS_Y}vmin`,
  );

  return (
    <motion.figure
      className="works-card"
      style={{
        width: `${slot.width}vmin`,
        height: `${slot.height}vmin`,
        x,
        y,
      }}
    >
      <img
        src="/event-poster.jpg"
        alt=""
        style={{ objectPosition: slot.position }}
        loading="lazy"
        decoding="async"
      />
    </motion.figure>
  );
}

function WorksOutroLine({
  line,
  index,
  progress,
}: {
  line: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = phase("hold", 0.12 + index * 0.08);
  const end = phase("hold", 0.34 + index * 0.08);
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], ["1.8rem", "0rem"]);
  const filter = useTransform(
    progress,
    [start, end],
    ["blur(12px)", "blur(0px)"],
  );

  return (
    <motion.span className="works-outro-line" style={{ opacity, y, filter }}>
      {line}
    </motion.span>
  );
}

function Works({ reduceMotion }: { reduceMotion: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewport = useViewport();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    // Mesmo mapeamento de "start start" → "end end", mas em números: as
    // palavras fazem o Motion delegar para uma ViewTimeline nativa que
    // mistrackeia quando o alvo é muito mais alto que a tela (a cena
    // congelava e as opacidades ficavam presas no valor inicial).
    offset: [0, 1],
  });

  // Distância que o trilho percorre: cada evento seguinte entra centralizado.
  const railTravel =
    (viewport.cardWidth + viewport.gap) * (WORKS_EVENTS.length - 1);

  // Tempo 1 — o anel se desenha e a frase acende palavra por palavra.
  const ringDraw = useTransform(
    scrollYProgress,
    [WORKS_RING_START, WORKS_RING_END],
    [1, 0],
  );
  // Tempo 2 — a órbita gira; o card do topo fica parado, é o escolhido.
  const orbitAngle = useTransform(
    scrollYProgress,
    [phase("scene", 0.42), phase("scene", 0.72)],
    [0, 180],
  );
  // Tempo 3 — a cena continua subindo, como se a página seguisse rolando,
  // enquanto o escolhido desce e cresce até tomar a tela.
  const stageY = useTransform(
    scrollYProgress,
    [phase("scene", 0.72), phase("scene", 0.9)],
    ["0vh", "-78vh"],
  );
  const stageFade = useTransform(
    scrollYProgress,
    [phase("scene", 0.74), phase("scene", 0.88)],
    [1, 0],
  );
  // O destaque acompanha a volta do topo até as 6 horas, e só então cresce.
  const featureX = useTransform(scrollYProgress, (value) => {
    const orbit = clamp01(
      (value - phase("scene", 0.42)) / (phase("scene", 0.72) - phase("scene", 0.42)),
    );
    const radians = ((-90 + 180 * orbit) * Math.PI) / 180;
    const pull =
      1 -
      clamp01(
        (value - phase("scene", 0.72)) /
          (phase("scene", 0.97) - phase("scene", 0.72)),
      );
    // No trilho, o destaque desliza junto com os outros cards.
    const rail = clamp01(
      (value - phase("rail", 0)) / (phase("rail", 1) - phase("rail", 0)),
    );

    return (
      Math.cos(radians) * WORKS_RADIUS_X * pull * viewport.vmin -
      rail * railTravel
    );
  });
  const featureY = useTransform(scrollYProgress, (value) => {
    const orbit = clamp01(
      (value - phase("scene", 0.42)) / (phase("scene", 0.72) - phase("scene", 0.42)),
    );
    const radians = ((-90 + 180 * orbit) * Math.PI) / 180;
    const grow = clamp01(
      (value - phase("scene", 0.72)) /
        (phase("scene", 0.97) - phase("scene", 0.72)),
    );
    // Continua descendo enquanto cresce, antes de assentar no centro da tela.
    const dip = Math.sin(grow * Math.PI) * 9;

    return (
      (Math.sin(radians) * WORKS_RADIUS_Y * (1 - grow) + dip) * viewport.vmin
    );
  });
  // vmin do card na órbita → tela cheia (e assim fica durante a sustentação
  // do texto) → medida exata da imagem do header.
  const featureSteps = [
    phase("scene", 0.72),
    phase("scene", 0.97),
    phase("shrink", 0.06),
    phase("shrink", 0.86),
  ];
  const featureWidth = useTransform(scrollYProgress, featureSteps, [
    10.5 * viewport.vmin,
    viewport.width,
    viewport.width,
    viewport.cardWidth,
  ]);
  const featureHeight = useTransform(scrollYProgress, featureSteps, [
    18.6 * viewport.vmin,
    viewport.height,
    viewport.height,
    viewport.cardHeight,
  ]);
  const featureRadius = useTransform(scrollYProgress, featureSteps, [
    1.15 * viewport.rem,
    0,
    0,
    viewport.cardRadius,
  ]);
  // Tempo 4 — com o vídeo já ocupando a tela, o texto sobe por cima dele e
  // fica sustentado até o encolhimento começar.
  const outroScrim = useTransform(
    scrollYProgress,
    [phase("hold", 0.02), phase("hold", 0.26), phase("shrink", 0.32)],
    [0, 1, 0],
  );
  const outroBrandOpacity = useTransform(
    scrollYProgress,
    [phase("hold", 0.06), phase("hold", 0.24), phase("shrink", 0.26)],
    [0, 1, 0],
  );
  const outroBrandY = useTransform(
    scrollYProgress,
    [phase("hold", 0.06), phase("hold", 0.24)],
    ["1.4rem", "0rem"],
  );
  const outroCopyOpacity = useTransform(
    scrollYProgress,
    [phase("shrink", 0.08), phase("shrink", 0.3)],
    [1, 0],
  );
  const outroCopyY = useTransform(
    scrollYProgress,
    [phase("shrink", 0.08), phase("shrink", 0.3)],
    ["0rem", "-2.6rem"],
  );
  // Tempo 5 — o destaque já tem o tamanho de card: o trilho assume no lugar
  // dele (mesma imagem, mesma posição) e leva os outros eventos.
  const featureFade = useTransform(
    scrollYProgress,
    [phase("shrink", 0.86), phase("shrink", 1)],
    [1, 0],
  );
  const railOpacity = useTransform(
    scrollYProgress,
    [phase("shrink", 0.86), phase("shrink", 1)],
    [0, 1],
  );
  // O trilho é centralizado como um bloco só, então parte deslocado para a
  // direita — assim o primeiro evento nasce exatamente onde o destaque parou.
  const railX = useTransform(
    scrollYProgress,
    [phase("rail", 0), phase("rail", 1)],
    [railTravel / 2, -railTravel / 2],
  );

  if (reduceMotion) {
    return (
      <section className="works works--static" id="trabalhos">
        <p className="works-copy">{WORKS_SENTENCE}</p>
        <ul className="works-static-grid">
          {WORKS_SLOTS.map((slot) => (
            <li key={slot.angle}>
              <img
                src="/event-poster.jpg"
                alt=""
                style={{ objectPosition: slot.position }}
              />
            </li>
          ))}
        </ul>
        <div className="works-outro works-outro--static">
          <p className="works-outro-brand">{WORKS_OUTRO_BRAND}</p>
          <p className="works-outro-copy">
            {WORKS_OUTRO_LINES.map((line) => (
              <span className="works-outro-line" key={line}>
                {line}
              </span>
            ))}
          </p>
        </div>
        <ul className="works-rail works-rail--static">
          {WORKS_EVENTS.map((event) => (
            <li className="works-rail-item" key={event.title}>
              <figure className="works-rail-card">
                <img
                  src="/event-poster.jpg"
                  alt={event.title}
                  style={{ objectPosition: event.position }}
                  loading="lazy"
                />
              </figure>
              <figcaption className="works-rail-caption">
                <span className="works-rail-title">{event.title}</span>
                <span className="works-rail-meta">{event.meta}</span>
              </figcaption>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="works" id="trabalhos">
      <div
        className="works-track"
        ref={trackRef}
        style={{ height: `${WORKS_TRACK_VH}svh` }}
      >
        <div className="works-sticky">
          <motion.div
            className="works-stage"
            style={{ y: stageY, opacity: stageFade }}
          >
          <motion.svg
            className="works-ring"
            viewBox="0 0 200 200"
            aria-hidden="true"
            style={{ rotate: orbitAngle }}
          >
            <defs>
              <mask id="works-ring-mask">
                <motion.circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="26"
                  pathLength={1}
                  strokeDasharray="1 1"
                  style={{ strokeDashoffset: ringDraw }}
                />
              </mask>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="rgba(85, 39, 55, 0.48)"
              strokeWidth="6"
              pathLength={1}
              strokeDasharray="0.0021 0.0139"
              mask="url(#works-ring-mask)"
            />
          </motion.svg>

          <p className="works-copy">
            <span className="works-copy-sr">{WORKS_SENTENCE}</span>
            <span aria-hidden="true">
              {WORKS_WORDS.map((word, index) => (
                <WorksWord
                  key={`${word}-${index}`}
                  word={word}
                  index={index}
                  progress={scrollYProgress}
                />
              ))}
            </span>
          </p>

          <div className="works-orbit" aria-hidden="true">
            {WORKS_SLOTS.map((slot) => (
              <WorksCard
                key={slot.angle}
                slot={slot}
                orbitAngle={orbitAngle}
              />
            ))}
          </div>
          </motion.div>

          <motion.figure
            className="works-feature"
            aria-hidden="true"
            style={{
              width: featureWidth,
              height: featureHeight,
              x: featureX,
              y: featureY,
              borderRadius: featureRadius,
              opacity: featureFade,
            }}
          >
            <img src="/event-poster.jpg" alt="" decoding="async" />
          </motion.figure>

          <motion.ul
            className="works-rail"
            style={{ x: railX, opacity: railOpacity, gap: viewport.gap }}
          >
            {WORKS_EVENTS.map((event) => (
              <li className="works-rail-item" key={event.title}>
                <figure
                  className="works-rail-card"
                  style={{
                    width: viewport.cardWidth,
                    height: viewport.cardHeight,
                    borderRadius: viewport.cardRadius,
                  }}
                >
                  <img
                    src="/event-poster.jpg"
                    alt={event.title}
                    style={{ objectPosition: event.position }}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
                <figcaption className="works-rail-caption">
                  <span className="works-rail-title">{event.title}</span>
                  <span className="works-rail-meta">{event.meta}</span>
                </figcaption>
              </li>
            ))}
          </motion.ul>

          <motion.div
            className="works-outro-scrim"
            aria-hidden="true"
            style={{ opacity: outroScrim }}
          />

          <div className="works-outro">
            <motion.p
              className="works-outro-brand"
              style={{ opacity: outroBrandOpacity, y: outroBrandY }}
            >
              {WORKS_OUTRO_BRAND}
            </motion.p>
            <motion.p
              className="works-outro-copy"
              style={{ opacity: outroCopyOpacity, y: outroCopyY }}
            >
              {WORKS_OUTRO_LINES.map((line, index) => (
                <WorksOutroLine
                  key={line}
                  line={line}
                  index={index}
                  progress={scrollYProgress}
                />
              ))}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ColorShift({ reduceMotion }: { reduceMotion: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: [0, 1],
  });
  const scale = useTransform(
    scrollYProgress,
    [0, 0.14, 0.5, 0.82, 1],
    [0.72, 0.78, 0.92, 1.06, 1.18],
  );
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.28, 0.96, 1],
    ["#ffffff", "#f6edef", "#f6edef", "#552737"],
  );
  const textColor = useTransform(
    scrollYProgress,
    [0, 0.5, 0.84, 1],
    ["#552737", "#7b4053", "#552737", "#f6edef"],
  );
  const imageProgress = [
    useTransform(scrollYProgress, [0.04, 0.22, 0.36], [0, 1, 0]),
    useTransform(scrollYProgress, [0.28, 0.46, 0.6], [0, 1, 0]),
    useTransform(scrollYProgress, [0.54, 0.72, 0.86], [0, 1, 0]),
  ];

  if (reduceMotion) {
    return (
      <section className="color-shift color-shift--static">
        <h2>{COLOR_SHIFT_LINES.join(" ")}</h2>
      </section>
    );
  }

  return (
    <section
      className="color-shift"
      aria-label={`${COLOR_SHIFT_MESSAGE}: ${COLOR_SHIFT_LINES.join(" ")}`}
    >
      <div
        className="color-shift-track"
        ref={trackRef}
        style={{ height: `${COLOR_SHIFT_TRACK_VH}svh` }}
      >
        <motion.div
          className="color-shift-sticky"
          style={{ backgroundColor }}
        >
          <motion.div className="color-shift-composition" style={{ color: textColor, scale }}>
            <h2 className="color-shift-title" aria-hidden="true">
              {COLOR_SHIFT_LINES.map((line) => (
                <span className="color-shift-line" key={line}>
                  {line}
                </span>
              ))}
            </h2>
            <div className="color-shift-images" aria-hidden="true">
              {imageProgress.map((opacity, index) => (
                <motion.img
                  className={`color-shift-image color-shift-image--${index + 1}`}
                  key={index}
                  src="/event-poster.jpg"
                  alt=""
                  style={{ opacity }}
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <div className="color-shift-tail" aria-hidden="true" />
    </section>
  );
}

type EditorialProject = (typeof EDITORIAL_PROJECTS)[number];

function EditorialMac({
  activeIndex = 0,
  project,
  className = "",
}: {
  activeIndex?: number;
  project?: EditorialProject;
  className?: string;
}) {
  const screenProjects = project ? [project] : EDITORIAL_PROJECTS;

  return (
    <figure className={`editorial-mac ${className}`.trim()}>
      <img
        className="editorial-mac-frame"
        src="/danyelle-laptop-frame.png"
        alt=""
        aria-hidden="true"
        draggable="false"
      />
      <div className="editorial-mac-screen">
        {screenProjects.map((screenProject, index) => {
          const isActive = Boolean(project) || index === activeIndex;

          return (
            <img
              className={`editorial-mac-screen-image${
                isActive ? " is-active" : ""
              }`}
              src={screenProject.image}
              alt={
                isActive
                  ? `Cobertura de ${screenProject.title.toLocaleLowerCase(
                      "pt-BR",
                    )} na tela do Mac`
                  : ""
              }
              aria-hidden={!isActive}
              style={{ objectPosition: screenProject.position }}
              loading={!project && index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          );
        })}
      </div>
    </figure>
  );
}

function EditorialTitle({
  title,
}: {
  title: string;
}) {
  const letters = Array.from(title);

  return (
    <span className="editorial-trigger-title" aria-label={title}>
      {letters.map((letter, index) => (
        <span
          aria-hidden="true"
          className={`editorial-title-letter${
            letter === " " ? " editorial-title-letter--space" : ""
          }`}
          key={`${letter}-${index}`}
        >
          {letter === " " ? "\u00a0" : letter}
        </span>
      ))}
    </span>
  );
}

function EditorialProjects({ reduceMotion }: { reduceMotion: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const projectRefs = useRef<Array<HTMLElement | null>>([]);
  const titleRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    let frame = 0;

    const updateActiveProject = () => {
      const viewportTarget = window.innerHeight * 0.5;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      const focusRadius = window.innerHeight * 0.72;

      const applyLetterFocus = (project: HTMLElement, focus: number) => {
        const letters = project.querySelectorAll<HTMLElement>(
          ".editorial-title-letter",
        );
        const revealSpan = 0.18;
        const maxLetterThreshold = 0.82;

        letters.forEach((letter, index) => {
          const threshold =
            letters.length > 1
              ? (index / (letters.length - 1)) * maxLetterThreshold
              : 0;
          const letterFocus = clamp01((focus - threshold) / revealSpan);

          letter.style.setProperty(
            "--letter-blur",
            `${((1 - letterFocus) * 5).toFixed(2)}px`,
          );
          letter.style.setProperty(
            "--letter-opacity",
            (0.58 + letterFocus * 0.42).toFixed(3),
          );
        });
      };

      projectRefs.current.forEach((project, index) => {
        if (!project) return;

        const bounds = project.getBoundingClientRect();
        const center = bounds.top + bounds.height / 2;
        const distance = Math.abs(center - viewportTarget);
        const normalizedFocus = clamp01(1 - distance / focusRadius);
        const easedFocus =
          normalizedFocus * normalizedFocus * (3 - 2 * normalizedFocus);

        const title = titleRefs.current[index];
        if (title) {
          applyLetterFocus(title, reduceMotion ? 0 : easedFocus);
        }

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (reduceMotion) {
        const activeProject = titleRefs.current[closestIndex];

        if (activeProject) {
          applyLetterFocus(activeProject, 1);
        }
      }

      setActiveIndex(closestIndex);
    };

    const queueUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveProject);
    };

    updateActiveProject();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [reduceMotion]);

  const scrollToProject = useCallback(
    (index: number) => {
      setActiveIndex(index);
      projectRefs.current[index]?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    },
    [reduceMotion],
  );

  return (
    <section className="editorial-projects" aria-labelledby="editorial-title">
      <h2 className="visually-hidden" id="editorial-title">
        Tipos de cobertura
      </h2>

      <div className="editorial-layout">
        <nav className="editorial-menu" aria-label="Tipos de cobertura">
          <ol className="editorial-list">
            {EDITORIAL_PROJECTS.map((project, index) => {
              const isActive = index === activeIndex;
              const panelId = `editorial-panel-${index}`;

              return (
                <li
                  className={`editorial-item${isActive ? " is-active" : ""}`}
                  ref={(titleElement) => {
                    titleRefs.current[index] = titleElement;
                  }}
                  key={project.title}
                >
                  <button
                    className="editorial-trigger"
                    type="button"
                    aria-controls={panelId}
                    aria-expanded={isActive}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => scrollToProject(index)}
                  >
                    <span className="editorial-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <EditorialTitle
                      title={project.title}
                    />
                  </button>

                  <div
                    className="editorial-panel"
                    id={panelId}
                    aria-hidden={!isActive}
                  >
                    <div className="editorial-panel-inner">
                      <p>{project.description}</p>
                      <a
                        href="https://www.instagram.com/danyellevieiracc"
                        target="_blank"
                        rel="noreferrer"
                        tabIndex={isActive ? 0 : -1}
                      >
                        {project.action}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="editorial-visuals">
          <div className="editorial-mac-sticky">
            <EditorialMac activeIndex={activeIndex} />
          </div>

          <div className="editorial-scroll-levels">
            {EDITORIAL_PROJECTS.map((project, index) => (
              <article
                className="editorial-project"
                id={`editorial-project-${index}`}
                ref={(projectElement) => {
                  projectRefs.current[index] = projectElement;
                }}
                aria-label={`${project.title}, etapa ${index + 1} de ${
                  EDITORIAL_PROJECTS.length
                }`}
                key={project.title}
              >
                <div className="editorial-mobile-copy">
                  <p className="editorial-mobile-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <a
                    href="https://www.instagram.com/danyellevieiracc"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {project.action}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </div>

                <EditorialMac
                  project={project}
                  className="editorial-mobile-mac"
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Splash() {
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="splash-lockup">
        <h1 className="splash-name" aria-label={SPLASH_TEXT}>
          {SPLASH_LETTERS.map((letter, index) => (
            <motion.span
              aria-hidden="true"
              className={`splash-letter${letter === " " ? " splash-letter--space" : ""}`}
              initial={{ opacity: 0, filter: "blur(14px)" }}
              animate={{
                opacity: [0, 1, 1, 0],
                filter: [
                  "blur(14px)",
                  "blur(0px)",
                  "blur(0px)",
                  "blur(14px)",
                ],
              }}
              transition={splashItemTransition(index)}
              key={`${letter}-${index}`}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}

          <motion.span
            aria-hidden="true"
            className="splash-emoji-frame"
            initial={{ opacity: 0, filter: "blur(14px)" }}
            animate={{
              opacity: [0, 1, 1, 0],
              filter: [
                "blur(14px)",
                "blur(0px)",
                "blur(0px)",
                "blur(14px)",
              ],
            }}
            transition={splashItemTransition(SPLASH_LETTERS.length)}
          >
            <img
              className="splash-emoji"
              src="/danyelle-avatar-v2.png"
              alt=""
            />
          </motion.span>
        </h1>
      </div>
    </motion.div>
  );
}

export default function App() {
  const reduceMotion = useReducedMotion();
  const [showSplash, setShowSplash] = useState(!reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;

    const timeout = window.setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [reduceMotion]);

  return (
    <main className="site-shell">
      {!showSplash && (
        <>
          <FloatingNav reduceMotion={Boolean(reduceMotion)} />
          <Hero reduceMotion={Boolean(reduceMotion)} />
          <Works reduceMotion={Boolean(reduceMotion)} />
          <ColorShift reduceMotion={Boolean(reduceMotion)} />
          <EditorialProjects reduceMotion={Boolean(reduceMotion)} />
        </>
      )}

      <AnimatePresence mode="wait">
        {showSplash && <Splash key="splash" />}
      </AnimatePresence>
    </main>
  );
}
