const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import all models
const User = require('../models/User');
const Child = require('../models/Child');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
const VaccinationSchedule = require('../models/VaccinationSchedule');
const Certificate = require('../models/Certificate');

const connectDB = require('../config/db');

// Function to extract backup zip file
async function extractBackup(backupZipPath) {
  try {
    console.log(`📂 Extracting backup from: ${backupZipPath}`);
    
    const extractPath = path.join(__dirname, '../temp-backup');
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    
    await fs.createReadStream(backupZipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();
    
    console.log('✅ Backup extracted successfully');
    return extractPath;
  } catch (error) {
    console.error('❌ Error extracting backup:', error.message);
    throw error;
  }
}

// Function to read and validate metadata
function readMetadata(extractPath) {
  try {
    const metadataPath = path.join(extractPath, 'backup-metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Backup metadata not found');
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log('📋 Backup metadata loaded:', {
      timestamp: metadata.backupInfo.timestamp,
      collections: metadata.backupInfo.collections.length,
      version: metadata.backupInfo.version
    });
    
    return metadata;
  } catch (error) {
    console.error('❌ Error reading metadata:', error.message);
    throw error;
  }
}

// Function to import collection from JSON
async function importCollection(collectionName, Model, extractPath) {
  try {
    console.log(`📥 Importing ${collectionName}...`);
    
    const filePath = path.join(extractPath, `${collectionName}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ No backup file found for ${collectionName}, skipping...`);
      return { collection: collectionName, count: 0, status: 'skipped' };
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.length === 0) {
      console.log(`ℹ️ ${collectionName}: No data to import`);
      return { collection: collectionName, count: 0, status: 'empty' };
    }
    
    // Clear existing data (optional - can be commented out for append mode)
    await Model.deleteMany({});
    console.log(`🗑️ Cleared existing ${collectionName} data`);
    
    // Import new data
    const result = await Model.insertMany(data);
    console.log(`✅ ${collectionName}: ${result.length} documents imported`);
    
    return { collection: collectionName, count: result.length, status: 'imported' };
  } catch (error) {
    console.error(`❌ Error importing ${collectionName}:`, error.message);
    return { collection: collectionName, error: error.message, status: 'failed' };
  }
}

// Function to validate data integrity
async function validateImport(extractPath) {
  try {
    console.log('\n🔍 Validating imported data...');
    
    const collections = [
      { name: 'users', model: User },
      { name: 'children', model: Child },
      { name: 'childVaccinationRecords', model: ChildVaccinationRecord },
      { name: 'childVaccinationStatuses', model: ChildVaccinationStatus },
      { name: 'vaccinationSchedules', model: VaccinationSchedule },
      { name: 'certificates', model: Certificate }
    ];
    
    const validationResults = [];
    
    for (const collection of collections) {
      const filePath = path.join(extractPath, `${collection.name}.json`);
      if (fs.existsSync(filePath)) {
        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const importedCount = await collection.model.countDocuments();
        
        validationResults.push({
          collection: collection.name,
          backupCount: backupData.length,
          importedCount: importedCount,
          status: backupData.length === importedCount ? '✅ Valid' : '❌ Mismatch'
        });
      }
    }
    
    console.log('\n📊 Validation Results:');
    console.log('=====================');
    validationResults.forEach(result => {
      console.log(`${result.status} ${result.collection}: ${result.importedCount}/${result.backupCount}`);
    });
    
    return validationResults;
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return [];
  }
}

// Main import function
async function importDatabase(backupZipPath) {
  try {
    console.log('🚀 Starting database import...');
    
    // Validate backup file
    if (!fs.existsSync(backupZipPath)) {
      throw new Error(`Backup file not found: ${backupZipPath}`);
    }
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Extract backup
    const extractPath = await extractBackup(backupZipPath);
    
    // Read metadata
    const metadata = readMetadata(extractPath);
    
    // Import all collections
    const importResults = await Promise.all([
      importCollection('users', User, extractPath),
      importCollection('children', Child, extractPath),
      importCollection('childVaccinationRecords', ChildVaccinationRecord, extractPath),
      importCollection('childVaccinationStatuses', ChildVaccinationStatus, extractPath),
      importCollection('vaccinationSchedules', VaccinationSchedule, extractPath),
      importCollection('certificates', Certificate, extractPath)
    ]);
    
    // Validate import
    const validationResults = await validateImport(extractPath);
    
    // Generate summary
    console.log('\n📊 Import Summary:');
    console.log('==================');
    importResults.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.collection}: ${result.error}`);
      } else {
        console.log(`${result.status === 'imported' ? '✅' : '⚠️'} ${result.collection}: ${result.count} documents (${result.status})`);
      }
    });
    
    // Clean up
    fs.rmSync(extractPath, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary files');
    
    console.log('\n🎉 Database import completed successfully!');
    console.log('📋 Check the validation results above to ensure data integrity.');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Function to show usage instructions
function showUsage() {
  console.log('\n📖 Database Import Tool Usage:');
  console.log('==============================');
  console.log('node importDatabase.js <backup-file-path>');
  console.log('');
  console.log('Examples:');
  console.log('  node importDatabase.js ../backups/tateematy-backup-2024-01-15T10-30-00-000Z.zip');
  console.log('  node importDatabase.js ./client-backup.zip');
  console.log('');
  console.log('⚠️  WARNING: This will overwrite existing data in the target database!');
  console.log('💡 Make sure to backup your current data before running this script.');
}

// Run import if script is executed directly
if (require.main === module) {
  const backupPath = process.argv[2];
  
  if (!backupPath) {
    showUsage();
    process.exit(1);
  }
  
  importDatabase(backupPath);
}

module.exports = { importDatabase };
