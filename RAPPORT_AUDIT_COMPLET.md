# Rapport d'audit complet — SaaS Dispatch / Livraison

**Date :** 10 juin 2026 · **Mode :** lecture seule (aucune modification du code)
**Périmètre :** schéma Prisma, logique métier (`src/lib`), logique financière, synchronisation formulaires ↔ interfaces, auth/autorisations, API (Stripe, cron), tests.
**Vérifications exécutées :** `tests/finance.test.cjs` → **21/21 tests passent** ✅. Compilation `tsc` non concluante dans le sandbox (timeout), à relancer localement.

---

## Synthèse

L'architecture est saine : `authz.ts` centralisé, `finance.ts` pur et testé, recalcul rétroactif bien conçu, isolation multi-tenant correcte en lecture, verrous optimistes sur start/finish. **Mais 11 problèmes critiques** compromettent la monétisation, l'intégrité des marges et la sécurité entre chauffeurs. Le cœur du problème : **le flux chauffeur (`saveUnifiedDelivery`) et le flux dispatch utilisent des conventions différentes sur les mêmes colonnes**, et la couche plans/abonnements est « fail-open ».

---

## 🔴 CRITIQUES (11)

### Monétisation / Abonnements

**1. `normalizePlan` retombe sur "pro" pour toute valeur inconnue — Starter devient Pro**
`src/lib/plans.ts:74-77` + `src/app/api/stripe/webhook/route.ts:59-60`
Le webhook écrit `subscription_plan = "starter-monthly"`, mais `normalizePlan` ne reconnaît que `starter|pro|business` et retourne `"pro"` par défaut. Tout abonné Starter (99 €) obtient les fonctionnalités Pro (249 €) : rétroactif, RH, multi-utilisateurs. Le palier Starter est de facto invendable. Aggravé par `registerOrganization` (`actions.ts:37`) qui crée l'org en `'pro'` au lieu de `'starter'`.

**2. Un abonnement résilié garde l'accès à vie**
`src/lib/plans.ts:91-97` (`orgCan`)
Seul le statut `trialing` est traité spécialement ; `canceled`, `past_due`, `unpaid` donnent l'accès complet au palier. La constante `PAID_STATUSES` référencée par le commentaire du webhook **n'existe pas**. Un client peut résilier et continuer indéfiniment.

**3. Le toggle Mensuel/Annuel écrit le plan en base sans paiement**
`src/lib/actions.ts:103-126` + `dispatch/settings/billing/page.tsx:107-118`
Un clic écrit `subscription_plan = "pro-monthly"` sans transaction Stripe. Combiné aux points 1 et 2 : n'importe quel owner s'attribue Pro gratuitement.

**4. L'essai gratuit n'expire jamais en base**
`api/cron/daily/route.ts:17-38` + `plans.ts:63-65` + `dispatch/layout.tsx:67-75`
Le cron envoie un email J-2 (avec `=== 2` strict : raté si le cron saute un jour), mais aucun code ne passe `trialing` → `expired`. Le blocage à 7 jours est purement visuel (layout) ; les server actions restent appelables en POST direct.

### Sécurité

**5. Un chauffeur peut piloter le run de n'importe quel collègue**
`actions.ts:1214` (startRun), `:809` (finishRun), `:1163` (reportIncident), `:1955` (saveUnifiedDelivery)
Ces actions vérifient l'organisation mais jamais que `run.driver_id` correspond au chauffeur connecté. `saveUnifiedDelivery` lit même `driverId` depuis le FormData et réécrit le run avec. Falsification possible de colis/km/CA d'un tiers.

**6. `toggleMonthlyBonus` : écriture cross-tenant**
`actions.ts:738-794`
`driverId` jamais vérifié contre `organization_id` ; le `deleteMany` (l.766) ne filtre pas l'org. Une organisation A peut créer/supprimer des primes pour les chauffeurs d'une organisation B.

**7. Entités d'autres organisations injectables dans les runs**
`actions.ts:1240-1251` (startRun: `vehicle_id`), `:1339-1473` (createRun: `client_id`, `zone_id` jamais validés ; driver/vehicle validés seulement si complété), `:3281-3316` (updateRun: idem), `:1745-1804` (reportVehicleDamage: rien validé)
Pollution de clés étrangères inter-organisations, stats faussées, blocages de suppression (`onDelete: Restrict`) chez l'autre société.

### Intégrité des données financières

**8. La date saisie par le chauffeur est ignorée et écrasée par "aujourd'hui"**
`UnifiedDeliveryForm.tsx:249` (champ `date` requis) vs `actions.ts:2097` (`date: new Date()`)
Le champ n'est jamais lu. Une saisie antidatée est silencieusement enregistrée à la date du jour ; la date d'un run planifié pour un autre jour est écrasée. Tous les agrégats par date deviennent faux.

**9. Charges fixes doublées sur les clôtures tardives**
`actions.ts:882-897` (finishRun), `:2025-2045` (saveUnifiedDelivery)
La déduplication « première tournée du jour » utilise `new Date()` (date serveur) au lieu de `run.date`. Clôturer après minuit une tournée de la veille impute une 2ᵉ fois le salaire journalier et la part fixe véhicule. `updateRun:3323` et le rétroactif utilisent correctement `run.date` → divergence garantie.

**10. `internal_cost_per_km` : aucun formulaire ne l'envoie, et chaque édition le remet à 0**
`actions.ts:1838, 3557, 3584` (lu côté serveur, `parseNumber(null) → 0`) vs `CreateVehicleForm.tsx` / `EditVehicleForm.tsx` (aucun input)
Le coût kilométrique des véhicules en propre est structurellement 0 → **marges systématiquement surévaluées**, sans aucun moyen UI de saisir la valeur.

**11. Les casses véhicule déclarées sont invisibles : mismatch d'enum**
Écriture `actions.ts:1779` : `incident_type: 'vehicle_damage'` ; lecture `dispatch/runs/page.tsx:128` : `where: { incident_type: "casse_vehicule" }` → toujours vide. En plus, revalidation de routes inexistantes (`/dispatch/fleet`, `/dispatch/vehicles`, `/direction`) et pas de `router.refresh()` côté client. La casse est facturée mais jamais affichée.

---

## 🟠 MAJEURS (sélection — 20)

### Divergence live ↔ rétroactif (la même tournée a deux marges « officielles »)

- **Pénalité km loué** : `finishRun` (`actions.ts:921`) applique un défaut de 4000 km si aucune limite n'est configurée ; `finance.ts:101-105`, createRun, updateRun et saveUnified n'appliquent **aucune** pénalité dans ce cas. Le rétroactif réécrit l'historique différemment du live.
- **Chauffeur payé au colis** : live = directs + relais (`actions.ts:891, 1398, 2041, 3332`) ; rétroactif = directs seulement (`finance.ts:96-98` lit `packages_delivered`). Le rétroactif sous-paie les relais.
- **`entry_date` du grand livre** : live = `new Date()` (`actions.ts:1050-1071`), rétroactif = `run.date` (`retroactive.ts:263`). Le même flux change de période selon le chemin.
- **Km mensuels double-comptés** : `saveUnifiedDelivery` (`actions.ts:2100-2102`) écrit `km_start/km_end` sur chaque tournée du jour avec `km_total: 0` ; `finishRun:920` retombe sur `km_end - km_start` (0 est falsy) → km gonflés ×N tournées/jour, pénalité km déclenchée trop tôt. `updateRun:3346-3353` omet en plus le filtre `status: 'completed'`.

### Conventions contradictoires entre formulaires

