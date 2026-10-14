export const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function getAppPath(pathname: string) {
  if (!appBasePath) return pathname;
  if (pathname === appBasePath) return '/';
  return pathname.startsWith(`${appBasePath}/`) ? pathname.slice(appBasePath.length) : pathname;
}

export function withAppBasePath(path: string) {
  if (!appBasePath || !path.startsWith('/') || path.startsWith('//')) return path;
  if (path === appBasePath || path.startsWith(`${appBasePath}/`)) return path;
  return `${appBasePath}${path}`;
}
