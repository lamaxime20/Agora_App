import { Container, Button, Modal } from "react-bootstrap";
import { useState } from "react";

const Footer = () => {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <Container fluid style={{ backgroundColor: "white", textAlign: "center", padding: "10px 0", marginTop: "40px", fontFamily: "Roboto, sans-serif" }}>
      <p style={{ fontSize: "16px", color: "#6c757d", margin: 0 }}>
        Agora Sarl © 2025 |{" "}
        <Button variant="link" style={{ color: "#ff9900", fontSize: "12px", padding: 0 }} onClick={() => setShowSupport(true)}>
          Support
        </Button>
      </p>
      <Modal show={showSupport} onHide={() => setShowSupport(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Contact Support</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Envoyez-nous un email à <a href="mailto:support@agora.com">support@agora.com</a> pour toute assistance.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSupport(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Footer;