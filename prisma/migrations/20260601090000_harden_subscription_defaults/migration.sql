-- Durcissement sécurité (fail-closed) des valeurs par défaut d'abonnement.
-- Avant : une organisation créée sans valeurs explicites naissait "active"/"pro"
-- => accès à TOUTES les interfaces. Désormais elle naît en essai au palier le plus bas.
-- N'altère PAS les lignes existantes : ne change que le DEFAULT des colonnes.

ALTER TABLE "organizations" ALTER COLUMN "subscription_plan" SET DEFAULT 'starter';
ALTER TABLE "organizations" ALTER COLUMN "subscription_status" SET DEFAULT 'trialing';
