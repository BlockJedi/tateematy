const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
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

// Create backup directory
const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `tateematy-backup-${timestamp}`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath, { recursive: true });
}

// Function to export collection to JSON
async function exportCollection(collectionName, Model) {
  try {
    console.log(`📤 Exporting ${collectionName}...`);
    const data = await Model.find({}).lean();
    
    const filePath = path.join(backupPath, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`✅ ${collectionName}: ${data.length} documents exported`);
    return { collection: collectionName, count: data.length, file: filePath };
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error.message);
    return { collection: collectionName, error: error.message };
  }
}

// Function to create metadata file
function createMetadata() {
  const metadata = {
    backupInfo: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: process.env.MONGODB_URI || 'mongodb://localhost:27017/tateematy',
      collections: [
        'users',
        'children',
        'childVaccinationRecords',
        'childVaccinationStatuses',
        'vaccinationSchedules',
        'certificates'
      ]
    },
    exportInfo: {
      totalCollections: 6,
      backupPath: backupPath,
      instructions: {
        import: 'Use the importDatabase.js script to restore this backup',
        requirements: 'MongoDB with mongoose, same models structure',
        notes: 'Ensure all required models are available before importing'
      }
    }
  };

  const metadataPath = path.join(backupPath, 'backup-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('📋 Backup metadata created');
  return metadata;
}

// Function to create compressed backup
async function createCompressedBackup() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${backupPath}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 Compressed backup created: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(backupPath, false);
    archive.finalize();
  });
}

// Main backup function
async function backupDatabase() {
  try {
    console.log('🚀 Starting database backup...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Export all collections
    const exportResults = await Promise.all([
      exportCollection('users', User),
      exportCollection('children', Child),
      exportCollection('childVaccinationRecords', ChildVaccinationRecord),
      exportCollection('childVaccinationStatuses', ChildVaccinationStatus),
      exportCollection('vaccinationSchedules', VaccinationSchedule),
      exportCollection('certificates', Certificate)
    ]);

    // Create metadata
    const metadata = createMetadata();

    // Create compressed backup
    await createCompressedBackup();

    // Generate summary
    console.log('\n📊 Backup Summary:');
    console.log('==================');
    exportResults.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.collection}: ${result.error}`);
      } else {
        console.log(`✅ ${result.collection}: ${result.count} documents`);
      }
    });

    console.log(`\n📁 Backup location: ${backupPath}`);
    console.log(`📦 Compressed backup: ${backupPath}.zip`);
    console.log(`📋 Metadata: ${path.join(backupPath, 'backup-metadata.json')}`);

    // Clean up uncompressed files
    fs.rmSync(backupPath, { recursive: true, force: true });
    console.log('🧹 Cleaned up uncompressed files');

    console.log('\n🎉 Database backup completed successfully!');
    console.log('📤 The compressed backup file is ready for transfer to client system.');

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run backup if script is executed directly
if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };
