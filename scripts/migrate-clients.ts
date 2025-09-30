#!/usr/bin/env tsx
/**
 * Migration Script: Convert existing client_name strings to Client records
 * 
 * This script will:
 * 1. Extract unique client names from existing daily_work_entries
 * 2. Create Client records for each unique name
 * 3. Update daily_work_entries to reference the new client_id
 * 4. Preserve the original client_name for backward compatibility
 */

import { supabase } from '../lib/supabase'
import { ClientService } from '../lib/services/clients'

async function migrateClientNames() {
  console.log('🚀 Starting client migration...')
  
  try {
    // Run the migration function
    await ClientService.migrateFromClientNames()
    
    console.log('✅ Client migration completed successfully!')
    
    // Verify the results
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    
    if (clientError) {
      throw clientError
    }
    
    const { data: entries, error: entriesError } = await supabase
      .from('daily_work_entries')
      .select('client_id, client_name')
      .not('client_id', 'is', null)
    
    if (entriesError) {
      throw entriesError
    }
    
    console.log(`📊 Migration Results:`)
    console.log(`   • Created ${clients?.length || 0} client records`)
    console.log(`   • Updated ${entries?.length || 0} work entries with client_id`)
    
    console.log(`\n📋 New Clients:`)
    clients?.forEach((client: any, index: number) => {
      console.log(`   ${index + 1}. ${client.name}`)
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateClientNames()
    .then(() => {
      console.log('\n🎉 Migration completed! You can now use the full client management features.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error)
      process.exit(1)
    })
}

export { migrateClientNames }
