# Correctif — Bug CRITIQUE #5 : prise de contrôle de la tournée d'un autre chauffeur

> Proposition de l'agent **backend-team**. AUCUN fichier source n'a été modifié.
> Tous les diffs ci-dessous sont à valider puis à appliquer manuellement.
> Date : 2026-06-10. Périmètre : `src/lib/actions.ts`, helper à ajouter dans `src/lib/authz.ts`.

---

## 1. Diagnostic vérifié dans le code

### 1.1 Les 4 actions ne contrôlent que l'organisation, jamais le chauffeur

| Action | Fichier:ligne (fetch du run) | Contrôle actuel | Manque |
|---|---|---|---|
| `startRun` | `src/lib/actions.ts:1232` | `where: { id: runId, organization_id: orgId }` | aucune vérif `driver_id` |
| `finishRun` | `src/lib/actions.ts:846` | `where: { id: runId, organization_id: orgId }` | aucune vérif `driver_id` |
| `reportIncident` | `src/lib/actions.ts:1179` | `where: { id: runId, organization_id: orgId }` | aucune vérif `driver_id` |
| `saveUnifiedDelivery` | `src/lib/actions.ts:1955`+ | lit `driverId` depuis le FormData (`src/lib/actions.ts:1961`), ne vérifie que `organization_id` (`src/lib/actions.ts:2004`) | `driverId` est **fourni par le client** : falsifiable |

Conséquence : un chauffeur authentifié de la société X peut, en changeant `runId` (et pour `saveUnifiedDelivery` aussi `driverId`) dans la requête POST, piloter ou clôturer la tournée d'un **autre** chauffeur de la même société, fausser ses stats RH/finances, déclarer des incidents sur sa tournée, etc. C'est un IDOR intra-tenant.

### 1.2 Comment le chauffeur connecté est résolu aujourd'hui

Référence : `src/app/driver/page.tsx:19-24`
```ts
let driver = null;
if (['admin', 'owner', 'dispatcher', 'manager'].includes(session.user.role as string)) {
  driver = await prisma.driver.findFirst({ where: { organization_id: orgId } });   // override Direction/Exploitation
} else {
  driver = await prisma.driver.findFirst({ where: { organization_id: orgId, email: session.user.email } }); // chauffeur
}
```

Donc la résolution réelle du chauffeur se fait **par email**, pas par `user_id`.

### 1.3 Pourquoi on ne peut pas se reposer sur `Driver.user_id`

- Schéma : `Driver.user_id String? @unique` (`prisma/schema.prisma:120`) — **nullable**.
- `createDriver` (`src/lib/actions.ts:131`) crée bien le `User` (`actions.ts:158-168`) puis le `Driver` (`actions.ts:173-184`) **mais ne renseigne JAMAIS `user_id`** sur le Driver (bug connu M5/M10). Le lien User↔Driver n'existe donc que via l'email partagé (le `User.email` et le `Driver.email` valent la même valeur, cf. `actions.ts:160` et `actions.ts:178`).
- `session.user.id` (= `User.id`, posé via `token.sub` dans `src/lib/auth.ts:82`) et `session.user.email` sont tous deux disponibles côté serveur.

**Stratégie retenue pour le helper** : résoudre le Driver de la session par `user_id` **en priorité** (chemin fort, utilisé dès que le lien existe / sera réparé par M5/M10), puis **repli sur l'email** (chemin actuellement fonctionnel malgré le bug). Le filtre `organization_id` est toujours présent. Aucune faille n'est introduite : l'email du `User` est unique en base (`prisma/schema.prisma:88`) et provient de la session signée, pas du FormData.

---

## 2. Correctif proposé

### 2.1 Nouveau helper réutilisable dans `src/lib/authz.ts`

À ajouter à la fin de `src/lib/authz.ts` (après `assertTrialQuota`, donc après la ligne 111). Il faut aussi un import de `prisma` — il est **déjà importé** ligne 14 (`import prisma from "@/lib/prisma";`).

