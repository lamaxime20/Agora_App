SPÉCIFICATION COMPLÈTE AGORA — MODULE LIVRAISON (PARTIE 1)
Dashboard
Commandes à Livrer
Assignation Livreur
Historique des Livraisons
OBJECTIF UX

Selon la vision émotionnelle AGORA, ce module doit provoquer :

✅ Contrôle

✅ Fluidité

✅ Clarté

✅ Coordination

✅ Suivi

✅ Confiance

L'utilisateur doit ressentir :

"Je sais exactement quelles commandes doivent partir, qui les transporte et où elles en sont."

Conformément au système émotionnel AGORA, aucun écran ne doit sembler stressant ou surchargé.

DESIGN SYSTEM
Palette

Fond principal :

#FFF8F0

Cartes :

#FFFFFF

Couleur primaire :

#F39C12

Couleur secondaire :

#2C3E50

Succès :

#27AE60

Erreur :

#E74C3C

Warning :

#F1C40F

Info :

#3498DB

Respect de la palette officielle AGORA.

TYPOGRAPHIE

Police :

Inter

Fallback :

system-ui

Titres :

font-size: 28px;
font-weight: 700;

Sous-titres :

font-size: 18px;
font-weight: 600;

Texte :

font-size: 14px;
font-weight: 400;

Labels :

font-size: 12px;
font-weight: 500;
ARCHITECTURE FRONTEND
modules/
└── livraison/
    ├── pages/
    │   ├── DashboardPage
    │   ├── CommandesPage
    │   ├── HistoriqueLivraisonsPage
    │
    ├── components/
    │   ├── KPIcard
    │   ├── DeliveryTable
    │   ├── DeliveryStatusBadge
    │   ├── DeliveryDrawer
    │   ├── AssignDriverModal
    │   ├── FiltersBar
    │   ├── DeliveryTimeline
    │   ├── ExportMenu
    │
    ├── hooks/
    │   ├── useDashboard
    │   ├── useCommandesALivrer
    │   ├── useHistoriqueLivraisons
    │
    ├── services/
    │   ├── dashboard.api.ts
    │   ├── commandes.api.ts
    │   ├── livraisons.api.ts
ROUTING
/livraisons/dashboard

/livraisons/commandes

/livraisons/historique
MOBILE FIRST

Largeur de référence :

360px

Puis :

768px

Puis :

1280px+
DASHBOARD
MOBILE

Header :

← Livraison

Hauteur :

64px

Fond :

#FFFFFF

Sticky :

position: sticky
top: 0

Sous le header :

Filtre temporel

Composant :

Aujourd'hui
Cette semaine
Ce mois
Personnalisé

Format :

horizontal scroll

Style :

Pills arrondies :

border-radius:999px
KPI

Disposition :

2 colonnes

Cards :

Largeur :

48%

Hauteur :

120px

Contenu :

Icône

Valeur

Label

Exemple :

18

Livraisons en cours

Animation :

count-up

Durée :

800ms
Activité récente

Carte pleine largeur

Affichage :

Commande #CMD-1001

Livreur :
Paul

Statut :
En cours

10:35

10 éléments

Virtualisation inutile

Graphique 1

Livraisons par jour

Hauteur :

240px

Type :

Area Chart
Graphique 2

Répartition statuts

Type :

Donut Chart
DESKTOP

Layout :

6 KPI

Disposition :

grid-template-columns:
repeat(6,1fr)

Puis :

2 colonnes

Gauche :

Activité récente

Droite :

Statuts

Puis :

Graphique complet

Livraisons par jour

API DASHBOARD
/public/mock/livraison/dashboard.json

Réponse :

{
  "kpis": {
    "enCours": 12,
    "livrees": 34,
    "echecs": 2,
    "retours": 1,
    "tauxReussite": 94,
    "livreursActifs": 6
  }
}

Chargement :

fetch('/mock/livraison/dashboard.json')

Cache :

5 minutes
COMMANDES À LIVRER
MOBILE

Header :

Commandes à livrer

Sous-header :

Boutons :

Commandes à livrer
Historique

Style :

segmented control

Hauteur :

