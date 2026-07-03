<?php

namespace Database\Seeders;

use App\Models\Entreprise;
use Database\Factories\MouvementFinancierFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Journal financier dérivé des événements réellement créés
 * (paiements, dépenses, entrées, salaires, abonnements, ravitaillements,
 * pertes d'argent, remboursements) — jamais généré au hasard.
 */
class MouvementFinancierSeeder extends Seeder
{
    public function run(
        Entreprise $entreprise,
        Collection $payements,
        Collection $depenses,
        Collection $entrees,
        Collection $paiementsSalaires,
        Collection $paiementsAbonnements,
        Collection $ravitaillementsTermines,
        Collection $pertesArgent,
        Collection $remboursements
    ): void {
        $payements->each(fn ($p) => MouvementFinancierFactory::new()->create([
            'date_operation' => $p->date_payement,
            'type_operation' => 'paiement_commande',
            'montant'        => $p->montant,
            'sens'           => 'entree',
            'reference_id'   => $p->id,
            'description'    => 'Paiement reçu pour une commande.',
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $p->user_enregistre,
        ]));

        $depenses->each(fn ($d) => MouvementFinancierFactory::new()->create([
            'date_operation' => $d->date_depense,
            'type_operation' => 'depense_generale',
            'montant'        => $d->montant,
            'sens'           => 'sortie',
            'reference_id'   => $d->id,
            'description'    => $d->raison,
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $d->utilisateur_marque,
        ]));

        $entrees->each(fn ($e) => MouvementFinancierFactory::new()->create([
            'date_operation' => $e->date_entree,
            'type_operation' => 'entree_generale',
            'montant'        => $e->montant,
            'sens'           => 'entree',
            'reference_id'   => $e->id,
            'description'    => $e->raison,
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $e->utilisateur_marque,
        ]));

        $paiementsSalaires->each(fn ($ps) => MouvementFinancierFactory::new()->create([
            'date_operation' => $ps->date_paiement,
            'type_operation' => 'paiement_salaire',
            'montant'        => $ps->montant,
            'sens'           => 'sortie',
            'reference_id'   => $ps->id,
            'description'    => 'Paiement de salaire.',
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $ps->user_enregistre,
        ]));

        $paiementsAbonnements->each(fn ($pa) => MouvementFinancierFactory::new()->create([
            'date_operation' => $pa->date_paiement,
            'type_operation' => 'paiement_abonnement',
            'montant'        => $pa->montant,
            'sens'           => 'sortie',
            'reference_id'   => $pa->id,
            'description'    => "Paiement d'abonnement mensuel.",
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $pa->user_enregistre,
        ]));

        $ravitaillementsTermines->each(fn ($r) => MouvementFinancierFactory::new()->create([
            'date_operation' => $r->date_execution ?? $r->date_creation,
            'type_operation' => 'paiement_ravitaillement',
            'montant'        => $r->montant_a_depenser,
            'sens'           => 'sortie',
            'reference_id'   => $r->id,
            'description'    => 'Ravitaillement de stock exécuté.',
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $r->utilisateur_demande,
        ]));

        $pertesArgent->each(fn ($pa) => MouvementFinancierFactory::new()->create([
            'date_operation' => $pa->date_constat,
            'type_operation' => 'perte_argent',
            'montant'        => $pa->montant,
            'sens'           => 'sortie',
            'reference_id'   => $pa->id,
            'description'    => $pa->cause,
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $pa->utilisateur_signale,
        ]));

        $remboursements->each(fn ($r) => MouvementFinancierFactory::new()->create([
            'date_operation' => $r->date_remboursement,
            'type_operation' => 'remboursement_commande',
            'montant'        => $r->montant,
            'sens'           => 'sortie',
            'reference_id'   => $r->id,
            'description'    => $r->cause,
            'entreprise_id'  => $entreprise->id,
            'utilisateur_id' => $r->utilisateur_engage,
        ]));
    }
}
