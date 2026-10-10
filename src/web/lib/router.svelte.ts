/**
 * Minimal hash router.
 *   #/                     main menu
 *   #/settings             global settings
 *   #/m/<module>           module drill page
 *   #/m/<module>/<page>    module sub-page (settings, stats, …; see ClientModule.pages)
 */
export type Route =
  | { page: 'menu' }
  | { page: 'settings' }
  | { page: 'module'; id: string; sub: string | null };

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'settings') return { page: 'settings' };
  if (parts[0] === 'm' && parts[1]) return { page: 'module', id: parts[1], sub: parts[2] ?? null };
  return { page: 'menu' };
}

/** The page one level up: module sub-page → module → menu. */
export function parentOf(route: Route): string | null {
  if (route.page === 'menu') return null;
  if (route.page === 'module' && route.sub) return `#/m/${route.id}`;
  return '#/';
}

class Router {
  route = $state<Route>(parse(location.hash));

  constructor() {
    addEventListener('hashchange', () => (this.route = parse(location.hash)));
  }
}

export const router = new Router();
