import { useState } from "react";
import { Nav, Navbar, Form, Badge, Button, Image, Modal, NavDropdown, Offcanvas } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import logo from '../../assets/Agora2.jpg';
import avatar from '../../assets/avatar.jpeg';
const userName = "Reine Esther";
const role = "Commercial";

const HeaderManager = () => {
  const [show, setShow] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState("https://via.placeholder.com/40");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const location = useLocation();
  const activeKey = location.pathname;

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleOffcanvasToggle = () => setShowOffcanvas(!showOffcanvas);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newAvatarUrl = URL.createObjectURL(file);
      setAvatarSrc(newAvatarUrl);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setPasswordError("");
    alert("Mot de passe mis à jour avec succès !");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = () => {
    alert("Déconnexion effectuée !");
    handleClose();
  };

  const navItems = [
    { to: "/manager/dashboard", label: "Dashboard", eventKey: "/manager/dashboard" },
    { to: "/manager/clients", label: "Clients & Prospect", eventKey: "/manager/clients" },
    { to: "/manager/dossiers", label: "Dossiers", eventKey: "/manager/dossiers" },
    { to: "/manager/factures", label: "Factures", eventKey: "/manager/factures" },
    { to: "/manager/fournisseurs", label: "Fournisseurs", eventKey: "/manager/fournisseurs" },
    { to: "/manager/commerciaux", label: "Commerciaux", eventKey: "/manager/commerciaux" },
    { to: "/manager/agenda", label: "Agenda", eventKey: "/manager/agenda" },
  ];

  // Rendu des liens de navigation pour l'Offcanvas
  const renderNavLinks = () => (
    <Nav variant="pills" activeKey={activeKey} className="flex-column">
      {navItems.map((item) => (
        <Nav.Item key={item.eventKey} className="my-1">
          <Nav.Link
            as={Link}
            to={item.to}
            eventKey={item.eventKey}
            className={`px-3 py-2 ${activeKey === item.eventKey ? "bg-warning text-white" : "text-dark"}`}
            onClick={handleOffcanvasToggle}
          >
            {item.label}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );

  return (
    <>
      {/* Sidebar horizontale pour petits écrans */}
      <Navbar
        bg="white"
        className="d-md-none position-fixed p-3 top-0 start-0 w-100 shadow-sm"
        style={{ height: "70px", zIndex: 50 }}
      >
        <Button
          variant="link"
          onClick={handleOffcanvasToggle}
          className="p-2 ms-2"
        >
          <i className="bi bi-list fs-3 text-dark"></i>
        </Button>

        <Navbar.Brand className="position-absolute top-50 start-50 translate-middle">
          <Image
            src={logo}
            alt="AGORA"
            style={{ width: "100px", maxHeight: "50px" }}
          />
        </Navbar.Brand>

        <div className="d-flex align-items-center ms-auto pe-2">
          <NavDropdown
            title={
              <Image
                src={avatar}
                alt="Profil"
                roundedCircle
                style={{ maxWidth: "40px", maxHeight: "40px" }}
              />
            }
            id="profile-dropdown"
            align="end"
          >
            <NavDropdown.Item onClick={handleShow}>Modifier Profil</NavDropdown.Item>
            <NavDropdown.Item onClick={handleLogout}>Déconnexion</NavDropdown.Item>
          </NavDropdown>
        </div>
      </Navbar>

      {/* Sidebar verticale pour grands écrans */}
      <aside
        className="d-none d-md-flex flex-column bg-white shadow-sm h-100 position-fixed top-0 start-0"
        style={{ width: "230px", zIndex: 40, margin: "10px", borderRadius: "5px" }}
      >
        <div className="p-3 border-bottom">
          <Image
            src={logo}
            alt="AGORA"
            style={{ width: "100px", height: "60px" }}
          />
        </div>

        <div className="flex-grow-1 p-3">
          <Nav variant="pills" activeKey={activeKey} className="flex-column h-100">
            {navItems.map((item) => (
              <Nav.Item key={item.eventKey} className="my-1">
                <Nav.Link
                  as={Link}
                  to={item.to}
                  style={{ fontSize: "16px" }}
                  eventKey={item.eventKey}
                  className={`px-3 py-2 ${activeKey === item.eventKey ? "bg-warning text-white" : "text-dark"}`}
                >
                  {item.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>

        <div className="p-3 border-top">
          <div className="d-flex align-items-center" style={{ gap: "15px" }}>
            <NavDropdown
              title={
                <Image
                  src={avatar}
                  alt="Profil"
                  roundedCircle
                  style={{ maxWidth: "40px", maxHeight: "40px" }}
                />
              }
              id="profile-dropdown"
              align="end"
            >
              <NavDropdown.Item onClick={handleShow}>Modifier Profil</NavDropdown.Item>
              <NavDropdown.Item onClick={handleLogout}>Déconnexion</NavDropdown.Item>
            </NavDropdown>
            <div>
              <div className="fw-bold" style={{ fontSize: "0.9rem" }}>{userName}</div>
              <div className="text-muted" style={{ fontSize: "0.7rem" }}>{role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Offcanvas pour petits écrans */}
      <Offcanvas show={showOffcanvas} onHide={handleOffcanvasToggle} placement="start" className="w-75">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <Image
              src={logo}
              alt="AGORA"
              style={{ width: "100px", height: "50px" }}
            />
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {renderNavLinks()}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Modal Profil */}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Profil de {userName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <div className="position-relative d-inline-block">
              <Image src={avatarSrc} roundedCircle style={{ width: "150px", height: "150px" }} />
              <label
                htmlFor="avatar-upload"
                className="position-absolute bottom-0 end-0 bg-white rounded-circle p-2 shadow"
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-pencil text-warning"></i>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          <p className="text-center">Nom : {userName}</p>
          <p className="text-center">Rôle : {role}</p>
          <p className="text-center">Email : reine.esther@example.com</p>

          <Form onSubmit={handlePasswordChange}>
            <h5 className="mt-4">Modifier le mot de passe</h5>
            <Form.Group className="mb-3" controlId="oldPassword">
              <Form.Label>Ancien mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>Nouveau mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>
            {passwordError && <p className="text-danger">{passwordError}</p>}
            <Button variant="warning" type="submit" className="w-100 mb-3">
              Mettre à jour le mot de passe
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Fermer
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Enregistrer
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Déconnexion
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HeaderManager;