function NavBarAdmin({ onglet }) {
    return (
        <nav className="navbaradmin-root">
            <ul className="navbaradmin-onglets">
            <li className={`navbaradmin-onglet ${onglet === ADMIN_PRODUITS ? 'active' : ''}`}>
                    <a href="/admin/application/produit">Produits</a>
                </li>
                <li className="navbaradmin-onglet">
                    <a href={`/admin/application/entreprise ${onglet === ADMIN_ENTREPRISE ? 'active' : ''}`}>Paramètres entreprise</a>
                </li>
                <li className={`navbaradmin-onglet ${onglet === ADMIN_EMPLOYE ? 'active' : ''}`}>
                    <a href="/admin/application/employe">Employés</a>
                </li>
                <li className={`navbaradmin-onglet ${onglet === ADMIN_ADMIN ? 'active' : ''}`}>
                    <a href="/admin/application/gestionAdmin">Admin</a>
                </li>
            </ul>

            <a className="navbaradmin-parametres">
                Paramètres
            </a>
        </nav>
    )
}

const ADMIN_PRODUITS = 'produits';
const ADMIN_ENTREPRISE = 'entreprise';
const ADMIN_EMPLOYE = 'employe';
const ADMIN_ADMIN = 'gestionAdmin';

export {
    ADMIN_PRODUITS,
    ADMIN_ENTREPRISE,
    ADMIN_EMPLOYE,
    ADMIN_ADMIN
}

export default NavBarAdmin;