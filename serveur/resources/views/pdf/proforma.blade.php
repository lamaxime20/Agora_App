<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proforma</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .header {
            position: relative;
            text-align: center; /* Centre horizontalement le contenu texte */
            padding: 20px;
            border-bottom: 2px solid #0047AB;
        }
        .header h1 {
            color: #0047AB;
            margin: 0;
            font-size: 24px; /* Ajuste la taille du titre si nécessaire */
        }
        .header img {
            height: 60px; /* Taille du logo */
            margin-left: 20px; /* Espacement avec le titre */
        }

        .details {
            text-align: left;
            padding: 20px;
        }
        .details p {
            margin: 1px 0;
        }

        .info {
            padding: 0 20px;
            text-align: right;
        }
        .info p {
            margin: 1px 0;
        }

        .table-container {
            padding: 0 20px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .table th {
            background-color: #f2f2f2;
        }

        .totals {
            text-align: right;
            padding: 20px;
            margin-top: 10px;
        }
        .totals p {
            margin: 4px 0;
        }

        .footer {
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 40%;
            text-align: left;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <!-- Header with title and logo on the same line -->
    <div class="header">
        <img src="{{ public_path('images/Agora2.jpg') }}" alt="Logo" style="height: 60px;">
        <h1>Facture Proforma</h1>
    </div>

    <!-- Details section in two columns -->
    <div class="details">
        <p><strong>FACTURÉ À</strong></p>
        <p>{{ $proforma->dossier->client->nom_entreprise }}</p>
        <p>{{ $proforma->dossier->client->adresse }}</p>
        <p>{{ $proforma->dossier->client->contact }}</p>
        <p>{{ $proforma->dossier->client->email }}</p>
    </div>

    <!-- Facture infos -->
    <div class="info">
        <p><strong>Facture N°</strong> FR-{{ $proforma->id }}</p>
        <p><strong>Date</strong> {{ $date }}</p>
    </div>

    <!-- Table des lignes -->
    <div class="table-container">
        <table class="table">
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th>Prix Unité HT</th>
                    <th>Qté</th>
                    <th>Montant HT</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($proforma->ligneProformas as $ligne)
                    <tr>
                        <td>{{ $ligne->designation }}</td>
                        <td>{{ number_format($ligne->prix_unitaire, 2) }} €</td>
                        <td>{{ $ligne->quantite }}</td>
                        <td>{{ number_format($ligne->quantite * $ligne->prix_unitaire, 2) }} €</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Totaux hors tableau -->
    <div class="totals">
        <p>Total HT :<strong>{{ number_format($proforma->total_ttc / 1.20, 2) }} €</strong> </p>
        <p>TVA 20% :<strong>{{ number_format($proforma->total_ttc - ($proforma->total_ttc / 1.20), 2) }} €</strong> </p>
        <p><strong>TOTAL :</strong> {{ number_format($proforma->total_ttc, 2) }} €</p>
    </div>

    <!-- Footer tout en bas à gauche -->
    <div class="footer">
        <p><strong>CONDITIONS ET MODALITÉS DE PAIEMENT</strong></p>
        <p>Le paiement est dû dans 15 jours</p>
        <p>Caisse d'Épargne</p>
        <p>IBAN: FR12 1234 5678</p>
        <p>SWIFT/BIC: ABCDFRP1XXX</p>
    </div>
</body>
</html>