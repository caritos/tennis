#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * Validates that PostgreSQL functions match actual database schema
 * Prevents runtime errors from schema mismatches
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get actual database schema for a table
 */
async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', tableName)
      .eq('table_schema', 'public');

    if (error) {
      console.error(`❌ Failed to get schema for ${tableName}:`, error);
      return null;
    }

    return data.reduce((schema, col) => {
      schema[col.column_name] = {
        type: col.data_type,
        nullable: col.is_nullable === 'YES'
      };
      return schema;
    }, {});
  } catch (error) {
    console.error(`❌ Error getting schema for ${tableName}:`, error);
    return null;
  }
}

/**
 * Get list of existing PostgreSQL functions
 */
async function getDatabaseFunctions() {
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION');

    if (error) {
      console.error('❌ Failed to get database functions:', error);
      return [];
    }

    return data.map(row => row.routine_name);
  } catch (error) {
    console.error('❌ Error getting database functions:', error);
    return [];
  }
}

/**
 * Validate SQL files against actual database schema
 */
async function validateSqlFiles() {
  console.log('🔍 Validating PostgreSQL functions...');
  
  const errors = [];
  const warnings = [];
  
  // Check critical tables exist and have expected columns
  const criticalTables = ['matches', 'clubs', 'club_members', 'users'];
  const schemas = {};
  
  for (const table of criticalTables) {
    console.log(`📊 Checking ${table} table schema...`);
    const schema = await getTableSchema(table);
    if (!schema) {
      errors.push(`Table ${table} not found or inaccessible`);
      continue;
    }
    schemas[table] = schema;
    console.log(`✅ ${table}: ${Object.keys(schema).length} columns found`);
  }
  
  // Check database functions
  console.log('🔧 Checking existing database functions...');
  const existingFunctions = await getDatabaseFunctions();
  console.log(`📝 Found ${existingFunctions.length} database functions:`, existingFunctions.slice(0, 5));
  
  // Validate SQL files in database directory
  const dbDir = path.join(__dirname, '../database');
  const sqlFiles = fs.readdirSync(dbDir)
    .filter(file => file.endsWith('.sql'))
    .filter(file => file.includes('record-complete-match'));
    
  for (const file of sqlFiles) {
    console.log(`📄 Validating ${file}...`);
    const filePath = path.join(dbDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Check for non-existent columns
    if (sql.includes('last_activity') && !schemas.clubs?.last_activity) {
      errors.push(`${file}: References non-existent column clubs.last_activity`);
    }
    
    // Check for non-existent functions
    const functionCalls = sql.match(/(?:SELECT|PERFORM)\s+(\w+)\(/g);
    if (functionCalls) {
      functionCalls.forEach(call => {
        const funcName = call.match(/(?:SELECT|PERFORM)\s+(\w+)\(/)[1];
        if (funcName !== 'gen_random_uuid' && funcName !== 'NOW' && funcName !== 'json_build_object') {
          if (!existingFunctions.includes(funcName)) {
            warnings.push(`${file}: Calls potentially missing function ${funcName}()`);
          }
        }
      });
    }
    
    // Check column references
    const updateMatches = sql.match(/UPDATE\s+(\w+)\s+SET\s+([^WHERE]+)/gi);
    if (updateMatches) {
      updateMatches.forEach(update => {
        const [, table, columns] = update.match(/UPDATE\s+(\w+)\s+SET\s+([^WHERE]+)/i) || [];
        if (table && schemas[table]) {
          const columnUpdates = columns.split(',');
          columnUpdates.forEach(col => {
            const colName = col.split('=')[0].trim();
            if (colName && !schemas[table][colName]) {
              errors.push(`${file}: References non-existent column ${table}.${colName}`);
            }
          });
        }
      });
    }
  }
  
  return { errors, warnings, schemas };
}

/**
 * Test function existence
 */
async function testFunctionExists(functionName, testParams = {}) {
  try {
    const { error } = await supabase.rpc(functionName, testParams);
    
    if (error) {
      if (error.code === '42883') {
        return { exists: false, error: 'Function does not exist' };
      }
      // Any other error means function exists but failed due to parameters/logic
      return { exists: true, error: error.message };
    }
    
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('🎾 Database Schema Validation');
  console.log('============================');
  
  const { errors, warnings, schemas } = await validateSqlFiles();
  
  console.log('\n📋 Schema Summary:');
  Object.entries(schemas).forEach(([table, schema]) => {
    console.log(`  ${table}: ${Object.keys(schema).join(', ')}`);
  });
  
  // Test critical functions
  console.log('\n🧪 Testing function existence:');
  const functionsToTest = [
    'record_complete_match',
    'create_match_result_notifications', 
    'update_player_ratings'
  ];
  
  for (const func of functionsToTest) {
    const result = await testFunctionExists(func, { test: true });
    const status = result.exists ? '✅' : '❌';
    console.log(`  ${status} ${func}: ${result.exists ? 'EXISTS' : 'MISSING'}`);
    if (!result.exists) {
      errors.push(`Function ${func} does not exist in database`);
    }
  }
  
  console.log('\n📊 Validation Results:');
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Warnings: ${warnings.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach(error => console.log(`  • ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
  }
  
  if (errors.length === 0) {
    console.log('\n🎉 No schema validation errors found!');
    return true;
  } else {
    console.log(`\n💡 Fix ${errors.length} errors before deploying database functions`);
    return false;
  }
}

if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { main, validateSqlFiles, testFunctionExists };