```ts
/**
 * Résout le Driver associé à la session courante (rôle "driver").
 * Lien fort par user_id si présent, sinon repli par email (bug M5/M10 : createDriver
 * ne renseigne pas toujours Driver.user_id). Toujours borné à l'organisation.
 * Retourne null si aucun profil chauffeur n'est trouvé.
 */
export async function resolveSessionDriver(): Promise<{ id: string } | null> {
  const session = await requireSession();
  const orgId = session.user.organization_id;
  const userId = session.user.id;
  const email = session.user.email;

  // 1) Lien fort par user_id (préféré dès que disponible)
  if (userId) {
    const byUser = await prisma.driver.findFirst({
      where: { organization_id: orgId, user_id: userId },
      select: { id: true },
    });
    if (byUser) return byUser;
  }

  // 2) Repli par email (chemin actuellement fonctionnel, cf. driver/page.tsx)
  if (email) {
    const byEmail = await prisma.driver.findFirst({
      where: { organization_id: orgId, email },
      select: { id: true },
    });
    if (byEmail) return byEmail;
  }

  return null;
}

/**
 * Vérifie que la session a le droit d'agir sur `run` (déjà chargé et confirmé
 * dans la bonne organisation par l'appelant).
 *  - Direction (admin/owner) + Exploitation (dispatcher/manager) : override total.
 *  - Chauffeur : autorisé uniquement si run.driver_id === driver de la session.
 *  - Autres rôles (hr, finance) : refusés (ils n'ont rien à piloter sur une tournée).
 * Lève une erreur explicite sinon.
 */
export async function assertCanOperateRun(run: { driver_id: string }): Promise<AuthedSession> {
  const session = await requireSession();
  const role = session.user.role;

  // Direction + Exploitation : override
  if (DIRECTION.includes(role) || role === "dispatcher" || role === "manager") {
    return session;
  }

  if (role === "driver") {
    const driver = await resolveSessionDriver();
    if (!driver) {
      throw new Error("Profil chauffeur introuvable. Contactez l'exploitation.");
    }
    if (run.driver_id !== driver.id) {
      throw new Error("Accès refusé : cette tournée n'est pas la vôtre.");
    }
    return session;
  }

  throw new Error("Accès refusé : votre rôle ne permet pas de piloter une tournée.");
}
```

> Remarque : `assertCanOperateRun` prend le run **déjà chargé** (et déjà filtré par `organization_id`) pour éviter une requête en double. Les 4 actions chargent déjà le run avant toute écriture, on branche le contrôle juste après le `if (!run)`.

---

### 2.2 `startRun` — `src/lib/actions.ts`

Le run est chargé l.1232-1235 et validé l.1237. On insère le contrôle juste après.

**AVANT** (l.1232-1238) :
```ts
    const run = await prisma.dailyRun.findUnique({
      where: { id: runId, organization_id: orgId },
      include: { driver: true }
    });

    if (!run) throw new Error("Tournée introuvable.");
    if (run.status !== "planned") throw new Error("Cette tournée ne peut pas être démarrée.");
```

**APRÈS** :
```ts
    const run = await prisma.dailyRun.findUnique({
      where: { id: runId, organization_id: orgId },
      include: { driver: true }
    });

    if (!run) throw new Error("Tournée introuvable.");
    // SECURITY #5 : un chauffeur ne peut démarrer QUE sa propre tournée (Direction/Exploitation = override)
    await assertCanOperateRun(run);
    if (run.status !== "planned") throw new Error("Cette tournée ne peut pas être démarrée.");
```

---

### 2.3 `finishRun` — `src/lib/actions.ts`

Le run est chargé l.846-857 et validé l.859-860.

**AVANT** (l.859-860) :
```ts
    if (!run) throw new Error("Tournée introuvable ou non autorisée.");
    if (run.status === "completed") throw new Error("Cette tournée est déjà clôturée.");
```

**APRÈS** :
```ts
    if (!run) throw new Error("Tournée introuvable ou non autorisée.");
    // SECURITY #5 : un chauffeur ne peut clôturer QUE sa propre tournée (Direction/Exploitation = override)
    await assertCanOperateRun(run);
    if (run.status === "completed") throw new Error("Cette tournée est déjà clôturée.");
```

---

### 2.4 `reportIncident` — `src/lib/actions.ts`

Le run est chargé l.1179-1185 mais avec `select: { organization_id: true }` uniquement.
Il faut **ajouter `driver_id` au select** puis brancher le contrôle après l.1187.

