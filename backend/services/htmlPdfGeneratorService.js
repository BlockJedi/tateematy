const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

class HTMLPdfGeneratorService {
  constructor() {
    this.logosPath = path.join(__dirname, '../public/logos');
  }

  // Generate vaccination certificate as image
  async generateVaccinationCertificate(certificateData) {
    try {
      console.log('Generating HTML certificate template...');
      const html = this.generateCertificateHTML(certificateData);
      console.log('HTML template generated successfully');
      
      console.log('Converting HTML to high-quality image using Puppeteer...');
      const imageBuffer = await this.convertHTMLToImage(html);
      console.log(`Image generated successfully, size: ${imageBuffer.length} bytes`);
      
      // Ensure we return a proper Buffer
      if (!imageBuffer || typeof imageBuffer !== 'object') {
        throw new Error('Puppeteer did not return a valid image buffer');
      }
      
      // Convert to Buffer if it's not already
      if (!Buffer.isBuffer(imageBuffer)) {
        imageBuffer = Buffer.from(imageBuffer);
      }
      
      return imageBuffer;
    } catch (error) {
      console.error('Error generating image from HTML:', error);
      console.log('Falling back to simple text-based PDF...');
      
      // Fallback: Generate a simple text-based PDF
      return this.generateSimplePDF(certificateData);
    }
  }

