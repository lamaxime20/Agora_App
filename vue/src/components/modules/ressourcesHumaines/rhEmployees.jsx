import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    Search, Plus, Eye, DollarSign, ChevronLeft, ChevronRight,
    Users, RefreshCw, X, Check, Loader2,
} from "lucide-react";
import { fetchRhEmployees, addRhEmployee, updateRhSalary, fetchRhEmployeeDetail } from "../../../services/rhService.js";
import { readCache } from "../../../services/rhCache.js";
import "../../../assets/styles/components/modules/ressourcesHumaines/rhEmployees.css";

// ─── Constantes ──────────────────────────────────────────────────────────────────

const ROLE_LABELS = {
    manager_rh:            "Manager RH",
    employe_rh:            "Employé RH",
    manager_finances:      "Manager Finances",
    employe_finances:      "Employé Finances",
    manager_vente:         "Manager Vente",
    employe_vente:         "Employé Vente",
    manager_gestion_stock: "Manager Stock",
    employe_gestion_stock: "Employé Stock",
    manager_livraison:     "Manager Livraison",
    employe_livraison:     "Employé Livraison",
};

const ROLES_SELECT = [
    "manager_rh", "employe_rh",
    "manager_finances", "employe_finances",
    "manager_vente", "employe_vente",
    "manager_gestion_stock", "employe_gestion_stock",
];

const FILTERS = [
    { key: "tous",     label: "Tous" },
    { key: "managers", label: "Managers" },
    { key: "employes", label: "Employés" },
    { key: "salaire",  label: "Salaire défini" },
    { key: "no_sal",   label: "Sans salaire" },
];

const PAGE_SIZE = 20;

const fmtSalaire = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

function initiales(emp) {
    return `${emp.prenom?.[0] ?? ""}${emp.nom?.[0] ?? ""}`.toUpperCase();
}

function isManager(role) { return role?.startsWith("manager_"); }

// ─── Toast ────────────────────────────────────────────────────────────────────────

