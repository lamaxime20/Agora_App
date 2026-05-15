<?php

namespace App\Exports;

use App\Models\Proforma;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProformasExport implements FromCollection, WithHeadings
{
    protected $proforma;

    public function __construct($proforma)
    {
        $this->proforma = $proforma;
    }

    public function collection()
    {
        return $this->proforma->ligneProformas->map(function ($ligne) {
            return [
                'Désignation' => $ligne->designation,
                'Quantité' => $ligne->quantite,
                'Prix Unitaire' => $ligne->prix_unitaire,
                'Montant HT' => $ligne->quantite * $ligne->prix_unitaire,
            ];
        });
    }

    public function headings(): array
    {
        return ['Désignation', 'Quantité', 'Prix Unitaire', 'Montant HT'];
    }
}