48px
LISTE COMMANDES

Format :

Cards

Hauteur :

150px

Contenu :

Commande #CMD-1001

Client

Montant

Date

Etat paiement

Bouton
ASSIGNER

Bouton :

Couleur :

#F39C12

Texte :

Assigner

Hauteur :

40px

Radius :

12px
DESKTOP

Tableau

Colonnes :

Commande
Client
Montant
Date
Etat paiement
Action

Action :

Bouton :

Assigner
API COMMANDES
/mock/livraison/commandes-a-livrer.json

Réponse :

{
  "data": [
    {
      "id": "cmd1",
      "numero": "CMD-001",
      "client": "Jean",
      "montant": 25000,
      "etatPaiement": "valide"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 8
  }
}

Pagination :

20 lignes

Lazy Loading :

IntersectionObserver
ASSIGNATION LIVREUR
MODALE MOBILE

Bottom Sheet

Hauteur :

75vh

Radius :

24px 24px 0 0

Titre :

Assigner un livreur

Champ :

Livreur

Composant :

Search Select

Recherche instantanée

Carte livreur :

Avatar

Nom

Téléphone

Nombre livraisons en cours

Sélection :

Glow orange :

#F39C12

Bouton :

Créer livraison

Couleur :

#F39C12
DESKTOP

Modal centrée

Largeur :

520px
API LIVREURS
/mock/livraison/livreurs.json

Réponse :

{
  "data": [
    {
      "id": "user1",
      "nom": "Paul",
      "telephone": "690000000",
      "livraisonsEnCours": 3
    }
  ]
}
API CREATION LIVRAISON
POST
/mock/livraison/create.json

Mock :

{
  "success": true,
  "livraisonId": "liv-001"
}

Optimistic UI :

Oui

HISTORIQUE LIVRAISONS
MOBILE

Liste cartes

Hauteur :

170px

Contenu :

Commande

Client

Livreur

Date

Statut

Badge :

En cours :

blue

Livrée :

green

Retour :

yellow

Echec :

red

Tap :

ouvre Drawer

DRAWER DÉTAILS

Plein écran mobile

Sections :

Informations Livraison

Numéro

Statut

Livreur

Date création

Date lancement

Date livraison

Informations Commande

Client

Montant

Produits

Timeline

Création

Assignation

Lancement

Livraison

Style :

Vertical

DESKTOP

Tableau

Colonnes :

Numéro
Commande
Livreur
Statut
Création
Lancement
Livraison

Clique ligne :

Drawer droite

Largeur :

520px
API HISTORIQUE
/mock/livraison/historique.json

Réponse :

{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250
  }
}
EXPORTS

Menu :

Exporter

Options :

PDF

CSV

DOCX

API MOCK

/mock/livraison/export-pdf.json

/mock/livraison/export-csv.json

/mock/livraison/export-docx.json
OPTIMISATIONS FRONTEND
Cache
TanStack Query
staleTime: 300000
Préchargement

Historique :

prefetchQuery()

au survol desktop.

Skeleton Loading

Dashboard :

KPI skeleton

Commandes :

Card skeleton

Historique :

Table skeleton
Virtualisation

Desktop uniquement

@tanstack/react-virtual

à partir de :

100 lignes
Pagination

Backend simulé :

20 éléments

par page.

Responsive

Mobile :

360 → 767px

Tablet :

768 → 1279px

Desktop :

1280px+

Cette partie 1 est désormais suffisamment détaillée pour être donnée directement à un développeur React afin d'implémenter le Dashboard Livraison, les Commandes à Livrer, l'Assignation de Livreur et l'Historique des Livraisons en respectant l'identité UX/UI d'AGORA.

SPÉCIFICATION COMPLÈTE AGORA — MODULE LIVRAISON (PARTIE 2)
Liste Livraisons
Livraison en cours
Validation
Échec
Retour
Historique personnel
OBJECTIF UX

Cette partie du module représente le cœur opérationnel du livreur.

Selon la philosophie émotionnelle AGORA, l'utilisateur doit ressentir :

✅ Contrôle

✅ Progression

✅ Fluidité

✅ Réactivité

✅ Coordination

