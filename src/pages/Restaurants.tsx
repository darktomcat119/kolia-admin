import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, AlertTriangle, UtensilsCrossed, Pencil, Menu, Images, Eye, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Restaurant } from '../lib/types';
import { CUISINE_LABELS } from '../lib/types';
import { useToast } from '../components/Toast';

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} role="presentation" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE8E8]">
            <AlertTriangle size={18} className="text-[#DC2626]" />
          </div>
          <p className="mt-2 font-body text-sm text-[#1A1A1A]">{message}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-xl border border-border py-2.5 font-body text-sm font-medium transition-colors hover:bg-surface-hover sm:min-h-0"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] flex-1 rounded-xl bg-[#DC2626] py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-[#B91C1C] sm:min-h-0"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function RestaurantDetailModal({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const gallery = Array.isArray(restaurant.gallery_urls) ? restaurant.gallery_urls : [];
  const kpi = [
    { label: 'Frais de livraison', value: `€${Number(restaurant.delivery_fee).toFixed(2)}` },
    { label: 'Commande minimum', value: `€${Number(restaurant.minimum_order).toFixed(2)}` },
    { label: 'Délai', value: `${restaurant.estimated_delivery_min}–${restaurant.estimated_delivery_max} min` },
    { label: 'Rayon', value: `${restaurant.delivery_radius_km} km` },
    { label: 'Statut', value: restaurant.is_active ? 'Actif' : 'Inactif' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#0F1011]/65 backdrop-blur-[2px]" onClick={onClose} role="presentation" />
      <div className="relative flex max-h-[min(94dvh,100%)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.25rem] border border-white/60 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border-light bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h3 className="font-body text-lg font-semibold tracking-tight text-[#1A1A1A] sm:text-xl">{restaurant.name}</h3>
            <p className="text-sm text-[#9C9690] font-body">{CUISINE_LABELS[restaurant.cuisine_type]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-11 shrink-0 self-end rounded-2xl border border-border text-[#6B6560] transition-colors hover:bg-surface-hover sm:h-10 sm:w-10 sm:self-auto"
            aria-label="Fermer"
          >
            <X size={16} className="mx-auto" />
          </button>
        </div>

        <div className="max-h-[calc(94dvh-88px)] space-y-5 overflow-y-auto overscroll-y-contain p-4 sm:max-h-[calc(90vh-88px)] sm:space-y-6 sm:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 space-y-4">
              <div className="h-60 sm:h-72 rounded-2xl overflow-hidden border border-border-light bg-[#F7F7F5]">
                {restaurant.image_url ? (
                  <button type="button" className="w-full h-full" onClick={() => setPreviewImage(restaurant.image_url!)}>
                    <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C4C0BB]">
                    <UtensilsCrossed size={34} />
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border-light bg-[#FAFAF7] px-3.5 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#9C9690] font-body mb-1">
                    <MapPin size={13} /> Adresse
                  </div>
                  <p className="text-sm text-[#3D3A37] font-body">{restaurant.address}, {restaurant.city}</p>
                </div>
                {restaurant.phone && (
                  <div className="rounded-xl border border-border-light bg-[#FAFAF7] px-3.5 py-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#9C9690] font-body mb-1">
                      <Phone size={13} /> Contact
                    </div>
                    <p className="text-sm text-[#3D3A37] font-body">{restaurant.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-2 rounded-2xl border border-border-light bg-gradient-to-b from-[#FAFAF7] to-[#F4F2EE] p-4">
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-3">Aperçu opérationnel</h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {kpi.map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/80 border border-border-light px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wide text-[#9C9690] font-body">{item.label}</p>
                    <p className="text-sm font-semibold font-body text-[#2F2B27] mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {restaurant.description && (
            <div className="rounded-2xl border border-border-light bg-white p-4">
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-2">Description</h4>
              <p className="text-sm leading-6 font-body text-[#4A4642]">{restaurant.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-1 rounded-2xl border border-border-light bg-white p-4">
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-3">Logo</h4>
              {restaurant.logo_url ? (
                <button type="button" onClick={() => setPreviewImage(restaurant.logo_url!)} className="h-24 w-24 rounded-2xl border border-border-light bg-[#F7F7F5] p-2">
                  <img src={restaurant.logo_url} alt="Logo" className="h-full w-full object-contain" />
                </button>
              ) : (
                <div className="h-24 w-24 rounded-2xl border border-dashed border-border-light bg-[#F7F7F5]" />
              )}
            </div>

            <div className="lg:col-span-3 rounded-2xl border border-border-light bg-white p-4">
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-3">Galerie ({gallery.length})</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {gallery.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setPreviewImage(url)}
                    className="group rounded-xl overflow-hidden border border-border-light bg-[#F7F7F5] h-28 sm:h-32"
                  >
                    <img src={url} alt={`Galerie ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </button>
                ))}
              </div>
              {gallery.length === 0 && (
                <p className="text-sm text-[#9C9690] font-body">Aucune image de galerie.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setPreviewImage(null)}
            role="presentation"
          />
          <div className="relative w-full max-w-6xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:max-h-[90dvh] sm:px-4 sm:pb-4 sm:pt-0">
            <div className="mb-2 flex justify-end sm:absolute sm:right-2 sm:top-2 sm:z-10 sm:mb-0">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-white hover:bg-white/20"
                aria-label="Fermer l’aperçu"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Aperçu"
              className="max-h-[min(78dvh,100%)] w-full rounded-xl object-contain shadow-2xl sm:max-h-[min(85dvh,calc(90dvh-3rem))] sm:rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [detailTarget, setDetailTarget] = useState<Restaurant | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name');

    if (!error && data) {
      setRestaurants(data as Restaurant[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.patch(`/api/admin/restaurants/${id}`, { is_active: !currentActive });
      setRestaurants((prev) =>
        prev.map((r) => r.id === id ? { ...r, is_active: !currentActive } : r),
      );
      showToast(currentActive ? 'Restaurant désactivé' : 'Restaurant activé');
    } catch {
      showToast('Échec de la mise à jour', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/restaurants/${deleteTarget.id}`);
      setRestaurants((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast('Restaurant supprimé');
    } catch {
      showToast('Échec de la suppression', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex animate-fade-up flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-body text-xl font-semibold text-[#1A1A1A] sm:text-2xl">Restaurants</h1>
          <p className="mt-0.5 font-body text-sm text-[#9C9690]">{restaurants.length} établissement(s)</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/restaurants/new')}
          className="flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 font-body text-sm font-medium text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-dark sm:w-auto"
        >
          <Plus size={16} />
          Ajouter un restaurant
        </button>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-white p-10 text-center shadow-sm sm:p-16">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F3F0] flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed size={24} className="text-[#C4C0BB]" />
          </div>
          <p className="text-[#1A1A1A] font-body font-semibold mb-1">Aucun restaurant</p>
          <p className="text-sm text-[#9C9690] font-body mb-6">Ajoutez votre premier restaurant pour commencer.</p>
          <button
            onClick={() => navigate('/restaurants/new')}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-dark transition-colors"
          >
            Ajouter un restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden group animate-fade-up"
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              {/* Image */}
              <div className="h-44 relative overflow-hidden bg-gradient-to-br from-[#E07A2F]/20 to-[#1B5E3A]/20">
                {restaurant.image_url ? (
                  <img
                    src={restaurant.image_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed size={32} className="text-[#C4C0BB]" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                {/* Active badge */}
                <button
                  onClick={() => handleToggleActive(restaurant.id, restaurant.is_active)}
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold font-body backdrop-blur-sm transition-colors ${
                    restaurant.is_active
                      ? 'bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-red-500/30'
                  }`}
                >
                  {restaurant.is_active ? 'Actif' : 'Inactif'}
                </button>

                {/* City chip + gallery badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90 text-xs font-body">
                    {restaurant.city}
                  </span>
                  {restaurant.gallery_urls && restaurant.gallery_urls.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/90 text-xs font-body" title="Galerie">
                      <Images size={12} />
                      {restaurant.gallery_urls.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold font-body text-base text-[#1A1A1A] mb-0.5">{restaurant.name}</h3>
                <p className="text-xs text-[#9C9690] font-body mb-3">
                  {CUISINE_LABELS[restaurant.cuisine_type]}
                </p>

                <div className="mb-4 flex flex-wrap gap-1.5 font-body text-xs text-[#A39E98]">
                  <span className="rounded-lg bg-[#F5F3F0] px-2 py-1">Min. €{Number(restaurant.minimum_order).toFixed(0)}</span>
                  <span className="rounded-lg bg-[#F5F3F0] px-2 py-1">Livraison €{Number(restaurant.delivery_fee).toFixed(2)}</span>
                  <span className="rounded-lg bg-[#F5F3F0] px-2 py-1">
                    {restaurant.estimated_delivery_min}–{restaurant.estimated_delivery_max} min
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDetailTarget(restaurant)}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#E5E3E0] py-2 text-[#3D3A37] transition-colors hover:bg-[#F5F3F0] sm:min-h-0 sm:px-3"
                    title="Voir les détails"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                    className="col-span-1 flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E5E3E0] py-2 font-body text-sm font-medium text-[#3D3A37] transition-colors hover:bg-[#F5F3F0] sm:min-w-[100px]"
                  >
                    <Pencil size={13} />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}
                    className="col-span-1 flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/20 sm:min-w-[100px]"
                  >
                    <Menu size={13} />
                    Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: restaurant.id, name: restaurant.name })}
                    className="col-span-2 flex min-h-[44px] items-center justify-center rounded-xl border border-[#F5E0E0] py-2 text-[#DC2626] transition-colors hover:bg-[#FDE8E8] sm:col-span-1 sm:min-h-0 sm:px-3"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Supprimer « ${deleteTarget.name} » ? Cette action est irréversible.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {detailTarget && (
        <RestaurantDetailModal
          restaurant={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}
