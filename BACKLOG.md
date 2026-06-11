# BACKLOG PGM — Priorisé

> Source de vérité des priorités. Tout agent consulte ce fichier AVANT d'agir et référence l'ID de l'item sur lequel il travaille (ex. `P0-01`).
> Statuts : `À FAIRE` · `EN COURS (agent)` · `EN REVUE` · `FAIT`.
> Origine des items : `RAPPORT_AUDIT_COMPLET.md`. Priorité : P0 = bloquant revenu/sécurité, P1 = fiabilité, P2 = dette/amélioration.
> Mise à jour : l'orchestrateur tient ce fichier à jour ; chaque agent peut changer le statut de l'item qu'il prend.

---

## P0 — Bloquant (revenu & sécurité) — départements : Tech / Produit

| ID | Item | Objectif | Owner | Statut |
|----|------|----------|-------|--------|
| P0-01 | `normalizePlan` fail-open : Starter normalisé en Pro (`plans.ts:74-77` + webhook) | OBJ-DIR-1 | backend-team | EN REVUE (backend-team) |
| P0-02 | Abonnement résilié garde l'accès (statut non vérifié hors `trialing`, `plans.ts:91-97`) | OBJ-DIR-1 | backend-team | EN REVUE (backend-team) |
| P0-03 | `updateBillingInterval` écrit le plan sans paiement (`actions.ts:103-126`) | OBJ-DIR-1 | backend-team | EN REVUE (backend-team) |
| P0-04 | Essai jamais expiré en base (cron n'escalade pas le statut) | OBJ-DIR-1 | backend-team | EN REVUE (backend-team) |
| P0-05 | Faille cross-chauffeur : run d'un tiers pilotable (start/finish/incident/saveUnified) | OBJ-TECH-2 | backend-team | EN REVUE (backend-team) → voir `CORRECTIF_cross_chauffeur.md` |
| P0-06 | `toggleMonthlyBonus` écriture cross-tenant (`actions.ts:738-794`) | OBJ-TECH-2 | backend-team | EN REVUE (backend-team) |
| P0-07 | Entités d'autres orgs injectables dans runs (createRun/updateRun/startRun/reportVehicleDamage) | OBJ-TECH-2 | backend-team | EN REVUE (backend-team) |
| P0-08 | Date chauffeur ignorée/écrasée par `new Date()` (`actions.ts:2097`) | OBJ-PROD-2 | backend-team | EN REVUE (backend-team) |
| P0-09 | Charges fixes doublées sur clôtures tardives (dédup sur date serveur, pas `run.date`) | OBJ-TECH-1 | backend-team | EN REVUE (backend-team) |
| P0-10 | `internal_cost_per_km` jamais saisissable → marges surévaluées (formulaires véhicule) | OBJ-PROD-2 | frontend-team | EN REVUE (frontend-team) |
| P0-11 | Casses véhicule invisibles : mismatch `vehicle_damage` / `casse_vehicule` | OBJ-PROD-2 | frontend-team | EN REVUE (frontend-team) |

## P1 — Fiabilité (données & robustesse)

| ID | Item | Objectif | Owner | Statut |
|----|------|----------|-------|--------|
| P1-01 | Unifier convention colis livrés/avisés/retournés sur tous les formulaires | OBJ-PROD-1 | cpo + frontend-team | À FAIRE |
| P1-02 | Aligner live ↔ rétroactif (limite km finishRun, colis relais, entry_date) | OBJ-TECH-1 | backend-team | À FAIRE |
| P1-03 | Double comptage km mensuels véhicule (`km_total` falsy) | OBJ-TECH-1 | backend-team | À FAIRE |
| P1-04 | `saveUnifiedDelivery` hors transaction + sans garde de statut | OBJ-TECH-1 | backend-team | À FAIRE |
| P1-05 | `updateRun` : repasser completed→planned laisse le ledger en place | OBJ-TECH-1 | backend-team | À FAIRE |
| P1-06 | Champs serveur jamais envoyés (cost driver, rate_card_id, proof_photo) | OBJ-PROD-2 | frontend-team | À FAIRE |
| P1-07 | Webhook Stripe : idempotence + resync du plan | OBJ-TECH-3 | backend-team | À FAIRE |
| P1-08 | `getDriverFinancialHistory` sans garde de rôle + absences mal comptées | OBJ-TECH-2 | backend-team | À FAIRE |
| P1-09 | Pénalités liées au ledger par plage de dates (devrait être par clé) | OBJ-TECH-1 | backend-team | À FAIRE |
| P1-10 | `api/cron/daily` non protégé hors prod + `Bearer undefined` | OBJ-TECH-2 | infrastructure-team | À FAIRE |

## P2 — Dette & amélioration

| ID | Item | Objectif | Owner | Statut |
|----|------|----------|-------|--------|
| P2-01 | Découper `actions.ts` (~4000 l.) par domaine | OBJ-TECH-3 | cto + backend-team | À FAIRE |
| P2-02 | Introduire les enums Prisma + `@updatedAt` + index manquants | OBJ-TECH-3 | backend-team | À FAIRE |
| P2-03 | Cohérence affichage/facturation de l'offre annuelle (-20 % / 2 mois) | OBJ-DIR-3 | cro + frontend-team | À FAIRE |
| P2-04 | Soft-delete (`deleted_at`) réellement utilisé ou retiré | OBJ-TECH-3 | backend-team | À FAIRE |
| P2-05 | Configurer la TVA Stripe (`automatic_tax`) | OBJ-COM | backend-team | À FAIRE |
| P2-06 | Nettoyer les scripts de debug à la racine du repo | OBJ-TECH-3 | infrastructure-team | À FAIRE |

---

## Items non-tech (Ops / Commercial / Marketing)

| ID | Item | Objectif | Owner | Statut |
|----|------|----------|-------|--------|
| GO-01 | Parcours d'onboarding documenté (exploitant + chauffeur) | OBJ-OPS-1 | formation-clients | À FAIRE |
| GO-02 | FAQ self-service des 10 symptômes fréquents (inclut bugs connus) | OBJ-OPS-2 | support | À FAIRE |
| GO-03 | Funnel instrumenté visiteur→essai→activé→payant | OBJ-COM-1 | acquisition + cro | À FAIRE |
| GO-04 | Séquence de prospection sortante + business case ROI | OBJ-COM-2 | sdr + sales | À FAIRE |
| GO-05 | 2 campagnes adossées au calculateur + landings | OBJ-MKT-1 | acquisition + cmo | À FAIRE |
| GO-06 | Socle SEO : mots-clés douleur + 3 contenus experts | OBJ-MKT-2 | seo + content | À FAIRE |
| GO-07 | 1 partenariat pilote (expert-comptable / loueur VUL) | OBJ-MKT-3 | partenariats | À FAIRE |

---

## Réserves CTO traitées (cycle 4 — 2026-06-10)

| ID | Réserve | Correctif | Owner | Statut |
|----|---------|-----------|-------|--------|
| R1 | `createDriver` ne renseignait pas `Driver.user_id` (fragilise `resolveSessionDriver` P0-05) | `user_id: user.id` ajouté à la création du Driver (pattern de `createEmployee`) | backend-team | EN REVUE (backend-team) |
| R2 | `registerOrganization` créait l'org en `subscription_plan: 'pro'` | Défaut ramené à `'starter'` (le webhook élève le palier après paiement) | backend-team | EN REVUE (backend-team) |
| R3 | Alerte essai J-2 en égalité stricte `=== 2` (perdue si le cron saute un jour) | Fenêtre `>= 1 && <= 2` ; sans dédup, double email J-2/J-1 possible (acceptable) | backend-team | EN REVUE (backend-team) |

---

## Comment prendre un item
1. Vérifie qu'il sert un objectif d'`OBJECTIFS.md`.
2. Passe son statut à `EN COURS (ton-nom)`.
3. Produis le livrable (fichier dans le repo).
4. Passe-le en `EN REVUE`, journalise dans `JOURNAL.md`, propose la suite à l'agent concerné.
