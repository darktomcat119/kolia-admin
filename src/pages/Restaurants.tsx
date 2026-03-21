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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-auto shadow-2xl border border-border-light">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-border-light px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold font-body text-[#1A1A1A]">{restaurant.name}</h3>
            <p className="text-xs text-[#9C9690] font-body">{CUISINE_LABELS[restaurant.cuisine_type]}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-border text-[#6B6560] hover:bg-surface-hover transition-colors"
            aria-label="Fermer"
          >
            <X size={16} className="mx-auto" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="h-44 rounded-xl overflow-hidden border border-border-light bg-[#F7F7F5]">
                {restaurant.image_url ? (
                  <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C4C0BB]">
                    <UtensilsCrossed size={28} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6B6560] font-body">
                <MapPin size={14} />
                <span>{restaurant.address}, {restaurant.city}</span>
              </div>
              {restaurant.phone && (
                <div className="flex items-center gap-2 text-sm text-[#6B6560] font-body">
                  <Phone size={14} />
                  <span>{restaurant.phone}</span>
                </div>
              )}
            </div>

            <div className="bg-[#FAFAF7] rounded-xl border border-border-light p-4 space-y-2">
              <p className="text-sm font-body text-[#3D3A37]">
                <span className="text-[#9C9690]">Frais de livraison:</span> €{Number(restaurant.delivery_fee).toFixed(2)}
              </p>
              <p className="text-sm font-body text-[#3D3A37]">
                <span className="text-[#9C9690]">Commande minimum:</span> €{Number(restaurant.minimum_order).toFixed(2)}
              </p>
              <p className="text-sm font-body text-[#3D3A37]">
                <span className="text-[#9C9690]">Délai:</span> {restaurant.estimated_delivery_min}–{restaurant.estimated_delivery_max} min
              </p>
              <p className="text-sm font-body text-[#3D3A37]">
                <span className="text-[#9C9690]">Rayon:</span> {restaurant.delivery_radius_km} km
              </p>
              <p className="text-sm font-body text-[#3D3A37]">
                <span className="text-[#9C9690]">Statut:</span> {restaurant.is_active ? 'Actif' : 'Inactif'}
              </p>
            </div>
          </div>

          {restaurant.description && (
            <div>
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-1.5">Description</h4>
              <p className="text-sm font-body text-[#4A4642]">{restaurant.description}</p>
            </div>
          )}

          {restaurant.logo_url && (
            <div>
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-2">Logo</h4>
              <img src={restaurant.logo_url} alt="Logo" className="h-14 w-14 object-contain rounded-xl border border-border-light bg-[#F7F7F5]" />
            </div>
          )}

          {restaurant.gallery_urls && restaurant.gallery_urls.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold font-body text-[#1A1A1A] mb-2">Galerie ({restaurant.gallery_urls.length})</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {restaurant.gallery_urls.map((url, i) => (
                  <img key={`${url}-${i}`} src={url} alt="" className="h-16 w-full object-cover rounded-lg border border-border-light bg-[#F7F7F5]" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
