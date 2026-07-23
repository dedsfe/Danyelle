import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "motion/react";
import {
  useEffect,
  useState,
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
      <a
        className="nav-avatar"
        href="https://www.instagram.com/danyellevieiracc"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir o Instagram de Danyelle Vieira"
      >
        <img src="/danyelle-avatar-v2.png" alt="" />
      </a>

      <div className="nav-pill">
        <a href="#trabalhos">Trabalhos</a>
        <a href="#servicos">Serviços</a>
        <a
          href="https://www.instagram.com/danyellevieiracc"
          target="_blank"
          rel="noreferrer"
        >
          Contato
        </a>
      </div>
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
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
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
        id="trabalhos"
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
                <span className="showcase-cursor-orb">
                  <span className="showcase-cursor-orb-core" />
                </span>
                <span className="showcase-cursor-pause">
                  <i />
                  <i />
                </span>
                <span className="showcase-cursor-label">Showreel</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.figure>
    </header>
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
        </>
      )}

      <AnimatePresence mode="wait">
        {showSplash && <Splash key="splash" />}
      </AnimatePresence>
    </main>
  );
}
