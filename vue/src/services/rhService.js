import { apiFetch } from "./api.js";
import { readCache, writeCache, clearCache } from "./rhCache.js";

// ─── DASHBOARD ──────────────────────────────────────────────────────────────────

export async function fetchRhDashboard() {
    const cacheKey = "rh_dashboard";
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch("rh/dashboard");
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le tableau de bord RH.");
    }
    return result;
}

// ─── EMPLOYÉS ───────────────────────────────────────────────────────────────────

export async function fetchRhEmployees() {
    const cacheKey = "rh_employees";
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch("rh/employes");
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger la liste des employés.");
    }
    return result;
}

export async function fetchRhEmployeeDetail(id) {
    const cacheKey = `rh_employee_${id}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`rh/employes/${id}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail de l'employé.");
    }
    return result;
}

export async function addRhEmployee(payload) {
    const result = await apiFetch("rh/employes", {
        method: "POST",
        body: { email: payload.email, role: payload.role },
    });
    clearCache("rh_employees");
    clearCache("rh_dashboard");
    return result;
}

export async function updateRhSalary(employeeId, salary) {
    const result = await apiFetch(`rh/employes/${employeeId}/salaire`, {
        method: "PATCH",
        body: { montant: salary },
    });
    clearCache(`rh_employee_${employeeId}`);
    clearCache("rh_employees");
    clearCache("rh_dashboard");
    return result;
}

// ─── STATISTIQUES ───────────────────────────────────────────────────────────────

export async function fetchRhStatistics(periode = "12m") {
    const cacheKey = `rh_statistics_${periode}`;
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await apiFetch(`rh/statistiques?periode=${periode}`);
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques RH.");
    }
    return result;
}

// ─── EXPORT ─────────────────────────────────────────────────────────────────────

export async function exportRh(format, context = "rh_employees") {
    const result = await apiFetch(`rh/export?format=${format}&context=${context}`);
    return result;
}
