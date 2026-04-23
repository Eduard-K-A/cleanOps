export type NavigationRole = 'customer' | 'employee' | 'admin';

export interface NavigationConfigItem {
  id: string;
  label: string;
  href: string;
  requiredRole?: NavigationRole;
}

const customerItems: NavigationConfigItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/homepage',
  },
  {
    id: 'book',
    label: 'Book Service',
    href: '/customer/order',
    requiredRole: 'customer',
  },
  {
    id: 'requests',
    label: 'My Requests',
    href: '/customer/requests',
    requiredRole: 'customer',
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/customer/messages',
    requiredRole: 'customer',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
  },
];

const employeeItems: NavigationConfigItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/homepage',
  },
  {
    id: 'jobs',
    label: 'Jobs Feed',
    href: '/employee/feed',
    requiredRole: 'employee',
  },
  {
    id: 'my-jobs',
    label: 'My Jobs',
    href: '/employee/my-jobs',
    requiredRole: 'employee',
  },
  {
    id: 'history',
    label: 'History',
    href: '/employee/history',
    requiredRole: 'employee',
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/employee/messages',
    requiredRole: 'employee',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/employee/dashboard',
  },
];

const adminItems: NavigationConfigItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/homepage',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    href: '/admin/jobs',
  },
  {
    id: 'review-queue',
    label: 'Review Queue',
    href: '/admin/review-queue',
  },
  {
    id: 'users',
    label: 'Users',
    href: '/admin/users',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
  },
];

export function getNavigationConfig(role?: string): NavigationConfigItem[] {
  if (role === 'admin') return adminItems;
  if (role === 'employee') return employeeItems;
  return customerItems;
}

export function prefetchNavigationRoutes(
  prefetch: (href: string) => void,
  routes: string[]
) {
  if (typeof window === 'undefined' || routes.length === 0) return () => {};

  const uniqueRoutes = Array.from(new Set(routes));

  if ('requestIdleCallback' in window) {
    const callbackId = window.requestIdleCallback(() => {
      uniqueRoutes.forEach(prefetch);
    }, { timeout: 2000 });

    return () => window.cancelIdleCallback(callbackId);
  }

  const timeoutId = globalThis.setTimeout(() => {
    uniqueRoutes.forEach(prefetch);
  }, 250);

  return () => globalThis.clearTimeout(timeoutId);
}
