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

test('courier directory supports real GPS distance sorting without fabricating missing coordinates', () => {
 const controller=read('server/controllers/livreurController.js');
 const model=read('server/models/User.js');
 const home=read('client/src/pages/Home.tsx');
 assert.match(controller,/distanceKm/);
 assert.match(controller,/loc\.latitude/);
 assert.match(controller,/distanceKm === null/);
 assert.match(model,/latitude: \{ type: Number/);
 assert.match(model,/longitude: \{ type: Number/);
 assert.match(home,/navigator\.geolocation\.getCurrentPosition/);
 assert.match(home,/Trouver près de moi/);
});

test('agency can search unassigned active courier candidates and add them from its dashboard', () => {
 const controller=read('server/controllers/agenceLivraisonController.js');
 const routes=read('server/routes/agenceLivraisonRoutes.js');
 const page=read('client/src/pages/delivery/DeliveryAgency.tsx');
 assert.match(controller,/const rechercherLivreurs/);
 assert.match(controller,/\$nin:agence\.livreurs/);
 assert.match(routes,/moi\/livreurs\/candidats/);
 assert.match(page,/Trouver des livreurs/);
 assert.match(page,/addCandidate/);
});

test('agency attachment enforces active profiles, active agencies, and no active mission', () => {
 const controller=read('server/controllers/agenceLivraisonController.js');
 assert.match(controller,/statut:'active'.*Agence introuvable ou suspendue/s);
 assert.match(controller,/livreur\.statut!=='active'/);
 assert.match(controller,/livreur\.utilisateur\.statut!=='actif'/);
 assert.match(controller,/missionActive=await DemandeLivraison\.exists/);
 assert.match(controller,/Attendez sa clôture avant le rattachement/);
 assert.match(controller,/findOneAndUpdate/);
});

test('public directories expose boutiques, restaurants, hotels, and distinct agency/courier routes', () => {
 const router=read('client/src/router.tsx');
 const directory=read('client/src/pages/Directory.tsx');
 const agencyRoutes=read('server/routes/agenceLivraisonRoutes.js');
 for(const route of ["path==='/boutiques'","path==='/restaurants'","path==='/hotels'","path==='/livreurs'"]) assert.ok(router.includes(route),`missing route ${route}`);
 assert.match(directory,/Agences de livraison/);
 assert.match(directory,/Livreurs indépendants/);
 assert.match(agencyRoutes,/router\.get\('\/public',c\.annuairePublic\)/);
});

test('public courier profile does not reveal suspended or inactive users', () => {
 const controller=read('server/controllers/livreurController.js');
 assert.match(controller,/findOne\(\{_id:req\.params\.id,statut:'active'\}\)/);
 assert.match(controller,/match:\{statut:'actif'\}/);
});

test('reference account journeys have real pages wired to existing backend endpoints', () => {
 const router=read('client/src/router.tsx');
 const auth=read('client/src/pages/account/AuthPage.tsx');
 const account=read('client/src/pages/account/AccountPages.tsx');
 const create=read('client/src/pages/public/NewAnnonce.tsx');
 for(const route of ["path==='/connexion'","path==='/inscription'","path==='/profil'","path==='/favoris'","path==='/notifications'","path==='/activites'","path==='/annonces/nouvelle'"]) assert.ok(router.includes(route),`missing ${route}`);
 assert.match(auth,/api\/users\//);
 assert.match(account,/api\/users\/favoris/);
 assert.match(account,/api\/notifications/);
 assert.match(account,/api\/commandes\/mes-achats/);
 assert.match(create,/api\/annonces/);
 assert.doesNotMatch(create,/setSuccess\('Annonce publiée'\);\s*\/\/ demo/);
});

test('unknown paths are not silently redirected to the home page and the shared shell has theme controls',()=>{
 const router=read('client/src/router.tsx');
 const shell=read('client/src/layouts/AppShell.tsx');
 assert.match(router,/else page = <NotFound\/>/);
 assert.match(shell,/Passer au thème sombre/);
 assert.match(shell,/dataset\.theme/);
});

test('missing core MVP pages now route to real account, professional, and admin screens',()=>{
 const router=read('client/src/router.tsx');
 const shell=read('client/src/layouts/AppShell.tsx');
 for(const route of ["path==='/pro/nouvelle-activite'","path==='/pro/clients'","path==='/admin'"]) assert.ok(router.includes(route),`missing ${route}`);
 assert.match(router,/RestaurantMenuManager/);
 assert.match(router,/ProfessionalOnboarding/);
 assert.match(router,/AdminDashboard/);
 assert.match(shell,/\['\/pro\/clients','Clients \/ contacts'/);
});

test('search results use valid courier profile data and restaurant dishes have a real public detail route',()=>{
 const search=read('server/controllers/rechercheController.js');
 const platRoutes=read('server/routes/platRoutes.js');
 const platController=read('server/controllers/platController.js');
 const publicPlat=read('client/src/pages/public/PublicPlat.tsx');
 const router=read('client/src/router.tsx');
 assert.match(search,/User\.find/);
 assert.match(search,/zoneCouverture/);
 assert.match(search,/utilisateur\?\.prenom/);
 assert.match(platRoutes,/router\.get\('\/:id', getPlatById\)/);
 assert.match(platController,/const getPlatById/);
 assert.match(publicPlat,/restaurantId:restaurant\?\._id/);
 assert.match(router,/path\.startsWith\('\/plat\/'\)/);
});

test('checkout does not display an unconnected payment method selector',()=>{
 const checkout=read('client/src/pages/commerce/Checkout.tsx');
 assert.doesNotMatch(checkout,/setMethod\(/);
 assert.match(checkout,/Choix du moyen de paiement sur la page sécurisée/);
});

test('journey: shared shell exposes discovery directories and separates restaurant/hotel management',()=>{
 const shell=read('client/src/layouts/AppShell.tsx');
 const overview=read('client/src/pages/pro/ProfessionalOverview.tsx');
 const router=read('client/src/router.tsx');
 for(const route of ['/boutiques','/restaurants','/hotels','/livreurs','/annonces/nouvelle','/pro/reservations']) assert.ok(shell.includes(route),`route missing from shared navigation: ${route}`);
 assert.match(overview,/restauration: \{[^\n]*href:'\/pro\/catalogue\?espaceType=restauration'/);
 assert.match(overview,/hotel: \{[^\n]*href:'\/pro\/catalogue\?espaceType=hotel'/);
 assert.match(router,/path==='\/pro\/reservations'/);
});

test('journey: desktop shell uses labeled navigation while mobile retains compact task navigation',()=>{
 const shell=read('client/src/layouts/AppShell.tsx');
 const css=read('client/src/styles/globals.css');
 assert.match(shell,/sidebar-section-label/);
 assert.match(shell,/mobile-nav/);
 assert.match(css,/grid-template-columns:236px minmax\(0,1fr\)/);
 assert.match(css,/@media\(max-width:760px\)\{\.app-shell\{display:block/);
});


test('journey: activity history never sends reservation rows back to the same history page',()=>{
 const account=read('client/src/pages/account/AccountPages.tsx');
 assert.match(account,/Certaines données n’ont pas pu être chargées/);
 assert.match(account,/kind:'Réservation hôtel',href:`\/reservation\/\$\{x\._id\}`,action:'Détails'/);
 assert.match(account,/kind:'Réservation restaurant',href:`\/reservation\/\$\{x\._id\}`,action:'Détails'/);
 assert.doesNotMatch(account,/kind:'Réservation hôtel',href:'\/activites'/);
 assert.doesNotMatch(account,/kind:'Réservation restaurant',href:'\/activites'/);
});

test('journey: professional catalogue header follows the selected business context',()=>{
 const shell=read('client/src/layouts/AppShell.tsx');
 assert.match(shell,/catalogueContext === 'restauration'/);
 assert.match(shell,/Menu du restaurant/);
 assert.match(shell,/Chambres et hébergements/);
 assert.match(shell,/path === '\/app' \? 'Découvrir'/);
});


test('journey: professional subscription targets the selected owned space, not an arbitrary first space',()=>{
 const subscription=read('client/src/pages/pro/ProfessionalSubscription.tsx');
 const service=read('client/src/services/professional.ts');
 const controller=read('server/controllers/paiementController.js');
 assert.match(subscription,/espaceId:active\.id/);
 assert.match(controller,/const \{ type, espaceType, espaceId, methode/);
 assert.match(controller,/Modele\.findOne\(\{ _id: espaceId, \.\.\.filtreProprietaire \}\)/);
 assert.match(controller,/await Modele\.findOne\(filtreProprietaire\)/);
 assert.match(service,/Promise\.allSettled\(sources\.map/);
});

test('journey: professional orders retain accessible results if one commerce engine is unavailable',()=>{
 const service=read('client/src/services/professional.ts');
 const page=read('client/src/pages/pro/ProfessionalOrders.tsx');
 assert.match(service,/Promise\.allSettled/);
 assert.match(service,/failedSources/);
 assert.match(page,/Certaines données ne sont pas disponibles/);
 assert.match(page,/Réessayer/);
});


test('journey: professional reservation entry point separates restaurant and hotel workflows',()=>{
 const router=read('client/src/router.tsx');
 const hub=read('client/src/pages/pro/ProfessionalReservationsHub.tsx');
 const hotel=read('client/src/pages/pro/HotelDashboard.tsx');
 assert.match(router,/reservationType==='restauration' \? <RestaurantReservationManager\/>/);
 assert.match(router,/reservationType==='hotel' \? <HotelDashboard initialTab="reservations"\/>/);
 assert.match(router,/<ProfessionalReservationsHub\/>/);
 assert.match(hub,/Gérer les réservations/);
 assert.match(hotel,/initialTab = 'overview'/);
});

test('journey: subscription UI does not confuse an unavailable status endpoint with no active subscription',()=>{
 const subscription=read('client/src/pages/pro/ProfessionalSubscription.tsx');
 assert.match(subscription,/Statut indisponible/);
 assert.match(subscription,/Vérification de l’abonnement/);
 assert.match(subscription,/if\(!popup\)window\.location\.assign/);
});

test('journey: seller can manage published ads using the existing ownership-protected API',()=>{
 const router=read('client/src/router.tsx');
 const page=read('client/src/pages/account/MyListings.tsx');
 const controller=read('server/controllers/annonceController.js');
 assert.match(router,/path==='\/mes-annonces'.*MyListingsPage/s);
 assert.match(page,/\/api\/annonces\/mes-annonces/);
 assert.match(page,/method:'PUT'/);
 assert.match(page,/method:'DELETE'/);
 assert.match(controller,/annonce\.createur\.toString\(\) !== req\.user\._id\.toString\(\)/);
 assert.match(page,/dateExpiration|quota/);
});

test('journey: client reservation details are linked from activities and resolve only reservations owned by the user',()=>{
 const router=read('client/src/router.tsx');
 const page=read('client/src/pages/account/ReservationDetail.tsx');
 const activities=read('client/src/pages/account/AccountPages.tsx');
 assert.match(router,/path\.startsWith\('\/reservation\/'\).*ReservationDetailPage/s);
 assert.match(page,/\/api\/reservations\/mes-reservations/);
 assert.match(page,/\/api\/restaurants\/reservations\/miennes/);
 assert.match(page,/Réservation introuvable dans votre compte/);
 assert.match(page,/paiement et le séjour|réservation et le paiement sont deux états distincts/);
 assert.match(activities,/href:`\/reservation\/\$\{x\._id\}`/);
});

test('journey: seller listing management uses valid server statuses and does not fabricate reservation actions',()=>{
 const page=read('client/src/pages/account/MyListings.tsx');
 const model=read('server/models/Annonce.js');
 assert.match(model,/enum: \['actif', 'expiré', 'désactivé'\]/);
 assert.match(page,/item\.statut==='actif'\?'désactivé':'actif'/);
 assert.doesNotMatch(page,/method:'PATCH'/);
});


test('journey: client reservation cancellation is ownership-protected and payment-safe for hotels',()=>{
 const controller=read('server/controllers/reservationController.js');
 const routes=read('server/routes/reservationRoutes.js');
 const page=read('client/src/pages/account/ReservationDetail.tsx');
 assert.match(controller,/findOne\(\{ _id: req\.params\.id, client: req\.user\._id \}\)/);
 assert.match(controller,/annulerReservationClient/);
 assert.match(controller,/paiementStatut === 'approuve'/);
 assert.match(controller,/findOneAndUpdate\(/);
 assert.match(routes,/router\.post\('\/:id\/annuler', auth, annulerReservationClient\)/);
 assert.match(page,/\/api\/reservations\/\$\{encodeURIComponent\(String\(reservation\._id\)\)\}\/annuler/);
 assert.match(page,/Confirmer l’annulation de cette réservation/);
});

test('journey: restaurant reservation cancellation verifies ownership, date and payment before freeing table',()=>{
 const controller=read('server/controllers/restaurantReservationController.js');
 const routes=read('server/routes/restaurantReservationRoutes.js');
 assert.match(controller,/findOne\(\{_id:req\.params\.id,client:req\.user\._id\}\)/);
 assert.match(controller,/dateReservation<=new Date\(\)/);
 assert.match(controller,/paiementStatut==='approuve'/);
 assert.match(controller,/findOneAndUpdate\(/);
 assert.match(controller,/statut:'disponible'/);
 assert.match(routes,/router\.post\('\/reservations\/:id\/annuler',auth,c\.annulerReservationClient\)/);
});

test('journey: reservation detail distinguishes missing records from failed reservation sources',()=>{
 const page=read('client/src/pages/account/ReservationDetail.tsx');
 assert.match(page,/failedSources/);
 assert.match(page,/Impossible de confirmer si cette réservation existe/);
 assert.match(page,/Réservation introuvable dans votre compte/);
 assert.match(page,/paiement est encore en cours/);
});

test('journey: category directory is a real page backed by currently public categories',()=>{
 const router=read('client/src/router.tsx');
 const page=read('client/src/pages/Categories.tsx');
 const routes=read('server/routes/rechercheRoutes.js');
 const controller=read('server/controllers/rechercheController.js');
 assert.match(router,/path==='\/categories'.*CategoriesPage/s);
 assert.match(page,/\/api\/recherche\/categories/);
 assert.match(page,/contenus publics/);
 assert.match(routes,/router\.get\('\/categories', c\.categories\)/);
 assert.match(controller,/dateExpiration: \{ \$gt: now \}/);
 assert.match(controller,/ownerSpace\.statut': 'active'/);
 assert.match(controller,/from: 'storefrontconfigs'/);
 assert.match(controller,/publicConfig\.publie': true/);
});

test('journey: public discovery and product detail exclude unavailable or unpublished commerce content',()=>{
 const discovery=read('server/controllers/discoveryController.js');
 const search=read('server/controllers/rechercheController.js');
 const product=read('server/controllers/produitController.js');
 const dish=read('server/controllers/platController.js');
 assert.match(discovery,/StorefrontConfig\.find\(\{publie:true/);
 assert.match(discovery,/Produit\.find\(\{boutique:\{\$in:ids\.vente\},statut:'disponible'\}\)/);
 assert.match(discovery,/dateExpiration:\{\$gt:new Date\(\)\}/);
 assert.match(search,/statut: 'disponible'/);
 assert.match(search,/StorefrontConfig\.find\(\{ publie: true/);
 assert.match(search,/ids\.vente/);
 assert.match(product,/findOne\(\{ _id: req\.params\.id, statut: 'disponible', boutique: \{ \$in: publishedSpaceIds \} \}\)/);
 assert.match(product,/if \(!produit \|\| !produit\.boutique\)/);
 assert.match(dish,/restaurant: \{ \$in: publishedSpaceIds \}/);
});

test('journey: home search navigation is not shadowed by a location helper and courier cards use their real profile',()=>{
 const home=read('client/src/pages/Home.tsx');
 assert.match(home,/const itemLocation=/);
 assert.match(home,/window\.location\.href=withAppBasePath\(`\/recherche\?q=/);
 assert.match(home,/type==='livreur'\?\(\[user\.prenom,user\.nom\]/);
 assert.match(home,/location:place/);
 assert.doesNotMatch(home,/const location=\(x:any\)/);
});

test('journey: public ad/service detail uses structured prices and location and protects expired listings',()=>{
 const page=read('client/src/pages/public/AnnonceDetail.tsx');
 const controller=read('server/controllers/annonceController.js');
 assert.match(page,/annonce\.prix\.montant/);
 assert.match(page,/annonce\.localisation\?\.quartier/);
 assert.match(page,/annonce\.createur\?\._id/);
 assert.match(page,/window\.location\.href/);
 assert.match(controller,/const estPublique = annonce\.statut === 'actif'/);
 assert.match(controller,/if \(!estPublique && !estLeCreateur\)/);
});

test('journey: public catalogue endpoints always filter to active published parent spaces',()=>{
 const products=read('server/controllers/produitController.js');
 const dishes=read('server/controllers/platController.js');
 assert.match(products,/getPublishedSpaceIds\('vente'\)/);
 assert.match(dishes,/getPublishedSpaceIds\('restauration'\)/);
});

test('journey: client support page creates and lists own disputes through the authenticated API',()=>{
 const router=read('client/src/router.tsx');
 const page=read('client/src/pages/account/SupportPage.tsx');
 const routes=read('server/routes/litigeRoutes.js');
 const controller=read('server/controllers/litigeController.js');
 assert.match(router,/path==='\/litiges'.*SupportPage/s);
 assert.match(page,/\/api\/litiges\/moi/);
 assert.match(page,/\/api\/litiges'/);
 assert.match(page,/ObjectId|hexadécimaux/);
 assert.match(routes,/router\.post\('\/', auth, creerLitige\)/);
 assert.match(routes,/router\.get\('\/moi', auth, mesLitiges\)/);
 assert.match(controller,/Litige\.find\(\{ auteur: req\.user\._id \}\)/);
});

test('journey: storefront publication is the source of truth and paid plans do not dominate discovery ranking',()=>{
 const discovery=read('server/controllers/discoveryController.js');
 const visibility=read('server/utils/storefrontVisibility.js');
 assert.match(discovery,/StorefrontConfig\.find\(\{publie:true/);
 assert.match(discovery,/const score = \(x\) =>/);
 assert.doesNotMatch(discovery,/priorite\|\|0\)\*100/);
 assert.match(visibility,/StorefrontConfig\.distinct\('espaceId', \{ espaceType, publie: true \}\)/);
});

test('journey: client refund page only offers owned approved transactions and never equates request with execution',()=>{
 const router=read('client/src/router.tsx');
 const page=read('client/src/pages/account/RefundsPage.tsx');
 const routes=read('server/routes/remboursementRoutes.js');
 const controller=read('server/controllers/remboursementController.js');
 assert.match(router,/path==='\/remboursements'.*RefundsPage/s);
 assert.match(page,/\/api\/remboursements\/transactions\/miennes/);
 assert.match(page,/\/api\/remboursements\/moi/);
 assert.match(page,/Cela ne signifie pas encore que le remboursement a été exécuté/);
 assert.match(routes,/router\.get\('\/transactions\/miennes',auth,c\.transactionsRemboursables\)/);
 assert.match(controller,/initiateur: req\.user\._id, statut: 'approuvé'/);
 assert.match(controller,/demandeur: req\.user\._id/);
 assert.match(controller,/montantRemboursable: Math\.max\(0/);
});

test('journey: refund amount checks are serialized per payment to avoid concurrent over-refunds',()=>{
 const controller=read('server/controllers/remboursementController.js');
 const model=read('server/models/TransactionPaiement.js');
 assert.match(controller,/findOneAndUpdate\(\{[\s\S]*remboursementEnCours/);
 assert.match(controller,/Une autre demande de remboursement est en cours/);
 assert.match(controller,/finally \{[\s\S]*remboursementEnCours: false/);
 assert.match(model,/remboursementEnCours: \{ type: Boolean, default: false \}/);
});

test('journey: delivery pickup code cannot be bypassed by changing status directly',()=>{
 const controller=read('server/controllers/demandeLivraisonController.js');
 const page=read('client/src/pages/delivery/Delivery.tsx');
 assert.match(controller,/en_cours: \['annulée'\]/);
 assert.match(controller,/demande\.statut!=='en_cours'/);
 assert.match(controller,/!demande\.recuperationValideeLe/);
 assert.match(controller,/type: 'code_remise', valideeLe/);
 assert.doesNotMatch(page,/else if\(d\.statut==='en_cours'\)next='en_route'/);
 assert.match(page,/Valider le retrait/);
 assert.match(page,/Preuve de remise/);
});

test('journey: mobile navigation exposes every destination through an accessible expanded menu', () => {
 const shell = read('client/src/layouts/AppShell.tsx');
 assert.match(shell,/mobile-more-panel/);
 assert.match(shell,/aria-expanded=\{mobileMoreOpen\}/);
 assert.match(shell,/\.\.\.\(!isPro && !isAdmin \? discoveryNav : \[\]\)/);
 assert.match(shell,/trackEvent\('view'/);
});

test('journey: share supports Instagram, TikTok, QR and copy with share analytics', () => {
 const share = read('client/src/components/share/ShareButton.tsx');
 const analytics = read('client/src/services/analytics.ts');
 for (const channel of ['Instagram','TikTok','QR code','Copier le lien','WhatsApp','Facebook']) assert.ok(share.includes(channel), `missing share channel ${channel}`);
 assert.match(share,/trackShare\(cibleType, cibleId, 'qr'\)/);
 assert.match(analytics,/api\/analytics\/partages/);
});

test('journey: storefront checklist is data-derived and publication is rejected server-side when incomplete', () => {
 const builder = read('client/src/pages/pro/StorefrontBuilder.tsx');
 const controller = read('server/controllers/storefrontController.js');
 assert.match(builder,/const essentialsOk = nomOk && descriptionOk && villeOk/);
 assert.match(builder,/const contentOk = contentCount > 0/);
 assert.match(builder,/disabled=\{saving \|\| !espaceId \|\| !espaceType \|\| !checklistReady\}/);
 assert.match(controller,/publicationReadiness/);
 assert.match(controller,/status\(422\)/);
});

test('journey: grouped delivery requires multiple pickups, allocations, ordered stops and structured proof', () => {
 const utility = read('server/utils/missionLivraison.js');
 const controller = read('server/controllers/missionLivraisonController.js');
 const model = read('server/models/MissionLivraison.js');
 const route = read('server/routes/missionLivraisonRoutes.js');
 const page = read('client/src/pages/delivery/GroupedDeliveryPage.tsx');
 assert.match(utility,/pickups\.length < 2/);
 assert.match(utility,/somme des montants des destinations/);
 assert.match(controller,/Validez les arrêts précédents dans l’ordre du parcours/);
 assert.match(controller,/const proposer = async/);
 assert.match(controller,/const accepter = async/);
 assert.match(controller,/const demarrer = async/);
 assert.match(controller,/Ce livreur a déjà une mission active/);
 assert.match(controller,/Vous ne pouvez pas rattacher une demande qui ne vous appartient pas/);
 assert.match(controller,/preuve/);
 assert.match(model,/valideeLe/);
 assert.match(route,/arrets\/:stopId\/terminer/);
 assert.match(route,/\/proposer/);
 assert.match(route,/\/accepter/);
 assert.match(route,/\/demarrer/);
 assert.match(page,/demandeIds: selected/);
 assert.match(page,/Créer la mission ·/);
 assert.match(page,/Frais alloués/);
});

test('journey: grouped delivery proposal requires courier acceptance before start and ordered proof completion', () => {
 const controller = read('server/controllers/missionLivraisonController.js');
 const model = read('server/models/MissionLivraison.js');
 const page = read('client/src/pages/delivery/GroupedDeliveryPage.tsx');
 assert.match(controller,/mission\.statut = 'proposée'/);
 assert.match(controller,/const accepter = async/);
 assert.match(controller,/const refuser = async/);
 assert.match(controller,/const demarrer = async/);
 assert.match(controller,/Seul le livreur affecté, après démarrage de la mission, peut valider les arrêts/);
 assert.match(model,/enum:\['en_attente','proposée','assignée','en_route','terminée','annulée'\]/);
 assert.match(page,/Envoyer la proposition/);
 assert.match(page,/Accepter la mission/);
 assert.match(page,/Démarrer le parcours/);
});

test('journey: all progressive-learning event types are wired to real customer actions', () => {
 const analytics = read('client/src/services/analytics.ts');
 const shell = read('client/src/layouts/AppShell.tsx');
 const search = read('client/src/pages/Search.tsx');
 const product = read('client/src/pages/public/PublicProduct.tsx');
 const plat = read('client/src/pages/public/PublicPlat.tsx');
 const checkout = read('client/src/pages/commerce/Checkout.tsx');
 const hotel = read('client/src/pages/hotel/HotelBooking.tsx');
 const restaurant = read('client/src/pages/restaurant/RestaurantReservation.tsx');
 const delivery = read('client/src/pages/delivery/Delivery.tsx');
 const favorites = read('client/src/pages/account/AccountPages.tsx');
 for (const type of ['search','view','favorite','share','contact','cart','purchase','reservation','delivery_request','completed']) assert.ok(analytics.includes(`'${type}'`), `missing event type ${type}`);
 assert.match(shell,/trackEvent\('view'/);
 assert.match(search,/trackEvent\('search'/);
 assert.match(product,/trackEvent\('cart'/);
 assert.match(plat,/trackEvent\('cart'/);
 assert.match(checkout,/trackEvent\('purchase'/);
 assert.match(hotel,/trackEvent\('reservation'/);
 assert.match(restaurant,/trackEvent\('reservation'/);
 assert.match(delivery,/trackEvent\('completed'/);
 assert.match(favorites,/trackEvent\('favorite'/);
});

test('journey: mobile navigation exposes every destination through the accessible More panel',()=>{
 const shell=read('client/src/layouts/AppShell.tsx');
 assert.match(shell,/mobile-more-panel/);
 assert.match(shell,/aria-expanded=\{mobileMoreOpen\}/);
 for (const route of ['/favoris','/notifications','/litiges','/remboursements','/categories','/boutiques','/restaurants','/hotels','/livreurs']) assert.ok(shell.includes(route), `missing mobile destination ${route}`);
});

test('journey: share options cover WhatsApp, Facebook, Instagram, TikTok, QR, copy and native share',()=>{
 const share=read('client/src/components/share/ShareButton.tsx');
 for (const token of ['WhatsApp','Facebook','Instagram','TikTok','QrCode','Copier le lien','navigator.share']) assert.ok(share.includes(token), `missing share capability ${token}`);
});

test('journey: progressive-learning events include category exposure, click and ignored exposure',()=>{
 const analytics=read('client/src/services/analytics.ts');
 const model=read('server/models/UserEvent.js');
 const categories=read('client/src/pages/Categories.tsx');
 for (const event of ['category_impression','category_click','category_ignored']) { assert.ok(analytics.includes(event)); assert.ok(model.includes(event)); assert.ok(categories.includes(event)); }
 assert.match(categories,/IntersectionObserver/);
});

test('journey: storefront publication checklist is data-backed and blocks invalid publishing',()=>{
 const builder=read('client/src/pages/pro/StorefrontBuilder.tsx');
 assert.match(builder,/const essentialsOk = nomOk && descriptionOk && villeOk/);
 assert.match(builder,/const contentOk = contentCount > 0/);
 assert.match(builder,/availableTemplateIds\.includes/);
 assert.match(builder,/disabled=\{saving \|\| !espaceId \|\| !espaceType \|\| !checklistReady\}/);
});

test('journey: grouped delivery enforces fee allocation and ordered proof for each stop',()=>{
 const page=read('client/src/pages/delivery/GroupedDeliveryPage.tsx');
 const controller=read('server/controllers/missionLivraisonController.js');
 const util=read('server/utils/missionLivraison.js');
 assert.match(page,/fixedAllocationValid/);
 assert.match(page,/completeStop/);
 assert.match(controller,/Validez les arrêts précédents dans l’ordre du parcours/);
 assert.match(controller,/Une référence de preuve ou une note est obligatoire/);
 assert.match(util,/la somme des montants des destinations doit être égale au total/);
});

test('journey: public storefront load failures have a recoverable state for slug and direct-space routes',()=>{
 const page=read('client/src/pages/public/PublicStorefront.tsx');
 assert.match(page,/if\(error\)return/);
 assert.match(page,/La vitrine n’a pas pu être chargée/);
 assert.match(page,/trackEvent\('view'/);
});

test('journey: public product, plat and announcement details record entity-level views',()=>{
 for (const file of ['client/src/pages/public/PublicProduct.tsx','client/src/pages/public/PublicPlat.tsx','client/src/pages/public/AnnonceDetail.tsx']) {
   const source=read(file);
   assert.match(source,/trackEvent\('view'/, `${file} must track a real entity view`);
 }
});