L'objectif est que le livreur puisse gérer une livraison en quelques secondes sans jamais chercher où cliquer.

STRUCTURE FRONTEND
modules/
└── livraison/
    ├── pages/
    │   ├── MesLivraisonsPage.tsx
    │   ├── HistoriquePersonnelPage.tsx
    │
    ├── components/
    │   ├── DeliveryCard.tsx
    │   ├── DeliveryStatusBadge.tsx
    │   ├── DeliveryActions.tsx
    │   ├── DeliveryDetailsDrawer.tsx
    │   ├── LaunchDeliveryDialog.tsx
    │   ├── CancelDeliveryDialog.tsx
    │   ├── ReturnDeliveryDialog.tsx
    │   ├── ValidateDeliveryDialog.tsx
    │   ├── DeliveryTimeline.tsx
    │   ├── DeliveryFilters.tsx
    │
    ├── hooks/
    │   ├── useMesLivraisons.ts
    │   ├── useHistoriquePersonnel.ts
    │
    ├── services/
    │   ├── livraison.api.ts
ROUTES
/livraisons/mes-livraisons

/livraisons/historique-personnel
DESIGN SYSTEM
Statuts
En cours
background: #3498DB20;
color: #3498DB;
Livrée
background: #27AE6020;
color: #27AE60;
Échec
background: #E74C3C20;
color: #E74C3C;
Retour
background: #F1C40F20;
color: #F39C12;
LISTE LIVRAISONS

Cette page correspond à :

Livraisons en cours

du workflow.

MOBILE
Header

Hauteur :

64px

Contenu :

← Livraison

Mes livraisons

Sticky.

Segmented Control

Sous le header.

En cours

Historique

Hauteur :

48px

Radius :

16px
LISTE

Format :

Cards verticales.

Espacement :

16px
CARD LIVRAISON

Hauteur :

220px

Largeur :

100%

Fond :

#FFFFFF

Radius :

20px

Shadow :

0 6px 20px rgba(0,0,0,.05)

Contenu :

Première ligne :

Commande #CMD-1024

Poids :

700

Deuxième ligne :

Client
Téléphone

Troisième ligne :

Adresse

Maximum :

2 lignes

Quatrième ligne :

Montant commande

Badge statut :

Coin supérieur droit.

Actions :

Zone fixe en bas.

CAS 1

Date lancement absente

Actions :

Annuler

Lancer

Bouton Annuler

background:#FFFFFF;
border:1px solid #E74C3C;
color:#E74C3C;

Bouton Lancer

background:#F39C12;
color:white;
CAS 2

Date lancement présente

Actions :

Retour

Échec

Valider

Retour

background:#F1C40F;

Échec

background:#E74C3C;

Valider

background:#27AE60;
DESKTOP

Disposition :

Tableau.

Colonnes :

Commande

Client

Téléphone

Adresse

Montant

Statut

Actions

Actions :

Boutons inline.

OUVERTURE DÉTAILS

Cliquer sur une ligne :

ouvre Drawer.

DRAWER DÉTAILS
MOBILE

Plein écran.

Animation :

translateY

Durée :

250ms

Sections :

Livraison
Numéro livraison

Statut

Livreur

Date création

Date lancement
Commande
Client

Téléphone

Adresse

Montant
Produits

Liste scrollable.

Carte produit :

Nom

Quantité

Prix
Timeline
Créée

Assignée

Lancée

Livrée

Verticale.

DESKTOP

Drawer droite.

Largeur :

520px
LANCER LIVRAISON
API
POST

/mock/livraison/start.json

Body :

{
  "livraisonId": "liv-001"
}

Réponse :

{
  "success": true,
  "dateLancement": "2026-06-08T12:30:00"
}

UX

Au clic :

spinner

Puis :

toast succès

Message :

Livraison démarrée

Optimistic Update :

Oui.

ANNULER LIVRAISON

Correspond à :

Échec avant départ
MOBILE

Bottom Sheet.

Hauteur :

55vh

Titre :

Annuler la livraison

Champ :

Raison de l'annulation

Type :

textarea

Minimum :

20 caractères

Bouton :

Confirmer

