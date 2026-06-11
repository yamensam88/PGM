# OBJECTIFS PGM — Plan 90 jours (T3 2026)

> Source de vérité des objectifs de l'agence. Tout agent lit ce fichier AVANT d'agir et rattache son travail à un objectif (ex. `OBJ-TECH-1`).
> Période : 10 juin → 10 septembre 2026. Révision mensuelle.
> Contexte fondateur : produit en production (`pgm-ruddy.vercel.app`), audit complet réalisé (`RAPPORT_AUDIT_COMPLET.md`) — 11 bugs critiques identifiés, dont des failles de monétisation et de sécurité actives en production.

---

## Cap stratégique (CEO)

**Thèse du trimestre : « Étanchéité avant croissance. »**
On ne met pas d'essence dans un réservoir percé. Avant d'accélérer l'acquisition, on colmate les fuites de revenu (monétisation contournable), on sécurise les données clients (failles cross-tenant et cross-chauffeur), et on rend les marges fiables (le cœur de la promesse produit). La croissance commerciale démarre une fois la confiance produit acquise.

Indicateur nord : **marge nette affichée fiable pour 100 % des comptes actifs** (aucune marge faussée par un bug connu).

---

## OBJ-DIR — Direction (CEO)
**Objectif :** sécuriser le revenu et préparer une croissance saine.
- KR1 : 0 voie de contournement de paiement ouverte (les 4 bugs monétisation P0 fermés et vérifiés).
- KR2 : un tableau de bord hebdo revenu/usage consolidé et lu chaque lundi.
- KR3 : décision pricing annuel tranchée et cohérente (offre + affichage + facturation).

## OBJ-PROD — Produit (CPO)
**Objectif :** rendre la donnée fiable et fluide de bout en bout.
- KR1 : convention unique « colis livrés / avisés / retournés » spécifiée et appliquée sur tous les formulaires (fin des 3 conventions divergentes).
- KR2 : 100 % des champs de formulaire ont une correspondance vérifiée formulaire ↔ action ↔ schéma (audit de cohérence à 0 écart).
- KR3 : 1 feature à valeur livrée et adoptée (cible : alerte de dérive de marge, pilotée par pm-ia).

## OBJ-TECH — Tech (CTO)
**Objectif :** fermer les failles critiques et réduire la dette structurante.
- KR1 : 11 bugs CRITIQUES du rapport corrigés, chacun couvert par un test (npm test reste vert).
- KR2 : isolation multi-tenant en écriture étanche — chaque ID reçu du client validé contre l'organisation (0 action vulnérable).
- KR3 : `src/lib/actions.ts` (~4000 l.) découpé par domaine ; webhook Stripe idempotent ; enums Prisma introduits.

## OBJ-OPS — Opérations (COO)
**Objectif :** activer et retenir les premiers clients.
- KR1 : parcours d'onboarding documenté (exploitant + chauffeur) et taux d'activation (1re tournée clôturée) suivi.
- KR2 : temps de première réponse support < 4 h ouvrées ; base de FAQ self-service couvrant les 10 symptômes les plus fréquents (dont les bugs connus).
- KR3 : 0 churn évitable dû à des marges fausses (coûts clients complets et vérifiés).

## OBJ-COM — Commercial (CRO)
**Objectif :** construire un funnel mesurable et les premières conversions.
- KR1 : funnel instrumenté de bout en bout (visiteur → essai → activé → payant → expansion).
- KR2 : 1 séquence de prospection sortante testée + business case ROI chiffré standardisé.
- KR3 : taux essai → payant mesuré et point de fuite principal identifié.

## OBJ-MKT — Marketing (CMO)
**Objectif :** générer des essais qualifiés à coût maîtrisé via le calculateur.
- KR1 : le calculateur public `/calculateur` décliné en au moins 2 campagnes avec landing dédiée.
- KR2 : socle SEO posé (mots-clés douleur prioritaires + 3 contenus experts chiffrés publiés).
- KR3 : coût par essai qualifié mesuré par canal ; 1 partenariat pilote lancé (expert-comptable ou loueur VUL).

---

## Règle de priorité inter-départements
En cas de conflit de ressources : **P0 sécurité/monétisation (Tech) > fiabilité données (Produit/Tech) > rétention (Ops) > acquisition (Commercial/Marketing).**
Toute exception est arbitrée par le CEO via l'orchestrateur.
