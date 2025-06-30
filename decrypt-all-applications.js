const { Client } = require('pg');
const CryptoJS = require('crypto-js');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'verify_db',
};

// Encryption key
const encryptionKey = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-32-chars-long';

/**
 * Decrypt an encrypted string
 */
function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return 'DECRYPTION_FAILED';
  }
}

/**
 * Fetch and decrypt all applications
 */
async function decryptAllApplications() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('🔗 Connected to database successfully\n');

    // Fetch all applications
    const result = await client.query(`
      SELECT 
        application_id,
        application_name,
        api_key,
        api_secret,
        api_key_expiry,
        is_active,
        created_at,
        updated_at
      FROM application_onboarding
      ORDER BY created_at DESC
    `);

    console.log(`📊 Found ${result.rows.length} applications\n`);

    if (result.rows.length === 0) {
      console.log('No applications found in the database.');
      return;
    }

    // Process each application
    result.rows.forEach((app, index) => {
      console.log(`\n--- Application ${index + 1} ---`);
      console.log(`Name: ${app.application_name}`);
      console.log(`ID: ${app.application_id}`);
      console.log(`Active: ${app.is_active}`);
      console.log(`Created: ${app.created_at}`);
      console.log(`Updated: ${app.updated_at}`);
      console.log(`Expiry: ${app.api_key_expiry}`);
      
      // Check if the API key is encrypted (starts with U2FsdGVkX1)
      const isEncrypted = app.api_key && app.api_key.startsWith('U2FsdGVkX1');
      
      if (isEncrypted) {
        console.log('\n🔐 Encrypted Values:');
        console.log(`API Key: ${app.api_key}`);
        console.log(`API Secret: ${app.api_secret}`);
        
        console.log('\n🔓 Decrypted Values:');
        console.log(`API Key: ${decrypt(app.api_key)}`);
        console.log(`API Secret: ${decrypt(app.api_secret)}`);
      } else {
        console.log('\n⚠️  Unencrypted Values (old data):');
        console.log(`API Key: ${app.api_key}`);
        console.log(`API Secret: ${app.api_secret}`);
      }
      
      console.log('\n' + '='.repeat(50));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  console.log('🔐 Application Decryption Tool\n');
  console.log('Encryption Key:', encryptionKey);
  console.log('Database:', `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}\n`);
  
  decryptAllApplications();
}

module.exports = {
  decrypt,
  decryptAllApplications
}; 