- **« Avisés / Retournés »** : 3 conventions sur les mêmes colonnes. `CreateRunForm:187` met les avisés dans `packages_returned` ; `UnifiedDeliveryForm` idem (`actions.ts:2105`), `packages_advised_*` jamais renseignés ; `FinishRunForm`/`UpdateRunForm` utilisent `packages_advised_direct/relay`. L'écran d'édition dispatch affiche les avisés du chauffeur dans « Colis Retournés » ; les KPI mélangent deux notions.
- **`updateRun` : CA vs `packages_delivered`** : le CA est recalculé depuis `loaded − avisés − retours` (`actions.ts:3318`) mais le champ stocké est la saisie brute du formulaire (`:3286`). Éditer « colis livrés » ne change pas le CA ; le mode « réel » du cockpit Direction (`dashboard/page.tsx:129`) recalcule depuis `packages_delivered` → 3ᵉ valeur.
- **Coût mensuel détourné dans `hourly_cost`** : la création stocke le mensuel exact (`actions.ts:687`), mais `updateEmployee:418` l'écrase par `dailyCost × 25.33` → la valeur exacte est perdue à la première édition. Le ratio diffère aussi : `CreateEmployeeForm` calcule la moyenne réelle de l'année (≈25,1–25,4) vs constante 25,33 partout ailleurs.

### Champs serveur jamais envoyés par les formulaires

