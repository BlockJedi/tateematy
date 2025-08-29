const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { PinataSDK } = require('pinata');
const { Blob } = require('buffer');
const { ethers } = require('ethers');
const HTMLPdfGeneratorService = require('./htmlPdfGeneratorService');
const Child = require('../models/Child');
const ChildVaccinationStatus = require('../models/ChildVaccinationStatus');
const ChildVaccinationRecord = require('../models/ChildVaccinationRecord');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const VaccinationSchedule = require('../models/VaccinationSchedule');

class CertificateService {
  constructor() {
    // Initialize blockchain provider
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    // Initialize HTML-based PDF generator service
    this.pdfGenerator = new HTMLPdfGeneratorService();
  }

  // Generate unique certificate ID
  generateCertificateId(childId, certificateType) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CERT-${childId.toString().slice(-8)}-${certificateType.toUpperCase()}-${timestamp}-${randomSuffix}`;
  }

  // Generate vaccination certificate
  async generateCertificate(childId, certificateType) {
    try {
      console.log(`Generating ${certificateType} certificate for child ${childId}...`);
      
      // Check if certificate already exists
      const existingCertificate = await Certificate.findOne({ 
        childId: childId, 
        certificateType: certificateType 
      });
      
      if (existingCertificate) {
        console.log(`Certificate already exists for ${certificateType}. Returning existing data.`);
        return {
          success: true,
          message: 'Certificate already exists',
          certificateId: existingCertificate.certificateId,
          ipfsHash: existingCertificate.ipfsHash,
          ipfsUrl: existingCertificate.ipfsUrl,
          qrCodeData: existingCertificate.ipfsUrl,
          downloadUrl: existingCertificate.ipfsUrl,
          isExisting: true,
          existingCertificate: {
            _id: existingCertificate._id,
            certificateId: existingCertificate.certificateId,
            certificateType: existingCertificate.certificateType,
            childId: existingCertificate.childId,
            ipfsHash: existingCertificate.ipfsHash,
            ipfsUrl: existingCertificate.ipfsUrl,
            qrCodeData: existingCertificate.ipfsUrl,
            generatedAt: existingCertificate.generatedAt,
            mimeType: existingCertificate.mimeType,
            status: 'exists'
          }
        };
      }
      
      // Check eligibility based on certificate type
      let eligible = false;
      let reason = '';
      
      if (certificateType === 'school_readiness') {
        const requirements = await this.checkSchoolReadinessRequirements(childId);
        eligible = requirements.eligible;
        reason = requirements.reason;
      } else if (certificateType === 'completion') {
        const requirements = await this.checkCompletionRequirements(childId);
        eligible = requirements.eligible;
        reason = requirements.reason;
      } else if (certificateType === 'progress') {
        const progress = await this.getCurrentProgress(childId);
        eligible = progress.completionRate > 0;
        reason = eligible ? 'Progress certificate available' : 'No vaccinations completed yet';
      }
      
      if (!eligible) {
        return {
          success: false,
          message: 'Not eligible for certificate generation',
          reason: reason
        };
      }
      
      // Generate certificate image
      const imageBuffer = await this.generateCertificateImage(childId, certificateType);
      
      // Upload to IPFS (only for blockchain certificates)
      let ipfsHash = null;
      let ipfsUrl = null;
      let qrCodeData = null;
      
      if (certificateType === 'school_readiness' || certificateType === 'completion') {
        console.log(`Uploading ${certificateType} certificate to IPFS...`);
        const ipfsResult = await this.uploadToIPFS(imageBuffer, certificateType, childId);
        ipfsHash = ipfsResult.hash;
        ipfsUrl = ipfsResult.pinataUrl; // This is the complete Pinata gateway URL
        qrCodeData = ipfsResult.pinataUrl;
        console.log(`IPFS URL stored: ${ipfsUrl}`);
      } else {
        // For progress certificates, use a local URL or placeholder
        ipfsUrl = `/api/certificates/download/${childId}/${certificateType}`;
        qrCodeData = ipfsUrl;
      }
      
      // Generate certificate ID (only for blockchain certificates)
      let certificateId = null;
      if (certificateType === 'school_readiness' || certificateType === 'completion') {
        certificateId = `CERT-${certificateType.toUpperCase()}-${childId}-${Date.now()}`;
        console.log(`Generated certificate ID: ${certificateId}`);
      } else {
        console.log(`No certificate ID for ${certificateType} (progress certificates don't need IDs)`);
      }
      
