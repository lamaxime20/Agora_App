function AjouterEmployerFormAdmin({ showPane, onClose}) {
    return (
        <form className="ajouterEmployerForm-root">
            <button onClick={onClose}>Fermer</button>
            <label>
                Nom:
                <input type="text" />
            </label>
            <label>
                Prénom:
                <input type="text" />
            </label>
            <label>
                Email:
                <input type="email" />
            </label>
            <label>
                Role:
                <select></select>
            </label>
        </form>
    )
}

export default AjouterEmployerFormAdmin;