'use client';

import { startTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type NavigateOptions = {
  scroll?: boolean;
};

type IntentHandlers = {
  onMouseEnter: () => void;
  onFocus: () => void;
  onTouchStart: () => void;
};

const prefetchedRoutes = new Set<string>();

function isInternalRoute(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

function normalizeRoute(href: string) {
  return href.trim();
}

export function useOptimizedNavigation() {
  const router = useRouter();

  const prefetch = useCallback((href: string) => {
    const route = normalizeRoute(href);
    if (!route || !isInternalRoute(route) || prefetchedRoutes.has(route)) {
      return;
    }

    prefetchedRoutes.add(route);
    void router.prefetch(route);
  }, [router]);

  const prefetchMany = useCallback((routes: string[]) => {
    for (const route of routes) {
      prefetch(route);
    }
  }, [prefetch]);

  const warmupRoutes = useCallback((routes: string[]) => {
    if (typeof window === 'undefined' || routes.length === 0) return () => {};

    const uniqueRoutes = Array.from(new Set(routes.map(normalizeRoute).filter(isInternalRoute)));
    if (uniqueRoutes.length === 0) return () => {};

    if ('requestIdleCallback' in window) {
      const callbackId = window.requestIdleCallback(() => {
        prefetchMany(uniqueRoutes);
      }, { timeout: 1500 });

      return () => window.cancelIdleCallback(callbackId);
    }

    const timeoutId = globalThis.setTimeout(() => {
      prefetchMany(uniqueRoutes);
    }, 150);

    return () => globalThis.clearTimeout(timeoutId);
  }, [prefetchMany]);

  const navigate = useCallback((href: string, options?: NavigateOptions) => {
    prefetch(href);
    startTransition(() => {
      router.push(href, { scroll: options?.scroll });
    });
  }, [prefetch, router]);

  const replace = useCallback((href: string, options?: NavigateOptions) => {
    prefetch(href);
    startTransition(() => {
      router.replace(href, { scroll: options?.scroll });
    });
  }, [prefetch, router]);

  const getIntentHandlers = useCallback((href: string): IntentHandlers => ({
    onMouseEnter: () => prefetch(href),
    onFocus: () => prefetch(href),
    onTouchStart: () => prefetch(href),
  }), [prefetch]);

  return {
    navigate,
    replace,
    prefetch,
    prefetchMany,
    warmupRoutes,
    getIntentHandlers,
  };
}
