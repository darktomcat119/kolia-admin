import { useState, useEffect, useCallback } from 'react';

interface Slide {
  image: string;
  label: string;
}

const SLIDES: Slide[] = [
  { image: '/images/food-hero.jpg', label: 'Cuisine africaine' },
  { image: '/images/african-food-spread.jpg', label: 'Saveurs du continent' },
  { image: '/images/jollof-rice.jpg', label: 'Jollof Rice' },
  { image: '/images/tajine-agneau.jpg', label: "Tajine d'Agneau" },
  { image: '/images/ndole.jpg', label: 'Ndolé Camerounais' },
  { image: '/images/couscous-royal.jpg', label: 'Couscous Royal' },
];

const INTERVAL = 4500;

interface HeroCarouselProps {
  greeting: string;
  title: string;
  subtitle: string;
}

export function HeroCarousel({ greeting, title, subtitle }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const goTo = useCallback((index: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
      setProgressKey((k) => k + 1);
    }, 500);
  }, [transitioning]);

  useEffect(() => {
    const interval = setInterval(() => {
      goTo((current + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(interval);
  }, [current, goTo]);

  return (
    <div className="relative mb-6 h-44 overflow-hidden rounded-2xl group sm:mb-8 sm:h-52 sm:rounded-3xl md:h-56">
      {/* Slides — Ken Burns zoom per active slide */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className="absolute inset-0 transition-opacity duration-700 bg-cover bg-center"
          style={{
            backgroundImage: `url(${slide.image})`,
            opacity: i === current ? 1 : 0,
            transform: i === current ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 0.7s ease, transform 8s ease-out',
          }}
        />
      ))}

      {/* Gradient overlay — premium multi-layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-4 py-5 sm:px-8 sm:py-7">
        <div>
          <p className="mb-1 font-body text-[10px] uppercase tracking-[0.2em] text-[#D4A745]/70 sm:text-xs">{greeting}</p>
          <h1 className="font-display text-2xl leading-tight text-white drop-shadow-lg sm:text-3xl">{title}</h1>
          <p className="mt-1 line-clamp-2 font-body text-xs text-white/40 sm:mt-1.5 sm:text-sm">{subtitle}</p>
        </div>

        {/* Bottom: slide label + progress dots */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-white/30 font-body text-xs italic tracking-wide">
            {SLIDES[current].label}
          </span>

          {/* Progress-bar dots */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => goTo(i)}
                className="flex h-10 min-w-[2.25rem] items-center justify-center rounded-lg sm:h-8 sm:min-w-0"
              >
                <span
                  className="relative block h-1 overflow-hidden rounded-full transition-all duration-300"
                  style={{ width: i === current ? 24 : 6 }}
                >
                  <span className="absolute inset-0 rounded-full bg-white/20" />
                  {i === current && (
                    <span
                      key={progressKey}
                      className="absolute inset-y-0 left-0 animate-progress-fill rounded-full bg-white"
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav arrows — always on touch; hover on desktop */}
      <button
        type="button"
        aria-label="Image précédente"
        onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.06] bg-black/30 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:text-white sm:left-3 sm:h-9 sm:w-9 sm:bg-black/20 sm:text-white/60 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        type="button"
        aria-label="Image suivante"
        onClick={() => goTo((current + 1) % SLIDES.length)}
        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/[0.06] bg-black/30 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:text-white sm:right-3 sm:h-9 sm:w-9 sm:bg-black/20 sm:text-white/60 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Bottom shimmer line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A745]/25 to-transparent" />
    </div>
  );
}
