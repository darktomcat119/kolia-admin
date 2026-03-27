import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';

type Locale = 'en' | 'fr' | 'pt';
type MediaType = 'all' | 'restaurant' | 'dish' | 'gallery';
type CuisineChip = { id: string; label: string };

type LandingContentType = {
  hero: {
    badge: string;
    slides: Array<{ image: string; title: string; subtitle: string }>;
    searchPlaceholder: string;
    ctaExplore: string;
    ctaTrack: string;
  };
  sections: {
    cuisineChips: CuisineChip[];
    featuredTitle: string;
    featuredSubtitle: string;
    liveStatusTitle: string;
    liveStatusSubtitle: string;
    popularTitle: string;
    popularSubtitle: string;
    howTitle: string;
    howSubtitle: string;
    howSteps: Array<{ n: string; title: string; desc: string }>;
    testimonialsTitle: string;
    testimonials: Array<{ name: string; city: string; text: string }>;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
};

const ALL_CUISINE_IDS: CuisineChip[] = [
  { id: 'all', label: 'All' },
  { id: 'west_african', label: 'West African' },
  { id: 'congolese', label: 'Congolese' },
  { id: 'north_african', label: 'North African' },
  { id: 'central_african', label: 'Central African' },
  { id: 'southern_african', label: 'Southern African' },
  { id: 'lusophone_african', label: 'Lusophone' },
  { id: 'pan_african', label: 'Pan-African' },
];
type MediaAsset = {
  id: string;
  type: Exclude<MediaType, 'all'>;
  label: string;
  source: string;
  url: string;
};

const DEFAULT_TEMPLATE: LandingContentType = {
  hero: {
    badge: 'Luxury delivery',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1600&auto=format&fit=crop&q=70',
        title: 'Authentic African cuisine, elevated',
        subtitle: 'A premium food journey from discovery to doorstep.',
      },
      {
        image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=1600&auto=format&fit=crop&q=70',
        title: 'Curated restaurants in your city',
        subtitle: 'Hand-picked places with quality and consistency.',
      },
      {
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&auto=format&fit=crop&q=70',
        title: 'Smooth ordering, secure payments',
        subtitle: 'Fast checkout and real-time tracking built for trust.',
      },
    ],
    searchPlaceholder: 'Search restaurants or dishes…',
    ctaExplore: 'Explore restaurants',
    ctaTrack: 'Track order',
  },
  sections: {
    cuisineChips: ALL_CUISINE_IDS,
    featuredTitle: 'Featured near you',
    featuredSubtitle: 'Hand-picked restaurants with signature dishes.',
    liveStatusTitle: 'Live status',
    liveStatusSubtitle: 'Your active order at a glance.',
    popularTitle: 'Popular right now',
    popularSubtitle: 'Premium picks with fast checkout.',
    howTitle: 'How it works',
    howSubtitle: 'A premium journey from discovery to delivery.',
    howSteps: [
      { n: '01', title: 'Discover', desc: 'Browse curated restaurants and dishes.' },
      { n: '02', title: 'Order', desc: 'Add favorites, checkout securely in seconds.' },
      { n: '03', title: 'Track', desc: 'Follow each step until your order arrives.' },
    ],
    testimonialsTitle: 'Loved by customers',
    testimonials: [
      { name: 'Aminata D.', city: 'Paris', text: 'Finally, authentic West African food delivered beautifully and on time.' },
      { name: 'Pedro M.', city: 'Lyon', text: 'The app feels premium and the dishes are consistently excellent.' },
      { name: 'Fatima B.', city: 'Grenoble', text: 'Fast checkout, clear tracking, and amazing flavors every time.' },
    ],
    ctaTitle: 'Ready to order?',
    ctaSubtitle: 'Discover premium African cuisine and get it delivered fast.',
    ctaPrimary: 'Start ordering',
    ctaSecondary: 'Create account',
  },
};

