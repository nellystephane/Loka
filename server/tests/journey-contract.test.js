const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..','..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('deployment version endpoint reports the Render commit',()=>{
 const server=read('server/index.js');
 assert.match(server,/app\.get\('\/api\/version'/);
 assert.match(server,/commit: process\.env\.RENDER_GIT_COMMIT \|\| process\.env\.GITHUB_SHA \|\| null/);
});

test('journey: public discovery is API-backed, not hard-coded demo content',()=>{
 const home=read('client/src/pages/Home.tsx');
 assert.match(home,/\/api\/discovery\/home/);
 assert.doesNotMatch(home,/Maison Naya|Chez Marcel|Hôtel Azala/);
});

test('journey: public business routes resolve real space ids',()=>{
 const router=read('client/src/router.tsx');
 assert.match(router,/PublicStorefront type="boutique" spaceId/);
 assert.match(router,/PublicStorefront type="restaurant" spaceId/);
 assert.match(router,/PublicStorefront type="hotel" spaceId/);
});

test('journey: storefront editor cannot publish without a real professional context',()=>{
 const builder=read('client/src/pages/pro/StorefrontBuilder.tsx');
 assert.match(builder,/Ouvrez le Builder depuis un espace professionnel réel/);
 assert.match(builder,/await saveStorefront/);
});

test('journey: restaurant order has a real confirmed state and valid mongoose hook',()=>{
 const model=read('server/models/CommandeRestaurant.js');
 assert.match(model,/commandeRestaurantSchema\.pre\('validate'/);
 assert.match(model,/confirmée/);
});

test('journey: hotel and restaurant reservations remain payment-confirmed server states',()=>{
 const payment=read('server/controllers/paiementCommandeController.js');
 assert.match(payment,/reservation\.statut = 'confirmee'/);
 assert.match(payment,/reservation\.statut = 'confirmee'/);
});

test('journey: agency dashboard uses agency backend endpoints',()=>{
 const page=read('client/src/pages/delivery/DeliveryAgency.tsx');
 const service=read('client/src/services/delivery.ts');
 assert.match(page,/getAgencyRequests/);
 assert.match(page,/assignAgencyCourier/);
 assert.match(service,/\/api\/agences-livraison\/moi\/demandes/);
});

test('journey: delivery tracking exposes backend status history',()=>{
 const page=read('client/src/pages/delivery/Delivery.tsx');
 assert.match(page,/historiqueStatuts/);
 assert.match(page,/Événements de la mission/);
});

test('journey: contextual chat exposes structured offer objects',()=>{
 const controller=read('server/controllers/conversationController.js');
 const page=read('client/src/pages/messages/Messages.tsx');
 assert.match(controller,/populate\('offre'\)/);
 assert.match(controller,/populate\('offreLivraison'\)/);
 assert.match(page,/Proposition de commande/);
 assert.match(page,/Proposition de livraison/);
});

test('journey: motion system has task feedback and reduced-motion fallback',()=>{
 const css=read('client/src/styles/globals.css');
 assert.match(css,/pc-motion-enter/);
 assert.match(css,/pc-motion-success/);
 assert.match(css,/pc-motion-status/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('journey: order timeline distinguishes completion from payment',()=>{
 const page=read('client/src/pages/commerce/Order.tsx');
 assert.match(page,/terminée/);
 assert.match(page,/paiement et l’exécution commerciale restent deux états distincts/);
});


test('journey: professional shell exposes the complete reference navigation',()=>{
 const shell=read('client/src/layouts/AppShell.tsx');
 for (const route of ['/pro','/pro/catalogue','/pro/commandes','/pro/livraisons','/pro/messages','/pro/finances','/pro/abonnement','/pro/vitrine','/pro/parametres']) assert.match(shell,new RegExp(route.replaceAll('/','\\/')));
});

test('journey: professional finance is a real backend read model, not a local balance',()=>{
 const controller=read('server/controllers/financeController.js');
 assert.match(controller,/Ledger\.find/);
 assert.match(controller,/Payout\.find/);
});

test('journey: no hard-coded negotiation demo remains in active proposal composer',()=>{
 const panel=read('client/src/components/chat/ProposalPanel.tsx');
 assert.doesNotMatch(panel,/Canapé 3 places|Maison Naya|PC-2026-00482/);
 assert.match(panel,/context\?/);
});

test('journey: professional navigation no longer points to dead hash links',()=>{
 const shell=read('client/src/layouts/AppShell.tsx');
 assert.doesNotMatch(shell,/href="#"/);
});


test('journey: share interaction has contextual expansion and reduced-motion fallback',()=>{
 const share=read('client/src/components/share/ShareButton.tsx');
 const css=read('client/src/styles/globals.css');
 assert.match(share,/navigator\.share/);
 assert.match(share,/Copier le lien/);
 assert.match(css,/pc-share-expand/);
 assert.match(css,/prefers-reduced-motion:reduce.*share-popover/s);
});

test('journey: motion language covers entry, success, status, page, viewer and share',()=>{
 const css=read('client/src/styles/globals.css');
 for (const token of ['pc-motion-enter','pc-motion-success','pc-motion-status','pc-page-in','pc-viewer-open','pc-share-expand']) assert.match(css,new RegExp(token));
});