function Toast({ message, type }) {
    return (
        <div className={`rh-toast rh-toast--${type}`} role="status" aria-live="polite">
            {type === "success" ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
            {message}
        </div>
    );
}

// ─── Modal Ajout Employé ──────────────────────────────────────────────────────────

function AddEmployeeModal({ onClose, onSuccess }) {
    const [email, setEmail]   = useState("");
    const [role, setRole]     = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!email.trim()) e.email = "L'email est obligatoire.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email invalide.";
        if (!role) e.role = "Le rôle est obligatoire.";
        return e;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const e = validate();
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setLoading(true);
        try {
            await addRhEmployee({ email: email.trim(), role });
            onSuccess("Employé ajouté avec succès.");
            onClose();
        } catch {
            setErrors({ global: "Impossible d'ajouter l'employé. Réessayez." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rhAddModal-overlay" role="dialog" aria-modal="true" aria-labelledby="rhAddModal-title">
            <div className="rhAddModal-panel">
                <div className="rhAddModal-header">
                    <h2 className="rhAddModal-header__title" id="rhAddModal-title">Ajouter un employé</h2>
                    <button className="rhAddModal-close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="rhAddModal-body">
                        {errors.global && (
                            <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", margin: 0 }}>
                                {errors.global}
                            </p>
                        )}
                        <div className="rhAddModal-field">
                            <label className="rhAddModal-label" htmlFor="rh-add-email">Email</label>
                            <input
                                id="rh-add-email"
                                className={`rhAddModal-input${errors.email ? " rhAddModal-input--error" : ""}`}
                                type="email"
                                placeholder="employe@entreprise.cm"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                                aria-describedby={errors.email ? "rh-add-email-err" : undefined}
                            />
                            {errors.email && <span id="rh-add-email-err" className="rhAddModal-error-msg">{errors.email}</span>}
                        </div>
                        <div className="rhAddModal-field">
                            <label className="rhAddModal-label" htmlFor="rh-add-role">Rôle</label>
                            <select
                                id="rh-add-role"
                                className={`rhAddModal-select${errors.role ? " rhAddModal-input--error" : ""}`}
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                aria-describedby={errors.role ? "rh-add-role-err" : undefined}
                            >
                                <option value="">-- Sélectionner un rôle --</option>
                                {ROLES_SELECT.map(r => (
                                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                ))}
                            </select>
                            {errors.role && <span id="rh-add-role-err" className="rhAddModal-error-msg">{errors.role}</span>}
                        </div>
                    </div>
                    <div className="rhAddModal-footer">
                        <button
                            className="rhAddModal-submit"
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                        >
                            {loading
                                ? <><Loader2 size={16} className="rh-spin" aria-hidden="true" /> Ajout en cours…</>
                                : <><Plus size={16} aria-hidden="true" /> Ajouter</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Bottom Sheet Salaire ─────────────────────────────────────────────────────────

function SalarySheet({ employee, onClose, onSuccess }) {
    const [value, setValue] = useState(employee?.salaire != null ? String(employee.salaire) : "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        const num = Number(value);
        if (isNaN(num) || num < 0) { setError("Montant invalide."); return; }
        setLoading(true);
        setError("");
        const prev = employee.salaire;
        onSuccess(num); // Optimistic update
        try {
            await updateRhSalary(employee.id, num);
        } catch {
            onSuccess(prev); // Rollback
            setError("Impossible de mettre à jour le salaire.");
        } finally {
            setLoading(false);
            if (!error) onClose();
        }
    };

    return (
        <>
            <div className="rhSalary-overlay" onClick={onClose} aria-hidden="true" />
            <div className="rhSalary-sheet" role="dialog" aria-modal="true" aria-labelledby="rhSalary-title">
                <div className="rhSalary-header">
                    <h2 className="rhSalary-header__title" id="rhSalary-title">Définir le salaire</h2>
                    <button className="rhSalary-close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="rhSalary-body">
                        <div className="rhSalary-employee">
                            <div className="rhSalary-employee__avatar">{initiales(employee)}</div>
                            <div>
                                <p className="rhSalary-employee__name">{employee.prenom} {employee.nom}</p>
                                <p className="rhSalary-employee__current">
                                    Salaire actuel : {employee.salaire != null ? fmtSalaire(employee.salaire) : "Non défini"}
                                </p>
                            </div>
                        </div>
                        <div className="rhSalary-field">
                            <label className="rhSalary-label" htmlFor="rh-salary-input">Nouveau montant</label>
                            <div className="rhSalary-input-wrap">
                                <span className="rhSalary-prefix">FCFA</span>
                                <input
                                    ref={inputRef}
                                    id="rh-salary-input"
                                    className="rhSalary-input"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    placeholder="250000"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                />
                            </div>
                            {error && <span style={{ color: "var(--color-error)", fontSize: "var(--text-xs)" }}>{error}</span>}
                        </div>
                    </div>
                    <div className="rhSalary-footer">
                        <button className="rhSalary-submit" type="submit" disabled={loading} aria-busy={loading}>
                            {loading
                                ? <><Loader2 size={16} className="rh-spin" aria-hidden="true" /> Enregistrement…</>
                                : <><Check size={16} aria-hidden="true" /> Enregistrer</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Pane Détail Employé ──────────────────────────────────────────────────────────

function EmployeePane({ employee: empBase, onClose, onSalaryUpdate }) {
    const [detail, setDetail]       = useState(null);
    const [loading, setLoading]     = useState(true);
    const [showSalary, setShowSalary] = useState(false);
    const [localEmp, setLocalEmp]   = useState(empBase);

    useEffect(() => {
        const stale = readCache(`rh_employee_${empBase.id}`);
        if (stale) { setDetail(stale); setLoading(false); }

        fetchRhEmployeeDetail(empBase.id)
            .then(d => { setDetail(d); setLoading(false); })
            .catch(() => { if (!stale) setLoading(false); });
    }, [empBase.id]);

    const fmtDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const handleSalarySuccess = (newSalaire) => {
        setLocalEmp(prev => ({ ...prev, salaire: newSalaire }));
        onSalaryUpdate(empBase.id, newSalaire);
    };

    const allEvents = [
        ...(detail?.salaryHistory ?? []).map(s => ({
            type: "salary",
            date: s.date,
            title: s.ancienMontant != null
                ? `Salaire modifié : ${fmtSalaire(s.ancienMontant)} → ${fmtSalaire(s.nouveauMontant)}`
                : `Salaire initial : ${fmtSalaire(s.nouveauMontant)}`,
            desc: s.motif,
        })),
        ...(detail?.roleHistory ?? []).map(r => ({
            type: r.ancienRole ? "role" : "add",
            date: r.date,
            title: r.ancienRole
                ? `Rôle changé : ${ROLE_LABELS[r.ancienRole] ?? r.ancienRole} → ${ROLE_LABELS[r.nouveauRole] ?? r.nouveauRole}`
                : `Ajouté dans l'entreprise — ${ROLE_LABELS[r.nouveauRole] ?? r.nouveauRole}`,
            desc: r.motif,
        })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <>
            <div className="rhPane-overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="rhPane-root"
                role="complementary"
                aria-label={`Détail employé : ${localEmp.prenom} ${localEmp.nom}`}
            >
                <div className="rhPane-header">
                    <h2 className="rhPane-header__title" id="rhPane-title">Détail employé</h2>
                    <button className="rhPane-close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="rhPane-body">
                    {/* Profil */}
                    <div className="rhPane-profile">
                        <div className="rhPane-profile__avatar" aria-hidden="true">
                            {initiales(localEmp)}
                        </div>
                        <h3 className="rhPane-profile__name">{localEmp.prenom} {localEmp.nom}</h3>
                        <p className="rhPane-profile__email">{localEmp.email}</p>
                        <span className={`rh-badge ${isManager(localEmp.role) ? "rh-badge--manager" : "rh-badge--employe"}`}>
                            {ROLE_LABELS[localEmp.role] ?? localEmp.role}
                        </span>
                    </div>

                    {/* Informations */}
                    <div className="rhPane-infoCard">
                        <p className="rhPane-infoCard__title">Informations</p>
                        <div className="rhPane-infoCard__grid">
                            <div className="rhPane-infoCard__row">
                                <span className="rhPane-infoCard__key">Date d'ajout</span>
                                <span className="rhPane-infoCard__val">{fmtDate(localEmp.dateAjout)}</span>
                            </div>
                            <div className="rhPane-infoCard__row">
                                <span className="rhPane-infoCard__key">Statut</span>
                                <span className={`rh-badge rh-badge--${localEmp.statut === "actif" ? "actif" : "inactif"}`}>
                                    {localEmp.statut === "actif" ? "Actif" : "Inactif"}
                                </span>
                            </div>
                            <div className="rhPane-infoCard__row">
                                <span className="rhPane-infoCard__key">Salaire mensuel</span>
                                <span className={`rhPane-infoCard__val ${localEmp.salaire != null ? "rhPane-infoCard__val--salary" : "rhPane-infoCard__val--none"}`}>
                                    {localEmp.salaire != null ? fmtSalaire(localEmp.salaire) : "Non défini"}
                                </span>
                            </div>
                            <div className="rhPane-infoCard__row">
                                <span className="rhPane-infoCard__key">Entreprise</span>
                                <span className="rhPane-infoCard__val">
                                    {detail?.employee?.entreprise ?? "AGORA SARL"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Historique */}
                    <div className="rhPane-infoCard">
                        <p className="rhPane-infoCard__title">Historique</p>
                        {loading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{ display: "flex", gap: "var(--space-3)" }}>
                                        <div className="rh-skeleton" style={{ width: 12, height: 12, borderRadius: "50%", marginTop: 3, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="rh-skeleton" style={{ width: "70%", height: 12, marginBottom: 4 }} />
                                            <div className="rh-skeleton" style={{ width: "50%", height: 10 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : allEvents.length === 0 ? (
                            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                                Aucun historique disponible.
                            </p>
                        ) : (
                            <div className="rhPane-timeline" role="list" aria-label="Historique">
                                {allEvents.map((ev, i) => (
                                    <div key={i} className="rhPane-timeline__event" role="listitem">
                                        <div className="rhPane-timeline__connector" aria-hidden="true">
                                            <div className={`rhPane-timeline__dot rhPane-timeline__dot--${ev.type}`} />
                                            <div className="rhPane-timeline__line" />
                                        </div>
                                        <div className="rhPane-timeline__content">
                                            <p className="rhPane-timeline__title">{ev.title}</p>
                                            {ev.desc && <p className="rhPane-timeline__desc">{ev.desc}</p>}
                                            <time className="rhPane-timeline__date">{fmtDate(ev.date)}</time>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rhPane-footer">
                    <button
                        className="rhPane-salary-btn"
                        onClick={() => setShowSalary(true)}
                        type="button"
                    >
                        <DollarSign size={16} aria-hidden="true" />
                        Définir le salaire
                    </button>
                </div>
            </aside>

            {showSalary && (
                <SalarySheet
                    employee={localEmp}
                    onClose={() => setShowSalary(false)}
                    onSuccess={handleSalarySuccess}
                />
            )}
        </>
    );
}

// ─── Tableau skeleton ─────────────────────────────────────────────────────────────

function TableSkeleton() {
    return Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="rhEmp-table__row--skeleton">
            <td><div className="rh-skeleton rhEmp-skeleton--xs" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--lg" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--md" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--sm" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--sm" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--md" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--sm" /></td>
            <td><div className="rh-skeleton rhEmp-skeleton--sm" /></td>
        </tr>
    ));
}

// ─── Liste Employés ───────────────────────────────────────────────────────────────

function RhEmployees({ showAdd = false, onCloseAdd }) {
    const [employees, setEmployees] = useState([]);
    const [total, setTotal]         = useState(0);
    const [loading, setLoading]     = useState(true);
    const [erreur, setErreur]       = useState("");
    const [search, setSearch]       = useState("");
    const [filtre, setFiltre]       = useState("tous");
    const [page, setPage]           = useState(1);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [showAddModal, setShowAddModal] = useState(showAdd);
    const [toast, setToast]         = useState(null);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        setErreur("");

        const stale = readCache("rh_employees");
        if (stale) {
            setEmployees(stale.employees ?? []);
            setTotal(stale.total ?? 0);
            setLoading(false);
        }

        try {
            const res = await fetchRhEmployees();
            setEmployees(res.employees ?? []);
            setTotal(res.total ?? 0);
        } catch (err) {
            if (!stale) setErreur(err.message ?? "Erreur de chargement.");
        } finally {
            if (!stale) setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Sync showAdd prop
    useEffect(() => { setShowAddModal(showAdd); }, [showAdd]);

    const handleSearchChange = (e) => {
        const v = e.target.value;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearch(v), 300);
        searchRef.current.value = v;
    };

    const filtered = useMemo(() => {
        let list = employees;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(e =>
                `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q) ||
                (ROLE_LABELS[e.role] ?? e.role).toLowerCase().includes(q)
            );
        }
        switch (filtre) {
            case "managers": list = list.filter(e => isManager(e.role)); break;
            case "employes": list = list.filter(e => !isManager(e.role)); break;
            case "salaire":  list = list.filter(e => e.salaire != null); break;
            case "no_sal":   list = list.filter(e => e.salaire == null); break;
        }
        return list;
    }, [employees, search, filtre]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSalaryUpdate = (id, newSalaire) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, salaire: newSalaire } : e));
        showToast("Salaire mis à jour.");
    };

    if (erreur && employees.length === 0) {
        return (
            <div className="rhEmp-root">
                <div className="rhDash-error">
                    <p className="rhDash-error__msg">{erreur}</p>
                    <button className="rhDash-error__btn" onClick={load} type="button">
                        <RefreshCw size={14} aria-hidden="true" /> Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section className="rhEmp-root" aria-label="Liste des employés">

            {/* Header */}
            <div className="rhEmp-header">
                <div>
                    <h1 className="rhEmp-header__title">Employés</h1>
                    <span className="rhEmp-header__count">{loading && !employees.length ? "…" : `${filtered.length} employé${filtered.length !== 1 ? "s" : ""}`}</span>
                </div>
                <button
                    className="rhEmp-header__add-btn"
                    onClick={() => setShowAddModal(true)}
                    type="button"
                    aria-label="Ajouter un employé"
                >
                    <Plus size={16} aria-hidden="true" />
                    Ajouter
                </button>
            </div>

            {/* Recherche */}
            <div className="rhEmp-search-wrap">
                <Search size={18} className="rhEmp-search-icon" aria-hidden="true" />
                <input
                    ref={searchRef}
                    className="rhEmp-search"
                    type="search"
                    placeholder="Rechercher un employé..."
                    defaultValue=""
                    onChange={handleSearchChange}
                    aria-label="Rechercher un employé"
                />
            </div>

            {/* Filtres */}
            <div className="rhEmp-filters" role="group" aria-label="Filtres">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`rhEmp-filter-chip${filtre === f.key ? " rhEmp-filter-chip--active" : ""}`}
                        onClick={() => { setFiltre(f.key); setPage(1); }}
                        type="button"
                        aria-pressed={filtre === f.key}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Tableau desktop */}
            <div className="rhEmp-tableWrap">
                <table className="rhEmp-table" aria-label="Liste des employés">
                    <thead className="rhEmp-table__head">
                        <tr>
                            <th scope="col">Avatar</th>
                            <th scope="col">Nom</th>
                            <th scope="col">Email</th>
                            <th scope="col">Rôle</th>
                            <th scope="col">Salaire</th>
                            <th scope="col">Date ajout</th>
                            <th scope="col">Statut</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && employees.length === 0 ? (
                            <TableSkeleton />
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="rhEmp-empty">
                                        <div className="rhEmp-empty__icon"><Users size={32} aria-hidden="true" /></div>
                                        <p className="rhEmp-empty__title">Aucun employé trouvé</p>
                                        <p className="rhEmp-empty__sub">Essayez un autre filtre ou terme de recherche.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map(emp => (
                                <tr key={emp.id} onClick={() => setSelectedEmp(emp)}>
                                    <td>
                                        <div className="rhEmp-table__avatar" aria-hidden="true">{initiales(emp)}</div>
                                    </td>
                                    <td>
                                        <p className="rhEmp-table__name" style={{ margin: 0 }}>{emp.prenom} {emp.nom}</p>
                                        <p className="rhEmp-table__email" style={{ margin: 0 }}>{emp.id}</p>
                                    </td>
                                    <td style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{emp.email}</td>
                                    <td>
                                        <span className={`rh-badge ${isManager(emp.role) ? "rh-badge--manager" : "rh-badge--employe"}`}>
                                            {ROLE_LABELS[emp.role] ?? emp.role}
                                        </span>
                                    </td>
                                    <td className={emp.salaire != null ? "rhEmp-table__salary" : "rhEmp-table__salary--none"}>
                                        {emp.salaire != null ? fmtSalaire(emp.salaire) : "Non défini"}
                                    </td>
                                    <td style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                                        {fmtDate(emp.dateAjout)}
                                    </td>
                                    <td>
                                        <span className={`rh-badge rh-badge--${emp.statut === "actif" ? "actif" : "inactif"}`}>
                                            {emp.statut === "actif" ? "Actif" : "Inactif"}
                                        </span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className="rhEmp-table__actions">
                                            <button
                                                className="rhEmp-table__action-btn rhEmp-table__action-btn--view"
                                                onClick={() => setSelectedEmp(emp)}
                                                aria-label={`Voir ${emp.prenom} ${emp.nom}`}
                                                type="button"
                                            >
                                                <Eye size={14} aria-hidden="true" />
                                            </button>
                                            <button
                                                className="rhEmp-table__action-btn rhEmp-table__action-btn--salary"
                                                onClick={() => setSelectedEmp(emp)}
                                                aria-label={`Définir salaire de ${emp.prenom} ${emp.nom}`}
                                                type="button"
                                            >
                                                <DollarSign size={14} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="rhEmp-cards" aria-label="Employés">
                {loading && employees.length === 0 ? (
                    [0,1,2,3,4].map(i => (
                        <div key={i} className="rhEmp-card">
                            <div className="rh-skeleton rhEmp-skeleton--xs" />
                            <div style={{ flex: 1 }}>
                                <div className="rh-skeleton rhEmp-skeleton--md" style={{ marginBottom: 6 }} />
                                <div className="rh-skeleton rhEmp-skeleton--sm" />
                            </div>
                        </div>
                    ))
                ) : paginated.length === 0 ? (
                    <div className="rhEmp-empty">
                        <div className="rhEmp-empty__icon"><Users size={32} aria-hidden="true" /></div>
                        <p className="rhEmp-empty__title">Aucun employé trouvé</p>
                        <p className="rhEmp-empty__sub">Essayez un autre filtre.</p>
                    </div>
                ) : (
                    paginated.map((emp, i) => (
                        <article
                            key={emp.id}
                            className="rhEmp-card"
                            onClick={() => setSelectedEmp(emp)}
                            style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                            aria-label={`${emp.prenom} ${emp.nom}`}
                        >
                            <div className="rhEmp-card__avatar" aria-hidden="true">{initiales(emp)}</div>
                            <div className="rhEmp-card__info">
                                <p className="rhEmp-card__name">{emp.prenom} {emp.nom}</p>
                                <p className="rhEmp-card__email">{emp.email}</p>
                                <div className="rhEmp-card__meta">
                                    <span className={`rh-badge ${isManager(emp.role) ? "rh-badge--manager" : "rh-badge--employe"}`}>
                                        {ROLE_LABELS[emp.role] ?? emp.role}
                                    </span>
                                    <span className={`rhEmp-card__salary${emp.salaire == null ? " rhEmp-card__salary--none" : ""}`}>
                                        {emp.salaire != null ? fmtSalaire(emp.salaire) : "Sans salaire"}
                                    </span>
                                </div>
                            </div>
                            <div className="rhEmp-card__actions" onClick={e => e.stopPropagation()}>
                                <button
                                    className="rhEmp-card__action-btn rhEmp-card__action-btn--view"
                                    onClick={() => setSelectedEmp(emp)}
                                    aria-label={`Voir ${emp.prenom} ${emp.nom}`}
                                    type="button"
                                >
                                    <Eye size={14} aria-hidden="true" />
                                </button>
                                <button
                                    className="rhEmp-card__action-btn rhEmp-card__action-btn--salary"
                                    onClick={() => { setSelectedEmp(emp); }}
                                    aria-label={`Salaire de ${emp.prenom} ${emp.nom}`}
                                    type="button"
                                >
                                    <DollarSign size={14} aria-hidden="true" />
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="rhEmp-pagination" aria-label="Pagination">
                    <button
                        className="rhEmp-pagination__btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Page précédente"
                        type="button"
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    <span className="rhEmp-pagination__info">Page {page} / {totalPages}</span>
                    <button
                        className="rhEmp-pagination__btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Page suivante"
                        type="button"
                    >
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* Modales */}
            {showAddModal && (
                <AddEmployeeModal
                    onClose={() => { setShowAddModal(false); if (onCloseAdd) onCloseAdd(); }}
                    onSuccess={(msg) => { showToast(msg); load(); }}
                />
            )}

            {selectedEmp && (
                <EmployeePane
                    employee={selectedEmp}
                    onClose={() => setSelectedEmp(null)}
                    onSalaryUpdate={handleSalaryUpdate}
                />
            )}

            {toast && <Toast message={toast.msg} type={toast.type} />}
        </section>
    );
}

export { AddEmployeeModal };
export default RhEmployees;