**AVANT** (l.1179-1187) :
```ts
  const run = await prisma.dailyRun.findUnique({
    where: { 
        id: runId,
        organization_id: orgId
    },
    select: { organization_id: true }
  });

  if (!run) throw new Error("Run not found or unauthorized");
```

**APRÈS** :
```ts
  const run = await prisma.dailyRun.findUnique({
    where: { 
        id: runId,
        organization_id: orgId
    },
    select: { organization_id: true, driver_id: true }
  });

  if (!run) throw new Error("Run not found or unauthorized");
  // SECURITY #5 : un chauffeur ne peut signaler un incident QUE sur sa propre tournée (Direction/Exploitation = override)
  await assertCanOperateRun(run);
```

> Note : `reportIncident` n'a pas de bloc try/catch ; l'erreur levée par `assertCanOperateRun` remontera comme pour les autres validations métier de cette fonction (comportement existant).

---

### 2.5 `saveUnifiedDelivery` — `src/lib/actions.ts` (le plus sensible)

Problème spécifique : `driverId` vient du FormData (l.1961) et sert ensuite à écrire `driver_id` sur le run (cf. `runData.driver_id: driverId`, l.~2103). Il ne faut **pas** faire confiance à cette valeur pour un chauffeur.

Correctif en deux temps :

**(a)** Résoudre le chauffeur de la session **une seule fois** en début de fonction, et déterminer le `driverId` effectif :
- pour un chauffeur : on **ignore** le `driverId` du FormData et on impose celui de la session ;
- pour Direction/Exploitation : on garde le `driverId` du FormData (override légitime du dispatch).

**AVANT** (l.1955-1961) :
```ts
export async function saveUnifiedDelivery(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
```

**APRÈS** :
```ts
export async function saveUnifiedDelivery(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;
    const role = session.user.role;

    const formDriverId = formData.get("driverId") as string;

    // SECURITY #5 : pour un chauffeur, on IGNORE le driverId du FormData (falsifiable)
    // et on impose le chauffeur de la session. Direction/Exploitation gardent l'override.
    let driverId = formDriverId;
    const isOverrideRole =
      ["admin", "owner", "dispatcher", "manager"].includes(role as string);
    if (!isOverrideRole) {
      const sessionDriver = await resolveSessionDriver();
      if (!sessionDriver) throw new Error("Profil chauffeur introuvable. Contactez l'exploitation.");
      driverId = sessionDriver.id;
    }
```

**(b)** Dans la boucle, après avoir chargé `existingRun` et vérifié l'org (l.2002-2004), vérifier en plus que le run appartient bien au `driverId` effectif :

**AVANT** (l.2002-2004) :
```ts
      const existingRun = await prisma.dailyRun.findUnique({ where: { id } });
      // SECURITY CHECK: Verify Ownership of Run Entity to prevent Cross-Tenant IDOR bleeding
      if (!existingRun || existingRun.organization_id !== orgId) continue;
```

**APRÈS** :
```ts
      const existingRun = await prisma.dailyRun.findUnique({ where: { id } });
      // SECURITY CHECK: Verify Ownership of Run Entity to prevent Cross-Tenant IDOR bleeding
      if (!existingRun || existingRun.organization_id !== orgId) continue;
      // SECURITY #5 : pour un chauffeur, le run doit lui appartenir.
      // (driverId est déjà forcé au chauffeur de la session pour les rôles non-override.)
      if (!isOverrideRole && existingRun.driver_id !== driverId) continue;
```

> Le `continue` (et non un `throw`) reste cohérent avec la logique de boucle existante : un run non autorisé est simplement ignoré, sans interrompre le traitement des runs légitimes. Si on préfère un échec dur, remplacer par `throw new Error("Accès refusé : tournée non autorisée.");`.

---

### 2.6 Import à ajouter dans `src/lib/actions.ts`

Ligne 8 actuelle :
```ts
import { requireDirection, requireRole, requireOwner, requireFeature, assertTrialQuota } from "@/lib/authz";
```
**Remplacer par** :
```ts
import { requireDirection, requireRole, requireOwner, requireFeature, assertTrialQuota, assertCanOperateRun, resolveSessionDriver } from "@/lib/authz";
```