Rouge.

API
POST

/mock/livraison/cancel.json

Body

{
  "livraisonId": "liv-001",
  "motif": "Client indisponible"
}

Réponse

{
  "success": true
}
ÉCHEC LIVRAISON

Après lancement.

MOBILE

Bottom Sheet.

Même design.

Titre :

Déclarer un échec

Champ :

Motif de l'échec

API

POST

/mock/livraison/echec.json

Body

{
  "livraisonId":"liv-001",
  "motif":"Adresse introuvable"
}

Réponse

{
  "success":true
}
RETOUR LIVRAISON
MOBILE

Bottom Sheet.

Titre

Retour de livraison

Champ :

Motif du retour

API

POST

/mock/livraison/retour.json

Body

{
  "livraisonId":"liv-001",
  "motif":"Client refuse la commande"
}

Réponse

{
  "success":true
}
VALIDATION LIVRAISON

Interface la plus importante.

MOBILE

Bottom Sheet.

Hauteur :

45vh

Icône :

✓

Grande.

Titre :

Confirmer la livraison

Message :

Confirmez-vous que le client a bien reçu sa commande ?

Boutons

Annuler

Confirmer

Confirmer

Vert.

API
POST

/mock/livraison/validate.json

Body

{
  "livraisonId":"liv-001"
}

Réponse

{
  "success":true,
  "dateLivraison":"2026-06-08T14:55:00"
}

Effets backend simulés :

{
  "success": true,
  "stockUpdated": true,
  "notificationsSent": true
}
HISTORIQUE PERSONNEL
MOBILE

Liste cartes.

Hauteur :

180px

Contenu :

Commande

Client

Date

Statut

Badge couleur.

Tap :

ouvre Drawer.

FILTRES

Barre sticky.

Filtres :

Date

Statut

Recherche

Recherche :

height:44px;
border-radius:12px;
DESKTOP

Tableau.

Colonnes :

Commande

Client

Date création

Date lancement

Date livraison

Statut

Pagination :

20 lignes
EXPORTS

Menu :

Exporter

Options :

PDF

CSV

DOCX

APIs

/mock/livraison/export-pdf.json

/mock/livraison/export-csv.json

/mock/livraison/export-docx.json
STRUCTURE API MOCK
Liste livraisons
/mock/livraison/mes-livraisons.json

Réponse :

{
  "data":[
    {
      "id":"liv001",
      "commande":"CMD-001",
      "client":"Jean",
      "telephone":"690000000",
      "adresse":"Yaoundé",
      "montant":25000,
      "statut":"en_cours",
      "dateCreation":"2026-06-01"
    }
  ],
  "pagination":{
    "page":1,
    "limit":20,
    "total":150
  }
}
Historique
/mock/livraison/historique-personnel.json
OPTIMISATIONS REACT
TanStack Query
staleTime: 300000
Cache local
gcTime: 15 minutes
Virtualisation

Desktop uniquement.

@tanstack/react-virtual

à partir de :

100 lignes
Lazy Loading
React.lazy()

pour :

Drawer

Timeline

Exports

Charts
Skeleton Loading

Cartes livraison :

3 skeleton cards

Drawer :

Skeleton détails
Préchargement

Lors du hover desktop :

queryClient.prefetchQuery()

pour les détails de la livraison.

RESPONSIVE
Mobile
360px → 767px

Cards + Bottom Sheets.

Tablet
768px → 1279px

2 colonnes.

Desktop
1280px+

Tableaux + Drawer latéral + Actions inline.

Cette partie couvre l'intégralité du cycle opérationnel du livreur : consultation des livraisons, démarrage, validation, échec, retour et historique personnel, tout en respectant la philosophie UX/UI AGORA de contrôle, fluidité et rapidité d'exécution.


SPÉCIFICATION COMPLÈTE AGORA — MODULE LIVRAISON (PARTIE 3)
Statistiques Complètes
Responsive Mobile
Responsive Desktop
Architecture React
API Mock JSON
Optimisations Frontend
OBJECTIF UX DES STATISTIQUES

Cette section ne sert pas uniquement à afficher des chiffres.

