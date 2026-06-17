import NavBarAdmin from "../../components/admin/navBar.jsx";

import ProduitsAdmin from "./produits.jsx"
import EmployesAdmin from "./employes.jsx"
import Admin from "./admin.jsx"

import {
    ADMIN_PRODUITS,
    ADMIN_ENTREPRISE,
    ADMIN_EMPLOYE,
    ADMIN_ADMIN
} from "../../components/admin/navBar.jsx";

function ApplicationPageAdmin({ onglet }) {
    return (
        <div className="application-root">
            <NavBarAdmin onglet={onglet} />
            <main className="application-content">
                {onglet === ADMIN_PRODUITS && <ProduitsAdmin />}
                {onglet === ADMIN_ENTREPRISE && <h1>Paramètres entreprise</h1>}
                {onglet === ADMIN_EMPLOYE && <EmployesAdmin />}
                {onglet === ADMIN_ADMIN && <Admin />}
            </main>
        </div>
    )
}

export default ApplicationPageAdmin;