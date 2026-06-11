# L'agence d'agents PGM — Mode d'emploi

Ce dépôt contient une **agence d'agents** : 25 rôles (`.claude/agents/`) organisés comme une vraie boîte tech, coordonnés par trois fichiers de pilotage et un agent chef de projet.

## Les pièces

**Les agents** (`.claude/agents/*.md`) — un fichier par rôle. Détection automatique par Claude Code dans ce dossier. Liste via `/agents`.

- Direction : `ceo`
- Produit : `cpo`, `pm-dispatch`, `pm-ia`, `ux-ui`
- Tech : `cto`, `backend-team`, `frontend-team`, `mobile-team`, `ia-team`, `infrastructure-team`
- Opérations : `coo`, `support`, `customer-success`, `formation-clients`
- Commercial : `cro`, `sdr`, `sales`, `account-managers`
- Marketing : `cmo`, `seo`, `content`, `acquisition`, `partenariats`
- Pilotage : `orchestrateur`

**Les fichiers de coordination** (à la racine) — la « mémoire » partagée qui fait tenir l'ensemble :

- `OBJECTIFS.md` — les OKR par département (le cap). Révisé chaque mois.
- `BACKLOG.md` — les priorités, avec IDs (P0/P1/P2), issues du rapport d'audit. Le « quoi faire ensuite ».
- `JOURNAL.md` — le registre de qui a fait quoi et ce qui attend qui. Le « où on en est ».
- `RAPPORT_AUDIT_COMPLET.md` — l'état des lieux technique, référencé par les agents.

## Comment ça marche réellement

Les agents **ne se parlent pas tout seuls** et **ne tournent pas en permanence**. Ce sont des spécialistes qu'on déclenche à la demande. La coordination vient de deux mécanismes :

1. **L'orchestrateur** joue le chef de projet : il découpe une demande, délègue aux bons agents dans le bon ordre, et consolide. C'est lui qui fait circuler le travail.
2. **Les fichiers partagés** servent de synchronisation : chaque agent lit `OBJECTIFS.md` + `BACKLOG.md` avant d'agir, et écrit dans `JOURNAL.md` après. Résultat : tout le monde part du même cap et tu as une visibilité complète sur l'avancement.

## Comment t'en servir

**Pour piloter (recommandé)** — parle à l'orchestrateur :
> « orchestrateur : attaque les bugs de monétisation P0 du backlog. »

Il lira les priorités, déléguera à `backend-team`, fera relire par `cto`, et te rendra une synthèse.

**Pour une tâche ciblée** — appelle directement le spécialiste :
> « backend-team : applique le correctif de P0-05. »
> « content : écris l'article SEO de GO-06 sur le coût de revient kilométrique. »

**Pour suivre l'avancement** — ouvre `JOURNAL.md` (qui a fait quoi) et `BACKLOG.md` (statuts des items).

## Le rythme conseillé

- **Chaque lundi** : demande à l'orchestrateur une synthèse de la semaine (lecture du JOURNAL) et la mise à jour des priorités du BACKLOG.
- **Chaque mois** : révise `OBJECTIFS.md` avec le `ceo`.
- Tu peux automatiser le point hebdo via une tâche planifiée.

## Important
- Tout ça vit dans **Claude Code (terminal)** ouvert sur ce dossier. C'est là que les agents `.claude/agents/` sont actifs.
- Les agents proposent des correctifs ; **toi tu valides** ce qui part en production (`git push` sur `main` → déploiement Vercel).