      // Store certificate in database
      const certificate = new Certificate({
        childId: childId,
        certificateType: certificateType,
        certificateId: certificateId,
        ipfsHash: ipfsHash,
        ipfsUrl: ipfsUrl,
        qrCodeData: qrCodeData,
        mimeType: 'image/png',
        generatedAt: new Date(),
        // Add required fields
        fileSize: imageBuffer.length,
        fileName: `${certificateType}_${childId}_${Date.now()}.png`,
        status: 'generated',
        verified: certificateType === 'school_readiness' || certificateType === 'completion'
      });
      
      await certificate.save();
      
      console.log(`Certificate generated and stored successfully! ID: ${certificateId || 'N/A'}`);
      
      return {
        success: true,
        message: 'Certificate generated successfully',
        certificateId: certificateId,
        ipfsHash: ipfsHash,
        ipfsUrl: ipfsUrl,
        qrCodeData: qrCodeData,
        downloadUrl: ipfsUrl,
        imageBuffer: imageBuffer.toString('base64'), // Convert buffer to base64 for frontend download
        isExisting: false
      };
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new Error(`Failed to generate certificate: ${error.message}`);
    }
  }

  // Generate certificate image using HTML generator service
  async generateCertificateImage(childId, certificateType) {
    try {
      console.log(`Generating certificate image for ${certificateType}...`);
      
      // Get child data
      const child = await Child.findById(childId).populate('parent');
      if (!child) {
        throw new Error('Child not found');
      }
      
      // Get certificate data based on type
      let certificateData;
      
      if (certificateType === 'school_readiness') {
        const requirements = await this.checkSchoolReadinessRequirements(childId);
        certificateData = await this.generateSchoolReadinessCertificate(child, requirements);
      } else if (certificateType === 'completion') {
        const requirements = await this.checkCompletionRequirements(childId);
        certificateData = await this.generateCompletionCertificate(child, requirements);
      } else if (certificateType === 'progress') {
        const progress = await this.getCurrentProgress(childId);
        certificateData = await this.generateProgressCertificate(child, progress);
      } else {
        throw new Error('Invalid certificate type');
      }
      
      // Generate image using the HTML generator service
      const imageBuffer = await this.pdfGenerator.generateVaccinationCertificate(certificateData);
      console.log(`Certificate image generated successfully, size: ${imageBuffer.length} bytes`);
      
      return imageBuffer;
      
    } catch (error) {
      console.error('Error generating certificate image:', error);
      throw new Error(`Failed to generate certificate image: ${error.message}`);
    }
  }

  // Check school readiness requirements (age 6+)
  async checkSchoolReadinessRequirements(childId) {
    const child = await Child.findById(childId);
    const ageInMonths = this.calculateAgeInMonths(child.dateOfBirth);
    
    if (ageInMonths < 72) { // 6 years
      return { eligible: false, reason: 'Child must be at least 6 years old' };
    }

    // Required vaccines for school (birth to 6 years ONLY)
    const requiredAgeGroups = ['At Birth', '2 Months', '4 Months', '6 Months', '9 Months', '12 Months', '18 Months', '24 Months', '4-6 Years'];
    
    const vaccinationRecords = await ChildVaccinationRecord.find({ childId });
    const schedule = await VaccinationSchedule.find({ 
      visitAge: { $in: requiredAgeGroups },
      isRequired: true 
    });

    console.log(`Vaccination records found: ${vaccinationRecords.length}`);
    console.log(`Vaccination records:`, vaccinationRecords.map(record => record.vaccineName));
    console.log(`Required age groups for school: ${requiredAgeGroups.join(', ')}`);
    console.log(`Schedule items found: ${schedule.length}`);
    console.log(`Schedule items:`, schedule.map(item => `${item.vaccineName} (${item.visitAge})`));

    const completedVaccines = new Set();
    vaccinationRecords.forEach(record => {
      completedVaccines.add(record.vaccineName);
    });

    const requiredVaccines = new Set();
    schedule.forEach(item => {
      requiredVaccines.add(item.vaccineName);
    });

    // Check for extra vaccines that aren't in the required schedule
    const extraVaccines = Array.from(completedVaccines).filter(v => !requiredVaccines.has(v));
    if (extraVaccines.length > 0) {
      console.log(`⚠️ Extra vaccines found (not in required schedule): ${extraVaccines.join(', ')}`);
    }

    // Only count vaccines that are both completed AND required for this age group
    const relevantCompletedVaccines = Array.from(completedVaccines).filter(v => requiredVaccines.has(v));
    const relevantCompletedCount = relevantCompletedVaccines.length;
    const requiredCount = requiredVaccines.size;
    const completionRate = requiredCount > 0 ? (relevantCompletedCount / requiredCount) * 100 : 0;

    console.log(`Relevant completed vaccines (only required ones):`, relevantCompletedVaccines);
    console.log(`Completed vaccines:`, Array.from(completedVaccines));
    console.log(`Required vaccines:`, Array.from(requiredVaccines));
    console.log(`Missing vaccines:`, Array.from(requiredVaccines).filter(v => !completedVaccines.has(v)));
    console.log(`Extra vaccines:`, extraVaccines);
    console.log(`School readiness check: ${relevantCompletedCount}/${requiredCount} relevant vaccines completed = ${completionRate}%`);

    return {
      eligible: completionRate >= 100,
      reason: completionRate >= 100 ? 'All required vaccines completed' : 'Missing required vaccines',
      completionRate: Math.round(completionRate),
      completedVaccines: relevantCompletedVaccines, // Only return relevant completed vaccines
      requiredVaccines: Array.from(requiredVaccines),
      missingVaccines: Array.from(requiredVaccines).filter(v => !completedVaccines.has(v)),
      ageInMonths: ageInMonths,
      // Add the fields that the HTML template expects
      completedAgeAppropriate: relevantCompletedCount,
      totalAgeAppropriate: requiredCount
    };
  }

  // Check completion requirements (age 18+)
  async checkCompletionRequirements(childId) {
    const child = await Child.findById(childId);
    const ageInMonths = this.calculateAgeInMonths(child.dateOfBirth);
    
    if (ageInMonths < 216) { // 18 years
      return { eligible: false, reason: 'Child must be at least 18 years old' };
    }

    // Required vaccines for completion (birth to 18 years ONLY)
    const requiredAgeGroups = ['At Birth', '2 Months', '4 Months', '6 Months', '9 Months', '12 Months', '18 Months', '24 Months', '4-6 Years', '11 Years', '12 Years', '18 Years'];
    
    const vaccinationRecords = await ChildVaccinationRecord.find({ childId });
    const schedule = await VaccinationSchedule.find({ 
      visitAge: { $in: requiredAgeGroups },
      isRequired: true 
    });

    console.log(`Vaccination records found: ${vaccinationRecords.length}`);
    console.log(`Vaccination records:`, vaccinationRecords.map(record => record.vaccineName));
    console.log(`Required age groups for completion: ${requiredAgeGroups.join(', ')}`);
    console.log(`Schedule items found: ${schedule.length}`);
    console.log(`Schedule items:`, schedule.map(item => `${item.vaccineName} (${item.visitAge})`));

    const completedVaccines = new Set();
    vaccinationRecords.forEach(record => {
      completedVaccines.add(record.vaccineName);
    });

    const requiredVaccines = new Set();
    schedule.forEach(item => {
      requiredVaccines.add(item.vaccineName);
    });

    // Check for extra vaccines that aren't in the required schedule
    const extraVaccines = Array.from(completedVaccines).filter(v => !requiredVaccines.has(v));
    if (extraVaccines.length > 0) {
      console.log(`⚠️ Extra vaccines found (not in required schedule): ${extraVaccines.join(', ')}`);
    }

    // Only count vaccines that are both completed AND required for this age group
    const relevantCompletedVaccines = Array.from(completedVaccines).filter(v => requiredVaccines.has(v));
    const relevantCompletedCount = relevantCompletedVaccines.length;
    const requiredCount = requiredVaccines.size;
    const completionRate = requiredCount > 0 ? (relevantCompletedCount / requiredCount) * 100 : 0;

    console.log(`Relevant completed vaccines (only required ones):`, relevantCompletedVaccines);
    console.log(`Completed vaccines:`, Array.from(completedVaccines));
    console.log(`Required vaccines:`, Array.from(requiredVaccines));
    console.log(`Missing vaccines:`, Array.from(requiredVaccines).filter(v => !completedVaccines.has(v)));
    console.log(`Extra vaccines:`, extraVaccines);
    console.log(`Completion check: ${relevantCompletedCount}/${requiredCount} relevant vaccines completed = ${completionRate}%`);

    return {
      eligible: completionRate >= 100,
      reason: completionRate >= 100 ? 'All required vaccines completed' : 'Missing required vaccines',
      completionRate: Math.round(completionRate),
      completedVaccines: relevantCompletedVaccines, // Only return relevant completed vaccines
      requiredVaccines: Array.from(requiredVaccines),
      missingVaccines: Array.from(requiredVaccines).filter(v => !completedVaccines.has(v)),
      ageInMonths: ageInMonths,
      // Add the fields that the HTML template expects
      completedAgeAppropriate: relevantCompletedCount,
      totalAgeAppropriate: requiredCount
    };
  }

  // Get current progress for any age (shows progress from birth to 18 years)
  async getCurrentProgress(childId) {
    const child = await Child.findById(childId);
    const vaccinationRecords = await ChildVaccinationRecord.find({ childId }).populate('givenBy');
    
    // Get ALL required vaccines from birth to 18 years for progress certificate
    const fullSchedule = await VaccinationSchedule.find({ isRequired: true });
    
    console.log(`\n🔍 PROGRESS CERTIFICATE DEBUG:`);
    console.log(`Full schedule found: ${fullSchedule.length} vaccines`);
    console.log(`Schedule items:`, fullSchedule.map(item => `${item.vaccineName} (${item.visitAge})`));

    const completedVaccines = new Set();
    vaccinationRecords.forEach(record => {
      completedVaccines.add(record.vaccineName);
    });

    // Calculate child's current age in months
    const childAgeInMonths = this.calculateAgeInMonths(child.dateOfBirth);
    console.log(`Child birth date: ${child.dateOfBirth}`);
    console.log(`Calculated age in months: ${childAgeInMonths}`);
    
    // For progress certificate: show progress toward full 18-year completion
    const allRequiredVaccines = new Set();
    fullSchedule.forEach(item => {
      allRequiredVaccines.add(item.vaccineName);
    });

    console.log(`All required vaccines (0-18 years): ${allRequiredVaccines.size}`);
    console.log(`All required vaccines:`, Array.from(allRequiredVaccines));
    
    // Count vaccines that are both completed AND in the full 18-year schedule
    const relevantCompletedVaccines = Array.from(completedVaccines).filter(v => allRequiredVaccines.has(v));
    const relevantCompletedCount = relevantCompletedVaccines.length;
    const totalRequiredCount = allRequiredVaccines.size;
    const completionRate = totalRequiredCount > 0 ? (relevantCompletedCount / totalRequiredCount) * 100 : 0;

    console.log(`\n📊 PROGRESS CALCULATION:`);
    console.log(`Total required vaccines (0-18 years): ${totalRequiredCount}`);
    console.log(`Completed vaccines (0-18 years): ${relevantCompletedCount}`);
    console.log(`Completion rate: ${completionRate}%`);
    console.log(`Relevant completed vaccines:`, relevantCompletedVaccines);

    // Get missing vaccines for the full journey
    const missingVaccines = Array.from(allRequiredVaccines).filter(v => !completedVaccines.has(v));

    return {
      ageInMonths: childAgeInMonths,
      completionRate: Math.round(completionRate),
      completedVaccines: relevantCompletedVaccines, // Vaccines completed toward 18-year goal
      requiredVaccines: Array.from(allRequiredVaccines), // All vaccines required for 18-year completion
      missingVaccines: missingVaccines,
      recentVaccinations: vaccinationRecords.slice(-5), // Last 5 vaccinations
      nextDueVaccines: this.getNextDueVaccines(child.dateOfBirth, completedVaccines),
      eligible: true, // Progress certificates are always eligible - they show current status
      totalAgeAppropriate: totalRequiredCount, // Total required for 18-year completion
      completedAgeAppropriate: relevantCompletedCount, // Completed toward 18-year goal
      completedAgeAppropriateList: relevantCompletedVaccines // List of vaccines completed toward 18-year goal
    };
  }

  // Generate school readiness certificate
  async generateSchoolReadinessCertificate(child, requirements) {
    return {
      title: 'School Readiness Vaccination Certificate',
      subtitle: 'Ministry of Health - Kingdom of Saudi Arabia',
      childName: child.fullName,
      childId: child.childId,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      certificateType: 'School Readiness',
      requirements: requirements,
      issuedDate: new Date(),
      validity: 'Permanent',
      purpose: 'School Enrollment Verification',
      ministryLogo: true,
      blockchainVerification: true
    };
  }

  // Generate completion certificate
  async generateCompletionCertificate(child, requirements) {
    return {
      title: 'Complete Vaccination Certificate',
      subtitle: 'Ministry of Health - Kingdom of Saudi Arabia',
      childName: child.fullName,
      childId: child.childId,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      certificateType: 'Completion',
      requirements: requirements,
      issuedDate: new Date(),
      validity: 'Permanent',
      purpose: 'Lifetime Achievement Recognition',
      ministryLogo: true,
      blockchainVerification: true
    };
  }

  // Generate progress certificate
  async generateProgressCertificate(child, requirements) {
    const ageInMonths = requirements.ageInMonths || 0;
    const completionRate = requirements.completionRate || 0;
    
    let progressDescription = '';
    if (ageInMonths < 12) {
      progressDescription = `Infant Progress (${ageInMonths} months) - Shows vaccinations completed from birth to current age`;
    } else if (ageInMonths < 72) {
      progressDescription = `Toddler Progress (${ageInMonths} months) - Shows vaccinations completed from birth to current age`;
    } else if (ageInMonths < 216) {
      progressDescription = `Child Progress (${ageInMonths} months) - Shows vaccinations completed from birth to current age`;
    } else {
      progressDescription = `Teen Progress (${ageInMonths} months) - Shows vaccinations completed from birth to current age`;
    }
    
    return {
      title: 'Current Vaccination Progress Certificate',
      subtitle: 'Ministry of Health - Kingdom of Saudi Arabia',
      childName: child.fullName,
      childId: child.childId,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      certificateType: 'Progress',
      requirements: requirements,
      issuedDate: new Date(),
      validity: 'Current Status - Valid until next vaccination due',
      purpose: progressDescription,
      ministryLogo: true,
      blockchainVerification: false,
      summary: {
        totalCompleted: requirements.completedVaccines?.length || 0,
        ageAppropriateCompleted: requirements.completedAgeAppropriate || 0,
        ageInMonths: ageInMonths,
        completionRate: completionRate
      }
    };
  }

  // Calculate age in months
  calculateAgeInMonths(dateOfBirth) {
    console.log(`calculateAgeInMonths called with: ${dateOfBirth}`);
    console.log(`dateOfBirth type: ${typeof dateOfBirth}`);
    
    // Ensure we have a proper Date object
    let birthDate;
    if (dateOfBirth instanceof Date) {
      birthDate = dateOfBirth;
    } else if (typeof dateOfBirth === 'string') {
      birthDate = new Date(dateOfBirth);
    } else {
      birthDate = new Date(dateOfBirth);
    }
    
    const today = new Date();
    
    console.log(`Parsed birthDate: ${birthDate.toISOString()}`);
    console.log(`Today: ${today.toISOString()}`);
    
    // Ensure dates are valid
    if (isNaN(birthDate.getTime()) || isNaN(today.getTime())) {
      console.error('Invalid date provided:', dateOfBirth);
      return 0;
    }
    
    // Calculate age in months more accurately
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months += today.getMonth() - birthDate.getMonth();
    
    // Adjust for day of month
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    
    console.log(`Age calculation: Birth: ${birthDate.toISOString()}, Today: ${today.toISOString()}, Months: ${months}`);
    
    return Math.max(0, months); // Ensure non-negative age
  }

  // Get next due vaccines
  getNextDueVaccines(dateOfBirth, completedVaccines) {
    // This would calculate the next vaccines due based on age and completed vaccines
    // Implementation depends on your vaccination schedule logic
    return [];
  }

  async uploadToIPFS(imageBuffer, certificateType, childId) {
    const pinataJwt = process.env.PINATA_JWT;
    const pinataGateway = process.env.PINATA_GATEWAY || 'coffee-yawning-crab-618.mypinata.cloud';
    
    if (!pinataJwt) {
      throw new Error('Pinata JWT not configured');
    }
    
    try {
      const pinata = new PinataSDK({
        pinataJwt: pinataJwt,
        pinataGateway: pinataGateway
      });
      
      console.log('Uploading certificate to Pinata Cloud using SDK...');
      console.log(`Using gateway: ${pinataGateway}`);
      console.log(`Image buffer size: ${imageBuffer.length} bytes`);
      
      // Create a temporary file first
      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `${certificateType}_${childId}_${Date.now()}.png`);
      fs.writeFileSync(tempFilePath, imageBuffer);
      console.log(`Temp file created: ${tempFilePath}`);
      
      // Follow the exact pattern from your example
      const blob = new Blob([fs.readFileSync(tempFilePath)]);
      const file = new File([blob], `${certificateType}_${childId}_${Date.now()}.png`, { type: 'image/png' });
      
      // Upload using the SDK exactly as in your example
      const upload = await pinata.upload.public.file(file);
      
      console.log('Pinata upload result:', upload);
      console.log('Upload type:', typeof upload);
      console.log('Upload keys:', Object.keys(upload));
      console.log('CID:', upload.cid);
      console.log('File ID:', upload.id);
      console.log('File size:', upload.size);
      
      // Use the correct field from Pinata response
      const ipfsHash = upload.cid;
      
      if (!ipfsHash) {
        console.error('Full upload response:', JSON.stringify(upload, null, 2));
        throw new Error(`No CID found in Pinata response. Response keys: ${Object.keys(upload).join(', ')}`);
      }
      
      console.log(`Certificate uploaded to Pinata successfully! IPFS Hash: ${ipfsHash}`);
      
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('Temp file cleaned up');
      }
      
      return {
        hash: ipfsHash,
        size: imageBuffer.length,
        timestamp: new Date(),
        pinataUrl: `https://${pinataGateway}/ipfs/${ipfsHash}`,
        metadata: {
          name: `${certificateType} Certificate - ${childId}`,
          description: `Vaccination certificate for ${certificateType} type`,
          attributes: {
            certificateType: certificateType,
            childId: childId,
            generatedAt: new Date().toISOString(),
            issuer: 'Tateematy Vaccination System',
            country: 'Saudi Arabia',
            ministry: 'Ministry of Health'
          }
        }
      };
      
    } catch (error) {
      console.error('Pinata SDK upload error:', error);
      throw new Error(`Failed to upload to Pinata: ${error.message}`);
    }
  }

  // Get existing certificates for a child
  async getExistingCertificates(childId) {
    try {
      console.log(`Getting existing certificates for child ${childId}...`);
      
      const certificates = await Certificate.find({ childId: childId }).sort({ generatedAt: -1 });
      
      console.log(`Found ${certificates.length} existing certificates`);
      
      return {
        success: true,
        certificates: certificates.map(cert => ({
          _id: cert._id,
          certificateId: cert.certificateId,
          certificateType: cert.certificateType,
          childId: cert.childId,
          ipfsHash: cert.ipfsHash,
          ipfsUrl: cert.ipfsUrl,
          qrCodeData: cert.ipfsUrl,
          generatedAt: cert.generatedAt,
          mimeType: cert.mimeType,
          status: 'exists'
        }))
      };
      
    } catch (error) {
      console.error('Error getting existing certificates:', error);
      throw new Error(`Failed to get existing certificates: ${error.message}`);
    }
  }

  // Get certificate image data for existing certificates
  async getCertificateImage(childId, certificateType) {
    try {
      console.log(`Getting certificate image for ${certificateType}...`);
      
      // Check if certificate exists
      const existingCertificate = await Certificate.findOne({ 
        childId: childId, 
        certificateType: certificateType 
      });
      
      if (!existingCertificate) {
        throw new Error('Certificate not found');
      }
      
      // If it's a blockchain certificate (IPFS), return the IPFS URL
      if (existingCertificate.ipfsHash) {
        console.log('Certificate exists on IPFS, returning download URL...');
        
        // Safely handle the generatedAt date
        let fileName = `${certificateType}_${childId}`;
        if (existingCertificate.generatedAt) {
          try {
            const date = new Date(existingCertificate.generatedAt);
            if (!isNaN(date.getTime())) {
              fileName += `_${date.toISOString().split('T')[0]}`;
            }
          } catch (dateError) {
            console.warn('Error parsing generatedAt date:', dateError);
          }
        }
        fileName += '.png';
        
        return {
          success: true,
          downloadUrl: existingCertificate.ipfsUrl,
          ipfsHash: existingCertificate.ipfsHash,
          fileName: fileName
        };
      } else {
        // For non-blockchain certificates, return error
        throw new Error('Certificate image not available for download');
      }
      
    } catch (error) {
      console.error('Error getting certificate image:', error);
      throw new Error(`Failed to get certificate image: ${error.message}`);
    }
  }
}

module.exports = CertificateService;
