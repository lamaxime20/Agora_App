import { useState } from "react";

import AjouterAdmin from "../../components/admin/admin/ajouterAdmin.jsx"

import { setADMIN_FORM_LOCALSTORAGE, getADMIN_FORM_LOCALSTORAGE } from "../../services/admin/admin.js";


function Admin() {
    const [showPane, setShowPane] = useState(getADMIN_FORM_LOCALSTORAGE());

    const handlePane = (voirPane) => {
        setShowPane(voirPane);
        setADMIN_FORM_LOCALSTORAGE(voirPane);
    }

    return (
        <div className="admin-root">
            <div className="admin-header">
                <h1>Admin</h1>
                <button
                    className="admin-btnAjouter"
                    onClick={() => handlePane(true)}
                >
                    Ajouter un admin
                </button>
            </div>
            <div className="admin-liste">
                Liste Admins
            </div>
            
            {showPane && <AjouterAdmin />}
        </div>
    )
}

export default Admin;