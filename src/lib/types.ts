export type CuisineType =
  | 'west_african'
  | 'congolese'
  | 'north_african'
  | 'central_african'
  | 'southern_african'
  | 'lusophone_african'
  | 'pan_african';

export type OrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'completed'
  | 'cancelled';

export type OrderType = 'delivery' | 'pickup';

export type DietaryTag =
  | 'halal'
  | 'vegan'
  | 'vegetarian'
  | 'spicy'
  | 'gluten_free'
  | 'contains_nuts';

export interface Restaurant {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  cuisine_type: CuisineType;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  image_url: string | null;
  logo_url: string | null;
  gallery_urls: string[];
  opening_hours: Record<string, { open: string; close: string } | null>;
  delivery_fee: number;
  minimum_order: number;
  estimated_delivery_min: number;
  estimated_delivery_max: number;
  delivery_radius_km: number;
  pickup_available: boolean;
  is_active: boolean;
  language: string;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  dietary_tags: DietaryTag[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  restaurant_id: string;
  status: OrderStatus;
  order_type: OrderType;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  restaurant?: { id: string; name: string };
  profile?: { full_name: string; email: string; phone: string | null };
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: number;
  quantity: number;
}

export interface DashboardStats {
  orders_today: number;
  revenue_today: number;
  active_restaurants: number;
  pending_orders: number;
}

export const CUISINE_LABELS: Record<CuisineType, string> = {
  west_african: 'Ouest-Africaine',
  congolese: 'Congolaise',
  north_african: 'Nord-Africaine',
  central_african: 'Centre-Africaine',
  southern_african: 'Sud-Africaine',
  lusophone_african: 'Afrique Lusophone',
  pan_african: 'Pan-Africaine',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Reçue',
  preparing: 'En préparation',
  ready: 'Prête',
  on_the_way: 'En livraison',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export const DIETARY_LABELS: Record<DietaryTag, string> = {
  halal: 'Halal',
  vegan: 'Végan',
  vegetarian: 'Végétarien',
  spicy: 'Épicé',
  gluten_free: 'Sans Gluten',
  contains_nuts: 'Contient des Noix',
};
