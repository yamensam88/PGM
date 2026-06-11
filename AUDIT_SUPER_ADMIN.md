# Audit — Interface Super Admin

Périmètre : `src/app/super-admin/page.tsx` (243 l.) + action `toggleSaaSClientStatus` (`src/lib/actions.ts:67-98`). Page de supervision plateforme (liste des organisations clientes, KPIs MRR, suspension/réactivation).

## 🔴 CRITIQUE

**[✅ CORRIGÉ 2026-06-11 — SA-C1] C1 — Le contrôle d'accès repose sur « l'organisation la plus ancienne »**
`super-admin/page.tsx:32` et `actions.ts:75` : `findFirst({ orderBy: { created_at: 'asc' } })` définit le « Super Admin » comme la 1ʳᵉ organisation créée. Fragile et dangereux : si cette organisation est supprimée (ou si une org plus ancienne est insérée via seed/import/restauration), le rôle de Super Admin **bascule silencieusement** vers une autre société, qui obtient alors le pouvoir de suspendre/réactiver **toutes** les autres. Il n'existe aucun marqueur explicite (`is_master`/flag). Déjà signalé dans l'audit global (M9) ; ici c'est l'unique rempart d'une interface qui contrôle toute la plateforme.

**[✅ CORRIGÉ 2026-06-11 — SA-C2] C2 — La réactivation force le statut `active` (accès payant gratuit)**
`actions.ts:85` : `newStatus = action === 'suspend' ? 'suspended' : 'active'`. Réactiver une organisation la passe **toujours** en `active`, quel que soit son état réel (essai, résiliée, impayée). Combiné au correctif P0-02 (`active` = accès complet du palier), un clic « Réactiver » sur une org `canceled`/`trialing`/`expired` lui **offre l'accès payant** sans paiement Stripe. Il faudrait restaurer le statut antérieur, pas écrire `active` en dur.

## 🟠 MAJEUR

**[✅ CORRIGÉ 2026-06-11 — SA-M1] M1 — Anti-auto-suspension uniquement côté UI**
La protection « ne pas se suspendre soi-même » est seulement le `disabled={org.id === masterOrg?.id}` du bouton (`page.tsx:212`). L'action `toggleSaaSClientStatus` (`actions.ts:67-98`) **ne revérifie pas** : un POST forgé avec `orgId = masterOrg` peut suspendre l'organisation maîtresse elle-même → la plateforme se verrouille. La garde doit être côté serveur.

**[✅ CORRIGÉ 2026-06-11 — SA-M2] M2 — Incohérence garde page (owner) vs garde action (Direction)**
La page exige `role === 'owner'` (ou `super_admin`, qui n'existe pas dans le type `Role`) — `page.tsx:38`. Mais l'action n'exige que `requireDirection()` (admin **ou** owner) + org maîtresse — `actions.ts:69`. Un `admin` de l'org maîtresse, qui ne voit pas la page, peut quand même suspendre/réactiver n'importe quelle org par appel direct. Gardes à aligner (owner-only des deux côtés, idéalement).

**[🟡 ATTÉNUÉ 2026-06-11 — SA-M3 : relabel indicatif, calcul Stripe encore TODO] M3 — MRR et facturation totalement déconnectés du vrai pricing**
`page.tsx:16-22` `calculateBilling` = 200 € de base + 100 €/3 chauffeurs. Or le produit facture **99 €/249 €** par paliers de véhicules (Stripe, `plans.ts:5-6`). Le « MRR Total Estimé », l'« Abonnement Mensuel » par client et le barème affiché (« +100€/3ch ») sont donc **faux** : ils ne reflètent ni les plans réels ni ce que Stripe encaisse. Décision de pilotage basée sur un chiffre fictif.

## 🟡 MINEUR

**m1 — Boutons non câblés** : « Nouvelle Instance Client » (`page.tsx:80`) et « Réactiver/Suspendre » n'ont pas de création d'org ; le bouton « Nouvelle Instance » ne fait rien (pas de form/handler).

**m2 — `role: 'super_admin'` fantôme** : testé en page (`page.tsx:38`) mais absent du type `Role` (`authz.ts`). Code mort ; seul `owner` de l'org maîtresse passe réellement.

**m3 — MRR compte `calculateBilling` même quand l'org maîtresse est incluse** : l'org maîtresse (votre propre société) apparaît dans le portefeuille et dans les totaux chauffeurs globaux, ce qui peut gonfler les KPIs plateforme.

**m4 — Statut `expired` (introduit par le correctif P0-04) non géré dans l'affichage** : le badge tombe dans le cas générique `{org.subscription_status}` — cosmétique, à styler comme les autres.

## ✅ Points sains
- Double garde sur la page (org maîtresse **et** rôle) + redirection propre des non-autorisés.
- L'action revérifie côté serveur l'appartenance à l'org maîtresse (ne se fie pas qu'à la page).
- `revalidatePath` correct, gestion d'erreur structurée `{ success, error }`.
- Le rendu lit/filtre bien toutes les organisations (vue plateforme assumée), pas de fuite inter-org puisque c'est précisément le rôle de cette interface.

## Priorités de correction
1. **C1** : marquer explicitement l'org maîtresse (flag `is_master` ou variable d'env `MASTER_ORG_ID`) au lieu de « la plus ancienne ».
2. **C2** : à la réactivation, restaurer le statut réel (ou repasser en `trialing`/dernier statut connu), jamais `active` en dur.
3. **M1/M2** : déplacer l'anti-auto-suspension côté serveur et aligner les gardes (owner-only).
4. **M3** : brancher le MRR sur le vrai pricing (plans Stripe) ou retirer/étiqueter clairement « estimation indicative ».
