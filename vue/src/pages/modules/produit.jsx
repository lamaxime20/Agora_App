import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Package, AlertTriangle, Pencil, Trash2, RefreshCcw,
    TrendingDown, X, Loader
} from "lucide-react";
import { fetchProduitDetail } from "../../services/gestionStock.js";
import ModalAjoutProduit from "../../components/modules/gestionStocks/produits/modalAjoutProduit.jsx";
import "../../assets/styles/pages/produit.css";

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function BadgeStatut({ statut, type }) {
    if (type === "service") return <span className="produitPage-badge produitPage-badge--service">Service</span>;
    const map = {
        disponible: { label: "En stock",     mod: "disponible" },
        faible:     { label: "Stock faible", mod: "faible"     },
        rupture:    { label: "Rupture",      mod: "rupture"    },
    };
    const info = map[statut] ?? { label: statut, mod: "disponible" };
    return <span className={`produitPage-badge produitPage-badge--${info.mod}`}>{info.label}</span>;
}

/* ─── Mini graphique SVG ────────────────────────────────────────────────────── */

function LineChart({ points, label }) {
    if (!points?.length) return null;
    const W = 300, H = 80, PAD = 8;
    const valeurs = points.map(p => p.ventes);
    const max     = Math.max(...valeurs, 1);
    const xs = points.map((_, i) => PAD + (i / (points.length - 1)) * (W - PAD * 2));
    const ys = valeurs.map(v => H - PAD - ((v / max) * (H - PAD * 2)));
    const pathD   = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
    const areaD   = `${pathD} L ${xs[xs.length - 1]} ${H - PAD} L ${xs[0]} ${H - PAD} Z`;

    return (
        <div className="produitPage-chart">
            <span className="produitPage-chart__title">{label}</span>
            <svg
                className="produitPage-chart__svg"
                viewBox={`0 0 ${W} ${H}`}
                aria-label={`Graphique : ${label}`}
                role="img"
            >
                <path className="produitPage-chart__area" d={areaD} />
                <path className="produitPage-chart__line" d={pathD} />
                {xs.map((x, i) => (
                    <circle
                        key={i}
                        className="produitPage-chart__dot"
                        cx={x}
                        cy={ys[i]}
                        r="3"
                    />
                ))}
            </svg>
            <div className="produitPage-chart__labels">
                {points.map((p, i) => (
                    <span key={i} className="produitPage-chart__label">{p.label}</span>
                ))}
            </div>
        </div>
    );
}

/* ─── Modale ravitaillement ─────────────────────────────────────────────────── */

