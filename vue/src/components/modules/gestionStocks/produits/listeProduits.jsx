import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, FolderPlus, AlertCircle, Package } from "lucide-react";
import ModalAjoutProduit from "./modalAjoutProduit.jsx";
import ModalAjoutCategorie from "./modalAjoutCategorie.jsx";
import { fetchStockProduits } from "../../../../services/gestionStock.js";
import "../../../../assets/styles/components/modules/gestionStocks/listeProduits.css";

function BadgeStatut({ statut, type }) {
    if (type === "service") {
        return <span className="listeProduits-badge listeProduits-badge--service">Service</span>;
    }
    const map = {
        disponible: { label: "En stock",     mod: "success" },
        faible:     { label: "Stock faible", mod: "warning" },
        rupture:    { label: "Rupture",      mod: "error"   },
    };
    const info = map[statut] ?? { label: statut, mod: "success" };
    return (
        <span className={`listeProduits-badge listeProduits-badge--${info.mod}`}>
            {info.label}
        </span>
    );
}

function SkeletonCard() {
    return (
        <div className="listeProduits-card listeProduits-card--skeleton" aria-hidden="true">
            <div className="skeleton-img" />
            <div className="listeProduits-card__body">
                <div className="skeleton-line skeleton-line--lg" />
                <div className="skeleton-line skeleton-line--sm" />
                <div className="skeleton-line skeleton-line--md" />
            </div>
            <div className="skeleton-badge" />
        </div>
    );
}

function EmptyState({ onAdd }) {
    return (
        <div className="listeProduits-empty">
            <div className="listeProduits-empty__icon">
                <Package size={40} aria-hidden="true" />
            </div>
            <h3 className="listeProduits-empty__title">Aucun produit enregistré</h3>
            <p className="listeProduits-empty__text">
                Commencez par ajouter votre premier produit ou créez une catégorie.
            </p>
            <button
                className="app-button app-button--primary"
                onClick={onAdd}
                type="button"
            >
                <Plus size={16} aria-hidden="true" />
                Ajouter un produit
            </button>
        </div>
    );
}

