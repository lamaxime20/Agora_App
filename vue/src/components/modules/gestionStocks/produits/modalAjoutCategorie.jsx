import { useState } from "react";
import { X } from "lucide-react";
import { createStockCategorie } from "../../../../services/gestionStock.js";
import "../../../../assets/styles/components/modules/gestionStocks/modalAjoutCategorie.css";

function ModalAjoutCategorie({ onClose, onSaved }) {
    const [form, setForm] = useState({ nom: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        createStockCategorie({
            categorie: form.nom,
            description: form.description,
        })
            .then(() => {
                setSuccess(true);
                onSaved?.();
                setTimeout(onClose, 1000);
            })
            .catch((err) => {
                setError(err?.message || "Impossible de créer la catégorie.");
            })
            .finally(() => setSubmitting(false));
    };

    if (success) {
        return (
            <div
                className="modalCategorie-overlay"
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
                role="presentation"
            >
                <div className="modalCategorie-panel" role="dialog" aria-modal="true">
                    <div className="modalCategorie-success">
                        <p>Catégorie créée avec succès.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="modalCategorie-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="presentation"
        >
            <div
                className="modalCategorie-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalCategorie-title"
            >
                <div className="modalCategorie-header">
                    <h2 id="modalCategorie-title" className="modalCategorie-title">
                        Ajouter une catégorie
                    </h2>
                    <button
                        className="modalCategorie-close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="modalCategorie-body">
                        <div className="modalCategorie-field">
                            <label className="modalCategorie-label" htmlFor="cat-nom">
                                Nom de la catégorie <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="cat-nom"
                                name="nom"
                                type="text"
                                className="app-input"
                                placeholder="Ex : Papeterie"
                                value={form.nom}
                                onChange={handleChange}
                            required
                            disabled={submitting}
                            autoFocus
                            autoComplete="off"
                        />
                        </div>

                        <div className="modalCategorie-field">
                            <label className="modalCategorie-label" htmlFor="cat-desc">Description</label>
                            <textarea
                                id="cat-desc"
                                name="description"
                                className="app-input modalCategorie-textarea"
                                placeholder="Description optionnelle de la catégorie…"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            disabled={submitting}
                        />
                    </div>
                </div>

                {error && (
                    <p className="modalCategorie-error" role="alert">
                        {error}
                    </p>
                )}

                <div className="modalCategorie-footer">
                    <button
                        type="button"
                        className="app-button app-button--ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="app-button app-button--primary"
                        disabled={!form.nom.trim() || submitting}
                    >
                        Créer la catégorie
                    </button>
                </div>
                </form>
            </div>
        </div>
    );
}

export default ModalAjoutCategorie;
