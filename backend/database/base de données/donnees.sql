-- =========================================================
-- DONNÉES DE TEST
-- =========================================================
-- Pré-requis :
-- 1) exécuter `role_db.sql`
-- 2) créer les 10 utilisateurs via Laravel avec un mot de passe hashé
-- 3) exécuter ce script pour créer 3 entreprises par utilisateur et
--    les affiliations avec des rôles dans d'autres entreprises
--
-- Ce script sélectionne les utilisateurs par email, comme demandé.
-- =========================================================

DO $$
DECLARE
  -- Liste des 10 utilisateurs enregistrés
  emails text[] := ARRAY[
    'amina.diop@agora.local',
    'benoit.martin@agora.local',
    'chloe.bernard@agora.local',
    'david.kouassi@agora.local',
    'elodie.nguessan@agora.local',
    'farid.benali@agora.local',
    'gabrielle.traore@agora.local',
    'hugo.pereira@agora.local',
    'ines.diallo@agora.local',
    'jules.okonkwo@agora.local'
  ];

  prenoms text[] := ARRAY[
    'Amina',
    'Benoît',
    'Chloé',
    'David',
    'Élodie',
    'Farid',
    'Gabrielle',
    'Hugo',
    'Inès',
    'Jules'
  ];

  noms text[] := ARRAY[
    'Diop',
    'Martin',
    'Bernard',
    'Kouassi',
    'N''Guessan',
    'Benali',
    'Traoré',
    'Pereira',
    'Diallo',
    'Okonkwo'
  ];

  i int;
  j int;
  user_id uuid;
  company_id uuid;
  director_role_id uuid;
  manager_gestion_stock_id uuid;
  employe_gestion_stock_id uuid;
  manager_vente_id uuid;
  employe_vente_id uuid;
  manager_finances_id uuid;
  employe_finances_id uuid;
  member_email_1 text;
  member_email_2 text;
  secondary_role_1 uuid;
  secondary_role_2 uuid;
BEGIN
  SELECT
    (SELECT id FROM roles_utilisateur WHERE role = 'directeur' LIMIT 1),
    (SELECT id FROM roles_utilisateur WHERE role = 'manager_gestion_stock' LIMIT 1),
    (SELECT id FROM roles_utilisateur WHERE role = 'employe_gestion_stock' LIMIT 1),
    (SELECT id FROM roles_utilisateur WHERE role = 'manager_vente' LIMIT 1),
    (SELECT id FROM roles_utilisateur WHERE role = 'employe_vente' LIMIT 1),
    (SELECT id FROM roles_utilisateur WHERE role = 'manager_finances' LIMIT 1),
    (SELECT id FROM roles_utilisateur WHERE role = 'employe_finances' LIMIT 1)
  INTO
    director_role_id,
    manager_gestion_stock_id,
    employe_gestion_stock_id,
    manager_vente_id,
    employe_vente_id,
    manager_finances_id,
    employe_finances_id
  ;

  IF director_role_id IS NULL
     OR manager_gestion_stock_id IS NULL
     OR employe_gestion_stock_id IS NULL
     OR manager_vente_id IS NULL
     OR employe_vente_id IS NULL
     OR manager_finances_id IS NULL
     OR employe_finances_id IS NULL THEN
    RAISE EXCEPTION 'Un ou plusieurs rôles sont introuvables dans roles_utilisateur.';
  END IF;

  FOR i IN 1..array_length(emails, 1) LOOP
    SELECT id
    INTO user_id
    FROM utilisateurs
    WHERE email = emails[i];

    IF user_id IS NULL THEN
      RAISE EXCEPTION 'Utilisateur introuvable pour l''email %', emails[i];
    END IF;

    FOR j IN 1..3 LOOP
      INSERT INTO entreprises (
        nom,
        logo,
        code_couleur,
        argent_virtuel,
        statut,
        directeur
      )
      VALUES (
        format('Entreprise %s %s - Lot %s', prenoms[i], noms[i], j),
        NULL,
        CASE j
          WHEN 1 THEN '#1D4ED8'
          WHEN 2 THEN '#0F766E'
          ELSE '#B45309'
        END,
        0,
        'actif',
        user_id
      )
      RETURNING id INTO company_id;

      INSERT INTO appartenir_entreprise (
        utilisateur_id,
        entreprise_id,
        role_utilisateur_id,
        statut
      )
      VALUES (
        user_id,
        company_id,
        director_role_id,
        'actif'
      );

      member_email_1 := emails[((i) % array_length(emails, 1)) + 1];
      member_email_2 := emails[((i + 1) % array_length(emails, 1)) + 1];

      -- On affecte directement les UUID des rôles chargés en amont.
      -- Cela évite d'insérer des affiliations avec un rôle NULL.

      secondary_role_1 := CASE j
        WHEN 1 THEN manager_gestion_stock_id
        WHEN 2 THEN manager_vente_id
        ELSE manager_finances_id
      END;

      secondary_role_2 := CASE j
        WHEN 1 THEN employe_gestion_stock_id
        WHEN 2 THEN employe_vente_id
        ELSE employe_finances_id
      END;

      INSERT INTO appartenir_entreprise (
        utilisateur_id,
        entreprise_id,
        role_utilisateur_id,
        statut
      )
      VALUES
        (
          (SELECT id FROM utilisateurs WHERE email = member_email_1),
          company_id,
          secondary_role_1,
          'actif'
        ),
        (
          (SELECT id FROM utilisateurs WHERE email = member_email_2),
          company_id,
          secondary_role_2,
          'actif'
        );
    END LOOP;
  END LOOP;
END $$;
