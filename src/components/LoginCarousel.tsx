import { useState, useEffect, useCallback } from 'react';

const SLIDES = [
  { image: '/images/login-bg.jpg' },
  { image: '/images/food-hero.jpg' },
  { image: '/images/jollof-rice.jpg' },
  { image: '/images/tajine-agneau.jpg' },
  { image: '/images/ndole.jpg' },
  { image: '/images/couscous-royal.jpg' },
];

// 3 different Ken Burns directions — cycles per slide
const KB_CLASSES = [
  'animate-[ken-burns-1_6s_ease-out_forwards]',
  'animate-[ken-burns-2_6s_ease-out_forwards]',
  'animate-[ken-burns-3_6s_ease-out_forwards]',
];

const INTERVAL = 5000;

export function LoginCarousel() {
  const [current, setCurrent] = useState(0);
  // Per-slide generation key — incrementing forces CSS animation restart
  const [gens, setGens] = useState<number[]>(SLIDES.map(() => 0));
  const [progressKey, setProgressKey] = useState(0);

  const advance = useCallback((next: number) => {
    setCurrent(next);
    setGens((prev) => prev.map((g, i) => (i === next ? g + 1 : g)));
    setProgressKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => advance((current + 1) % SLIDES.length),
      INTERVAL,
    );
    return () => clearInterval(id);
  }, [current, advance]);

  return (
    <>
      {/* Slide images */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1100ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 2 : 1 }}
        >
          {/* Inner div is re-keyed per generation → restarts CSS animation */}
          <div
            key={gens[i]}
            className={`absolute inset-0 bg-cover bg-center ${KB_CLASSES[i % 3]}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        </div>
      ))}

      {/* Gold progress line at top edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-20 overflow-hidden bg-white/[0.06]">
        <div
          key={progressKey}
          className="h-full bg-gradient-to-r from-[#D4A745]/80 to-[#E07A2F]/80 rounded-full"
          style={{ animation: `progress-fill ${INTERVAL}ms linear forwards` }}
        />
      </div>
    </>
  );
}
