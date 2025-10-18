#!/usr/bin/env python3
import json
import os

def generate_sql_from_schema():
    # Read the API schema
    with open('schema/api_schema.json', 'r') as f:
        schema = json.load(f)
    
    sql_statements = []
    sql_statements.append("-- Mari Gunting Database Schema Export")
    sql_statements.append("-- Generated from production database")
    sql_statements.append("-- Date: " + json.dumps(schema.get('info', {}).get('version', 'unknown')))
    sql_statements.append("")
    
    # Extract table definitions
    definitions = schema.get('definitions', {})
    
    for table_name, table_def in definitions.items():
        # Skip system tables
        if table_name.startswith('pg_') or table_name in ['geography_columns', 'geometry_columns', 'spatial_ref_sys']:
            continue
            
        sql_statements.append(f"-- Table: {table_name}")
        sql_statements.append(f"CREATE TABLE IF NOT EXISTS public.{table_name} (")
        
        properties = table_def.get('properties', {})
        required = table_def.get('required', [])
        
        columns = []
        for col_name, col_def in properties.items():
            col_type = col_def.get('format', col_def.get('type', 'text'))
            
            # Map JSON types to PostgreSQL types
            type_mapping = {
                'integer': 'integer',
                'int4': 'integer',
                'int8': 'bigint',
                'bigint': 'bigint',
                'number': 'numeric',
                'float4': 'real',
                'float8': 'double precision',
                'string': 'text',
                'text': 'text',
                'varchar': 'character varying',
                'boolean': 'boolean',
                'bool': 'boolean',
                'timestamp': 'timestamp with time zone',
                'timestamptz': 'timestamp with time zone',
                'timestamp without time zone': 'timestamp without time zone',
                'uuid': 'uuid',
                'json': 'json',
                'jsonb': 'jsonb',
                'array': 'text[]',
                'date': 'date',
                'time': 'time without time zone',
                'timetz': 'time with time zone'
            }
            
            pg_type = type_mapping.get(col_type, 'text')
            
            # Check if column is required (NOT NULL)
            null_constraint = ' NOT NULL' if col_name in required else ''
            
            # Check for default values
            default = col_def.get('default', '')
            if default:
                default = f" DEFAULT {default}"
            
            columns.append(f"    {col_name} {pg_type}{null_constraint}{default}")
        
        sql_statements.append(",\n".join(columns))
        sql_statements.append(");")
        sql_statements.append("")
    
    # Save to file
    with open('schema/database_schema.sql', 'w') as f:
        f.write("\n".join(sql_statements))
    
    print(f"Generated SQL schema with {len(definitions)} tables")
    print("Saved to: supabase-backup/schema/database_schema.sql")

if __name__ == "__main__":
    generate_sql_from_schema()