- `createDriver` : champ `cost` absent du formulaire → défaut silencieux **150 €/jour** (`actions.ts:143`) dans toutes les marges et ~3 800 €/mois en masse salariale RH.
- `CreateRunForm` : prop `rateCards` jamais utilisée, `rate_card_id` jamais envoyé → fallback `client.rate_cards[0]` **sans orderBy** (grille arbitraire s'il y en a plusieurs). `updateTariffs` (`actions.ts:3028`) modifie le premier client de l'org via `findFirst` sans critère.
- `FinishRunForm:267` : `proof_of_return_photo_url` envoyé, lu (`actions.ts:829`)… jamais persisté.
- Salariés `per_package` : ni `dailyCost` ni `monthlyCost` envoyés → 150 €/j par défaut, et `hr/page.tsx:178,570` calcule le payroll sans regarder `pay_mode` → ~3 800 €/mois fictifs par chauffeur au colis.

### Cycle de vie & transactions

- **`saveUnifiedDelivery` sans transaction ni garde de statut** : le run est marqué `completed` (`actions.ts:2119-2122`) hors de la transaction du ledger (`:2241`) → ledger incohérent si elle échoue. Aucune validation du statut courant : `planned` → `completed` sans démarrage possible.
- **`updateRun` : repasser un run `completed` en `planned` laisse le ledger en place** (`actions.ts:3300` : nettoyage seulement si `completed`) → CA et marge fantômes. Option `failed` dans `UpdateRunForm:65` hors enum, non traitée par les agrégats.
- **Race condition « première tournée du jour »** : comptage `priorDriverRuns` hors transaction (`actions.ts:887, 1394, 2037`) → deux clôtures concurrentes facturent deux fois le coût journalier. Idem `assertTrialQuota` (check-then-create).
- **`createDriver` ne lie pas `user_id`** (`actions.ts:172-182`, contrairement à `createEmployee:287`) : portail chauffeur par matching email (non unique en base) → comptes orphelins à la suppression, « Profil Introuvable » si l'email change.

### Pénalités / RH

- **Pénalités liées au ledger par plage de dates, pas par clé** (`actions.ts:2449-2465, 2496-2512`) + montant stocké en texte dans `notes` relu par **regex** (`EditPenaltyForm.tsx:168`). Deux pénalités le même jour → modifier/supprimer l'une altère les écritures des deux.
- **`getDriverFinancialHistory`** : (a) aucune garde de rôle (`actions.ts:2767`) → un chauffeur peut lire le salaire/pénalités d'un collègue ; (b) compte les `sanction` et `presence` comme jours d'absence (`:2834-2877`) ; (c) `vacationBalance = 25 - x` codé en dur, contredit `leave.ts`.
- **`leave.ts:18-25`** : congés décomptés en jours calendaires (dimanches/fériés inclus) alors que l'acquisition est en jours ouvrés.
- **CreateRunForm : avertissement « chauffeur en congé » mort** : teste `d.hr_events` mais la page ne fait pas l'`include` (`runs/create/page.tsx:20`).

### Webhook & API

- **Webhook Stripe** : pas d'idempotence (`event.id`), pas de gestion d'ordre (un `updated` rejoué réactive un compte résilié), le plan n'est jamais resynchronisé sur `subscription.updated`, statut `suspended` du super-admin écrasable, `trialing` Stripe → `active` interne. Signature correctement vérifiée par ailleurs.
- **`api/cron/daily:11`** : auth désactivée hors production (`&& NODE_ENV === 'production'`) et `Bearer undefined` passe si `CRON_SECRET` absent (contrairement à `api/agents/cron` qui exige la présence du secret).
- **`simulateRetroactiveCosts`** (`retroactive.ts:100-107`) : aucune garde `requireFeature`/`requireRole` (seul `apply` est verrouillé) → un compte Starter/essai lit les marges recalculées en POST direct.
- **Aucune limite de véhicules pour les paliers payés** : quotas uniquement en essai (`authz.ts:94-111`) alors que la page billing promet une bascule automatique au-delà de 15 véhicules.
- **Double comptage des écritures orphelines** dans les synthèses chauffeur/zone (`dashboard/page.tsx:141-153, 624-686`) : une casse sans `run_id` est rattachée à chaque tournée du même chauffeur/jour.
- **`reportVehicleDamage`** : `vehicle_id`/`driver_id` non vérifiés ; **`reportIncident`** : aucun rôle requis, incident créé sans auteur ni `driver_id`.
- **`UnifiedDeliveryForm` : zone dans `run_code`** (`:96-97` → `actions.ts:2099`), `zone_id` reste null → les synthèses par zone n'agrègent jamais les saisies chauffeur.
- **Erreurs jetées au lieu de retournées** dans `createRun`/`reportIncident` (`actions.ts:1306-1328`) : en production Next masque le message → « Erreur inattendue » au lieu de la validation.
- **Mots de passe** : aucune politique à l'inscription (`actions.ts:19-52`), 6 caractères au reset, mots de passe retournés en clair par `createAdminUser`/`createEmployee` sans flag `must_change_password`, token de reset stocké en clair (préférer un hash).

---

## 🟡 MINEURS (sélection)

- **Schéma Prisma** : aucun enum (statuts en VarChar libres — `archived`, `granted/refused`, `failed` écrits hors valeurs documentées) ; `@updatedAt` absent partout (`updated_at` figé) ; uniques manquants (`Vehicle(org, plate_number)`, `Driver(org, employee_code)`, `Client(org, client_code)`, `Zone(org, code)`, `DailyRun.run_code`) ; index manquants (`HrEvent`, `FinancialEntry(run_id)`, `FuelLog(run_id)`) ; `deleted_at` présent sur 6 modèles mais jamais utilisé (soft-delete mort) ; `InternalMessage.receiver` en Cascade (supprime les messages envoyés par d'autres).
- **Timezone** : mélange local/UTC (`actions.ts:1331-1332` parse UTC puis getters locaux ; bornes de mois locales vs `@db.Date`). Sain uniquement parce que le serveur est en UTC (Vercel) ; fragile ailleurs.
- **Km décimaux** : `step="0.1"` sur `km_start/km_end` (`FinishRunForm:186,199`) alors que Prisma attend `Int` → erreur d'exécution, tournée non clôturable.
- **Billing UI** : `isAnnual` ne reconnaît que `pro-annual` ; « -20 % » et « 2 mois offerts » mathématiquement incompatibles (950 € vs 990 €) ; risque d'écart affichage/facture (Price IDs Stripe).
- **`SettingsForms`** : `alert` de succès même en échec ; `|| 4500` au lieu de `??` (une valeur 0 se ré-affiche 4 500 €).
- **`IncidentForm`** : types `failure/delay/accident/dispute` ≠ vocabulaire du schéma ; affichage brut non traduit.
- **Chat** : `receiver_id` non validé dans l'org ; `getUnreadCount` sans filtre org → badge de non-lus fantôme possible.
- **Hardcodés dispersés** : `25.33` (≥6 occurrences au lieu de `WORKING_DAYS_PER_MONTH`), gasoil `1.80` (×5), `0.18` €/km, 150 €, essai 7 j en dur.
- **`addMaintenanceLog`** force `status:'maintenance'` sans retour auto à `active` → véhicule disparaît des sélecteurs sans avertissement.
- **Uploads simulés** : URLs fabriquées persistées en base, fichiers jamais stockés (`actions.ts:963, 2278`).
- **Super-admin = la plus vieille organisation** (`orderBy created_at asc`) : heuristique fragile ; rôle `super_admin` testé (`super-admin/page.tsx:38`) mais inexistant dans le type `Role`.
- **Atomicité création** : `registerOrganization`, `createDriver`/`createEmployee`, boucle multi-clients de `createRun` sans transaction → enregistrements orphelins/partiels possibles.
- **TVA** : aucune gestion (montants implicitement HT), `automatic_tax` non activé sur Checkout — à configurer pour un SaaS B2B français.
- **`UpdateFuelPriceForm`** : composant orphelin jamais importé ; tarifs hardcodés dans les libellés d'`UpdateRunForm` divergents des grilles réelles.
- **`deleteDriver`** ne décrémente pas `vehicle.current_km` (contrairement à `deleteRun`).

---

## ✅ Points sains

- **`finance.ts`** : fonctions pures, sans DB, testées (21/21), conventions cohérentes (charge fixe 1×/jour, salarié non payé dimanche/férié vs indépendant payé, CA = colis livrés).
- **`retroactive.ts`** : contexte en une requête, calcul en mémoire, transactions par lot, seuil 0,01 €.
- **`calendar.ts`** : algorithme de Pâques exact, 11 fériés français, dates ancrées à midi (anti-DST).
- **`headcount.ts`** : priorités présent > congé > absent, ensembles disjoints.
- **Multi-tenant en lecture** : `organization_id` filtré systématiquement ; `authz.ts` centralisé (`requireRole/requireDirection/requireOwner/requireFeature`) appelé dans les actions sensibles.
- **Verrous optimistes** corrects sur `startRun`/`finishRun` (`updateMany` + garde de statut).
- **Stripe** : signature webhook vérifiée (`constructEvent` sur corps brut), Checkout créé côté serveur, Price IDs en env, aucun montant manipulable côté client. Pas de confusion centimes/euros.
- **Auth** : bcrypt partout, tokens reset 32 octets/1 h/invalidés après usage, pas d'énumération d'emails, NextAuth sans secret de repli.
- **Formulaires bien câblés** : StartRun/FinishRun, absences (Create/EditAbsenceForm), grilles tarifaires (RateCardForms), zones, véhicules (cohérence owned/rented imposée serveur), deleteRun/deleteDriver transactionnels.
- **Calculateur public** : 100 % client, formules cohérentes.

---

## Priorités de correction recommandées

1. **Monétisation** : corriger `normalizePlan` (fail-closed), vérifier le statut payé dans `orgCan`, supprimer/sécuriser `updateBillingInterval`, expirer l'essai en base.
2. **Sécurité** : vérifier `run.driver_id === chauffeur connecté` dans startRun/finishRun/reportIncident/saveUnifiedDelivery ; vérifier l'appartenance org de toutes les entités injectées (toggleMonthlyBonus, createRun, updateRun, reportVehicleDamage).
3. **Intégrité financière** : lire le champ `date` dans `saveUnifiedDelivery`, dédupliquer les charges fixes sur `run.date`, ajouter le champ `internal_cost_per_km` aux formulaires véhicule, unifier la convention avisés/retournés, aligner finishRun sur finance.ts (limite km), corriger le double comptage km.
4. **Robustesse** : idempotence du webhook Stripe, transaction autour de `saveUnifiedDelivery`, lien par clé entre HrEvent et FinancialEntry, machine à états sur les transitions de statut.
