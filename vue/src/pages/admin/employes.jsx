import { useState } from "react";

import AjouterEmployerFormAdmin from "../../components/admin/employes/ajouterEmployeForm.jsx"

import { setADMIN_EMPLOYE_FORM_LOCALSTORAGE, getADMIN_EMPLOYE_FORM_LOCALSTORAGE } from "../../services/admin/employe.js";

function EmployesAdmin() {
    const [showPane, setShowPane] = useState(getADMIN_EMPLOYE_FORM_LOCALSTORAGE());

    const handlePane = (voirPane) => {
        setShowPane(voirPane);
        setADMIN_EMPLOYE_FORM_LOCALSTORAGE(voirPane);
    }

    const handleClose = (e) => {
        e.preventDefault();
        handlePane(false)
    }

    return (
        <div className="employesAdmin-root">
            <div className="employesAdmin-header">
                <h1>Employés</h1>
                <button
                    className="employesAdmin-btnAjouter"
                    onClick={() => handlePane(true)}
                >
                    Ajouter un employé
                </button>
            </div>
            <div className="employesAdmin-employes">
                Liste Employés
            </div>

            {showPane && <AjouterEmployerFormAdmin showPane={showPane} onClose={handleClose} />}
        </div>
    )
}

export default EmployesAdmin;