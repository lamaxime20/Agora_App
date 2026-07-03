<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Rôles imposés (role_db.sql)
        $this->call(RolesUtilisateurSeeder::class);

        // 2. Admin unique
        $adminCredentials = (new AdminSeeder())->run();
        $admin = Admin::where('email', $adminCredentials['email'])->firstOrFail();

        // 3. Utilisateurs (couvrent les 11 rôles + comptes de test)
        $utilisateurRoster = (new UtilisateurSeeder())->run();

        $directeur = collect($utilisateurRoster)->firstWhere('role_slug', 'directeur')['user'];

        $stockStaff     = collect($utilisateurRoster)->whereIn('role_slug', ['manager_gestion_stock', 'employe_gestion_stock'])->pluck('user');
        $venteStaff     = collect($utilisateurRoster)->whereIn('role_slug', ['manager_vente', 'employe_vente'])->pluck('user');
        $financeStaff   = collect($utilisateurRoster)->whereIn('role_slug', ['manager_finances', 'employe_finances'])->pluck('user');
        $livraisonStaff = collect($utilisateurRoster)->whereIn('role_slug', ['manager_livraison', 'employe_livraison'])->pluck('user');
        $managers       = collect($utilisateurRoster)
            ->filter(fn (array $e) => $e['role_slug'] === 'directeur' || str_starts_with($e['role_slug'], 'manager_'))
            ->pluck('user');
        $allStaff       = collect($utilisateurRoster)->pluck('user');

        // 4. Entreprise unique : Bytes-Corp
        $entreprise = (new EntrepriseSeeder())->run($directeur);

        // 5. Couleurs de l'entreprise
        (new CodeCouleurSeeder())->run($entreprise);

        // 6. Affiliations utilisateurs <-> entreprise <-> rôle
        (new AppartenirEntrepriseSeeder())->run($utilisateurRoster, $entreprise);

        // 7. Invitations
        (new InvitationSeeder())->run($entreprise);

        // 8. Stock
        $categories      = (new CategorieProduitSeeder())->run($entreprise, $stockStaff);
        $produits        = (new ProduitSeeder())->run($entreprise, $stockStaff, $categories);
        $ravitaillements = (new RavitaillementSeeder())->run($entreprise, $stockStaff, $produits);
        (new PerteProduitSeeder())->run($entreprise, $stockStaff, $produits);

        // 9. Ventes / livraisons
        $clients           = (new ClientSeeder())->run($entreprise);
        $commandes         = (new CommandeSeeder())->run($entreprise, $venteStaff, $clients, $produits);
        $commandesValidees = $commandes->where('statut', 'validee')->values();
        (new LivraisonSeeder())->run($entreprise, $livraisonStaff, $commandesValidees);
        $payements = (new PayementSeeder())->run($entreprise, $venteStaff->merge($financeStaff), $commandesValidees);

        // 10. Finances
        $depenses             = (new DepenseSeeder())->run($entreprise, $financeStaff);
        $entrees              = (new EntreeArgentSeeder())->run($entreprise, $financeStaff);
        $salaires             = (new SalaireSeeder())->run($entreprise, $allStaff);
        $paiementsSalaires    = (new PaiementSalaireSeeder())->run($entreprise, $financeStaff, $salaires);
        $abonnements          = (new FraisMensuelSeeder())->run($entreprise);
        $paiementsAbonnements = (new PaiementAbonnementSeeder())->run($entreprise, $financeStaff, $abonnements);
        $pertesArgent         = (new PerteArgentSeeder())->run($entreprise, $financeStaff);
        $remboursements       = (new RemboursementSeeder())->run($entreprise, $financeStaff, $commandesValidees);

        // 11. Journal financier dérivé des événements ci-dessus
        $ravitaillementsTermines = $ravitaillements->where('statut', 'termine')->values();
        (new MouvementFinancierSeeder())->run(
            $entreprise,
            $payements,
            $depenses,
            $entrees,
            $paiementsSalaires,
            $paiementsAbonnements,
            $ravitaillementsTermines,
            $pertesArgent,
            $remboursements
        );

        // 12. Tâches, événements, historiques, notifications
        $taches     = (new TacheSeeder())->run($entreprise, $utilisateurRoster, $managers);
        $evenements = (new EvenementSeeder())->run($entreprise, $allStaff);
        (new ParticiperEvenementSeeder())->run($allStaff, $evenements);

        $historiqueTargets = [
            ['module' => 'stock',    'table' => 'produits',        'action' => 'creation',   'ids' => $produits->pluck('id')],
            ['module' => 'stock',    'table' => 'ravitaillements', 'action' => 'validation', 'ids' => $ravitaillements->pluck('id')],
            ['module' => 'ventes',   'table' => 'commandes',       'action' => 'validation', 'ids' => $commandes->pluck('id')],
            ['module' => 'finances', 'table' => 'payements',       'action' => 'creation',   'ids' => $payements->pluck('id')],
            ['module' => 'rh',       'table' => 'taches',          'action' => 'assignation','ids' => $taches->pluck('id')],
        ];
        (new HistoriqueSeeder())->run($entreprise, $allStaff, $historiqueTargets);

        (new NotificationSeeder())->run($entreprise, $utilisateurRoster);

        // 13. Tables techniques (sessions, tokens, codes)
        (new SessionAppSeeder())->run($entreprise, $utilisateurRoster);
        (new TokenChoixRoleSeeder())->run($allStaff);
        (new CodeOtpSeeder())->run();
        (new CodeReinitialisationSeeder())->run($allStaff);
        (new TokenAdminSeeder())->run($admin);
        (new CodeReinitialisationAdminSeeder())->run($admin);

        // 14. Fichier de credentials en clair (mots de passe hashés en base uniquement)
        $this->writeCredentialsFile($adminCredentials, $utilisateurRoster);
    }

    /**
     * @param array{nom: string, email: string, password: string} $adminCredentials
     * @param array<int, array{role_slug: string, credentials: array{nom: string, email: string, password: string}}> $utilisateurRoster
     */
    private function writeCredentialsFile(array $adminCredentials, array $utilisateurRoster): void
    {
        $separator = str_repeat('=', 48);
        $lines = [
            $separator,
            'ADMIN',
            $separator,
            '',
            'Nom :',
            $adminCredentials['nom'],
            '',
            'Email :',
            $adminCredentials['email'],
            '',
            'Mot de passe :',
            $adminCredentials['password'],
            '',
            $separator,
            'UTILISATEURS',
            $separator,
            '',
        ];

        foreach ($utilisateurRoster as $entry) {
            $credentials = $entry['credentials'];

            $lines[] = 'Nom :';
            $lines[] = $credentials['nom'] . ' (' . $entry['role_slug'] . ')';
            $lines[] = '';
            $lines[] = 'Email :';
            $lines[] = $credentials['email'];
            $lines[] = '';
            $lines[] = 'Mot de passe :';
            $lines[] = $credentials['password'];
            $lines[] = '';
        }

        $path = database_path('base de données' . DIRECTORY_SEPARATOR . 'seed_credentials.txt');
        File::put($path, implode(PHP_EOL, $lines) . PHP_EOL);
    }
}
