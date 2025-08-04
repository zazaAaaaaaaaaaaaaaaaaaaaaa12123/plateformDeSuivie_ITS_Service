-- Script SQL pour ajouter les colonnes JSON nécessaires
-- Exécutez ce script dans votre interface PostgreSQL (pgAdmin, psql, etc.)

-- Ajouter les colonnes JSON si elles n'existent pas
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS container_numbers_list JSONB;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS container_foot_types_map JSONB;

-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
AND column_name IN ('container_numbers_list', 'container_foot_types_map')
ORDER BY column_name;

-- Afficher un échantillon des données pour vérifier
SELECT 
  id,
  container_number,
  container_numbers_list,
  container_foot_types_map,
  created_at
FROM deliveries 
ORDER BY created_at DESC
LIMIT 3;

-- Compter le nombre total de livraisons
SELECT COUNT(*) as total_deliveries FROM deliveries;
