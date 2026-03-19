import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Pencil, X, Plus } from 'lucide-react';
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
  dietary_tags: DietaryTag[];
  sort_order: number;
}

const EMPTY_ITEM: ItemFormState = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  is_available: true,
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

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item.id);
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      image_url: item.image_url ?? '',
      is_available: item.is_available,
      dietary_tags: item.dietary_tags ?? [],
      sort_order: item.sort_order,
    });
    setShowItemForm(true);
  };

  const toggleDietaryTag = (tag: DietaryTag) => {
    setItemForm((prev) => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter((t) => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/restaurants')}
          className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft size={18} className="inline -mt-0.5" /> Retour
        </button>
        <h1 className="text-2xl font-semibold font-body">
          Menu — {restaurant?.name}
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-border-light p-4">
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
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-border-light">
              <p className="text-[#6B6560] font-body">
                Créez une catégorie pour commencer à ajouter des plats
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-body">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(EMPTY_ITEM);
                    setShowItemForm(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} className="inline -mt-0.5" /> Ajouter un plat
                </button>
              </div>

              {/* Item Form Modal */}
              {showItemForm && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-border-light mb-6">
                  <h3 className="text-base font-semibold font-body mb-4">
                    {editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                  </h3>
                  <form
                    onSubmit={editingItem ? handleUpdateItem : handleAddItem}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
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
                      <div className="col-span-2">
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
                      <div>
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
                      <div>
                        <label className="block text-sm font-medium text-[#6B6560] font-body mb-1">
                          URL de l'image
                        </label>
                        <input
                          type="url"
                          value={itemForm.image_url}
                          onChange={(e) =>
                            setItemForm((p) => ({
                              ...p,
                              image_url: e.target.value,
                            }))
                          }
                          placeholder="https://..."
                          className="w-full px-3 py-2.5 rounded-xl border border-border font-body text-sm focus:outline-none focus:border-primary"
                        />
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
                            className={`px-3 py-1.5 rounded-full text-xs font-body transition-colors ${
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

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-body font-medium text-sm hover:bg-primary-dark transition-colors"
                      >
                        {editingItem ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowItemForm(false);
                          setEditingItem(null);
                          setItemForm(EMPTY_ITEM);
                        }}
                        className="px-6 py-2.5 rounded-xl border border-border text-sm font-body hover:bg-surface-hover transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items Table */}
              {activeItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-border-light">
                  <p className="text-[#6B6560] font-body">
                    Aucun plat dans cette catégorie
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
                  <table className="w-full">
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
