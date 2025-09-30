#!/usr/bin/env ts-node

import { AuthService } from '../lib/services/auth'

async function initializeAdmin() {
  try {
    console.log('Initializing default admin user...')
    await AuthService.initializeDefaultAdmin()
    console.log('✅ Admin initialization complete')
  } catch (error) {
    console.error('❌ Error initializing admin:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeAdmin()
}

export { initializeAdmin }
