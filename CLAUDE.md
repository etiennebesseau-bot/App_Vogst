# App Vogesenstrasse

PWA de gamification des tâches ménagères pour une colocation à Freiburg (3 appartements, 6 résidents).

**URL prod :** https://vogesenstrasse.vercel.app  
**Déploiement :** `npx vercel --prod --yes` depuis ce dossier

## Stack

- React 18 + Vite + TypeScript + Tailwind CSS
- State : `localStorage` uniquement (pas de DB pour les tâches/completions)
- Supabase : push notifications uniquement (`push_subscriptions` table)
- PWA avec service worker (Workbox)

## Structure

```
src/
  data/initial.ts       ← TOUTES les tâches, catégories, résidents, niveaux, dates Müll
  types/index.ts        ← types TypeScript
  store/useStore.ts     ← state localStorage (completions, currentResidentId)
  context/AppContext.tsx ← logique métier (completeTask, isTaskAvailable, etc.)
  components/
    TaskCard.tsx        ← affiche une tâche + qui l'a faite + bouton ✓
    LevelBadge.tsx
    Navigation.tsx
  pages/
    TasksPage.tsx       ← liste tâches (Verfügbar / Erledigt / Vorschlag)
    DashboardPage.tsx
    LeaderboardPage.tsx
    AdminPage.tsx
    KassePage.tsx
    WelcomePage.tsx
```

## Résidents & Appartements

| Résident | Emoji | Appartement |
|----------|-------|-------------|
| Etienne  | 🦊    | apt-a — Team Nelly (rouge) |
| Greta    | 🐺    | apt-a — Team Nelly (rouge) |
| Marc     | 🦋    | apt-b — Team Ivey (violet) |
| Nele     | 🐬    | apt-b — Team Ivey (violet) |
| Dennis   | 🦁    | apt-c — Team Daisy (vert) |
| Charly   | 🐸    | apt-c — Team Daisy (vert) |

## Tâches (src/data/initial.ts)

Modifier points, noms, récurrence toujours dans ce fichier.

### Außenbereich actuelles
| ID    | Titre                   | Points | Récurrence |
|-------|-------------------------|--------|------------|
| t-06  | Strasse fegen           | 16     | 14j        |
| t-07  | Hintere Terrasse fegen  | 8      | 14j        |
| t-08  | Pflanzen entfernen      | 15     | 14j        |
| t-09  | Grünschnitt wegbringen  | 18     | 30j        |
| t-10  | Schnee wegräumen        | 25     | 1j         |
| t-18  | Rasen Mähen hinten      | 8      | 21j        |

### Logique de récurrence
- `recurrenceDays` : tâche bloquée pour tout le monde pendant N jours après completion
- `perResident: true` : chaque résident a son propre compteur (tâches sociales)
- `scheduledDates` : dates fixes (Müll) — affiche le prochain rendez-vous

## Niveaux
1. 🌱 Anfänger (0–99) · 2. 🔧 Fleißig (100–249) · 3. 💪 Solide (250–499) · 4. 🏆 Profi (500–999) · 5. ⭐ Legende (1000+)

## Ajouter une tâche
Dans `src/data/initial.ts`, ajouter dans le tableau `TASKS` :
```ts
{ id: 't-XX', title: '...', points: N, categoryId: 'cat-aussen', recurrenceDays: N }
```
Catégories : `cat-reinigung` · `cat-aussen` · `cat-muell` · `cat-sozial`
