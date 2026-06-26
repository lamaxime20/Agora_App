import { apiFetchBlob } from './api.js';

// ─── Utilitaire ───────────────────────────────────────────────────────────────

function ext(format) {
    return format === 'csv' || format === 'xlsx' ? 'csv' : format;
}

function qs(params = {}) {
    const p = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const s = new URLSearchParams(p).toString();
    return s ? `?${s}` : '';
}

// ─── Finances ─────────────────────────────────────────────────────────────────

export function exportPaiements(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/paiements/export${qs({ format, ...params })}`, `agora-paiements.${ext(format)}`);
}

export function exportRemboursements(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/remboursements/export${qs({ format, ...params })}`, `agora-remboursements.${ext(format)}`);
}

export function exportDepenses(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/depenses/export${qs({ format, ...params })}`, `agora-depenses.${ext(format)}`);
}

export function exportEntrees(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/entrees/export${qs({ format, ...params })}`, `agora-entrees.${ext(format)}`);
}

export function exportAbonnements(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/abonnements/export${qs({ format, ...params })}`, `agora-abonnements.${ext(format)}`);
}

export function exportReapprovisionnements(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/reapprovisionnements/export${qs({ format, ...params })}`, `agora-reapprovisionnements.${ext(format)}`);
}

export function exportSalaires(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/salaires/export${qs({ format, ...params })}`, `agora-salaires.${ext(format)}`);
}

export function exportJournal(format = 'pdf', params = {}) {
    return apiFetchBlob(`finances/journal/export${qs({ format, ...params })}`, `agora-journal.${ext(format)}`);
}

export function exportRapport(format = 'pdf', rapport = 'tableau_bord', periode = 'mensuel') {
    return apiFetchBlob(`finances/rapports${qs({ format, rapport, periode })}`, `agora-rapport-${rapport}-${periode}.${ext(format)}`);
}

// ─── Ventes ───────────────────────────────────────────────────────────────────

export function exportClients(format = 'pdf', params = {}) {
    return apiFetchBlob(`ventes/clients/export${qs({ format, ...params })}`, `agora-clients.${ext(format)}`);
}

export function exportCommandes(format = 'pdf', params = {}) {
    return apiFetchBlob(`ventes/commandes/export${qs({ format, ...params })}`, `agora-commandes.${ext(format)}`);
}

export function exportReservationsVentes(format = 'pdf', params = {}) {
    return apiFetchBlob(`ventes/reservations/export${qs({ format, ...params })}`, `agora-reservations-ventes.${ext(format)}`);
}

export function exportVentesStatistiques(format = 'pdf', params = {}) {
    return apiFetchBlob(`ventes/statistiques/export${qs({ format, ...params })}`, `agora-ventes-statistiques.${ext(format)}`);
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export function exportPertes(format = 'pdf', params = {}) {
    return apiFetchBlob(`stock/pertes/export${qs({ format, ...params })}`, `agora-pertes.${ext(format)}`);
}

export function exportHistoriqueTransactions(format = 'pdf', params = {}) {
    return apiFetchBlob(`stock/historique/export${qs({ format, ...params })}`, `agora-historique-transactions.${ext(format)}`);
}

export function exportReservationsStock(format = 'pdf', params = {}) {
    return apiFetchBlob(`stock/reservations/export${qs({ format, ...params })}`, `agora-reservations-stock.${ext(format)}`);
}

export function exportRavitaillements(format = 'pdf', params = {}) {
    return apiFetchBlob(`stock/ravitaillements/export${qs({ format, ...params })}`, `agora-ravitaillements.${ext(format)}`);
}
