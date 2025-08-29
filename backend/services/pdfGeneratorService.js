const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGeneratorService {
  constructor() {
    this.logosPath = path.join(__dirname, '../public/logos');
  }

  // Generate vaccination certificate PDF
  async generateVaccinationCertificate(certificateData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          margins: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Page dimensions
        const pageWidth = doc.page.width - 80;
        const centerX = pageWidth / 2;

        // Generate certificate content
        this.generateHeader(doc, centerX);
        this.generateCertificateTitle(doc, centerX, certificateData);
        this.generateChildInformation(doc, centerX, certificateData);
        this.generateCertificateDetails(doc, centerX, certificateData);
        this.generateVaccinationProgress(doc, centerX, certificateData);
        this.generateFooter(doc, centerX, certificateData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate certificate header with MOH branding
  generateHeader(doc, centerX) {
    // Background border (official document style)
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .strokeColor('#007A3D') // MOH Green
       .stroke();

    // Inner border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(1)
       .strokeColor('#007A3D')
       .stroke();

    // MOH Logo (placeholder - will be replaced with actual logo)
    doc.fontSize(36)
       .fillColor('#007A3D')
       .text('🏥', centerX - 20, 60, { align: 'center' });

    // Ministry of Health Title
    doc.fontSize(24)
       .fillColor('#007A3D')
       .text('وزارة الصحة', centerX, 100, { align: 'center' }); // Arabic

    doc.fontSize(24)
       .fillColor('#007A3D')
       .text('Ministry of Health', centerX, 130, { align: 'center' }); // English

    // Kingdom of Saudi Arabia
    doc.fontSize(18)
       .fillColor('#4B4B4B')
       .text('المملكة العربية السعودية', centerX, 160, { align: 'center' }); // Arabic

    doc.fontSize(18)
       .fillColor('#4B4B4B')
       .text('Kingdom of Saudi Arabia', centerX, 190, { align: 'center' }); // English

    // Vision 2030 Logo reference
    doc.fontSize(12)
       .fillColor('#666666')
       .text('Vision 2030', centerX, 220, { align: 'center' });
  }

  // Generate certificate title section
  generateCertificateTitle(doc, centerX, certificateData) {
    // Certificate Title
    doc.fontSize(28)
       .fillColor('#007A3D')
       .text(certificateData.title, centerX, 250, { align: 'center' });

    // Certificate Number
    if (certificateData.certificateId) {
      doc.fontSize(12)
         .fillColor('#666666')
         .text(`رقم الشهادة: ${certificateData.certificateId}`, centerX, 290, { align: 'center' }); // Arabic
      doc.text(`Certificate ID: ${certificateData.certificateId}`, centerX, 305, { align: 'center' }); // English
    }
  }

  // Generate child information section
  generateChildInformation(doc, centerX, certificateData) {
    let yPosition = 340;

    // Section Header
    doc.fontSize(16)
       .fillColor('#007A3D')
       .text('معلومات الطفل', centerX, yPosition, { align: 'center' }); // Arabic
    yPosition += 25;
    doc.text('Child Information', centerX, yPosition, { align: 'center' }); // English
    yPosition += 40;

    // Table format for child details
    const leftColumn = 80;
    const rightColumn = 350;
    const rowHeight = 25;

    // Child Name
    this.addTableRow(doc, 'الاسم الكامل:', 'Full Name:', certificateData.childName, leftColumn, rightColumn, yPosition);
    yPosition += rowHeight;

    // Child ID
    this.addTableRow(doc, 'رقم الطفل:', 'Child ID:', certificateData.childId, leftColumn, rightColumn, yPosition);
    yPosition += rowHeight;

    // Date of Birth
    this.addTableRow(doc, 'تاريخ الميلاد:', 'Date of Birth:', 
      new Date(certificateData.dateOfBirth).toLocaleDateString('ar-SA'), leftColumn, rightColumn, yPosition);
    yPosition += rowHeight;

    // Gender
    const genderAr = certificateData.gender === 'male' ? 'ذكر' : 'أنثى';
    this.addTableRow(doc, 'الجنس:', 'Gender:', `${genderAr} / ${certificateData.gender}`, leftColumn, rightColumn, yPosition);
    yPosition += 40;

    return yPosition;
  }

  // Generate certificate details section
  generateCertificateDetails(doc, centerX, certificateData) {
    let yPosition = 500;

    // Section Header
    doc.fontSize(16)
       .fillColor('#007A3D')
       .text('تفاصيل الشهادة', centerX, yPosition, { align: 'center' }); // Arabic
    yPosition += 25;
    doc.text('Certificate Details', centerX, yPosition, { align: 'center' }); // English
    yPosition += 40;

    const leftColumn = 80;
    const rightColumn = 350;
    const rowHeight = 25;

    // Certificate Type
    this.addTableRow(doc, 'نوع الشهادة:', 'Certificate Type:', certificateData.certificateType, leftColumn, rightColumn, yPosition);
    yPosition += rowHeight;

    // Issued Date
    this.addTableRow(doc, 'تاريخ الإصدار:', 'Issued Date:', 
      new Date(certificateData.issuedDate).toLocaleDateString('ar-SA'), leftColumn, rightColumn, yPosition);
    yPosition += rowHeight;

    // Validity
    this.addTableRow(doc, 'الصلاحية:', 'Validity:', certificateData.validity, leftColumn, rightColumn, yPosition);
    yPosition += rowHeight;

    // Purpose
    this.addTableRow(doc, 'الغرض:', 'Purpose:', certificateData.purpose, leftColumn, rightColumn, yPosition);
    yPosition += 40;

    return yPosition;
  }

  // Generate vaccination progress section
  generateVaccinationProgress(doc, centerX, certificateData) {
    if (!certificateData.requirements) return;

    let yPosition = 640;

    // Section Header
    doc.fontSize(16)
       .fillColor('#007A3D')
       .text('تقدم التطعيم', centerX, yPosition, { align: 'center' }); // Arabic
    yPosition += 25;
    doc.text('Vaccination Progress', centerX, yPosition, { align: 'center' }); // English
    yPosition += 40;

    // Progress bar
    const progressBarWidth = 300;
    const progressBarHeight = 20;
    const progressBarX = centerX - (progressBarWidth / 2);
    
    // Progress bar background
    doc.rect(progressBarX, yPosition, progressBarWidth, progressBarHeight)
       .fillColor('#E5E7EB')
       .fill();

    // Progress bar fill
    const completionRate = certificateData.requirements.completionRate || 0;
    const fillWidth = (progressBarWidth * completionRate) / 100;
    
    doc.rect(progressBarX, yPosition, fillWidth, progressBarHeight)
       .fillColor('#007A3D')
       .fill();

    // Progress percentage text
    doc.fontSize(14)
       .fillColor('#000000')
       .text(`${completionRate}% مكتمل`, centerX, yPosition + 5, { align: 'center' }); // Arabic
    yPosition += 25;
    doc.text(`${completionRate}% Complete`, centerX, yPosition, { align: 'center' }); // English
    yPosition += 40;

    // Statistics grid
    const statsY = yPosition;
    doc.fontSize(12)
       .fillColor('#000000');

    const leftColumn = 80;
    const rightColumn = 350;

    // Left column stats
    doc.text(`العمر: ${certificateData.requirements.ageInMonths || 0} شهر`, leftColumn, statsY); // Arabic
    doc.text(`Age: ${certificateData.requirements.ageInMonths || 0} months`, leftColumn, statsY + 20); // English
    
    doc.text(`المكتمل: ${certificateData.requirements.completedVaccines?.length || 0}`, leftColumn, statsY + 40); // Arabic
    doc.text(`Completed: ${certificateData.requirements.completedVaccines?.length || 0}`, leftColumn, statsY + 60); // English
    
    // Right column stats
    doc.text(`المطلوب: ${certificateData.requirements.requiredVaccines?.length || 0}`, rightColumn, statsY); // Arabic
    doc.text(`Required: ${certificateData.requirements.requiredVaccines?.length || 0}`, rightColumn, statsY + 20); // English
    
    doc.text(`الناقص: ${certificateData.requirements.missingVaccines?.length || 0}`, rightColumn, statsY + 40); // Arabic
    doc.text(`Missing: ${certificateData.requirements.missingVaccines?.length || 0}`, rightColumn, statsY + 60); // English
    
    yPosition += 80;

    // Completed Vaccines List
    if (certificateData.requirements.completedVaccines && certificateData.requirements.completedVaccines.length > 0) {
      doc.fontSize(14)
         .fillColor('#007A3D')
         .text('اللقاحات المكتملة:', leftColumn, yPosition); // Arabic
      yPosition += 20;
      doc.text('Completed Vaccines:', leftColumn, yPosition); // English
      yPosition += 25;

      doc.fontSize(10)
         .fillColor('#666666');
      
      const vaccinesPerRow = 2; // Reduced for Arabic text
      const vaccines = certificateData.requirements.completedVaccines;
      
      for (let i = 0; i < vaccines.length; i += vaccinesPerRow) {
        const rowVaccines = vaccines.slice(i, i + vaccinesPerRow);
        const rowText = rowVaccines.join('    ');
        doc.text(rowText, leftColumn, yPosition);
        yPosition += 15;
      }
    }
  }

  // Generate footer section
  generateFooter(doc, centerX, certificateData) {
    let yPosition = doc.page.height - 120;

    // System information
    doc.fontSize(10)
       .fillColor('#666666')
       .text('تم إنشاؤها بواسطة نظام تطعيمات تطعيمات', centerX, yPosition, { align: 'center' }); // Arabic
    yPosition += 20;
    doc.text('Generated by Tateematy Vaccination Management System', centerX, yPosition, { align: 'center' }); // English
    
    yPosition += 20;
    doc.text('هذه الشهادة صالحة لحالة التطعيم الحالية فقط', centerX, yPosition, { align: 'center' }); // Arabic
    yPosition += 20;
    doc.text('This certificate is valid for current vaccination status only', centerX, yPosition, { align: 'center' }); // English

    // Certificate validity notice
    yPosition += 20;
    doc.fontSize(9)
       .fillColor('#999999')
       .text('For verification, contact your healthcare provider or visit the MOH portal', centerX, yPosition, { align: 'center' });
  }

  // Helper method to add table rows with Arabic and English labels
  addTableRow(doc, labelAr, labelEn, value, leftColumn, rightColumn, yPosition) {
    // Arabic label
    doc.fontSize(12)
       .fillColor('#000000')
       .text(labelAr, leftColumn, yPosition);
    
    // English label
    doc.fontSize(10)
       .fillColor('#666666')
       .text(labelEn, leftColumn, yPosition + 15);
    
    // Value
    doc.fontSize(12)
       .fillColor('#333333')
       .text(value, rightColumn, yPosition);
  }

  // Generate school readiness certificate (special format)
  async generateSchoolReadinessCertificate(certificateData) {
    return this.generateVaccinationCertificate(certificateData);
  }

  // Generate completion certificate (special format)
  async generateCompletionCertificate(certificateData) {
    return this.generateVaccinationCertificate(certificateData);
  }
}

module.exports = PDFGeneratorService;
