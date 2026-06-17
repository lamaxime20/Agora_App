function AjouterAdmin({ onClose }) {
    return (
        <form className="ajouterAdmin-root">
            <button onClick={onClose}>Fermer</button>
            <label>
                Email:
                <input type="email" />
            </label>
        </form>
    )
}

export default AjouterAdmin;