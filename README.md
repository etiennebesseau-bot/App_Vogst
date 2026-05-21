# App Vogesenstrasse

PWA de gestion des tâches ménagères communes pour les 3 appartements de la Vogesenstrasse. Les résidents gagnent des points en effectuant des tâches, montent de niveau, et peuvent se donner des kudos.

## Stack

- **React + TypeScript + Vite** — frontend
- **Tailwind CSS** — styles
- **Supabase** — base de données Postgres + realtime (sync entre appareils en temps réel)
- **GitHub Actions → GitHub Pages** — déploiement automatique sur push sur `main`

## Appartements & résidents

| Appartement | Couleur | Résidents |
|---|---|---|
| Team Nelly (apt-a) | 🔴 Rouge | Etienne 🦊, Greta 🐺 |
| Team Ivey (apt-b) | 🟣 Violet | Marc 🦋, Nele 🐬 |
| Team Daisy (apt-c) | 🟢 Vert | Dennis 🦁, Charly 🐸 |

## Types de tâches

### Tâches récurrentes globales (`recurrenceDays`)
Une fois accomplie par n'importe qui, la tâche est verrouillée pour tous pendant X jours.  
**Règle spéciale :** les tâches avec `recurrenceDays ≥ 14` (2+ semaines) redeviennent disponibles après **5 jours minimum** au lieu d'attendre le cycle complet — pour pouvoir les refaire en cas de besoin urgent.

Exemples : Treppenhaus saugen (14j), Keller saugen (30j), Strasse fegen (14j)

### Tâches per-resident (`perResident: true`)
Chaque résident suit son propre cycle indépendamment des autres.  
Exemples : Apéro organisieren (14j/pers), Abendessen organisieren (30j/pers)

### Tâches programmées (`scheduledDates`)
Liées aux dates de ramassage des poubelles. Disponibles 2 jours avant et jusqu'au lendemain de la date prévue.  
Exemples : Papiertonne rausstellen, Graue Tonne rausstellen, Gelber Sack rausstellen

## Points & niveaux

| Niveau | Nom | Points |
|---|---|---|
| 1 | 🌱 Anfänger | 0–99 |
| 2 | 🔧 Fleißig | 100–249 |
| 3 | 💪 Solide | 250–499 |
| 4 | 🏆 Profi | 500–999 |
| 5 | ⭐ Legende | 1000+ |

Les kudos reçus comptent aussi comme points (+1 par kudos).

## Pages

- **/** — WelcomePage : choix du résident
- **/dashboard** — tableau de bord personnel (points, niveau, streak)
- **/tasks** — liste des tâches (Verfügbar / Erledigt / Vorschlag par urgence)
- **/leaderboard** — classement par appartement et par résident
- **/kasse** — gestion des dépenses communes
- **/admin** — PIN 3242 — historique complet, reset par résident ou global

## Lancer en local

```bash
npm install
npm run dev
```

Variables d'environnement (fichier `.env`) :
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...
```

## Déploiement

Push sur `main` → GitHub Actions build + déploie automatiquement sur GitHub Pages.  
Les secrets Supabase sont configurés dans les Settings du repo GitHub.

## Base de données (Supabase)

Voir `supabase/schema.sql`. Tables principales :
- `task_completions` — chaque action effectuée (task_id, resident_id, completed_at, points_earned)
- `push_subscriptions` — abonnements aux notifications push (optionnel)

Le realtime Supabase permet la synchronisation instantanée entre tous les appareils.

## Modifier les tâches

Tout se passe dans `src/data/initial.ts` :
- Ajouter/modifier/supprimer dans le tableau `TASKS`
- Mettre à jour les dates de ramassage annuellement dans `PAPIERTONNE`, `GRAUE_TONNE`, `GELBER_SACK`

**Note :** les IDs de tâches (`t-01`, `t-03`, etc.) sont persistés en base. Si tu supprimes un ID, les completions historiques orphelines restent en base mais n'affectent plus rien.
