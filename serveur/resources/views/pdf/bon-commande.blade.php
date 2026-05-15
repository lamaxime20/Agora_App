<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bon de Commande</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 0; }
        .header {
            position: relative;
            text-align: center;
            padding: 20px;
            border-bottom: 2px solid #0047AB;
        }
        .header h1 {
            color: #0047AB;
            margin: 0;
            font-size: 24px;
        }
        .details, .info {
            padding: 20px;
        }
        .details p, .info p {
            margin: 2px 0;
        }
        .info {
            text-align: right;
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
            text-align: center;
            padding: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <img src="{{ public_path('images/Agora2.jpg') }}" alt="Logo" style="height: 60px;">
        <h1>BON DE COMMANDE #{{ $bon->id }}</h1>
    </div>

    <!-- Infos client -->
    <div class="details">
        <p><strong>CLIENT</strong></p>
        <p>{{ $client->nom_entreprise ?? 'N/A' }}</p>
        <p>{{ $client->adresse ?? 'Adresse non renseignée' }}</p>
        <p>{{ $client->contact ?? 'Téléphone non renseigné' }}</p>
        <p>{{ $client->email ?? 'Email non renseigné' }}</p>
    </div>

    <!-- Infos commande -->
    <div class="info">
        <p><strong>Référence Proforma:</strong> {{ $proforma->id }}</p>
        <p><strong>Date de livraison prévue:</strong> {{ \Carbon\Carbon::parse($bon->date_livraison_prevue)->format('d/m/Y') }}</p>
    </div>

    <!-- Tableau des articles -->
    <div class="table-container">
        <table class="table">
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @if (!empty($items) && is_array($items))
                    @foreach ($items as $item)
                        <tr>
                            <td>{{ $item['designation'] ?? 'N/A' }}</td>
                            <td>{{ $item['quantite'] ?? 0 }}</td>
                            <td>{{ number_format($item['prix_unitaire'] ?? 0, 2) }} {{ $currency ?? 'FCFA' }}</td>
                            <td>{{ number_format(($item['quantite'] ?? 0) * ($item['prix_unitaire'] ?? 0), 2) }} {{ $currency ?? 'FCFA' }}</td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="4">Aucun article disponible</td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>

    <!-- Total -->
    <div class="totals">
        <p><strong>Total :</strong> {{ number_format($totalPrice ?? 0, 2) }} {{ $currency ?? 'FCFA' }}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Merci pour votre commande !</p>
    </div>
</body>
</html>