  // Generate the HTML certificate template - Simplified Saudi MOH Design
  generateCertificateHTML(certificateData) {
    console.log('Generating simplified certificate HTML with data:', JSON.stringify(certificateData, null, 2));
    const requirements = certificateData.requirements || {};
    const completionRate = requirements.completionRate || 0;
    const ageInMonths = requirements.ageInMonths || 0;
    
    // Calculate age in years and months with better formatting
    const ageYears = Math.floor(ageInMonths / 12);
    const ageMonths = ageInMonths % 12;
    
    let ageText;
    if (ageYears === 0) {
      // Under 1 year: show only months
      ageText = `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    } else if (ageMonths === 0) {
      // Exact years: show only years
      ageText = `${ageYears} year${ageYears !== 1 ? 's' : ''}`;
    } else {
      // Years and months: show both
      ageText = `${ageYears} year${ageYears !== 1 ? 's' : ''}, ${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
    
    console.log(`Age formatting: ${ageInMonths} months → ${ageText}`);
    
    // Determine vaccination status
    let statusText = 'Up to Date';
    let statusColor = '#059669';
    if (completionRate < 80) {
      statusText = 'Pending Next Dose';
      statusColor = '#d97706';
    }
    if (completionRate < 60) {
      statusText = 'Overdue';
      statusColor = '#dc2626';
    }
    
    // Read and encode logos to base64
    let mohLogoBase64 = '';
    let systemLogoBase64 = '';
    
    try {
      // Try to find MOH logo (PNG or SVG)
      const mohLogoPngPath = path.join(this.logosPath, 'moh-logo.png');
      const mohLogoSvgPath = path.join(this.logosPath, 'Saudi_Ministry_of_Health_Logo.svg');
      
      if (fs.existsSync(mohLogoSvgPath)) {
        const mohLogoBuffer = fs.readFileSync(mohLogoSvgPath);
        mohLogoBase64 = `data:image/svg+xml;base64,${mohLogoBuffer.toString('base64')}`;
        console.log('MOH SVG logo loaded successfully');
      } else if (fs.existsSync(mohLogoPngPath)) {
        const mohLogoBuffer = fs.readFileSync(mohLogoPngPath);
        mohLogoBase64 = `data:image/png;base64,${mohLogoBuffer.toString('base64')}`;
        console.log('MOH PNG logo loaded successfully');
      }
      
      // Load system logo
      const systemLogoPath = path.join(this.logosPath, 'system-logo.png');
      if (fs.existsSync(systemLogoPath)) {
        const systemLogoBuffer = fs.readFileSync(systemLogoPath);
        systemLogoBase64 = `data:image/png;base64,${systemLogoBuffer.toString('base64')}`;
        console.log('System logo loaded successfully');
      }
    } catch (error) {
      console.log('Error loading logos:', error.message);
    }
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vaccination Certificate - ${certificateData.childName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: #1f2937;
            line-height: 1.4;
            font-size: 12px;
          }
          
          .certificate-container {
            width: 794px;
            height: 1123px;
            background: white;
            border: 4px solid #007A3D;
            position: relative;
            margin: 0 auto;
            box-shadow: 0 4px 20px rgba(0, 122, 61, 0.1);
          }
          
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(0, 122, 61, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 1;
            font-family: 'Arial', sans-serif;
          }
          
          .content-wrapper {
            position: relative;
            z-index: 2;
            padding: 40px;
            height: 100%;
          }
          
          /* Header Section */
          .header-section {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #007A3D;
            padding-bottom: 30px;
          }
          
          .moh-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px auto;
            display: block;
            object-fit: contain;
          }
          
          .moh-title {
            font-size: 28px;
            font-weight: bold;
            color: #007A3D;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .moh-subtitle {
            font-size: 18px;
            color: #374151;
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          .vision-text {
            font-size: 14px;
            color: #6b7280;
            font-style: italic;
            margin-bottom: 20px;
          }
          
          .tateematy-logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 10px auto;
            display: block;
            object-fit: contain;
          }
          
          /* Fallback styling for when logos can't be loaded */
          .moh-logo:not(img) {
            font-size: 48px;
            color: #007A3D;
            margin-bottom: 15px;
            text-align: center;
          }
          
          .tateematy-logo:not(img) {
            font-size: 36px;
            color: #1e40af;
            margin-bottom: 10px;
            text-align: center;
          }
          
          .tateematy-text {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          
          .certificate-type {
            font-size: 20px;
            color: #374151;
            font-weight: 600;
            margin-bottom: 20px;
          }
          
          /* Certificate Meta */
          .certificate-meta {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            gap: 20px;
          }
          
          .meta-item {
            text-align: center;
            flex: 1;
            min-width: 0;
          }
          
          .meta-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
          }
          
          .meta-value {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
          }
          
          /* Child Information */
          .child-info-section {
            background: #f9fafb;
            padding: 25px;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #007A3D;
            margin-bottom: 20px;
            text-align: center;
            border-bottom: 2px solid #007A3D;
            padding-bottom: 10px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .info-value {
            color: #111827;
            font-weight: bold;
            font-size: 14px;
          }
          
          /* Vaccination Status */
          .status-section {
            background: #f0f9ff;
            padding: 25px;
            border-radius: 12px;
            border: 2px solid #0ea5e9;
            margin-bottom: 30px;
            text-align: center;
          }
          
          .status-statement {
            font-size: 16px;
            color: #0c4a6e;
            line-height: 1.6;
            margin-bottom: 20px;
            font-weight: 500;
          }
          
          .status-badge {
            display: inline-block;
            padding: 8px 20px;
            background: ${statusColor};
            color: white;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          /* Footer */
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body {
              background: white;
            }
            .certificate-container {
              box-shadow: none;
              border: 3px solid #007A3D;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="watermark">تطعيمتي</div>
          <div class="content-wrapper">
            
            <!-- Header Section -->
            <div class="header-section">
              ${mohLogoBase64 ? `<img src="${mohLogoBase64}" alt="Ministry of Health" class="moh-logo">` : '<div class="moh-logo">🏥</div>'}
              <div class="moh-title">Ministry of Health</div>
              <div class="moh-subtitle">Kingdom of Saudi Arabia</div>
              <div class="vision-text">Vision 2030</div>
              
              ${systemLogoBase64 ? `<img src="${systemLogoBase64}" alt="Tateematy System" class="tateematy-logo">` : '<div class="tateematy-logo">💉</div>'}
              <div class="tateematy-text">تطعيمتي</div>
              <div class="certificate-type">Tateematy Vaccination Certificate</div>
            </div>
            
            <!-- Certificate Meta Information -->
            <div class="meta-section">
              ${certificateData.certificateId ? `
              <div class="meta-item">
                <span class="meta-label">Certificate ID</span>
                <span class="meta-value">${certificateData.certificateId}</span>
              </div>
              ` : ''}
              <div class="meta-item">
                <span class="meta-label">Issue Date</span>
                <span class="meta-value">${new Date(certificateData.issuedDate).toLocaleDateString()}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Validity</span>
                <span class="meta-value">${certificateData.validity}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Purpose</span>
                <span class="meta-value">${certificateData.purpose}</span>
              </div>
            </div>
            
            <!-- Child Information -->
            <div class="child-info-section">
              <div class="section-title">👤 Child Information</div>
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Full Name</span>
                  <span class="info-value">${certificateData.childName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">National ID</span>
                  <span class="info-value">${certificateData.childId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date of Birth</span>
                  <span class="info-value">${new Date(certificateData.dateOfBirth).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Current Age</span>
                  <span class="info-value">${ageText}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Gender</span>
                  <span class="info-value">${certificateData.gender}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Completion Rate</span>
                  <span class="info-value">${requirements.completedAgeAppropriate || 0} out of ${requirements.totalAgeAppropriate || 0} vaccines completed (${completionRate}%)</span>
                </div>
              </div>
            </div>
            
            <!-- Vaccination Status -->
            <div class="status-section">
              <div class="status-statement">
                ✅ This is to certify that <strong>${certificateData.childName}</strong>, age <strong>${ageText}</strong>, 
                has received ${requirements.completedAgeAppropriate || 0} out of ${requirements.totalAgeAppropriate || 0} vaccinations required up to this age according to the Saudi Ministry of Health schedule.
              </div>
              <div class="status-badge">
                Status: ${statusText}
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              © 2025 Ministry of Health – Saudi Arabia
            </div>
            
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Convert HTML to high-quality image using Puppeteer
  async convertHTMLToImage(html) {
    let browser;
    try {
      console.log('Launching Puppeteer browser...');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      console.log('Creating new page...');
      const page = await browser.newPage();
      
      // Set viewport to A4 dimensions (portrait)
      await page.setViewport({
        width: 794,  // A4 width in pixels (72 DPI)
        height: 1123, // A4 height in pixels (72 DPI)
        deviceScaleFactor: 2 // Higher resolution
      });
      
      console.log('Setting HTML content...');
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Wait a bit for any animations or fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Generating high-quality image...');
      const imageBuffer = await page.screenshot({
        type: 'png',
        fullPage: false, // Only capture the viewport
        omitBackground: false
      });
      
      console.log(`Image generated with Puppeteer, size: ${imageBuffer.length} bytes`);
      console.log(`Buffer type: ${typeof imageBuffer}, isBuffer: ${Buffer.isBuffer(imageBuffer)}, constructor: ${imageBuffer.constructor.name}`);
      return imageBuffer;
    } catch (error) {
      console.error('Puppeteer image generation error:', error);
      throw error;
    } finally {
      if (browser) {
        console.log('Closing browser...');
        await browser.close();
      }
    }
  }

  // Fallback method: Generate beautiful PDF using PDFKit with logos
  generateSimplePDF(certificateData) {
    console.log('Generating beautiful fallback PDF using PDFKit...');
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Page dimensions
        const pageWidth = doc.page.width - 60;
        const centerX = pageWidth / 2;

        // Draw beautiful borders
        doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30)
           .lineWidth(3)
           .strokeColor('#007A3D')
           .stroke();

        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
           .lineWidth(1)
           .strokeColor('#007A3D')
           .stroke();

        // Header with Ministry branding and logos
        try {
          // Try to add MOH logo
          const mohLogoPath = path.join(this.logosPath, 'moh-logo.png');
          if (fs.existsSync(mohLogoPath)) {
            doc.image(mohLogoPath, centerX - 100, 40, { width: 80, height: 80 });
          } else {
            // Fallback to emoji if logo not found
            doc.fontSize(32)
               .fillColor('#007A3D')
               .text('🏥', centerX - 20, 50, { align: 'center' });
          }
        } catch (error) {
          console.log('Could not load MOH logo, using emoji fallback');
          doc.fontSize(32)
             .fillColor('#007A3D')
             .text('🏥', centerX - 20, 50, { align: 'center' });
        }

        doc.fontSize(24)
           .fillColor('#007A3D')
           .text('Ministry of Health', centerX, 90, { align: 'center' });

        doc.fontSize(18)
           .fillColor('#4B4B4B')
           .text('Kingdom of Saudi Arabia', centerX, 120, { align: 'center' });

        // Add Vision 2030 logo
        try {
          const visionLogoPath = path.join(this.logosPath, 'vision2030-logo.png');
          if (fs.existsSync(visionLogoPath)) {
            doc.image(visionLogoPath, centerX + 20, 130, { width: 60, height: 60 });
          }
        } catch (error) {
          console.log('Could not load Vision 2030 logo');
        }
        
        doc.fontSize(14)
           .fillColor('#666666')
           .text('Vision 2030', centerX, 150, { align: 'center' });

        // Certificate Title
        doc.fontSize(28)
           .fillColor('#007A3D')
           .text('تطعيمتي', centerX, 190, { align: 'center' });

        doc.fontSize(24)
           .fillColor('#007A3D')
           .text('Tateematy', centerX, 220, { align: 'center' });

        doc.fontSize(18)
           .fillColor('#4B4B4B')
           .text(`${certificateData.certificateType} Certificate`, centerX, 250, { align: 'center' });

        // Certificate ID
        doc.fontSize(12)
           .fillColor('#666666')
           .text(`Certificate ID: ${certificateData.certificateId || 'N/A'}`, centerX, 280, { align: 'center' });

        let yPosition = 320;

        // Child Information Section
        doc.fontSize(16)
           .fillColor('#007A3D')
           .text('Child Information', centerX, yPosition, { align: 'center' });
        yPosition += 30;

        // Create info boxes
        const leftColumn = 80;
        const rightColumn = 350;
        const rowHeight = 25;

        // Child Name
        this.addStyledRow(doc, 'Full Name:', certificateData.childName, leftColumn, rightColumn, yPosition);
        yPosition += rowHeight;

        // Child ID
        this.addStyledRow(doc, 'Child ID:', certificateData.childId, leftColumn, rightColumn, yPosition);
        yPosition += rowHeight;

        // Date of Birth
        this.addStyledRow(doc, 'Date of Birth:', new Date(certificateData.dateOfBirth).toLocaleDateString(), leftColumn, rightColumn, yPosition);
        yPosition += rowHeight;

        // Gender
        this.addStyledRow(doc, 'Gender:', certificateData.gender, leftColumn, rightColumn, yPosition);
        yPosition += 40;

        // Certificate Details Section
        doc.fontSize(16)
           .fillColor('#007A3D')
           .text('Certificate Details', centerX, yPosition, { align: 'center' });
        yPosition += 30;

        // Certificate Type
        this.addStyledRow(doc, 'Type:', certificateData.certificateType, leftColumn, rightColumn, yPosition);
        yPosition += rowHeight;

        // Issued Date
        this.addStyledRow(doc, 'Issued Date:', new Date(certificateData.issuedDate).toLocaleDateString(), leftColumn, rightColumn, yPosition);
        yPosition += rowHeight;

        // Validity
        this.addStyledRow(doc, 'Validity:', certificateData.validity, leftColumn, rightColumn, yPosition);
        yPosition += rowHeight;

        // Purpose
        this.addStyledRow(doc, 'Purpose:', certificateData.purpose, leftColumn, rightColumn, yPosition);
        yPosition += 40;

        // Vaccination Progress Section
        if (certificateData.requirements) {
          doc.fontSize(16)
             .fillColor('#007A3D')
             .text('Vaccination Progress', centerX, yPosition, { align: 'center' });
          yPosition += 30;

          // Progress bar background
          const progressBarWidth = 300;
          const progressBarHeight = 20;
          const progressBarX = centerX - (progressBarWidth / 2);
          
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
             .text(`${completionRate}% Complete`, centerX, yPosition + 5, { align: 'center' });
          yPosition += 40;

          // Statistics grid
          const statsY = yPosition;
          doc.fontSize(12)
             .fillColor('#000000');

          // Left column stats
          doc.text(`Age: ${certificateData.requirements.ageInMonths || 0} months`, leftColumn, statsY);
          doc.text(`Completed: ${certificateData.requirements.completedVaccines?.length || 0}`, leftColumn, statsY + 20);
          
          // Right column stats
          doc.text(`Required: ${certificateData.requirements.requiredVaccines?.length || 0}`, rightColumn, statsY);
          doc.text(`Missing: ${certificateData.requirements.missingVaccines?.length || 0}`, rightColumn, statsY + 20);
          
          yPosition += 60;

          // Completed Vaccines List
          if (certificateData.requirements.completedVaccines && certificateData.requirements.completedVaccines.length > 0) {
            doc.fontSize(14)
               .fillColor('#007A3D')
               .text('Completed Vaccines:', leftColumn, yPosition);
            yPosition += 25;

            doc.fontSize(10)
               .fillColor('#666666');
            
            const vaccinesPerRow = 3;
            const vaccines = certificateData.requirements.completedVaccines;
            
            for (let i = 0; i < vaccines.length; i += vaccinesPerRow) {
              const rowVaccines = vaccines.slice(i, i + vaccinesPerRow);
              const rowText = rowVaccines.join('    ');
              doc.text(rowText, leftColumn, yPosition);
              yPosition += 15;
            }
          }
        }

        // Footer
        yPosition += 40;
        doc.fontSize(10)
           .fillColor('#666666')
           .text('Generated by Tateematy Vaccination Management System', centerX, yPosition, { align: 'center' });
        
        yPosition += 20;
        doc.text('This certificate is valid for current vaccination status only', centerX, yPosition, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper method to add styled rows
  addStyledRow(doc, label, value, leftColumn, rightColumn, yPosition) {
    doc.fontSize(12)
       .fillColor('#000000')
       .text(label, leftColumn, yPosition);
    
    doc.fontSize(12)
       .fillColor('#333333')
       .text(value, rightColumn, yPosition);
  }

  // Generate school readiness certificate
  async generateSchoolReadinessCertificate(certificateData) {
    return this.generateVaccinationCertificate(certificateData);
  }

  // Generate completion certificate
  async generateCompletionCertificate(certificateData) {
    return this.generateVaccinationCertificate(certificateData);
  }
}

module.exports = HTMLPdfGeneratorService;
