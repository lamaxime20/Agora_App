-- =========================================================
-- ALTER TABLE notifications
-- Ancien schéma → nouveau schéma
-- =========================================================

-- 1. Supprimer les colonnes statut (enum) et actif (boolean)
ALTER TABLE notifications DROP COLUMN IF EXISTS statut;
ALTER TABLE notifications DROP COLUMN IF EXISTS actif;

-- 2. Supprimer la contrainte CHECK de l'enum type_notification
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_notification_check;

-- 3. Élargir type_notification en VARCHAR(100) et renommer en type
ALTER TABLE notifications ALTER COLUMN type_notification TYPE VARCHAR(100) USING type_notification::text;
ALTER TABLE notifications RENAME COLUMN type_notification TO type;

-- 4. Renommer titre → title
ALTER TABLE notifications RENAME COLUMN titre TO title;

-- 5. Supprimer les anciennes contraintes FK et index avant renommage
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_cr0;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_cr1;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_cr2;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_utilisateur_foreign;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_entreprise_foreign;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_role_foreign;
DROP INDEX IF EXISTS notifications_utilisateur_index;
DROP INDEX IF EXISTS notifications_entreprise_index;

-- 6. Renommer les colonnes FK
ALTER TABLE notifications RENAME COLUMN utilisateur TO user_id;
ALTER TABLE notifications RENAME COLUMN entreprise TO company_id;
ALTER TABLE notifications RENAME COLUMN role TO role_id;

-- 7. Renommer date_arrivee → created_at
ALTER TABLE notifications RENAME COLUMN date_arrivee TO created_at;

-- 8. Ajouter les nouvelles colonnes
ALTER TABLE notifications ADD COLUMN priority  VARCHAR(20)  NOT NULL DEFAULT 'medium';
ALTER TABLE notifications ADD COLUMN data       JSONB;
ALTER TABLE notifications ADD COLUMN read_at    TIMESTAMP;
ALTER TABLE notifications ADD COLUMN archived_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP;

-- 9. Recréer les contraintes FK avec les nouveaux noms de colonnes
ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_foreign
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_company_id_foreign
    FOREIGN KEY (company_id) REFERENCES entreprises(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_role_id_foreign
    FOREIGN KEY (role_id) REFERENCES roles_utilisateur(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Recréer les index
CREATE INDEX notifications_user_id_index    ON notifications(user_id);
CREATE INDEX notifications_company_id_index ON notifications(company_id);
CREATE INDEX notifications_role_id_index    ON notifications(role_id);
CREATE INDEX notifications_read_at_index    ON notifications(read_at);
CREATE INDEX notifications_archived_at_index ON notifications(archived_at);
