import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Restaurant, CuisineType } from '../lib/types';
import { CUISINE_LABELS } from '../lib/types';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
  friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const CUISINE_OPTIONS = Object.entries(CUISINE_LABELS) as [CuisineType, string][];
const ADDRESS_DEBOUNCE_MS = 450;

type AddressSuggestion = {
  displayName: string;
  latitude: number;
  longitude: number;
};

function normalizeGalleryUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
      }
    } catch {
      // Not JSON, fall back to comma-separated values
    }
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return [];
}

const EMPTY_RESTAURANT: Partial<Restaurant> = {
  name: '',
  description: '',
  cuisine_type: 'west_african',
  address: '',
  city: '',
  country: 'FR',
  latitude: 48.8566,
  longitude: 2.3522,
  phone: '',
  image_url: '',
  logo_url: '',
  gallery_urls: [],
  delivery_fee: 3.5,
  minimum_order: 12,
  estimated_delivery_min: 30,
  estimated_delivery_max: 45,
  delivery_radius_km: 5,
  pickup_available: true,
  is_active: true,
  opening_hours: Object.fromEntries(
    DAYS.map((d) => [d, { open: '11:00', close: '22:00' }]),
  ),
};

export function RestaurantEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState<Partial<Restaurant>>(EMPTY_RESTAURANT);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragCover, setDragCover] = useState(false);
  const [dragLogo, setDragLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [dragGallery, setDragGallery] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNew && id) {
      supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            const row = data as Record<string, unknown>;
            const gallery_urls = normalizeGalleryUrls(row.gallery_urls);
            setForm({ ...row, gallery_urls } as Restaurant);
          }
          setLoading(false);
        });
    }
  }, [id, isNew]);

  useEffect(() => {
    const query = (form.address ?? '').trim();

    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }

    if (query.length < 3) {
      setAddressSuggestions([]);
      setAddressSearching(false);
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      setAddressSearching(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '6',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
        if (!res.ok) {
          setAddressSuggestions([]);
          return;
        }

        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;

        const suggestions = (data || [])
          .filter((item) => item.display_name && item.lat && item.lon)
          .map((item) => ({
            displayName: item.display_name as string,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
          }));

        setAddressSuggestions(suggestions);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSearching(false);
      }
    }, ADDRESS_DEBOUNCE_MS);

    return () => {
      if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    };
  }, [form.address]);

  const updateField = <K extends keyof Restaurant>(
    key: K,
    value: Restaurant[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateHours = (day: string, field: 'open' | 'close', value: string) => {
    setForm((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...(prev.opening_hours?.[day] ?? { open: '11:00', close: '22:00' }),
          [field]: value,
        },
      },
    }));
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleImageUpload = async (file: File, type: 'cover' | 'logo' | 'gallery') => {
    if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Format accepté : JPEG, PNG ou WebP');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image trop lourde (max 5 Mo)');
      return;
    }
    if (type === 'cover') setUploadingCover(true);
    else if (type === 'logo') setUploadingLogo(true);
    else setUploadingGallery(true);
    setError('');
    try {
      const { url } = await api.uploadRestaurantImage(file, type);
      if (type === 'gallery') {
        setForm((prev) => ({
          ...prev,
          gallery_urls: [...(prev.gallery_urls ?? []), url],
        }));
      } else {
        updateField(type === 'cover' ? 'image_url' : 'logo_url', url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'upload');
    } finally {
      if (type === 'cover') setUploadingCover(false);
      else if (type === 'logo') setUploadingLogo(false);
      else setUploadingGallery(false);
    }
  };

  const handleGalleryBatchUpload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const invalidType = list.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidType) {
      setError('Format accepté : JPEG, PNG ou WebP');
      return;
    }
    const oversized = list.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError('Une ou plusieurs images dépassent 5 Mo');
      return;
    }

    setUploadingGallery(true);
    setError('');
    try {
      const uploaded = await Promise.all(
        list.map((file) => api.uploadRestaurantImage(file, 'gallery'))
      );
      setForm((prev) => ({
        ...prev,
        gallery_urls: [...(prev.gallery_urls ?? []), ...uploaded.map((u) => u.url)],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery_urls: normalizeGalleryUrls(prev.gallery_urls).filter((_, i) => i !== index),
    }));
  };

  const addGalleryUrl = () => {
    const url = galleryUrlInput.trim();
    if (!url) return;
    try {
      new URL(url);
      setForm((prev) => ({
        ...prev,
        gallery_urls: [...normalizeGalleryUrls(prev.gallery_urls), url],
      }));
      setGalleryUrlInput('');
      setError('');
    } catch {
      setError('URL invalide');
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'cover' | 'logo' | 'gallery') => {
    e.preventDefault();
    if (type === 'cover') setDragCover(false);
    else if (type === 'logo') setDragLogo(false);
    else setDragGallery(false);
    if (type === 'gallery') {
      handleGalleryBatchUpload(e.dataTransfer.files);
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file, type);
  };

  const handleDragOver = (e: React.DragEvent, type: 'cover' | 'logo' | 'gallery') => {
    e.preventDefault();
    if (type === 'cover') setDragCover(true);
    else if (type === 'logo') setDragLogo(true);
    else setDragGallery(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'cover' | 'logo' | 'gallery') => {
    e.preventDefault();
    if (type === 'cover') setDragCover(false);
    else if (type === 'logo') setDragLogo(false);
    else setDragGallery(false);
  };

  const toggleDayClosed = (day: string) => {
    setForm((prev) => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: prev.opening_hours?.[day] ? null : { open: '11:00', close: '22:00' },
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        gallery_urls: normalizeGalleryUrls(form.gallery_urls),
      };
      if (isNew) {
        await api.post('/api/admin/restaurants', payload);
      } else {
        await api.patch(`/api/admin/restaurants/${id}`, payload);
      }
      navigate('/restaurants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const galleryUrls = normalizeGalleryUrls(form.gallery_urls);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/restaurants')}
            className="flex min-h-[44px] items-center gap-1.5 font-body text-sm text-[#9C9690] transition-colors hover:text-[#1A1A1A]"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <span className="hidden text-[#C4C0BB] sm:inline">/</span>
          <h1 className="font-body text-lg font-semibold text-[#1A1A1A] sm:text-xl">
            {isNew ? 'Nouveau restaurant' : 'Modifier le restaurant'}
          </h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/restaurants')}
            className="min-h-[44px] rounded-2xl border border-[#E5E3E0] px-5 py-2.5 font-body text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F5F3F0] sm:min-h-0"
          >
            Annuler
          </button>
          <button
            form="restaurant-form"
            type="submit"
            disabled={saving}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark disabled:opacity-50 sm:min-h-0"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Enregistrement...' : isNew ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
          <p className="text-red-700 text-sm font-body">{error}</p>
        </div>
      )}

      <form id="restaurant-form" onSubmit={handleSubmit}>
        {/* Two-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          {/* Left column */}
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A1A]">Informations générales</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Nom *</label>
                  <input
                    type="text"
                    value={form.name ?? ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                    placeholder="Nom du restaurant"
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Description</label>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    placeholder="Décrivez votre restaurant..."
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Type de cuisine *</label>
                    <select
                      value={form.cuisine_type ?? 'west_african'}
                      onChange={(e) => updateField('cuisine_type', e.target.value as CuisineType)}
                      className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                    >
                      {CUISINE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Téléphone</label>
                    <input
                      type="text"
                      value={form.phone ?? ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Images — upload (main cover + logo) or paste URL */}
            <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold font-body text-[#1A1A1A] mb-1">Images</h2>
              <p className="text-xs text-[#9C9690] font-body mb-4">Téléversez une image de couverture et un logo, ou collez une URL.</p>
              <div className="space-y-6">
                {/* Cover image */}
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-2">Image de couverture (principale)</label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, 'cover');
                      e.target.value = '';
                    }}
                  />
                  <div
                    onDrop={(e) => handleDrop(e, 'cover')}
                    onDragOver={(e) => handleDragOver(e, 'cover')}
                    onDragLeave={(e) => handleDragLeave(e, 'cover')}
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragCover ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-[#FAFAF7]'}`}
                  >
                    {uploadingCover ? (
                      <div className="flex items-center justify-center gap-2 text-primary font-body text-sm">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Upload en cours…</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={28} className="mx-auto text-[#9C9690] mb-2" />
                        <p className="text-sm font-body text-[#6B6560]">Cliquez ou glissez-déposez une image (JPEG, PNG, WebP — max 5 Mo)</p>
                      </>
                    )}
                  </div>
                  {form.image_url && (
                    <img src={form.image_url} alt="Aperçu couverture" className="mt-3 h-20 w-full object-cover rounded-xl border border-border-light" />
                  )}
                  <p className="text-xs text-[#9C9690] font-body mt-2">Ou URL de l&apos;image de couverture</p>
                  <input
                    type="url"
                    value={form.image_url ?? ''}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-2">Logo</label>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, 'logo');
                      e.target.value = '';
                    }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div
                      onDrop={(e) => handleDrop(e, 'logo')}
                      onDragOver={(e) => handleDragOver(e, 'logo')}
                      onDragLeave={(e) => handleDragLeave(e, 'logo')}
                      onClick={() => logoInputRef.current?.click()}
                      className={`flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragLogo ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-[#FAFAF7]'}`}
                    >
                      {uploadingLogo ? (
                        <div className="flex items-center justify-center gap-2 text-primary font-body text-sm">
                          <Loader2 size={18} className="animate-spin" />
                          <span>Upload en cours…</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={22} className="mx-auto text-[#9C9690] mb-1.5" />
                          <p className="text-sm font-body text-[#6B6560]">Cliquez ou glissez-déposez un logo (JPEG, PNG, WebP — max 5 Mo)</p>
                        </>
                      )}
                    </div>
                    <div className="sm:w-[88px] shrink-0">
                      <p className="text-xs text-[#9C9690] font-body mb-1">Aperçu</p>
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Aperçu logo" className="h-16 w-16 object-contain rounded-xl border border-border-light bg-[#F7F7F5]" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl border border-dashed border-border-light bg-[#F7F7F5]" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#9C9690] font-body mt-2">Ou URL du logo</p>
                  <input
                    type="url"
                    value={form.logo_url ?? ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Gallery / sub images */}
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-2">Images supplémentaires (galerie)</label>
                  <div className="mb-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {galleryUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative group">
                        <img
                          src={url}
                          alt={`Galerie ${index + 1}`}
                          className="h-14 w-full object-cover rounded-lg border border-border-light bg-[#F7F7F5]"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow"
                          aria-label="Supprimer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {galleryUrls.length > 0 && (
                    <p className="text-xs text-[#9C9690] font-body mb-2">{galleryUrls.length} image(s) dans la galerie</p>
                  )}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) handleGalleryBatchUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <div
                    onDrop={(e) => handleDrop(e, 'gallery')}
                    onDragOver={(e) => handleDragOver(e, 'gallery')}
                    onDragLeave={(e) => handleDragLeave(e, 'gallery')}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${dragGallery ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-[#FAFAF7]'}`}
                  >
                    {uploadingGallery ? (
                      <div className="flex items-center justify-center gap-2 text-primary font-body text-sm">
                        <Loader2 size={18} className="animate-spin" />
                        <span>Upload en cours…</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={22} className="mx-auto text-[#9C9690] mb-1" />
                        <p className="text-sm font-body text-[#6B6560]">Ajouter une image (glisser-déposer ou clic)</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[#9C9690] font-body mt-2">Ou ajouter par URL</p>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      type="url"
                      value={galleryUrlInput}
                      onChange={(e) => setGalleryUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryUrl())}
                      placeholder="https://..."
                      className="min-h-[44px] flex-1 rounded-xl border border-border px-4 py-2.5 font-body text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 sm:min-h-0"
                    />
                    <button
                      type="button"
                      onClick={addGalleryUrl}
                      disabled={!galleryUrlInput.trim()}
                      className="min-h-[44px] shrink-0 rounded-xl border border-primary bg-primary/5 px-4 py-2.5 font-body text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Location */}
            <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold font-body text-[#1A1A1A] mb-4">Adresse & Localisation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Adresse *</label>
                  <div className="relative">
                  <input
                    type="text"
                    value={form.address ?? ''}
                    onChange={(e) => {
                      updateField('address', e.target.value);
                      setShowAddressSuggestions(true);
                    }}
                    onFocus={() => setShowAddressSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                    required
                    placeholder="Adresse complète (ex: 12 rue des Saveurs)"
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  {addressSearching && (
                    <div className="absolute right-3 top-3.5 text-xs text-[#9C9690] font-body">Recherche...</div>
                  )}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-border-light bg-white shadow-lg">
                      {addressSuggestions.map((item, index) => (
                        <button
                          key={`${item.latitude}-${item.longitude}-${index}`}
                          type="button"
                          onClick={() => {
                            updateField('address', item.displayName);
                            updateField('latitude', item.latitude);
                            updateField('longitude', item.longitude);
                            setShowAddressSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm font-body text-[#4A4642] hover:bg-[#F7F7F5] border-b last:border-b-0 border-border-light"
                        >
                          {item.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                  <p className="mt-1 text-xs text-[#9C9690] font-body">
                    Renseignez le numéro, la rue et des détails utiles (bâtiment, étage, etc.) si nécessaire.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Ville *</label>
                    <input
                      type="text"
                      value={form.city ?? ''}
                      onChange={(e) => updateField('city', e.target.value)}
                      required
                      placeholder="Paris"
                      className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Pays *</label>
                    <input
                      type="text"
                      value={form.country ?? ''}
                      onChange={(e) => updateField('country', e.target.value)}
                      required
                      maxLength={2}
                      placeholder="FR"
                      className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude ?? 0}
                      onChange={(e) => updateField('latitude', Number(e.target.value))}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude ?? 0}
                      onChange={(e) => updateField('longitude', Number(e.target.value))}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold font-body text-[#1A1A1A] mb-4">Paramètres de livraison</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Frais de livraison (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={form.delivery_fee ?? 3.5}
                    onChange={(e) => updateField('delivery_fee', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Commande minimum (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={form.minimum_order ?? 12}
                    onChange={(e) => updateField('minimum_order', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Délai min. (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.estimated_delivery_min ?? 30}
                    onChange={(e) => updateField('estimated_delivery_min', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Délai max. (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.estimated_delivery_max ?? 45}
                    onChange={(e) => updateField('estimated_delivery_max', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B6560] font-body mb-1.5">Rayon (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.delivery_radius_km ?? 5}
                    onChange={(e) => updateField('delivery_radius_km', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="pickup"
                    checked={form.pickup_available ?? true}
                    onChange={(e) => updateField('pickup_available', e.target.checked)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <label htmlFor="pickup" className="text-sm font-body text-[#6B6560]">Retrait disponible</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours — full width */}
        <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 font-body text-base font-semibold text-[#1A1A1A]">Horaires d'ouverture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {DAYS.map((day) => {
              const hours = form.opening_hours?.[day];
              const isClosed = !hours;
              return (
                <div key={day} className={`p-3 rounded-xl border transition-colors ${isClosed ? 'border-[#E5E3E0] bg-[#FAFAF7]' : 'border-primary/20 bg-primary/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body font-semibold text-[#1A1A1A]">{DAY_LABELS[day]}</span>
                    <button
                      type="button"
                      onClick={() => toggleDayClosed(day)}
                      className={`px-2 py-0.5 rounded-full text-xs font-body font-medium transition-colors ${
                        isClosed ? 'bg-[#FDE8E8] text-[#DC2626]' : 'bg-[#E8F9EE] text-[#16A34A]'
                      }`}
                    >
                      {isClosed ? 'Fermé' : 'Ouvert'}
                    </button>
                  </div>
                  {!isClosed && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHours(day, 'open', e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-border font-body text-xs focus:outline-none focus:border-primary bg-white"
                      />
                      <span className="text-[#9C9690] text-xs">–</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHours(day, 'close', e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-border font-body text-xs focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                  )}
                  {isClosed && (
                    <p className="text-xs text-[#C4C0BB] font-body">Fermé ce jour</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}
