import { Table, Button, Row, Col, Card, Badge } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FacturesContext } from '../../pages/manager/facturePage';

const FacturesTable = () => {
  const { filters } = useContext(FacturesContext);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const navigate = useNavigate();

  // Données simulées
  const factures = [
    { 
      id: 1, 
      montant: 174.00, 
      dossierId: 1, 
      client: "Cendrillon Ayot", 
      statut: "Non payée", 
      dossier: { statut: "En cours", client: "Cendrillon Ayot", commercial: "Commercial 1" },
      details: {
        date: "29/01/2019",
        commandDate: "16/03/2019",
        dueDate: "24/05/2019",
        items: [
          { qty: 1, designation: "Grand brun escargot pour manger", price: 100.00, total: 100.00, number:1 },
          { qty: 2, designation: "Petit marinier uniforme en bleu", price: 15.00, total: 30.00, number:2 },
          { qty: 3, designation: "Facile à jouer accordéon", price: 5.00, total: 15.00, number:3 },
        ],
        totalHT: 145.00,
        tva: 29.00,
        totalTTC: 174.00,
        to: { name: "Cendrillon Ayot", address: "69 rue Nations, 22000 Paris" },
      }
    },
    { 
      id: 2, 
      montant: 750.00, 
      dossierId: 2, 
      client: "Client B", 
      statut: "Payée", 
      dossier: { statut: "Clôturé", client: "Client B", commercial: "Commercial 2" },
      details: {
        date: "15/02/2020",
        commandDate: "20/04/2020",
        dueDate: "30/06/2020",
        items: [
          { qty: 2, designation: "Produit A", price: 300.00, total: 600.00, number:1 },
          { qty: 1, designation: "Produit B", price: 150.00, total: 150.00, number:2 },
        ],
        totalHT: 750.00,
        tva: 0.00, // Ajustez selon vos besoins
        totalTTC: 750.00,
        to: { name: "Client B", address: "25 Avenue des Champs, 75008 Paris" },
      }
    },
    { 
      id: 3, 
      montant: 300.00, 
      dossierId: 1, 
      client: "Cendrillon Ayot", 
      statut: "Non validée", 
      dossier: { statut: "En cours", client: "Cendrillon Ayot", commercial: "Commercial 1" },
      details: {
        date: "10/03/2021",
        commandDate: "15/05/2021",
        dueDate: "20/07/2021",
        items: [
          { qty: 1, designation: "Service C", price: 250.00, total: 250.00, number:1},
          { qty: 1, designation: "Service D", price: 50.00, total: 50.00, number:2},
        ],
        totalHT: 300.00,
        tva: 0.00, 
        totalTTC: 300.00,
        to: { name: "Cendrillon Ayot", address: "69 rue Nations, 22000 Paris" },
      }
    },
  ];

  // Filtrage
  const filteredFactures = factures.filter((facture) => {
    const matchesDate = !filters.date || new Date(facture.details?.date || factures[0].date) >= new Date(filters.date);
    const matchesClient = filters.client === 'Tous' || facture.client === filters.client;
    const matchesCommercial = filters.commercial === 'Tous' || facture.dossier.commercial === filters.commercial;
    const matchesStatus = filters.status === 'Tous' || facture.statut === filters.status;
    return matchesDate && matchesClient && matchesCommercial && matchesStatus;
  });

  const handleDeleteFacture = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      setSelectedFacture(null); // Réinitialise si la facture sélectionnée est supprimée
      console.log(`Supprimer facture ${id}`);
    }
  };

  const handleValidateFacture = () => {
    if (selectedFacture && selectedFacture.statut === "Non validée") {
      setSelectedFacture({ ...selectedFacture, statut: "Non payée" });
      console.log(`Facture ${selectedFacture.id} validée`);
    }
  };

  const handleExportPDF = () => {
    if (selectedFacture && selectedFacture.statut !== "Non validée") {
      console.log(`Exporter facture ${selectedFacture.id} en PDF`);
    }
  };

  const handleViewDossier = (dossierId) => {
    console.log(`Voir dossier ${dossierId}`);
    // Logique pour naviguer ou afficher dossier si nécessaire
  };

  return (
    <div>
      {selectedFacture ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedFacture(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12} md={12}>
              <div className="mb-3">
                <p><strong>Statut :</strong> 
                  <Badge bg={selectedFacture.statut === "Payée" ? "success" : selectedFacture.statut === "Non payée" ? "warning" : "danger"}>
                    {selectedFacture.statut}
                  </Badge>
                </p>
                <p><strong>Statut Dossier :</strong> 
                  <Badge bg={selectedFacture.dossier.statut === "Clôturé" ? "success" : "warning"}>
                    {selectedFacture.dossier.statut}
                  </Badge>
                </p>
                <p><strong>Commercial :</strong> {selectedFacture.dossier.commercial}</p>
              </div>
              <Card className="shadow-sm" style={{ borderColor: 'orange', minHeight: '450px' }}>
                <Card.Body>
                  <Card.Title style={{ color: 'orange', fontSize: '24px', fontWeight: 'bold' }}>FACTURE</Card.Title>
                  <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                    <p>FACTURE N° <strong>00/12/AGF</strong></p>
                    <p>DATE <strong>{selectedFacture.details?.date || 'N/A'}</strong></p>
                    <p>COMMANDE N° <strong>{selectedFacture.details?.commandDate || 'N/A'}</strong></p>
                  </div>
                  <Row>
                    <Col md={6}>
                      <p><strong>Facturé à :</strong></p>
                      <p>{selectedFacture.details?.to?.name || 'N/A'}</p>
                      <p>{selectedFacture.details?.to?.address || 'N/A'}</p>
                    </Col>
                  </Row>
                  <Table >
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Désignation</th>
                        <th>Prix Unitaire (CFA)</th>
                        <th>Quantité</th>
                        <th>Prix total (CFA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFacture.details?.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.number}</td>
                          <td>{item.designation}</td>
                          <td>{item.price} </td>
                          <td>{item.qty}</td>
                          <td>{item.total} </td>
                        </tr>
                      )) || <tr><td colSpan="4">Aucun item disponible</td></tr>}
                    </tbody>
                  </Table>
                  <div style={{textAlign: 'right'}}>
                    <p>Total HT :  <strong>{selectedFacture.details?.totalHT || 0} CFA</strong></p>
                    <p>TVA 19.0% :  <strong>{selectedFacture.details?.tva || 0} CFA</strong></p>
                    <p>TOTAL TTC A PAYER:  <strong>{selectedFacture.details?.totalTTC || 0} CFA</strong></p>
                  </div>
                  <div style={{ borderLeft: '4px solid #ff4500', paddingLeft: '10px', marginTop: '20px' }}>
                    <p><strong>MODALITÉS DE PAIEMENT</strong></p>
                    <p>Espèce, cheque, virement - 15 à 30 jours après le dépôt de la facture</p>
                  </div>
                </Card.Body>
              </Card>
              <div className="mt-3">
                <Button variant="success" onClick={handleValidateFacture} disabled={selectedFacture.statut !== "Non validée"} className="me-2">
                  Valider
                </Button>
                <Button variant="primary" onClick={handleExportPDF} disabled={selectedFacture.statut === "Non validée"} className="me-2">
                  Exporter en PDF
                </Button>
                <Button variant="danger" onClick={() => handleDeleteFacture(selectedFacture.id)}>
                  Supprimer
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      ) : (
        filteredFactures.length === 0 ? (
          <p>Aucune facture trouvée avec les filtres actuels.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Montant</th>
                  <th>Dossier ID</th>
                  <th>Client</th>
                  <th>Statut Dossier</th>
                  <th>Commercial</th>
                  <th>Statut Facture</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFactures.map((facture) => (
                  <tr key={facture.id}>
                    <td>{facture.id}</td>
                    <td>{facture.montant} €</td>
                    <td>{facture.dossierId}</td>
                    <td>{facture.client}</td>
                    <td>
                      <Badge
                        bg={facture.dossier.statut === "Clôturé" ? "success" : "warning"}
                        style={{
                          backgroundColor:
                            facture.dossier.statut === "Clôturé" ? "#28a745" : "#ffc107",
                        }}
                      >
                        {facture.dossier.statut}
                      </Badge>
                    </td>
                    <td>{facture.dossier.commercial}</td>
                    <td>
                      <Badge
                        bg={
                          facture.statut === "Payée"
                            ? "success"
                            : facture.statut === "Non payée"
                            ? "warning"
                            : "danger"
                        }
                        style={{
                          backgroundColor:
                            facture.statut === "Payée"
                              ? "#28a745"
                              : facture.statut === "Non payée"
                              ? "#ffc107"
                              : "#dc3545",
                        }}
                      >
                        {facture.statut}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="link"
                        onClick={() => setSelectedFacture(facture)}
                      >
                        <i className="bi bi-eye" style={{ color: "orange" }}></i>
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => handleViewDossier(facture.dossierId)}
                      >
                        <i className="bi bi-folder" style={{ color: "#28a745" }}></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

        )
      )}
    </div>
  );
};

export default FacturesTable;