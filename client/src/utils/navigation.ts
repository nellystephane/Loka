export function appPath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = window.location.pathname === '/Loka' || window.location.pathname.startsWith('/Loka/') ? '/Loka' : '';
  return `${base}${normalized}` || '/';
}
