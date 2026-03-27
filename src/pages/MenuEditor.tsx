import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Pencil, X, Plus, Upload, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { Restaurant, MenuCategory, MenuItem, DietaryTag } from '../lib/types';
import { DIETARY_LABELS } from '../lib/types';

const ALL_DIETARY_TAGS: DietaryTag[] = [
  'halal', 'vegan', 'vegetarian', 'spicy', 'gluten_free', 'contains_nuts',
];

interface ItemFormState {
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_popular: boolean;
  popular_rank: number | null;
  dietary_tags: DietaryTag[];
  sort_order: number;
}

const EMPTY_ITEM: ItemFormState = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  is_available: true,
  is_popular: false,
  popular_rank: null,
  dietary_tags: [],
  sort_order: 0,
};

export function MenuEditor() {
  const { id: restaurantId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM);

  useEffect(() => {
    if (!restaurantId) return;

    Promise.all([
      supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
      supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order'),
      supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order'),
    ]).then(([restRes, catRes, itemRes]) => {
      if (restRes.data) setRestaurant(restRes.data as Restaurant);
      if (catRes.data) {
        const cats = catRes.data as MenuCategory[];
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      }
      if (itemRes.data) setItems(itemRes.data as MenuItem[]);
      setLoading(false);
    });
  }, [restaurantId]);

  // Category actions
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !restaurantId) return;

    try {
      const data = await api.post<MenuCategory>(
        `/api/admin/restaurants/${restaurantId}/categories`,
        { name: newCategoryName.trim(), sort_order: categories.length },
      );
      setCategories((prev) => [...prev, data]);
      setActiveCategory(data.id);
      setNewCategoryName('');
    } catch (err) {
      console.error('Failed to add category:', err);
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editCategoryName.trim()) return;

    try {
      await api.patch(`/api/admin/categories/${categoryId}`, {
        name: editCategoryName.trim(),
      });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, name: editCategoryName.trim() } : c,
        ),
      );
      setEditingCategory(null);
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const catItems = items.filter((i) => i.category_id === categoryId);
    if (catItems.length > 0) {
      if (!window.confirm(`Cette catégorie contient ${catItems.length} plat(s). Tout supprimer ?`))
        return;
    }

    try {
      await api.delete(`/api/admin/categories/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setItems((prev) => prev.filter((i) => i.category_id !== categoryId));
      if (activeCategory === categoryId) {
        setActiveCategory(categories.find((c) => c.id !== categoryId)?.id ?? null);
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  // Item actions
  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeCategory || !restaurantId) return;

    try {
      const data = await api.post<MenuItem>(
        `/api/admin/restaurants/${restaurantId}/items`,
        { ...itemForm, category_id: activeCategory },
      );
      setItems((prev) => [...prev, data]);
      setItemForm(EMPTY_ITEM);
      setShowItemForm(false);
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const data = await api.patch<MenuItem>(
        `/api/admin/items/${editingItem}`,
        itemForm,
      );
      setItems((prev) => prev.map((i) => (i.id === editingItem ? data : i)));
      setEditingItem(null);
      setItemForm(EMPTY_ITEM);
      setShowItemForm(false);
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Supprimer ce plat ?')) return;

    try {
      await api.delete(`/api/admin/items/${itemId}`);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleToggleAvailable = async (itemId: string, current: boolean) => {
    try {
      await api.patch(`/api/admin/items/${itemId}`, {
        is_available: !current,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, is_available: !current } : i,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleTogglePopular = async (itemId: string, current: boolean) => {
    try {
      await api.patch(`/api/admin/items/${itemId}`, {
        is_popular: !current,
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, is_popular: !current } : i,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle popular:', err);
    }
  };

  const itemImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [itemImagePreviewError, setItemImagePreviewError] = useState(false);

  useEffect(() => {
    return () => {
      if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl);
    };
  }, [blobPreviewUrl]);

  const clearItemImage = () => {
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setItemImagePreviewError(false);
    setItemForm((p) => ({ ...p, image_url: '' }));
    if (itemImageInputRef.current) itemImageInputRef.current.value = '';
  };

  const handleItemImageFile = async (file: File | undefined) => {
    if (!file || !restaurantId) return;
    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!okTypes.includes(file.type)) {
      window.alert('Utilisez JPEG, PNG ou WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('Fichier trop volumineux (max 5 Mo)');
      return;
    }
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setItemImagePreviewError(false);
    setUploadingItemImage(true);
    try {
      const { url } = await api.uploadMenuItemImage(file, restaurantId);
      setBlobPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setItemForm((p) => ({ ...p, image_url: url }));
    } catch (err) {
      setBlobPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      window.alert(err instanceof Error ? err.message : 'Échec du téléversement');
    } finally {
      setUploadingItemImage(false);
      if (itemImageInputRef.current) itemImageInputRef.current.value = '';
    }
  };

  const itemImagePreviewSrc = blobPreviewUrl || itemForm.image_url.trim();

  useEffect(() => {
    setItemImagePreviewError(false);
  }, [itemForm.image_url, blobPreviewUrl]);

  const toggleDietaryTag = (tag: DietaryTag) => {
    setItemForm((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const startEditItem = (item: MenuItem) => {
    setBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setItemImagePreviewError(false);
    setEditingItem(item.id);
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      image_url: item.image_url ?? '',
      is_available: item.is_available,
      is_popular: item.is_popular ?? false,
      popular_rank: item.popular_rank ?? null,
      dietary_tags: item.dietary_tags ?? [],
      sort_order: item.sort_order,
    });
    setShowItemForm(true);
  };

  const activeItems = items.filter((i) => i.category_id === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <button
          type="button"
          onClick={() => navigate('/restaurants')}
          className="flex min-h-[44px] w-fit items-center gap-1 text-[#6B6560] transition-colors hover:text-[#1A1A1A]"
        >
          <ArrowLeft size={18} className="-mt-0.5 inline" /> Retour
        </button>
        <h1 className="font-body text-xl font-semibold sm:text-2xl">
          Menu — {restaurant?.name}
        </h1>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Categories Sidebar */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm">
            <h3 className="text-sm font-medium text-[#6B6560] font-body mb-3">
              Catégories
            </h3>

            <div className="space-y-1 mb-4">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1">
                  {editingCategory === cat.id ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateCategory(cat.id);
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 text-sm border border-border rounded font-body"
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="text-xs text-primary"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                          activeCategory === cat.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-surface-hover text-[#1A1A1A]'
                        }`}
                      >
                        {cat.name}
                        <span className="ml-1 text-xs text-[#A39E98]">
                          ({items.filter((i) => i.category_id === cat.id).length})
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(cat.id);
                          setEditCategoryName(cat.name);
                        }}
                        className="text-xs text-[#A39E98] hover:text-primary px-1"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-xs text-[#A39E98] hover:text-[#DC2626] px-1"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add Category */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nouvelle catégorie"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg font-body focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-primary text-white text-sm"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1">
          {!activeCategory ? (
            <div className="rounded-2xl border border-border-light bg-white px-4 py-10 text-center shadow-sm sm:p-12">
              <p className="font-body text-[#6B6560]">
                Créez une catégorie pour commencer à ajouter des plats
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-body text-lg font-semibold">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setBlobPreviewUrl((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                    setItemImagePreviewError(false);
                    setItemForm(EMPTY_ITEM);
                    setShowItemForm(true);
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-primary-dark sm:w-auto sm:min-h-0"
                >
                  <Plus size={16} className="-mt-0.5 inline" /> Ajouter un plat
                </button>
              </div>

              {/* Item Form Modal */}
              {showItemForm && (
                <div className="mb-6 rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-6">
                  <h3 className="text-base font-semibold font-body mb-4">
                    {editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                  </h3>
                  <form
                    onSubmit={editingItem ? handleUpdateItem : handleAddItem}
                    className="space-y-4"
                  >
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="col-span-full min-w-0">
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          Nom *
                        </label>
                        <input
                          type="text"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm((p) => ({ ...p, name: e.target.value }))
                          }
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-full min-w-0">
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          Description
                        </label>
                        <textarea
                          value={itemForm.description}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                      <div className="col-span-full min-w-0 sm:col-span-1">
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          Prix (€) *
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={itemForm.price}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              price: Number(e.target.value),
                            }))
                          }
                          required
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="col-span-full min-w-0 rounded-2xl border border-border-light bg-[#FAFAF7]/80 p-4 sm:p-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <label className="mb-0.5 block font-body text-sm font-medium text-[#6B6560]">
                              Photo du plat
                            </label>
                            <p className="font-body text-xs text-[#9C9690]">
                              JPEG, PNG ou WebP — max 5 Mo. Aperçu en direct après choix du fichier ou saisie d&apos;une URL.
                            </p>
                          </div>
                          {itemImagePreviewSrc ? (
                            <button
                              type="button"
                              onClick={clearItemImage}
                              className="mt-2 shrink-0 rounded-lg px-3 py-1.5 font-body text-xs font-medium text-[#B45309] underline-offset-2 hover:underline sm:mt-0"
                            >
                              Retirer la photo
                            </button>
                          ) : null}
                        </div>

                        <div
                          className={`relative mt-4 flex min-h-[180px] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white sm:min-h-[220px] ${
                            itemImagePreviewSrc && !itemImagePreviewError
                              ? 'border-transparent p-0'
                              : 'border-[#D8D5D0] p-6'
                          }`}
                        >
                          {uploadingItemImage ? (
                            <div
                              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-[2px]"
                              aria-live="polite"
                            >
                              <Loader2 size={32} className="animate-spin text-primary" />
                              <span className="font-body text-sm font-medium text-[#3D3A37]">
                                Téléversement…
                              </span>
                            </div>
                          ) : null}
                          {itemImagePreviewSrc && !itemImagePreviewError ? (
                            <img
                              src={itemImagePreviewSrc}
                              alt="Aperçu du plat"
                              className="max-h-[280px] w-full object-cover sm:max-h-[320px]"
                              onLoad={() => setItemImagePreviewError(false)}
                              onError={() => setItemImagePreviewError(true)}
                            />
                          ) : itemImagePreviewSrc && itemImagePreviewError ? (
                            <div className="flex max-w-sm flex-col items-center gap-2 text-center">
                              <ImageIcon className="h-10 w-10 text-[#DC2626]/70" aria-hidden />
                              <p className="font-body text-sm font-medium text-[#B91C1C]">
                                Impossible de charger cette image
                              </p>
                              <p className="font-body text-xs text-[#9C9690]">
                                Vérifiez l&apos;URL ou choisissez un fichier.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EFEB]">
                                <ImageIcon className="h-7 w-7 text-[#A39E98]" aria-hidden />
                              </div>
                              <p className="font-body text-sm font-medium text-[#6B6560]">
                                Aucune image pour l&apos;instant
                              </p>
                              <p className="max-w-xs font-body text-xs text-[#9C9690]">
                                Utilisez le bouton ci-dessous ou collez un lien direct vers une image.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                          <input
                            ref={itemImageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleItemImageFile(e.target.files?.[0])}
                          />
                          <button
                            type="button"
                            disabled={uploadingItemImage || !restaurantId}
                            onClick={() => itemImageInputRef.current?.click()}
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 font-body text-sm font-medium text-[#3D3A37] shadow-sm transition-colors hover:bg-surface-hover disabled:opacity-50 sm:w-auto sm:min-h-0"
                          >
                            {uploadingItemImage ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Téléversement…
                              </>
                            ) : (
                              <>
                                <Upload size={18} />
                                Choisir une image
                              </>
                            )}
                          </button>
                          <div className="min-w-0 flex-1 sm:min-w-[240px]">
                            <label className="mb-1 block font-body text-xs font-medium text-[#9C9690]">
                              Ou URL de l&apos;image
                            </label>
                            <input
                              type="url"
                              value={itemForm.image_url}
                              onChange={(e) => {
                                setBlobPreviewUrl((prev) => {
                                  if (prev) URL.revokeObjectURL(prev);
                                  return null;
                                });
                                setItemForm((p) => ({ ...p, image_url: e.target.value }));
                              }}
                              placeholder="https://..."
                              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-body text-sm shadow-sm focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dietary Tags */}
                    <div>
                      <label className="block text-sm font-medium text-[#6B6560] font-body mb-2">
                        Tags alimentaires
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_DIETARY_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleDietaryTag(tag)}
                            className={`min-h-[40px] rounded-full px-3 py-2 text-xs font-body transition-colors sm:min-h-0 sm:py-1.5 ${
                              itemForm.dietary_tags.includes(tag)
                                ? 'bg-primary text-white'
                                : 'bg-surface-hover text-[#6B6560] border border-border'
                            }`}
                          >
                            {DIETARY_LABELS[tag]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popular on landing page */}
                    <div className="rounded-xl border border-border-light bg-[#FAFAF7]/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-body text-sm font-medium text-[#3D3A37]">
                            Populaire sur la page d&apos;accueil
                          </p>
                          <p className="font-body text-xs text-[#9C9690] mt-0.5">
                            Ce plat apparaîtra dans la section &laquo;&nbsp;Populaires&nbsp;&raquo; du site client.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setItemForm((p) => ({ ...p, is_popular: !p.is_popular }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                            itemForm.is_popular ? 'bg-primary' : 'bg-[#D8D5D0]'
                          }`}
                          role="switch"
                          aria-checked={itemForm.is_popular}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                              itemForm.is_popular ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      {itemForm.is_popular && (
                        <div className="mt-3">
                          <label className="block font-body text-xs font-medium text-[#6B6560] mb-1">
                            Rang d&apos;affichage (optionnel)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={itemForm.popular_rank ?? ''}
                            onChange={(e) =>
                              setItemForm((p) => ({
                                ...p,
                                popular_rank: e.target.value ? Number(e.target.value) : null,
                              }))
                            }
                            placeholder="1, 2, 3…"
                            className="w-32 px-3 py-2 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <button
                        type="submit"
                        className="min-h-[44px] rounded-xl bg-primary px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-primary-dark sm:min-h-0"
                      >
                        {editingItem ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItem(null);
                          setBlobPreviewUrl((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return null;
                          });
                          setItemImagePreviewError(false);
                          setItemForm(EMPTY_ITEM);
                        }}
                        className="min-h-[44px] rounded-xl border border-border px-6 py-2.5 font-body text-sm transition-colors hover:bg-surface-hover sm:min-h-0"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items Table */}
              {activeItems.length === 0 ? (
                <div className="rounded-2xl border border-border-light bg-white px-4 py-10 text-center shadow-sm sm:p-12">
                  <p className="font-body text-[#6B6560]">
                    Aucun plat dans cette catégorie
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm">
                  <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-border-light">
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Nom
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Prix
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Tags
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Disponible
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Populaire
                        </th>
                        <th className="text-left p-4 text-sm font-medium text-[#6B6560] font-body">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border-light last:border-0 hover:bg-surface-hover transition-colors"
                        >
                          <td className="p-4">
                            <div className="text-sm font-medium font-body">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-[#A39E98] font-body mt-0.5 line-clamp-1">
                                {item.description}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-sm font-body">
                            €{Number(item.price).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {(item.dietary_tags ?? []).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-body bg-surface-hover text-[#6B6560]"
                                >
                                  {DIETARY_LABELS[tag]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                handleToggleAvailable(item.id, item.is_available)
                              }
                              className={`px-3 py-1 rounded-full text-xs font-body ${
                                item.is_available
                                  ? 'bg-[#E8F9EE] text-[#16A34A]'
                                  : 'bg-[#FDE8E8] text-[#DC2626]'
                              }`}
                            >
                              {item.is_available ? 'Oui' : 'Non'}
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() =>
                                handleTogglePopular(item.id, item.is_popular ?? false)
                              }
                              className={`px-3 py-1 rounded-full text-xs font-body ${
                                item.is_popular
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : 'bg-surface-hover text-[#A39E98]'
                              }`}
                            >
                              {item.is_popular ? '★ Oui' : 'Non'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditItem(item)}
                                className="text-sm text-primary hover:underline font-body"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-sm text-[#DC2626] hover:underline font-body"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