Elle doit permettre au responsable logistique, au directeur et au responsable commercial de répondre immédiatement aux questions suivantes :

Combien de livraisons réalisons-nous ?
Quel est notre taux réel de réussite ?
Quels livreurs performent le mieux ?
Quels sont les problèmes les plus fréquents ?
Les performances s'améliorent-elles ou se dégradent-elles ?
Quels clients génèrent le plus de retours ?

Conformément à la philosophie AGORA, l'écran doit donner une sensation de contrôle et non de surcharge.

STRUCTURE GLOBALE
Statistiques
│
├── Vue Générale
├── Performance Livreurs
├── Activité Temporelle
├── Analyse des Échecs
├── Analyse des Retours
├── Analyse Géographique
├── Analyse Clients
├── Rapports
ARCHITECTURE REACT
modules/
└── livraison/
    ├── pages/
    │
    │   ├── StatisticsPage.tsx
    │
    ├── sections/
    │
    │   ├── OverviewSection.tsx
    │   ├── DriversSection.tsx
    │   ├── TemporalSection.tsx
    │   ├── FailuresSection.tsx
    │   ├── ReturnsSection.tsx
    │   ├── GeographicSection.tsx
    │   ├── ClientsSection.tsx
    │   ├── ReportsSection.tsx
    │
    ├── components/
    │
    │   ├── KPICard.tsx
    │   ├── StatCard.tsx
    │   ├── ChartCard.tsx
    │   ├── FilterBar.tsx
    │   ├── DateRangePicker.tsx
    │   ├── DriverRankingTable.tsx
    │   ├── ExportMenu.tsx
    │   ├── DeliveryHeatmap.tsx
    │
    ├── hooks/
    │
    │   ├── useStatistics.ts
    │   ├── useDriversStats.ts
    │   ├── useFailuresStats.ts
    │
    ├── services/
    │
    │   ├── statistics.api.ts
DESIGN SYSTEM STATISTIQUES
Cartes KPI

Dimensions desktop

height: 140px;

Radius

24px;

Shadow

0 8px 24px rgba(0,0,0,.05)

Padding

24px;

Contenu

Icône

Valeur

Variation

Titre

Exemple

95%

Taux de réussite

+4.5%
VUE GÉNÉRALE
OBJECTIF

Donner un résumé complet du système logistique.

KPI

Première ligne

Total livraisons

Livraisons réussies

Échecs

Retours

Taux de réussite

Livreurs actifs

Deuxième ligne

Livraisons aujourd'hui

Cette semaine

Ce mois

Temps moyen livraison
GRAPHIQUES
Evolution des livraisons

Type

Area Chart

Périodes

Jour
Semaine
Mois
Année
Répartition des statuts

Type

Donut Chart

Segments

Livrée
Retour
Échec
Tendance de réussite

Type

Line Chart
PERFORMANCE LIVREURS
TABLEAU CLASSEMENT

Colonnes

Position

Livreur

Livraisons

Succès

Échecs

Retours

Taux réussite

Temps moyen
KPI
Meilleur livreur

Livreur le plus rapide

Livreur le plus actif
Graphique

Type

Horizontal Bar Chart

Classement des performances.

ACTIVITÉ TEMPORELLE
Graphique journalier
Livraisons par jour
Graphique hebdomadaire
Livraisons par semaine
Graphique mensuel
Livraisons par mois
Heatmap

Type

Calendar Heatmap

Affiche

Jours les plus actifs
ANALYSE DES ÉCHECS
KPI
Total échecs

Taux échec

Clients absents

Adresse incorrecte

Téléphone injoignable
Graphique

Type

Pie Chart

Répartition

Motifs échec
Tableau

Colonnes

Motif

Nombre

Pourcentage
ANALYSE DES RETOURS

Même structure que les échecs.

KPI
Total retours

Refus client

Produit non conforme

Erreur commande
ANALYSE GÉOGRAPHIQUE
Carte

Version mock

Carte du Cameroun simplifiée.

Affichage

Yaoundé

Douala

Bafoussam

Garoua
KPI
Ville la plus active

Ville la plus difficile

