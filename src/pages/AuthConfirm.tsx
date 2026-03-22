import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

/**
 * Handles email confirmation redirect (tokens in URL hash).
 * Must stay a public route (not inside GuestGuard) so the hash is processed before any redirect.
 */
export function AuthConfirm() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'admin' | 'other' | 'error'>('loading');

  useEffect(() => {
    const run = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (s) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', s.user.id)
          .single();
        const isAdmin = profile?.role === 'admin';
        setStatus(isAdmin ? 'admin' : 'other');
        if (isAdmin) navigate('/dashboard', { replace: true });
      } else if (!isLoading) {
        setStatus('error');
      }
    };
    run();
  }, [isLoading, navigate]);

  useEffect(() => {
    if (session && status === 'loading') {
      window.history.replaceState(null, '', window.location.pathname);
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          const isAdmin = data?.role === 'admin';
          setStatus(isAdmin ? 'admin' : 'other');
          if (isAdmin) navigate('/dashboard', { replace: true });
        });
    }
  }, [session, status, navigate]);

  if (status === 'other') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E3E0] bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-[#1A1A1A] mb-2">E-mail confirmé</h1>
          <p className="text-[#6B6560] font-body text-sm mb-6">
            Ce compte n&apos;est pas un compte administrateur. Utilisez l&apos;espace restaurant ou
            l&apos;application mobile pour vous connecter.
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-body font-semibold text-white transition-colors hover:bg-primary-dark sm:w-auto"
          >
            Retour à la connexion admin
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'admin') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#3D3A37] font-body">Redirection...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E3E0] bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="font-display text-xl text-[#1A1A1A] mb-2">Lien invalide ou expiré</h1>
          <p className="text-[#6B6560] font-body text-sm mb-6">
            Le lien de confirmation a expiré ou a déjà été utilisé.
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-body font-semibold text-white transition-colors hover:bg-primary-dark sm:w-auto"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF7] px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#3D3A37] font-body">Confirmation en cours...</p>
      </div>
    </div>
  );
}
