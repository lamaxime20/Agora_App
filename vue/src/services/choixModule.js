const roles = [
    'directeur', 'manager_gestion_stock',
    'employe_gestion_stock', 'manager_vente',
    'employe_vente', 'manager_finances',
    'employe_finances', 'manager_rh',
    'employe_rh'
]

export const modules = [
    {
        name: 'Gestion des Stocks',
        icon: 'mdi-warehouse',
        route: '/application/stock',
        roles: ['directeur', 'manager_gestion_stock', 'employe_gestion_stock']
    },

    {
        name: 'Ventes',
        icon: 'mdi-cash-register',
        route: '/application/vente',
        roles: ['directeur', 'manager_vente', 'employe_vente']
    },

    {
        name: 'Finances',
        icon: 'mdi-chart-line',
        route: '/application/finances',
        roles: ['directeur', 'manager_finances', 'employe_finances']
    },

    {
        name: 'Ressources Humaines',
        icon: 'mdi-account-group',
        route: '/application/ressources-humaines',
        roles: ['directeur', 'manager_rh', 'employe_rh']
    }
]