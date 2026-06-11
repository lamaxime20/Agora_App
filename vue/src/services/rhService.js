import { readCache, writeCache, clearCache } from "./rhCache.js";

async function fetchMock(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    return res.json();
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────────

export async function fetchRhDashboard() {
    const cacheKey = "rh_dashboard";
    const stale = readCache(cacheKey);
    let result;
    try {
        const [dashboard, preview] = await Promise.all([
            fetchMock("/mock/rh/dashboard.json"),
            fetchMock("/mock/rh/employees-preview.json"),
        ]);
        result = { ...dashboard, preview: preview.employees };
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
        result = await fetchMock("/mock/rh/employees.json");
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
        result = await fetchMock("/mock/rh/employee-details.json");
        // En production: fetchMock(`/api/rh/employees/${id}`)
        result = { ...result, employee: { ...result.employee, id } };
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger le détail de l'employé.");
    }
    return result;
}

export async function addRhEmployee(payload) {
    await new Promise(r => setTimeout(r, 800));
    const result = await fetchMock("/mock/rh/add-employee.json");
    clearCache("rh_employees");
    clearCache("rh_dashboard");
    return result;
}

export async function updateRhSalary(employeeId, salary) {
    await new Promise(r => setTimeout(r, 600));
    const result = await fetchMock("/mock/rh/update-salary.json");
    clearCache(`rh_employee_${employeeId}`);
    clearCache("rh_employees");
    clearCache("rh_dashboard");
    return result;
}

// ─── STATISTIQUES ───────────────────────────────────────────────────────────────

export async function fetchRhStatistics() {
    const cacheKey = "rh_statistics";
    const stale = readCache(cacheKey);
    let result;
    try {
        result = await fetchMock("/mock/rh/statistics.json");
        writeCache(cacheKey, result);
    } catch {
        if (stale) return stale;
        throw new Error("Impossible de charger les statistiques RH.");
    }
    return result;
}

// ─── EXPORT ─────────────────────────────────────────────────────────────────────

export async function exportRh(format, filters = {}) {
    await new Promise(r => setTimeout(r, 1200));
    const result = await fetchMock("/mock/rh/export.json");
    return { ...result, downloadUrl: `/exports/rh-report.${format}` };
}