function ListeProduits() {
    const [produits, setProduits]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [recherche, setRecherche]           = useState("");
    const [modalProduit, setModalProduit]     = useState(false);
    const [modalCategorie, setModalCategorie] = useState(false);

    const charger = useCallback(() => {
        setLoading(true);
        setError(null);
        let active = true;

        (async () => {
            try {
                const payload = await fetchStockProduits({ limit: 100 });
                if (!active) return;
                setProduits(payload.items ?? []);
            } catch {
                if (active) {
                    setError("Impossible de charger les produits.");
                }
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        return charger();
    }, [charger]);

    const produitsFiltres = produits.filter(p => {
        const q = recherche.toLowerCase();
        return (
            p.nom.toLowerCase().includes(q) ||
            p.reference.toLowerCase().includes(q) ||
            (p.categorie?.nom ?? "").toLowerCase().includes(q)
        );
    });

    const stockDispo = (p) => Math.max(0, (p.quantite_stock ?? 0) - (p.stock_reserve ?? 0));

    return (
        <div className="listeProduits-root">
            <div className="listeProduits-toolbar">
                <div className="listeProduits-search" role="search">
                    <Search size={16} className="listeProduits-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="listeProduits-search__input app-input"
                        placeholder="Rechercher un produit, une catégorie…"
                        aria-label="Rechercher un produit"
                        value={recherche}
                        onChange={e => setRecherche(e.target.value)}
                    />
                </div>
                <div className="listeProduits-actions">
                    <button
                        className="app-button app-button--primary app-button--sm"
                        onClick={() => setModalProduit(true)}
                        type="button"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Ajouter un produit
                    </button>
                    <button
                        className="app-button app-button--ghost-primary app-button--sm"
                        onClick={() => setModalCategorie(true)}
                        type="button"
                    >
                        <FolderPlus size={16} aria-hidden="true" />
                        Catégorie
                    </button>
                </div>
            </div>

            {loading && (
                <div className="listeProduits-grid" aria-busy="true" aria-label="Chargement des produits">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {!loading && error && (
                <div className="listeProduits-error" role="alert">
                    <AlertCircle size={32} aria-hidden="true" />
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && produitsFiltres.length === 0 && (
                <EmptyState onAdd={() => setModalProduit(true)} />
            )}

            {!loading && !error && produitsFiltres.length > 0 && (
                <>
                    {/* Mobile : cartes */}
                    <ul className="listeProduits-grid" aria-label="Liste des produits">
                        {produitsFiltres.map(produit => (
                            <li key={produit.id}>
                                <Link
                                    to={`/application/produit/${produit.id}`}
                                    className="listeProduits-card"
                                >
                                    <div className="listeProduits-card__image">
                                        {produit.image_url ? (
                                            <img src={produit.image_url} alt={produit.nom} />
                                        ) : (
                                            <Package size={24} className="app-icon--muted" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="listeProduits-card__body">
                                        <span className="listeProduits-card__name">{produit.nom}</span>
                                        <span className="listeProduits-card__meta">
                                            {produit.categorie?.nom ?? "Sans catégorie"} · {Number(produit.prix_unitaire ?? 0).toLocaleString("fr-FR")} FCFA
                                        </span>
                                        {produit.type === "physique" && (
                                            <div className="listeProduits-card__stock">
                                                <span className="listeProduits-card__stock-item">
                                                    Stock : <strong>{produit.quantite_stock}</strong>
                                                </span>
                                                <span className="listeProduits-card__stock-item">
                                                    Réservé : <strong>{produit.stock_reserve ?? 0}</strong>
                                                </span>
                                                <span className="listeProduits-card__stock-item">
                                                    Dispo : <strong>{stockDispo(produit)}</strong>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <BadgeStatut statut={produit.statut} type={produit.type} />
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Desktop : tableau */}
                    <div className="listeProduits-table-wrap">
                        <table className="listeProduits-table" aria-label="Liste des produits">
                            <thead>
                                <tr>
                                    <th scope="col">Produit</th>
                                    <th scope="col">Catégorie</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Prix unitaire</th>
                                    <th scope="col">Stock</th>
                                    <th scope="col">Réservé</th>
                                    <th scope="col">Disponible</th>
                                    <th scope="col">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produitsFiltres.map(produit => (
                                    <tr key={produit.id} className="listeProduits-table__row">
                                        <td>
                                            <Link
                                                to={`/application/produit/${produit.id}`}
                                                className="listeProduits-table__name-link"
                                            >
                                                <div className="listeProduits-table__image">
                                                    {produit.image_url ? (
                                                        <img src={produit.image_url} alt="" aria-hidden="true" />
                                                    ) : (
                                                        <Package size={16} className="app-icon--muted" aria-hidden="true" />
                                                    )}
                                                </div>
                                                <span>{produit.nom}</span>
                                            </Link>
                                        </td>
                                        <td>{produit.categorie?.nom ?? "Sans catégorie"}</td>
                                        <td className="listeProduits-table__type">
                                            {produit.type === "physique" ? "Physique" : "Service"}
                                        </td>
                                        <td className="listeProduits-table__price">
                                            {Number(produit.prix_unitaire ?? 0).toLocaleString("fr-FR")} FCFA
                                        </td>
                                        <td>
                                            {produit.type === "physique" ? produit.quantite_stock : "—"}
                                        </td>
                                        <td>
                                            {produit.type === "physique" ? (produit.stock_reserve ?? 0) : "—"}
                                        </td>
                                        <td>
                                            {produit.type === "physique" ? stockDispo(produit) : "—"}
                                        </td>
                                        <td>
                                            <BadgeStatut statut={produit.statut} type={produit.type} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {modalProduit && (
                <ModalAjoutProduit onClose={() => setModalProduit(false)} onSaved={charger} />
            )}
            {modalCategorie && (
                <ModalAjoutCategorie onClose={() => setModalCategorie(false)} onSaved={charger} />
            )}
        </div>
    );
}

export default ListeProduits;