Ville la plus rentable
Graphique
Livraisons par ville
ANALYSE CLIENTS
Tableau
Client

Commandes

Livraisons

Retours

Échecs
KPI
Client le plus livré

Client avec le plus de retours

Client le plus fidèle
RAPPORTS
Interface

Liste de cartes

Carte

Rapport mensuel

PDF
CSV
DOCX

Carte

Rapport trimestriel

PDF
CSV
DOCX

Carte

Rapport annuel

PDF
CSV
DOCX
FILTRES GLOBAUX

Toujours visibles.

Desktop

Date

Livreur

Ville

Statut

Client

Recherche

Mobile

Filtres dans :

Bottom Sheet
STRUCTURE API MOCK
Vue générale
/mock/livraison/statistics/overview.json
{
  "kpis": {
    "total": 2456,
    "success": 2310,
    "failures": 98,
    "returns": 48,
    "successRate": 94.1
  }
}
Livreurs
/mock/livraison/statistics/drivers.json
{
  "data": [
    {
      "id": "user1",
      "nom": "Paul",
      "livraisons": 542,
      "success": 512,
      "failures": 20,
      "returns": 10,
      "successRate": 94
    }
  ]
}
Échecs
/mock/livraison/statistics/failures.json
{
  "data": [
    {
      "motif": "Client absent",
      "count": 48
    }
  ]
}
Retours
/mock/livraison/statistics/returns.json
Activité
/mock/livraison/statistics/activity.json
Géographie
/mock/livraison/statistics/geography.json
Clients
/mock/livraison/statistics/clients.json
RAPPORTS
/mock/livraison/statistics/reports.json
STRATÉGIE FETCH

Chargement initial

Promise.all([
overview,
activity,
drivers
])

Chargement différé

failures
returns
clients
geography

Objectif

Afficher l'écran en moins de :

500 ms

sur données mock.

CACHE

TanStack Query

staleTime: 300000
gcTime: 1800000
LAZY LOADING

Chargement dynamique :

React.lazy()

pour :

Charts

Map

Reports

Tables volumineuses
SKELETONS

KPI

6 skeleton cards

Graphiques

chart placeholder

Tableaux

10 lignes simulées
RESPONSIVE MOBILE
BREAKPOINT
0 → 767px
KPI

Disposition

2 colonnes

Taille

height:120px;
Graphiques

Largeur

100%

Hauteur

220px
Tableaux

Transformés en cartes.

Exemple

Paul

542 livraisons

94% réussite
Filtres

Bouton flottant

Filtres

Clique

Bottom Sheet
RESPONSIVE TABLET

Breakpoint

768 → 1279px

KPI

3 colonnes

Graphiques

2 colonnes
RESPONSIVE DESKTOP

Breakpoint

1280+

Layout principal

display:grid;
grid-template-columns:
280px 1fr;

KPI

6 colonnes

Graphiques

2 colonnes

Tableaux

Mode complet.

OPTIMISATIONS FRONTEND
Pagination
20 éléments
Infinite Scroll

Pour :

Clients

Livreurs
Virtualisation
@tanstack/react-virtual

activation :

>100 lignes
Préchargement
queryClient.prefetchQuery()

au survol desktop.

Memoisation
useMemo()

pour :

Graphiques

Filtres

Classements
Séparation des bundles
React.lazy()

Bundles :

overview.bundle

drivers.bundle

failures.bundle

returns.bundle

reports.bundle
STRUCTURE JSON MOCK
public/
└── mock/
    └── livraison/
        ├── statistics/
        │
        ├── overview.json
        ├── drivers.json
        ├── activity.json
        ├── failures.json
        ├── returns.json
        ├── geography.json
        ├── clients.json
        ├── reports.json
RÉSULTAT UX FINAL

À la fin de cette partie, le responsable logistique doit pouvoir ouvrir les statistiques et comprendre en moins de 10 secondes :

l'état global des livraisons ;
les performances des livreurs ;
les principales causes d'échec ;
les principales causes de retour ;
les tendances d'activité ;
les zones géographiques performantes ;
les clients à risque ;

tout en conservant l'identité AGORA : contrôle, simplicité, fluidité et visibilité immédiate.