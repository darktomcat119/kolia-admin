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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#FDE8E8] flex items-center justify-center">
            <AlertTriangle size={18} className="text-[#DC2626]" />
          </div>
          <p className="font-body text-sm text-[#1A1A1A] mt-2">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-body font-medium hover:bg-surface-hover transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#DC2626] text-white text-sm font-body font-medium hover:bg-[#B91C1C] transition-colors"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F1011]/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/60">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-border-light px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold font-body text-[#1A1A1A] tracking-tight">{restaurant.name}</h3>
            <p className="text-sm text-[#9C9690] font-body">{CUISINE_LABELS[restaurant.cuisine_type]}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-border text-[#6B6560] hover:bg-surface-hover transition-colors"
            aria-label="Fermer"
          >
            <X size={16} className="mx-auto" />
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[calc(90vh-76px)] space-y-6">
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
              <div className="grid grid-cols-2 gap-2.5">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewImage(null)} />
          <div className="relative max-w-6xl w-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-2xl bg-white/10 border border-white/30 text-white hover:bg-white/20"
              aria-label="Fermer l’aperçu"
            >
              <X size={18} className="mx-auto" />
            </button>
            <img src={previewImage} alt="Aperçu" className="max-h-[82vh] w-full object-contain rounded-2xl shadow-2xl" />
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
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-semibold font-body text-[#1A1A1A]">Restaurants</h1>
          <p className="text-sm text-[#9C9690] font-body mt-0.5">{restaurants.length} établissement(s)</p>
        </div>
        <button
          onClick={() => navigate('/restaurants/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
        >
          <Plus size={16} />
          Ajouter un restaurant
        </button>
      </div>

      {restaurants.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-border-light">
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

                <div className="flex gap-1.5 text-xs text-[#A39E98] font-body mb-4">
                  <span className="px-2 py-1 bg-[#F5F3F0] rounded-lg">Min. €{Number(restaurant.minimum_order).toFixed(0)}</span>
                  <span className="px-2 py-1 bg-[#F5F3F0] rounded-lg">Livraison €{Number(restaurant.delivery_fee).toFixed(2)}</span>
                  <span className="px-2 py-1 bg-[#F5F3F0] rounded-lg">{restaurant.estimated_delivery_min}–{restaurant.estimated_delivery_max} min</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDetailTarget(restaurant)}
                    className="py-2 px-3 rounded-xl border border-[#E5E3E0] text-[#3D3A37] hover:bg-[#F5F3F0] transition-colors"
                    title="Voir les détails"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#E5E3E0] text-sm font-body font-medium text-[#3D3A37] hover:bg-[#F5F3F0] transition-colors"
                  >
                    <Pencil size={13} />
                    Modifier
                  </button>
                  <button
                    onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-sm font-body font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Menu size={13} />
                    Menu
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: restaurant.id, name: restaurant.name })}
                    className="py-2 px-3 rounded-xl border border-[#F5E0E0] text-[#DC2626] hover:bg-[#FDE8E8] transition-colors"
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
