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
    <div className="relative rounded-3xl overflow-hidden mb-8 h-56 group">
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
      <div className="relative z-10 flex flex-col justify-between h-full px-8 py-7">
        <div>
          <p className="text-[#D4A745]/70 font-body text-xs uppercase tracking-[0.2em] mb-1">{greeting}</p>
          <h1 className="font-display text-3xl text-white leading-tight drop-shadow-lg">{title}</h1>
          <p className="text-white/40 font-body text-sm mt-1.5">{subtitle}</p>
        </div>

        {/* Bottom: slide label + progress dots */}
        <div className="flex items-center justify-between">
          <span className="text-white/30 font-body text-xs italic tracking-wide">
            {SLIDES[current].label}
          </span>

          {/* Progress-bar dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: i === current ? 24 : 6 }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                {i === current && (
                  <div
                    key={progressKey}
                    className="absolute inset-y-0 left-0 bg-white rounded-full animate-progress-fill"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav arrows — visible on hover */}
      <button
        onClick={() => goTo((current - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 duration-300 border border-white/[0.06]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        onClick={() => goTo((current + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 duration-300 border border-white/[0.06]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Bottom shimmer line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A745]/25 to-transparent" />
    </div>
  );
}
