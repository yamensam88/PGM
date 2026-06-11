# Checklist de déploiement — Corrections P0 (audit PGM)

> 11 bugs critiques + 3 réserves CTO corrigés sur 4 cycles. Tests automatiques : 21/21 verts.
> Verdict revue CTO : **GO avec réserves** (aucun bloquant). Détail : `RAPPORT_AUDIT_COMPLET.md`, `BACKLOG.md`, `JOURNAL.md`.
> Ne PAS pousser directement sur `main`. Déployer d'abord en préversion, dérouler les tests ci-dessous, puis merger.

## 1. Mettre les corrections sur une branche et la déployer en préversion

Dans un terminal, à la racine du projet :

```bash
# (si un verrou git traîne) :  rm -f .git/index.lock
git checkout -b fix/p0-audit-cycles-1-4

# Ne commite QUE les fichiers corrigés (pas schema.prisma / _tmp_check_orgs.mjs déjà modifiés avant) :
git add src/lib/plans.ts src/lib/authz.ts src/lib/actions.ts \
        src/app/api/cron/daily/route.ts src/app/dispatch/runs/page.tsx \
        src/components/dashboard/VehicleRowActions.tsx \
        src/components/forms/CreateVehicleForm.tsx \
        src/components/forms/EditVehicleForm.tsx

git commit -m "fix(P0): 11 bugs critiques audit + 3 reserves CTO

- P0-01/02 plans.ts: normalizePlan fail-closed + PAID_STATUSES (acces palier seulement si paye)
- P0-03 updateBillingInterval: route vers Stripe Checkout (plus d'attribution gratuite)
- P0-04 cron: expiration des essais trialing depasses
- P0-05 authz: assertCanOperateRun/resolveSessionDriver (un chauffeur ne pilote que SA tournee)
- P0-06 toggleMonthlyBonus: verif appartenance org + filtre deleteMany
- P0-07 authz: assertBelongsToOrg sur createRun/updateRun/startRun/reportVehicleDamage
- P0-08 saveUnifiedDelivery: date du formulaire respectee
- P0-09 finishRun+saveUnifiedDelivery: dedup charges fixes sur la date de la tournee
- P0-10 formulaires vehicule: champ internal_cost_per_km saisissable
- P0-11 casses: lecture alignee sur vehicle_damage + revalidate /dispatch/runs
- R1 createDriver lie user_id ; R2 inscription en 'starter' ; R3 alerte essai non stricte

Tests: 21/21. Revue CTO: GO avec reserves."

# Pousser la branche -> Vercel cree automatiquement un deploiement de PREVERSION (Preview)
git push -u origin fix/p0-audit-cycles-1-4
```

Vercel génère une URL de préversion pour cette branche (visible dans l'onglet Deployments). Teste sur CETTE url, pas sur la production.

## 2. Les 11 tests à dérouler en préversion

Coche au fur et à mesure.

### Sécurité (le plus important)
- [ ] **T1 — Chauffeur clôture sa tournée.** Login chauffeur → ouvrir une tournée qui lui appartient → la clôturer. Attendu : succès, et les charges fixes (salaire jour + véhicule) comptées **une seule fois**.
- [ ] **T2 — Tentative cross-chauffeur.** En chauffeur, essayer de clôturer / saisir / déclarer un incident sur la tournée d'un **collègue** (changer l'ID dans l'URL ou via les outils dev). Attendu : refus (« cette tournée n'est pas la vôtre »).
- [ ] **T3 — Falsification d'identité.** En chauffeur, soumettre une saisie en mettant l'ID d'un autre chauffeur. Attendu : le serveur force l'identité du chauffeur connecté.
- [ ] **T4 — Override Direction.** En dispatcher/owner, clôturer la tournée d'un chauffeur. Attendu : autorisé (la Direction garde tous ses droits).
- [ ] **T8 — Données d'une autre société.** Tenter de créer une tournée / prime avec un chauffeur/véhicule/client/zone d'une **autre organisation**. Attendu : « introuvable dans votre société ».

### Monétisation
- [ ] **T5 — Client résilié.** Passer une organisation en statut `canceled` (ou `expired`). Attendu : accès coupé (menu vide), plus d'accès aux fonctionnalités du palier.
- [ ] **T6 — Essai.** Org en essai < 7 jours : accès tableau de bord + exploitation uniquement. Forcer `created_at` à -8 jours, lancer le cron quotidien. Attendu : statut bascule `expired`, accès coupé. Vérifier qu'une org **active n'est jamais touchée** par le cron.
- [ ] **T7 — Toggle facturation.** Cliquer Mensuel / Annuel dans les réglages de facturation. Attendu : redirection vers le paiement Stripe (aucun palier attribué en base avant paiement). Une erreur Stripe doit afficher un message propre, sans plantage.

### Fiabilité des marges
- [ ] **T9 — Tournée antidatée.** Saisir une tournée datée d'hier, après minuit. Attendu : enregistrée à la date saisie, charges fixes **non doublées**.
- [ ] **T10 — Coût/km véhicule en propre.** Créer/éditer un véhicule en propre avec coût/km = 0,25 €. Attendu : valeur persistée, un 0 reste 0 après ré-édition, et la marge du véhicule reflète bien ce coût.
- [ ] **T11 — Casse véhicule.** Déclarer une casse. Attendu : elle apparaît immédiatement dans la liste (/dispatch/runs) après rafraîchissement automatique.

## 3. Si tout passe
```bash
git checkout main
git merge fix/p0-audit-cycles-1-4
git push        # -> deploiement PRODUCTION
```

## 4. Réserves connues (non bloquantes, à backlogger)
- Alerte essai : peut envoyer 2 emails (J-2 et J-1) faute de déduplication — acceptable. Une dédup propre (`last_trial_warning_sent`) serait à ajouter plus tard.
- Erreur de typage préexistante `actions.ts` (`worker_type`) : indépendante de ces corrections, à traiter dans un cycle dette.
- Reste les bugs P1 (alignement live ↔ rétroactif, double-comptage km, transactions) pour un prochain chantier.

## 5. En cas de souci — revenir en arrière
Les fichiers d'origine de chaque cycle sont sauvegardés dans le sandbox (`/tmp/backup_cycle1..4`). Côté git, un simple `git checkout main` revient à l'état d'avant (commit 1d63bce).
