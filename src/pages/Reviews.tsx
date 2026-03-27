import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  restaurant?: { id: string; name: string } | null;
  profile?: { full_name: string | null; email: string | null } | null;
  order?: { order_number: string; status: string } | null;
};

type RawReviewRow = Omit<ReviewRow, 'restaurant' | 'profile' | 'order'> & {
  restaurant?: Array<{ id: string; name: string }> | null;
  profile?: Array<{ full_name: string | null; email: string | null }> | null;
  order?: Array<{ order_number: string; status: string }> | null;
};

const PAGE_SIZE = 20;

export function Reviews() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const incoming = searchParams.get('filter');
    if (incoming === 'approved' || incoming === 'hidden' || incoming === 'all') {
      setStatusFilter(incoming);
    }
    setQuery(searchParams.get('q') ?? '');
    const pageParam = Number(searchParams.get('page') ?? '1');
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1);
  }, [searchParams]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let req = supabase
        .from('restaurant_reviews')
        .select('id, rating, comment, is_approved, created_at, restaurant:restaurants(id, name), profile:profiles(full_name, email), order:orders(order_number, status)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (statusFilter === 'approved') req = req.eq('is_approved', true);
      if (statusFilter === 'hidden') req = req.eq('is_approved', false);

      const { data, error, count } = await req;
      if (error) throw error;
      setTotalCount(count ?? 0);
      const rows = ((data ?? []) as RawReviewRow[]).map((r) => ({
        ...r,
        restaurant: r.restaurant?.[0] ?? null,
        profile: r.profile?.[0] ?? null,
        order: r.order?.[0] ?? null,
      }));
      setReviews(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les avis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, [page, statusFilter]);

  const toggleApproval = async (id: string, nextValue: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurant_reviews')
        .update({ is_approved: nextValue })
        .eq('id', id);
      if (error) throw error;
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: nextValue } : r)));
      showToast(nextValue ? 'Avis approuvé' : 'Avis masqué');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Échec de la mise à jour', 'error');
    }
  };

  const filtered = useMemo(() => {
    let list = reviews;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const hay = [
          r.restaurant?.name ?? '',
          r.profile?.full_name ?? '',
          r.profile?.email ?? '',
          r.order?.order_number ?? '',
          r.comment ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [reviews, statusFilter, query]);

  const setFilter = (next: 'all' | 'approved' | 'hidden') => {
    const params = new URLSearchParams(searchParams);
    params.set('filter', next);
    params.set('page', '1');
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const setSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams);
    if (statusFilter) params.set('filter', statusFilter);
    params.set('page', '1');
    const trimmed = value.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setQuery('');
    setSearchParams(new URLSearchParams({ filter: 'all', page: '1' }), { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const goToPage = (next: number) => {
    const safe = Math.min(totalPages, Math.max(1, next));
    const params = new URLSearchParams(searchParams);
    params.set('page', String(safe));
    if (statusFilter) params.set('filter', statusFilter);
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-xl font-semibold text-[#1A1A1A] sm:text-2xl">Avis clients</h1>
        <p className="mt-0.5 font-body text-sm text-[#9C9690]">
          Modérez les avis et pilotez la réputation affichée dans l&apos;app client.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher restaurant, client, commande..."
            className="w-full rounded-xl border border-[#E5E3E0] px-3 py-2 text-sm outline-none focus:border-primary/40 lg:col-span-2"
          />
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-[#F5F3F0] text-[#6B6560]'}`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${statusFilter === 'approved' ? 'bg-primary text-white' : 'bg-[#F5F3F0] text-[#6B6560]'}`}
          >
            Approuvés
          </button>
          <button
            type="button"
            onClick={() => setFilter('hidden')}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${statusFilter === 'hidden' ? 'bg-primary text-white' : 'bg-[#F5F3F0] text-[#6B6560]'}`}
          >
            Masqués
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#6B6560]">
            {filtered.length} / {totalCount} résultat(s)
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#6B6560] border border-[#E5E3E0] hover:bg-[#F9F8F6]"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-[#E5E3E0] bg-white" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="rounded-2xl border border-[#E5E3E0] bg-white p-6 text-sm text-[#6B6560]">Aucun avis pour le moment.</div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[#E5E3E0] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center rounded-full bg-[#FFF7ED] px-2.5 py-1 font-semibold text-[#C65D12]">
                        ★ {r.rating.toFixed(1)}
                      </span>
                      <span className="font-medium text-[#1A1A1A]">{r.restaurant?.name ?? 'Restaurant'}</span>
                      <span className="text-[#9C9690]">·</span>
                      <span className="text-[#9C9690]">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#3D3A37]">
                      {r.comment?.trim() ? r.comment : 'Pas de commentaire'}
                    </p>
                    <p className="mt-2 text-xs text-[#9C9690]">
                      {r.profile?.full_name || r.profile?.email || 'Client'} · {r.order?.order_number ?? 'Sans commande'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                          r.order?.status === 'completed'
                            ? 'bg-[#E8F9EE] text-[#15803D]'
                            : 'bg-[#F5F3F0] text-[#6B6560]',
                        ].join(' ')}
                      >
                        {r.order?.status === 'completed' ? 'Commande complétée' : 'Commande non complétée'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleApproval(r.id, !r.is_approved)}
                      className={[
                        'min-h-[40px] rounded-xl px-4 text-xs font-semibold transition-colors',
                        r.is_approved
                          ? 'bg-[#FDE8E8] text-[#DC2626] hover:bg-[#FBD5D5]'
                          : 'bg-[#E8F9EE] text-[#15803D] hover:bg-[#D8F3E3]',
                      ].join(' ')}
                    >
                      {r.is_approved ? 'Masquer' : 'Approuver'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#E5E3E0] bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-xl border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-xs font-semibold text-[#6B6560]">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-xl border border-[#E5E3E0] px-3 py-2 text-xs font-semibold text-[#6B6560] disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

