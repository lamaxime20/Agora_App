import { useState } from "react";

function ChoixEntrepriseAdmin() {
    const [entrepriseExist, setEntrepriseExist] = useState(true);
    const [entreprise, setEntreprise] = useState({
        nom: "entreprise1",
        id: "aijdeknfiedmed"
    });

    return (
        <div>
            <h1>Choix d'entreprise</h1>
            {entrepriseExist ? (
                <button>
                    {entreprise.nom}
                </button>
            ):(
                <button>
                    Créer une entreprise
                </button>
            )}
        </div>
    )
}

export default ChoixEntrepriseAdmin;