const MAX_SLIDES = 6;
const MAX_HOW_STEPS = 6;
const MAX_TESTIMONIALS = 6;

function isLikelyUrl(value: string) {
  const v = value.trim();
  return v.startsWith('http://') || v.startsWith('https://');
}


async function getImageMeta(url: string): Promise<{ width: number; height: number } | null> {
  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function LandingContent() {
  const { showToast } = useToast();
  const [locale, setLocale] = useState<Locale>('en');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState<LandingContentType>(DEFAULT_TEMPLATE);
  const [showJson, setShowJson] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTargetSlide, setMediaTargetSlide] = useState<number | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const locales = useMemo(() => (['en', 'fr', 'pt'] as const), []);

  const loadLocale = async (next: Locale) => {
    setLoading(true);
    try {
      const row = await api.get<{ content: LandingContentType; is_active: boolean } | null>(
        `/api/admin/landing-content/${next}`,
      );
      setContent(row?.content ?? DEFAULT_TEMPLATE);
      setIsActive(row?.is_active ?? true);
      setLocale(next);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Échec du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocale('en');
  }, []);

  const save = async () => {
    if (validationErrors.length) {
      showToast(`Cannot save: ${validationErrors[0]}`, 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/admin/landing-content/${locale}`, {
        content,
        is_active: isActive,
      });
      showToast('Contenu de la landing enregistré');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erreur de sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateHero = <K extends keyof LandingContentType['hero']>(key: K, value: LandingContentType['hero'][K]) => {
    setContent((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }));
  };

  const updateSections = <K extends keyof LandingContentType['sections']>(
    key: K,
    value: LandingContentType['sections'][K],
  ) => {
    setContent((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }));
  };

  const uploadSlideImage = async (slideIndex: number, file: File | null) => {
    if (!file) return;
    setUploadingSlide(slideIndex);
    try {
      const { url } = await api.uploadRestaurantImage(file, 'cover');
      updateHero(
        'slides',
        content.hero.slides.map((s, idx) => (idx === slideIndex ? { ...s, image: url } : s)),
      );
      await warnIfImageNotHeroFriendly(url);
      showToast('Image téléversée');
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Échec de l'upload", 'error');
    } finally {
      setUploadingSlide(null);
    }
  };

  const loadMediaLibrary = async () => {
    setMediaLoading(true);
    try {
      const assets = await api.get<MediaAsset[]>('/api/admin/landing-content/media-library');
      setMediaAssets(assets ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load media library', 'error');
    } finally {
      setMediaLoading(false);
    }
  };

  const warnIfImageNotHeroFriendly = async (url: string) => {
    const meta = await getImageMeta(url);
    if (!meta || meta.height <= 0) return;
    const ratio = meta.width / meta.height;
    const ratioOk = ratio >= 1.45 && ratio <= 2.4;
    const sizeOk = meta.width >= 1200 && meta.height >= 600;
    if (!ratioOk || !sizeOk) {
      showToast(
        `Image selected (${meta.width}x${meta.height}). For hero, prefer >=1200x600 and ~16:9 ratio.`,
        'error',
      );
    }
  };

  const openMediaPicker = async (slideIndex: number) => {
    setMediaTargetSlide(slideIndex);
    setMediaOpen(true);
    if (!mediaAssets.length) {
      await loadMediaLibrary();
    }
  };

  const usedSlidesByUrl = useMemo(() => {
    const map = new Map<string, number[]>();
    content.hero.slides.forEach((s, idx) => {
      const key = s.image.trim();
      if (!key) return;
      const current = map.get(key) ?? [];
      current.push(idx + 1);
      map.set(key, current);
    });
    return map;
  }, [content.hero.slides]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!content.hero.badge.trim()) errors.push('Hero badge is required.');
    if (!content.hero.searchPlaceholder.trim()) errors.push('Hero search placeholder is required.');
    if (!content.hero.ctaExplore.trim() || !content.hero.ctaTrack.trim()) errors.push('Hero CTA labels are required.');
    if (!content.hero.slides.length) errors.push('At least one hero slide is required.');
    if (content.hero.slides.length > MAX_SLIDES) errors.push(`Maximum ${MAX_SLIDES} hero slides allowed.`);
    content.hero.slides.forEach((s, i) => {
      if (!s.title.trim() || !s.subtitle.trim()) errors.push(`Hero slide ${i + 1} title/subtitle is required.`);
      if (!isLikelyUrl(s.image)) errors.push(`Hero slide ${i + 1} image must be a valid URL.`);
    });
    if (!content.sections.featuredTitle.trim() || !content.sections.popularTitle.trim()) {
      errors.push('Section titles are required.');
    }
    if (!content.sections.howSteps.length) errors.push('At least one how-step is required.');
    if (content.sections.howSteps.length > MAX_HOW_STEPS) errors.push(`Maximum ${MAX_HOW_STEPS} how-steps allowed.`);
    content.sections.howSteps.forEach((s, i) => {
      if (!s.n.trim() || !s.title.trim() || !s.desc.trim()) errors.push(`How-step ${i + 1} is incomplete.`);
    });
    if (!content.sections.testimonials.length) errors.push('At least one testimonial is required.');
    if (content.sections.testimonials.length > MAX_TESTIMONIALS) errors.push(`Maximum ${MAX_TESTIMONIALS} testimonials allowed.`);
    content.sections.testimonials.forEach((t, i) => {
      if (!t.name.trim() || !t.city.trim() || !t.text.trim()) errors.push(`Testimonial ${i + 1} is incomplete.`);
    });
    return errors;
  }, [content]);

  const filteredMedia = useMemo(() => {
    const q = mediaSearch.trim().toLowerCase();
    return mediaAssets.filter((m) => {
      if (mediaType !== 'all' && m.type !== mediaType) return false;
      if (!q) return true;
      return `${m.label} ${m.source}`.toLowerCase().includes(q);
    });
  }, [mediaAssets, mediaType, mediaSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-xl font-semibold text-[#1A1A1A] sm:text-2xl">Landing page customer</h1>
          <p className="mt-0.5 font-body text-sm text-[#9C9690]">
            Éditez tout le contenu de la page d&apos;accueil avec des champs structurés (par locale).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowJson((v) => !v)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E5E3E0] bg-white px-4 text-sm font-semibold text-[#6B6560]"
          >
            {showJson ? 'Masquer JSON' : 'Voir JSON'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || validationErrors.length > 0}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {validationErrors.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Validation issues</p>
          <ul className="mt-2 list-disc pl-5">
            {validationErrors.slice(0, 6).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => void loadLocale(l)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                locale === l ? 'bg-primary text-white' : 'bg-[#F5F3F0] text-[#6B6560]'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-[#6B6560]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Actif pour cette locale
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-[#1A1A1A]">Hero</h2>
          <div className="space-y-3">
            <input
              value={content.hero.badge}
              onChange={(e) => updateHero('badge', e.target.value)}
              placeholder="Badge"
              className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm"
            />
            <input
              value={content.hero.searchPlaceholder}
              onChange={(e) => updateHero('searchPlaceholder', e.target.value)}
              placeholder="Search placeholder"
              className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={content.hero.ctaExplore}
                onChange={(e) => updateHero('ctaExplore', e.target.value)}
                placeholder="CTA Explore"
                className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm"
              />
              <input
                value={content.hero.ctaTrack}
                onChange={(e) => updateHero('ctaTrack', e.target.value)}
                placeholder="CTA Track"
                className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              {content.hero.slides.map((slide, i) => (
                <div key={i} className="rounded-xl border border-[#E5E3E0] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#9C9690]">Slide {i + 1}</p>
                    <button
                      type="button"
                      onClick={() => updateHero('slides', content.hero.slides.filter((_, idx) => idx !== i))}
                      disabled={content.hero.slides.length <= 1}
                      className="rounded-md border border-[#E5E3E0] px-2 py-1 text-[11px] font-semibold text-[#6B6560] disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="inline-flex min-h-[36px] cursor-pointer items-center rounded-lg border border-[#E5E3E0] bg-white px-3 text-xs font-semibold text-[#6B6560] hover:bg-[#F8F7F5]">
                        {uploadingSlide === i ? 'Uploading...' : 'Upload image'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingSlide !== null}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            void uploadSlideImage(i, file);
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void openMediaPicker(i)}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E5E3E0] bg-white px-3 text-xs font-semibold text-[#6B6560] hover:bg-[#F8F7F5]"
                      >
                        Choose library
                      </button>
                      <span className="text-[11px] text-[#9C9690]">or paste URL below</span>
                    </div>
                    <input
                      value={slide.image}
                      onChange={(e) =>
                        updateHero(
                          'slides',
                          content.hero.slides.map((s, idx) => (idx === i ? { ...s, image: e.target.value } : s)),
                        )
                      }
                      placeholder="Image URL"
                      className="w-full rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs"
                    />
                    <input
                      value={slide.title}
                      onChange={(e) =>
                        updateHero(
                          'slides',
                          content.hero.slides.map((s, idx) => (idx === i ? { ...s, title: e.target.value } : s)),
                        )
                      }
                      placeholder="Title"
                      className="w-full rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs"
                    />
                    <input
                      value={slide.subtitle}
                      onChange={(e) =>
                        updateHero(
                          'slides',
                          content.hero.slides.map((s, idx) => (idx === i ? { ...s, subtitle: e.target.value } : s)),
                        )
                      }
                      placeholder="Subtitle"
                      className="w-full rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateHero('slides', [
                    ...content.hero.slides,
                    { image: '', title: 'New slide title', subtitle: 'New slide subtitle' },
                  ])
                }
                disabled={content.hero.slides.length >= MAX_SLIDES}
                className="rounded-xl border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
              >
                Add slide
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-[#1A1A1A]">Sections</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={content.sections.featuredTitle} onChange={(e) => updateSections('featuredTitle', e.target.value)} placeholder="Featured title" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.featuredSubtitle} onChange={(e) => updateSections('featuredSubtitle', e.target.value)} placeholder="Featured subtitle" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.liveStatusTitle} onChange={(e) => updateSections('liveStatusTitle', e.target.value)} placeholder="Live status title" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.liveStatusSubtitle} onChange={(e) => updateSections('liveStatusSubtitle', e.target.value)} placeholder="Live status subtitle" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.popularTitle} onChange={(e) => updateSections('popularTitle', e.target.value)} placeholder="Popular title" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.popularSubtitle} onChange={(e) => updateSections('popularSubtitle', e.target.value)} placeholder="Popular subtitle" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.howTitle} onChange={(e) => updateSections('howTitle', e.target.value)} placeholder="How title" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.howSubtitle} onChange={(e) => updateSections('howSubtitle', e.target.value)} placeholder="How subtitle" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.testimonialsTitle} onChange={(e) => updateSections('testimonialsTitle', e.target.value)} placeholder="Testimonials title" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.ctaTitle} onChange={(e) => updateSections('ctaTitle', e.target.value)} placeholder="Bottom CTA title" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.ctaSubtitle} onChange={(e) => updateSections('ctaSubtitle', e.target.value)} placeholder="Bottom CTA subtitle" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm sm:col-span-2" />
              <input value={content.sections.ctaPrimary} onChange={(e) => updateSections('ctaPrimary', e.target.value)} placeholder="Bottom CTA primary button" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
              <input value={content.sections.ctaSecondary} onChange={(e) => updateSections('ctaSecondary', e.target.value)} placeholder="Bottom CTA secondary button" className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm" />
            </div>

            <div className="rounded-xl border border-[#E5E3E0] p-3">
              <p className="mb-1 text-xs font-semibold text-[#9C9690]">Cuisine filter chips</p>
              <p className="mb-3 text-[11px] text-[#B0ABA5]">
                Controls which cuisine filters appear in the hero. IDs must match database values — only edit labels.
              </p>
              <div className="space-y-2">
                {(content.sections.cuisineChips ?? []).map((chip, i) => (
                  <div key={chip.id} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 rounded-lg bg-[#F5F3F0] px-2 py-1.5 font-mono text-[11px] text-[#6B6560]">
                      {chip.id}
                    </span>
                    <input
                      value={chip.label}
                      onChange={(e) =>
                        updateSections(
                          'cuisineChips',
                          (content.sections.cuisineChips ?? []).map((c, idx) =>
                            idx === i ? { ...c, label: e.target.value } : c,
                          ),
                        )
                      }
                      placeholder="Label"
                      className="flex-1 rounded-lg border border-[#E5E3E0] px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        const chips = [...(content.sections.cuisineChips ?? [])];
                        [chips[i - 1], chips[i]] = [chips[i], chips[i - 1]];
                        updateSections('cuisineChips', chips);
                      }}
                      className="rounded-lg border border-[#E5E3E0] px-2 py-1.5 text-[11px] font-semibold text-[#6B6560] disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === (content.sections.cuisineChips ?? []).length - 1}
                      onClick={() => {
                        const chips = [...(content.sections.cuisineChips ?? [])];
                        [chips[i], chips[i + 1]] = [chips[i + 1], chips[i]];
                        updateSections('cuisineChips', chips);
                      }}
                      className="rounded-lg border border-[#E5E3E0] px-2 py-1.5 text-[11px] font-semibold text-[#6B6560] disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={(content.sections.cuisineChips ?? []).length <= 1}
                      onClick={() =>
                        updateSections(
                          'cuisineChips',
                          (content.sections.cuisineChips ?? []).filter((_, idx) => idx !== i),
                        )
                      }
                      className="rounded-lg border border-[#E5E3E0] px-2 py-1.5 text-[11px] font-semibold text-[#DC2626] disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {(() => {
                const activeIds = new Set((content.sections.cuisineChips ?? []).map((c) => c.id));
                const available = ALL_CUISINE_IDS.filter((c) => !activeIds.has(c.id));
                if (!available.length) return null;
                return (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {available.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          updateSections('cuisineChips', [
                            ...(content.sections.cuisineChips ?? []),
                            { id: c.id, label: c.label },
                          ])
                        }
                        className="rounded-full border border-dashed border-[#D8D5D0] px-3 py-1 text-[11px] font-semibold text-[#9C9690] hover:border-primary hover:text-primary"
                      >
                        + {c.id}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="rounded-xl border border-[#E5E3E0] p-3">
              <p className="mb-2 text-xs font-semibold text-[#9C9690]">How steps</p>
              <div className="space-y-2">
                {content.sections.howSteps.map((s, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <input value={s.n} onChange={(e) => updateSections('howSteps', content.sections.howSteps.map((x, idx) => (idx === i ? { ...x, n: e.target.value } : x)))} placeholder="Step no" className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs" />
                    <input value={s.title} onChange={(e) => updateSections('howSteps', content.sections.howSteps.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} placeholder="Step title" className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs" />
                    <input value={s.desc} onChange={(e) => updateSections('howSteps', content.sections.howSteps.map((x, idx) => (idx === i ? { ...x, desc: e.target.value } : x)))} placeholder="Step description" className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs" />
                    <button
                      type="button"
                      onClick={() => updateSections('howSteps', content.sections.howSteps.filter((_, idx) => idx !== i))}
                      disabled={content.sections.howSteps.length <= 1}
                      className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => updateSections('howSteps', [...content.sections.howSteps, { n: '00', title: 'New step', desc: 'Step description' }])}
                disabled={content.sections.howSteps.length >= MAX_HOW_STEPS}
                className="mt-2 rounded-xl border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
              >
                Add step
              </button>
            </div>

            <div className="rounded-xl border border-[#E5E3E0] p-3">
              <p className="mb-2 text-xs font-semibold text-[#9C9690]">Testimonials</p>
              <div className="space-y-2">
                {content.sections.testimonials.map((t, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <input value={t.name} onChange={(e) => updateSections('testimonials', content.sections.testimonials.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs" />
                    <input value={t.city} onChange={(e) => updateSections('testimonials', content.sections.testimonials.map((x, idx) => (idx === i ? { ...x, city: e.target.value } : x)))} placeholder="City" className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs" />
                    <input value={t.text} onChange={(e) => updateSections('testimonials', content.sections.testimonials.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))} placeholder="Text" className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs" />
                    <button
                      type="button"
                      onClick={() => updateSections('testimonials', content.sections.testimonials.filter((_, idx) => idx !== i))}
                      disabled={content.sections.testimonials.length <= 1}
                      className="rounded-lg border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => updateSections('testimonials', [...content.sections.testimonials, { name: 'New Name', city: 'City', text: 'New testimonial text' }])}
                disabled={content.sections.testimonials.length >= MAX_TESTIMONIALS}
                className="mt-2 rounded-xl border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
              >
                Add testimonial
              </button>
            </div>
          </div>
        </section>
      </div>

      {showJson ? (
        <div className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm">
          <textarea
            value={JSON.stringify(content, null, 2)}
            readOnly
            rows={24}
            spellCheck={false}
            className="w-full rounded-xl border border-[#E5E3E0] bg-[#FCFCFB] p-3 font-mono text-xs leading-6 outline-none"
          />
        </div>
      ) : null}

      {mediaOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 p-4">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col rounded-2xl border border-[#E5E3E0] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E3E0] px-4 py-3">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">Select image from media library</h3>
                <p className="text-xs text-[#9C9690]">Slide {mediaTargetSlide !== null ? mediaTargetSlide + 1 : '-'}</p>
              </div>
              <button
                type="button"
                onClick={() => setMediaOpen(false)}
                className="rounded-lg border border-[#E5E3E0] px-3 py-1.5 text-xs font-semibold text-[#6B6560]"
              >
                Close
              </button>
            </div>
            <div className="border-b border-[#E5E3E0] p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
                <input
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm sm:col-span-3"
                />
                {(['all', 'restaurant', 'dish', 'gallery'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMediaType(t)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      mediaType === t ? 'bg-primary text-white' : 'bg-[#F5F3F0] text-[#6B6560]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {mediaLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-36 animate-pulse rounded-xl border border-[#E5E3E0] bg-[#F5F3F0]" />
                  ))}
                </div>
              ) : !filteredMedia.length ? (
                <div className="rounded-xl border border-[#E5E3E0] bg-[#FAFAF7] p-4 text-sm text-[#6B6560]">No media found.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMedia.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={async () => {
                        if (mediaTargetSlide === null) return;
                        updateHero(
                          'slides',
                          content.hero.slides.map((s, idx) => (idx === mediaTargetSlide ? { ...s, image: m.url } : s)),
                        );
                        await warnIfImageNotHeroFriendly(m.url);
                        setMediaOpen(false);
                        showToast('Image selected');
                      }}
                      className="overflow-hidden rounded-xl border border-[#E5E3E0] bg-white text-left transition hover:border-primary/40"
                    >
                      <img src={m.url} alt="" className="h-28 w-full object-cover" loading="lazy" />
                      <div className="p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-[#1A1A1A]">{m.label}</p>
                          {usedSlidesByUrl.get(m.url)?.length ? (
                            <span className="shrink-0 rounded-full bg-[#F5F3F0] px-2 py-0.5 text-[10px] font-semibold text-[#6B6560]">
                              Used: {usedSlidesByUrl.get(m.url)!.join(',')}
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-[11px] text-[#9C9690]">{m.type} · {m.source}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

