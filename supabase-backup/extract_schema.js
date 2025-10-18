const SUPABASE_URL = 'https://uufiyurcsldecspakneg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Zml5dXJjc2xkZWNzcGFrbmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk4MDgyNCwiZXhwIjoyMDc1NTU2ODI0fQ.VXkCjFe9blUBydpo9CGp5B0BhHMj5TB988EMv15Uz4U';

const fs = require('fs');
const path = require('path');

async function runQuery(query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    // Try alternative method
    return null;
  }
  
  return await response.json();
}

async function extractSchema() {
  console.log('Extracting database schema...\n');
  
  // Get all tables
  const tablesQuery = `
    SELECT 
      schemaname,
      tablename,
      tableowner
    FROM pg_tables 
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename;
  `;
  
  // Get all columns
  const columnsQuery = `
    SELECT 
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position;
  `;
  
  // Get all functions
  const functionsQuery = `
    SELECT 
      routine_schema,
      routine_name,
      routine_type,
      data_type
    FROM information_schema.routines
    WHERE routine_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY routine_schema, routine_name;
  `;
  
  // Get all indexes
  const indexesQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY schemaname, tablename, indexname;
  `;
  
  // Get all constraints
  const constraintsQuery = `
    SELECT 
      constraint_schema,
      constraint_name,
      table_schema,
      table_name,
      constraint_type
    FROM information_schema.table_constraints
    WHERE constraint_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `;
  
  // Get all sequences
  const sequencesQuery = `
    SELECT 
      sequence_schema,
      sequence_name,
      data_type,
      start_value,
      minimum_value,
      maximum_value,
      increment
    FROM information_schema.sequences
    WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema');
  `;
  
  // Get all views
  const viewsQuery = `
    SELECT 
      table_schema,
      table_name,
      view_definition
    FROM information_schema.views
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `;
  
  // Get all triggers
  const triggersQuery = `
    SELECT 
      trigger_schema,
      trigger_name,
      event_manipulation,
      event_object_schema,
      event_object_table,
      action_statement,
      action_orientation,
      action_timing
    FROM information_schema.triggers
    WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY trigger_schema, trigger_name;
  `;
  
  const schema = {
    extractedAt: new Date().toISOString(),
    database: 'mari-gunting-production',
    tables: await runQuery(tablesQuery),
    columns: await runQuery(columnsQuery),
    functions: await runQuery(functionsQuery),
    indexes: await runQuery(indexesQuery),
    constraints: await runQuery(constraintsQuery),
    sequences: await runQuery(sequencesQuery),
    views: await runQuery(viewsQuery),
    triggers: await runQuery(triggersQuery)
  };
  
  // Save to file
  fs.writeFileSync(
    path.join(__dirname, 'schema/database_schema.json'),
    JSON.stringify(schema, null, 2)
  );
  
  console.log('Schema extraction complete!');
  console.log(`Saved to: supabase-backup/schema/database_schema.json`);
}

// Alternative method using direct API calls
async function extractViaAPI() {
  console.log('Extracting schema via REST API...\n');
  
  // Get list of all tables
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    }
  });
  
  const apiSchema = await response.json();
  
  // Save API schema
  fs.writeFileSync(
    path.join(__dirname, 'schema/api_definitions.json'),
    JSON.stringify(apiSchema, null, 2)
  );
  
  // Extract table list
  const tables = Object.keys(apiSchema.definitions || {});
  console.log(`Found ${tables.length} tables/views`);
  
  // Save table list
  fs.writeFileSync(
    path.join(__dirname, 'schema/tables_list.json'),
    JSON.stringify(tables, null, 2)
  );
  
  console.log('API extraction complete!');
}

// Run extraction
extractViaAPI().catch(console.error);