import { useState, useEffect } from "react";
import { X, Search, Loader, User } from "lucide-react";
import { fetchLivreurs, createLivraison } from "../../../services/livraison.js";
import "../../../assets/styles/components/modules/livraison/DeliveryDialog.css";

function AssignDriverModal({ commande, onClose, onSuccess }) {
    const [livreurs, setLivreurs]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState("");
    const [selected, setSelected]       = useState(null);
    const [submitting, setSubmitting]   = useState(false);
    const [error, setError]             = useState("");

    useEffect(() => {
        fetchLivreurs()
            .then(data => setLivreurs(data.data ?? []))
            .catch(() => setError("Impossible de charger les livreurs."))
            .finally(() => setLoading(false));
    }, []);

    const filtered = livreurs.filter(l =>
        l.nom.toLowerCase().includes(search.toLowerCase())
    );

    const handleConfirm = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError("");
        try {
            await createLivraison(commande.id, selected.id);
            onSuccess?.();
            onClose();
        } catch {
            setError("Erreur lors de la création de la livraison.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="deliveryDialog-backdrop" onClick={onClose} aria-hidden="true" />
            <div className="deliveryDialog-sheet deliveryDialog-sheet--lg" role="dialog" aria-modal="true" aria-label="Assigner un livreur">
                <div className="deliveryDialog-header">
                    <h2 className="deliveryDialog-title">Assigner un livreur</h2>
                    <button type="button" className="deliveryDialog-close" onClick={onClose} aria-label="Fermer">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="deliveryDialog-body">
                    <p className="deliveryDialog-subtitle">
                        Commande <strong>{commande?.numero}</strong> — {commande?.client}
                    </p>

                    <div className="deliveryDialog-search">
                        <Search size={16} className="deliveryDialog-search__icon" aria-hidden="true" />
                        <input
                            type="text"
                            className="deliveryDialog-search__input"
                            placeholder="Rechercher un livreur…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            aria-label="Rechercher un livreur"
                        />
                    </div>

                    <div className="deliveryDialog-drivers">
                        {loading && (
                            <div className="deliveryDialog-loading">
                                <Loader size={20} className="deliveryDialog-loading__spin" aria-hidden="true" />
                                <span>Chargement…</span>
                            </div>
                        )}
                        {!loading && filtered.map(l => (
                            <button
                                key={l.id}
                                type="button"
                                className={`deliveryDialog-driver${selected?.id === l.id ? " deliveryDialog-driver--selected" : ""}`}
                                onClick={() => setSelected(l)}
                            >
                                <span className="deliveryDialog-driver__avatar">
                                    <User size={18} aria-hidden="true" />
                                </span>
                                <span className="deliveryDialog-driver__info">
                                    <span className="deliveryDialog-driver__name">{l.nom}</span>
                                    <span className="deliveryDialog-driver__phone">{l.telephone}</span>
                                </span>
                                <span className="deliveryDialog-driver__count">
                                    {l.livraisonsEnCours} en cours
                                </span>
                            </button>
                        ))}
                        {!loading && filtered.length === 0 && (
                            <p className="deliveryDialog-empty">Aucun livreur trouvé.</p>
                        )}
                    </div>

                    {error && <p className="deliveryDialog-error">{error}</p>}
                </div>

                <div className="deliveryDialog-footer">
                    <button type="button" className="deliveryDialog-btn deliveryDialog-btn--ghost" onClick={onClose}>
                        Annuler
                    </button>
                    <button
                        type="button"
                        className="deliveryDialog-btn deliveryDialog-btn--primary"
                        onClick={handleConfirm}
                        disabled={!selected || submitting}
                    >
                        {submitting
                            ? <><Loader size={16} className="deliveryDialog-loading__spin" aria-hidden="true" /> Création…</>
                            : "Créer la livraison"}
                    </button>
                </div>
            </div>
        </>
    );
}

export default AssignDriverModal;
