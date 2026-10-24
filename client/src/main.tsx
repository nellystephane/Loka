import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from './layouts/AppShell';
import { Router } from './router';
import './styles/tokens.css';
import './styles/globals.css';
import { appPath } from './utils/navigation';

// GitHub Pages sert l'application sous /Loka/. Les liens internes absolus
// (href="/…") doivent conserver ce préfixe, sans toucher aux API ni aux liens externes.
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
  const raw = anchor.getAttribute('href') || '';
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/Loka/')) return;
  const deployedUnderLoka = window.location.pathname === '/Loka' || window.location.pathname.startsWith('/Loka/');
  if (!deployedUnderLoka) return;
  event.preventDefault();
  window.location.assign(`/Loka${raw}`);
}, true);

// Une réponse 401 sur une requête authentifiée invalide la session locale :
// on la nettoie et on renvoie vers la connexion en conservant la page visée.
// Les 401 du formulaire de connexion (sans Bearer) ne sont jamais interceptés.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : null;
  const headers = new Headers(init?.headers || request?.headers);
  const hasBearer = /^Bearer\s+.+/i.test(headers.get('Authorization') || '');
  const response = await originalFetch(input, init);
  if (hasBearer && response.status === 401 && !window.location.pathname.includes('/connexion')) {
    localStorage.removeItem('token'); localStorage.removeItem('loka_user');
    const path = window.location.pathname + window.location.search + window.location.hash;
    const returnTo = path.startsWith('/Loka/') ? path.slice('/Loka'.length) : path;
    const target = appPath('/connexion') + '?session=expired&returnTo=' + encodeURIComponent(returnTo || '/');
    if (!window.location.pathname.endsWith('/connexion')) window.location.assign(target);
  }
  return response;
};

createRoot(document.getElementById('root')!).render(<React.StrictMode><AppShell><Router /></AppShell></React.StrictMode>);