function ModalRavitailler({ onClose }) {
    const [quantite, setQuantite]   = useState("");
    const [montant, setMontant]     = useState("");
    const [password, setPassword]   = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onClose();
    };

    return (
        <div className="modalDanger-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modalDanger-panel" role="dialog" aria-modal="true" aria-labelledby="modalRav-title">
                <h2 id="modalRav-title" className="modalDanger-title">Ravitailler le produit</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <div className="modalDanger-field">
                        <label className="modalDanger-label" htmlFor="rav-qty">Quantité à ajouter</label>
                        <input
                            id="rav-qty"
                            type="number"
                            min="1"
                            className="app-input"
                            placeholder="Ex : 50"
                            value={quantite}
                            onChange={e => setQuantite(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modalDanger-field">
                        <label className="modalDanger-label" htmlFor="rav-montant">Montant total (FCFA)</label>
                        <input
                            id="rav-montant"
                            type="number"
                            min="0"
                            className="app-input"
                            placeholder="Ex : 25 000"
                            value={montant}
                            onChange={e => setMontant(e.target.value)}
                        />
                    </div>
                    <div className="modalDanger-field">
                        <label className="modalDanger-label" htmlFor="rav-pwd">Mot de passe de confirmation</label>
                        <input
                            id="rav-pwd"
                            type="password"
                            className="app-input"
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modalDanger-footer">
                        <button type="button" className="app-button app-button--ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="app-button app-button--primary" disabled={!quantite || !password}>
                            Confirmer le ravitaillement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Modale signaler perte ─────────────────────────────────────────────────── */

function ModalPerte({ onClose }) {
    const [quantite, setQuantite] = useState("");
    const [raison, setRaison]     = useState("vol");

    const handleSubmit = (e) => {
        e.preventDefault();
        onClose();
    };

    return (
        <div className="modalDanger-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modalDanger-panel" role="dialog" aria-modal="true" aria-labelledby="modalPerte-title">
                <div className="modalDanger-icon">
                    <TrendingDown size={28} aria-hidden="true" />
                </div>
                <h2 id="modalPerte-title" className="modalDanger-title">Signaler une perte</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <div className="modalDanger-field">
                        <label className="modalDanger-label" htmlFor="perte-qty">Quantité perdue</label>
                        <input
                            id="perte-qty"
                            type="number"
                            min="1"
                            className="app-input"
                            placeholder="Ex : 5"
                            value={quantite}
                            onChange={e => setQuantite(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modalDanger-field">
                        <label className="modalDanger-label" htmlFor="perte-raison">Raison</label>
                        <select
                            id="perte-raison"
                            className="app-input"
                            value={raison}
                            onChange={e => setRaison(e.target.value)}
                            style={{ height: 44, cursor: "pointer" }}
                        >
                            <option value="vol">Vol</option>
                            <option value="casse">Casse</option>
                            <option value="peremption">Péremption</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>
                    <div className="modalDanger-footer">
                        <button type="button" className="app-button app-button--ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="app-button app-button--danger" disabled={!quantite}>
                            Confirmer la perte
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Modale suppression ─────────────────────────────────────────────────────── */

function ModalSupprimer({ produit, onClose }) {
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onClose();
    };

    return (
        <div className="modalDanger-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modalDanger-panel" role="dialog" aria-modal="true" aria-labelledby="modalDel-title">
                <div className="modalDanger-icon">
                    <Trash2 size={28} aria-hidden="true" />
                </div>
                <h2 id="modalDel-title" className="modalDanger-title">Supprimer le produit</h2>
                <p className="modalDanger-text">
                    Cette action archive <strong>{produit.nom}</strong>. Il ne sera plus visible
                    dans la liste mais ses données seront conservées.
                </p>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    <div className="modalDanger-field">
                        <label className="modalDanger-label" htmlFor="del-pwd">Mot de passe</label>
                        <input
                            id="del-pwd"
                            type="password"
                            className="app-input"
                            placeholder="Confirmez avec votre mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modalDanger-footer">
                        <button type="button" className="app-button app-button--ghost" onClick={onClose}>Annuler</button>
                        <button type="submit" className="app-button app-button--danger" disabled={!password}>
                            Confirmer la suppression
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */

function ProduitSkeleton() {
    return (
        <div className="produitPage-root">
            <div className="produitPage-skeleton-loader">
                <Loader size={32} className="produitPage-skeleton-loader__icon" />
                <p>Chargement du produit...</p>
            </div>
        </div>
    );
}

/* ─── Page Produit ───────────────────────────────────────────────────────────── */

function ProduitPage() {
    const { id } = useParams();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(null);

    useEffect(() => {
        const fetchProduct = () => {
            setLoading(true);
            setError(null);
            fetchProduitDetail(id)
                .then(data => {
                    setDetail(data);
                })
                .catch(err => {
                    console.error(err);
                    setError("Impossible de charger les données du produit.");
                })
                .finally(() => {
                    setLoading(false);
                });
        };
        fetchProduct();
    }, [id]);

    if (loading) return <ProduitSkeleton />;
    
    if (error || !detail?.produit) {
        return (
            <div className="produitPage-root">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-16)", textAlign: "center" }}>
                    <AlertTriangle size={48} color={error ? "var(--color-error)" : "var(--color-warning)"} aria-hidden="true" />
                    <h2>{error ? "Erreur de chargement" : "Produit introuvable"}</h2>
                    <p style={{ color: "var(--color-text-muted)" }}>{error || "Ce produit n'existe pas ou a été supprimé."}</p>
                    <Link to="/application/stock/produits" className="app-button app-button--primary">
                        Retour aux produits
                    </Link>
                </div>
            </div>
        );
    }

    const { produit } = detail;
    const estPhysique = produit.type_produit === "physique";
    const stats = detail?.statistiques;
    const stock = detail?.stock;

    return (
        <div className="produitPage-root">
            {/* Header */}
            <div className="produitPage-header">
                <Link
                    to="/application/stock/produits"
                    className="produitPage-back"
                    aria-label="Retour à la liste des produits"
                >
                    <ArrowLeft size={18} aria-hidden="true" />
                </Link>
                <h1 className="produitPage-header__title">{produit.nom}</h1>
            </div>

            {/* Hero */}
            <div className="produitPage-hero">
                <div className="produitPage-hero__image">
                    {produit.image_url ? (
                        <img src={produit.image_url} alt={produit.nom} />
                    ) : (
                        <Package size={64} className="produitPage-hero__image-placeholder" aria-hidden="true" />
                    )}
                </div>
                <div className="produitPage-hero__info">
                    <h2 className="produitPage-hero__name">{produit.nom}</h2>
                    <div className="produitPage-hero__meta">
                        <span className="produitPage-hero__meta-item">{produit.categorie.categorie}</span>
                        <span className="produitPage-hero__meta-sep" aria-hidden="true">·</span>
                        <span className="produitPage-hero__meta-item">Réf. {produit.reference ?? produit.id}</span>
                        <span className="produitPage-hero__meta-sep" aria-hidden="true">·</span>
                        <BadgeStatut statut={produit.statut_disponibilite} type={produit.type_produit} />
                    </div>
                    <p className="produitPage-price">
                        {(produit.prix_unitaire ?? 0).toLocaleString("fr-FR")} FCFA
                        {produit.unite_mesure && <span style={{ fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--color-text-muted)" }}>  / {produit.unite_mesure}</span>}
                    </p>
                    {produit.description && (
                        <p className="produitPage-description">{produit.description}</p>
                    )}
                </div>
            </div>

            {/* Stock (physique uniquement) */}
            {estPhysique && (
                <section aria-label="Informations de stock">
                    <div className="produitPage-stock">
                        <div className="produitPage-stock__card produitPage-stock__card--actuel">
                            <span className="produitPage-stock__label">Stock actuel</span>
                            <span className="produitPage-stock__value">{produit?.stock_actuel ?? 0}</span>
                        </div>
                        <div className="produitPage-stock__card produitPage-stock__card--reserve">
                            <span className="produitPage-stock__label">Réservé</span>
                            <span className="produitPage-stock__value">{produit?.stock_reserve ?? 0}</span>
                        </div>
                        <div className="produitPage-stock__card produitPage-stock__card--dispo">
                            <span className="produitPage-stock__label">Disponible</span>
                            <span className="produitPage-stock__value">{produit?.stock_disponible ?? 0}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Actions */}
            <div className="produitPage-actions">
                <button
                    className="produitPage-action-btn produitPage-action-btn--ravitailler"
                    onClick={() => setModal("ravitailler")}
                    type="button"
                    style={{ display: estPhysique ? "flex" : "none" }}
                >
                    <RefreshCcw size={16} aria-hidden="true" />
                    Ravitailler
                </button>
                <button
                    className="produitPage-action-btn produitPage-action-btn--perte"
                    onClick={() => setModal("perte")}
                    type="button"
                    style={{ display: estPhysique ? "flex" : "none" }}
                >
                    <TrendingDown size={16} aria-hidden="true" />
                    Perte
                </button>
                <button
                    className="produitPage-action-btn produitPage-action-btn--modifier"
                    onClick={() => setModal("modifier")}
                    type="button"
                >
                    <Pencil size={16} aria-hidden="true" />
                    Modifier
                </button>
                <button
                    className="produitPage-action-btn produitPage-action-btn--supprimer"
                    onClick={() => setModal("supprimer")}
                    type="button"
                >
                    <Trash2 size={16} aria-hidden="true" />
                    Supprimer
                </button>
            </div>

            {/* Statistiques */}
            {stats && (
                <section className="produitPage-stats-section" aria-label="Statistiques du produit">
                    <h2 className="produitPage-stats-title">Statistiques</h2>
                    <div className="produitPage-stats-grid">
                        <div className="produitPage-stat-card">
                            <span className="produitPage-stat-card__label">Quantité vendue</span>
                            <span className="produitPage-stat-card__value">{stats.nb_ventes ?? 0}</span>
                        </div>
                        <div className="produitPage-stat-card">
                            <span className="produitPage-stat-card__label">Chiffre d'affaires</span>
                            <span className="produitPage-stat-card__value">{(stats.ca_total ?? 0).toLocaleString("fr-FR")} FCFA</span>
                        </div>
                        <div className="produitPage-stat-card">
                            <span className="produitPage-stat-card__label">Commandes</span>
                            <span className="produitPage-stat-card__value">{stats.nb_commandes ?? stats.nb_ventes ?? 0}</span>
                        </div>
                        {estPhysique && (
                            <>
                                <div className="produitPage-stat-card">
                                    <span className="produitPage-stat-card__label">Réapprovisionnements</span>
                                    <span className="produitPage-stat-card__value">{stats.nb_reapprovisionnements}</span>
                                </div>
                                <div className="produitPage-stat-card">
                                    <span className="produitPage-stat-card__label">Qté réapprovisionnée</span>
                                    <span className="produitPage-stat-card__value">{stats.quantite_reapprovisionnee ?? 0}</span>
                                </div>
                                <div className="produitPage-stat-card">
                                    <span className="produitPage-stat-card__label">Coût réappro.</span>
                                    <span className="produitPage-stat-card__value">{(stats.montant_total_reappro ?? 0).toLocaleString("fr-FR")} FCFA</span>
                                </div>
                                <div className="produitPage-stat-card">
                                    <span className="produitPage-stat-card__label">Quantité perdue</span>
                                    <span className="produitPage-stat-card__value">{stats.quantite_perdue_totale ?? 0}</span>
                                </div>
                                <div className="produitPage-stat-card">
                                    <span className="produitPage-stat-card__label">Valeur pertes</span>
                                    <span className="produitPage-stat-card__value">{(stats.valeur_perdue ?? 0).toLocaleString("fr-FR")} FCFA</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Graphiques */}
                    {detail?.evolution_stock_7j && (
                        <div className="produitPage-charts">
                            <LineChart points={detail.evolution_7j}  label="Ventes — 7 derniers jours" />
                            <LineChart points={detail.evolution_30j} label="Ventes — 30 derniers jours" />
                        </div>
                    )}
                </section>
            )}

            {/* Modales */}
            {modal === "ravitailler" && (
                <ModalRavitailler onClose={() => setModal(null)} />
            )}
            {modal === "perte" && (
                <ModalPerte onClose={() => setModal(null)} />
            )}
            {modal === "modifier" && (
                <ModalAjoutProduit produitInitial={produit} onClose={() => setModal(null)} />
            )}
            {modal === "supprimer" && (
                <ModalSupprimer produit={produit} onClose={() => setModal(null)} />
            )}
        </div>
    );
}

export default ProduitPage;