---

## 3. Effets de bord à tester

1. **Non-régression chauffeur légitime** : un chauffeur démarre/clôture/signale un incident/saisit les livraisons sur SA tournée du jour → tout doit continuer à fonctionner (chemin email, car `user_id` n'est pas posé par `createDriver`).
2. **Override Direction/Exploitation** : admin, owner, dispatcher, manager peuvent toujours agir sur n'importe quelle tournée de leur organisation (notamment la saisie pour le compte d'un chauffeur via `saveUnifiedDelivery` avec `driverId` arbitraire). Ne pas casser ce flux de dispatch.
3. **Cas où `Driver.user_id` SERA renseigné** (après correctif M5/M10) : `resolveSessionDriver` doit alors résoudre par `user_id` en priorité et rester cohérent avec le repli email.
4. **Multi-profils / homonymes** : `findFirst` par email pourrait théoriquement matcher plusieurs Driver si la donnée est sale. `User.email` est unique, et l'email du Driver est censé recopier celui du User ; mais valider qu'il n'existe pas deux Driver actifs avec le même email dans une org (sinon prévoir un `findMany` + contrôle, ou prioriser le Driver actif).
5. **`reportIncident` sans try/catch** : vérifier que l'erreur levée remonte proprement au client (toast/erreur UI) et n'écrit rien.
6. **`saveUnifiedDelivery` multi-runs** : confirmer que le forçage de `driverId` à la session n'altère pas le calcul `isFirstIteration` (coûts chauffeur/flotte) et que les runs d'un autre chauffeur passés dans `runIds` sont bien ignorés (`continue`).

## 4. Cas de test proposés

### Cas A — Attaque cross-chauffeur sur `startRun`/`finishRun` (doit ÉCHOUER)
- Préparer org O, chauffeurs D1 (session) et D2, une tournée R2 `planned` appartenant à D2.
- Authentifié en tant que D1 (rôle `driver`), appeler `startRun({ runId: R2, ... })`.
- **Attendu** : `success:false` / erreur « cette tournée n'est pas la vôtre » ; R2 reste `planned`, aucun `eventsLog` créé. Idem `finishRun` → R2 non clôturée.

### Cas B — Falsification du `driverId` dans `saveUnifiedDelivery` (doit être NEUTRALISÉE)
- Authentifié en tant que chauffeur D1, POST `saveUnifiedDelivery` avec `driverId = D2.id` et `runIds = [R2]` (tournée de D2).
- **Attendu** : R2 ignorée (`continue`), aucune écriture sur la tournée de D2 ; le `driverId` effectif est forcé à D1, donc même si R1 (de D1) était dans la liste, c'est bien D1 qui est enregistré, jamais D2.

### Cas C — Chemin nominal + override (doit RÉUSSIR)
- C1 : chauffeur D1 sur SA tournée R1 → `startRun`/`finishRun`/`reportIncident`/`saveUnifiedDelivery` réussissent (vérifie le repli email).
- C2 : dispatcher/admin de O appelle `saveUnifiedDelivery({ driverId: D2.id, runIds:[R2] })` → réussit (override conservé), R2 enregistrée pour D2.

---

## 5. Résumé

- Ajouter dans `src/lib/authz.ts` deux helpers : `resolveSessionDriver()` (résolution Driver par `user_id` puis repli email, bornée à l'org — robuste malgré le bug M5/M10) et `assertCanOperateRun(run)` (Direction + Exploitation = override ; chauffeur = `run.driver_id` doit égaler son Driver ; hr/finance refusés).
- Brancher `assertCanOperateRun(run)` juste après le chargement/validation du run dans `startRun` (`actions.ts:1237`), `finishRun` (`actions.ts:859`) et `reportIncident` (`actions.ts:1187`, en ajoutant `driver_id` au `select`).
- Dans `saveUnifiedDelivery`, ne plus faire confiance au `driverId` du FormData pour un chauffeur : le forcer au Driver de la session, et ignorer (`continue`) tout run dont `driver_id` ne correspond pas. Direction/Exploitation conservent l'override.
- Ajouter les deux helpers à l'import `@/lib/authz` en tête de `actions.ts` (l.8).
- Aucun fichier source modifié : proposition à valider.
