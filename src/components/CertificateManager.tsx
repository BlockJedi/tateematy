import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Shield,
  GraduationCap,
  Award,
  Loader,
  Eye,
  ExternalLink
} from 'lucide-react';
import { certificateAPI } from '../lib/api';

interface CertificateRequirements {
  eligible: boolean;
  reason?: string;
  completionRate?: number;
  completedVaccines?: string[];
  requiredVaccines?: string[];
  missingVaccines?: string[];
  ageInMonths?: number;
  recentVaccinations?: any[];
  nextDueVaccines?: any[];
  totalAgeAppropriate?: number;
  completedAgeAppropriate?: number;
  completedAgeAppropriateList?: string[];
}

interface CertificateData {
  certificateId?: string; // Optional - only for blockchain certificates
  certificateType: string;
  childId: string;
  imageBuffer?: any;
  ipfsHash?: string;
  ipfsUrl?: string;
  blockchainTx?: string;
  verified: boolean;
  generatedAt: Date;
  requirements?: CertificateRequirements; // Make optional since we might not always have it
  status?: string; // Add status field
}

interface CertificateManagerProps {
  childId: string;
  childName: string;
  childAge: number; // in months
}

const CertificateManager: React.FC<CertificateManagerProps> = ({
  childId,
  childName,
  childAge
}) => {
  const [certificateType, setCertificateType] = useState<string>('');
  const [requirements, setRequirements] = useState<CertificateRequirements | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<any[]>([]);

  // Load existing certificates on component mount
  useEffect(() => {
    if (childId) {
      loadExistingCertificates();
    }
  }, [childId]);

  const loadExistingCertificates = async () => {
    try {
      const response = await certificateAPI.getExisting(childId);
      if (response.success) {
        setCertificates(response.certificates);
      }
    } catch (error) {
      console.error('Error loading existing certificates:', error);
    }
  };

  // Certificate types with descriptions
  const certificateTypes = [
    {
      id: 'progress',
      name: 'Current Progress Certificate',
      description: 'Shows completed vaccinations up to current age',
      icon: <Shield className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      available: true,
      requirements: 'Always available - shows current progress'
    },
    {
      id: 'school_readiness',
      name: 'School Readiness Certificate',
      description: 'Required for school enrollment (age 6+)',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      available: childAge >= 72, // 6 years
      requirements: 'Age 6+ with all required vaccines (birth to 6 years)'
    },
    {
      id: 'completion',
      name: 'Complete Vaccination Certificate',
      description: 'Lifetime achievement recognition (age 18+)',
      icon: <Award className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      available: childAge >= 216, // 18 years
      requirements: 'Age 18+ with all required vaccines completed'
    }
  ];

  const checkEligibility = async (type: string) => {
    try {
      setIsCheckingEligibility(true);
      setError(null);
      setRequirements(null);

      const response = await certificateAPI.checkEligibility(childId, type);
      if (response.success) {
        setRequirements(response.data.requirements);
        setCertificateType(type);
      } else {
        setError(response.message || 'Failed to check eligibility');
      }
    } catch (err: any) {
      console.error('Error checking eligibility:', err);
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const generateCertificate = async (certificateType: string) => {
    if (!childId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await certificateAPI.generate(childId, certificateType);
      
      if (response.success) {
        if (response.isExisting) {
          // Certificate already exists - show existing data with buttons
          setError(null);
          setGeneratedCertificate(response.existingCertificate);
          setError('Certificate already exists!');
        } else {
          // New certificate generated
          setError(null);
          setGeneratedCertificate({
            childId: childId,
            certificateType: certificateType,
            certificateId: response.certificateId,
            ipfsHash: response.ipfsHash,
            ipfsUrl: response.ipfsUrl,
            blockchainTx: response.blockchainTx,
            imageBuffer: response.imageBuffer, // Include the image buffer for immediate download
            generatedAt: new Date(),
            verified: certificateType === 'school_readiness' || certificateType === 'completion',
            status: 'generated'
          });
        }
      } else {
        setError(response.message || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      setError('Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (certificateData: CertificateData) => {
    try {
      // For newly generated certificates, download directly from imageBuffer
      if (certificateData.imageBuffer) {
        console.log('Downloading newly generated certificate from imageBuffer...');
        
        const byteCharacters = atob(certificateData.imageBuffer);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${certificateData.certificateType}_${childName}_${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('Image download completed successfully');
        return;
      }
      
      // Check if this is a mock certificate (for testing without Pinata)
      if (certificateData.ipfsUrl && certificateData.ipfsUrl.includes('mock_')) {
        console.log('This is a mock certificate - Pinata upload is disabled for testing');
        setError('Certificate download is currently disabled (Pinata upload skipped for testing). The certificate image was generated successfully and stored locally.');
        return;
      }
      
      // If it's an existing certificate, open the IPFS URL directly
      if (certificateData.status === 'exists' || certificateData.ipfsUrl) {
        console.log('Opening existing certificate from IPFS...');
        
        if (certificateData.ipfsUrl) {
          // Open the IPFS URL directly in a new tab
          window.open(certificateData.ipfsUrl, '_blank');
          console.log('Opened certificate in new tab');
        } else {
          // Fallback: try to get the download URL from the API
          try {
            const response = await certificateAPI.downloadImage(childId, certificateData.certificateType);
            
            if (response.success && response.downloadUrl) {
              window.open(response.downloadUrl, '_blank');
              console.log('Opened certificate in new tab');
            } else {
              throw new Error('Failed to get certificate download URL');
            }
          } catch (apiError) {
            console.error('API error, trying direct IPFS access...');
            // If API fails, try to construct IPFS URL from hash
            if (certificateData.ipfsHash) {
              const ipfsUrl = `https://ipfs.io/ipfs/${certificateData.ipfsHash}`;
              window.open(ipfsUrl, '_blank');
              console.log('Opened certificate using IPFS hash');
            } else {
              throw new Error('No IPFS URL or hash available');
            }
          }
        }
      } else {
        throw new Error('No image data available for download');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to download image: ${errorMessage}`);
    }
  };

  const generateQRCode = (certificateData: CertificateData) => {
    // Generate QR code data for the certificate
    let qrData = '';
    
    if (certificateData.verified && certificateData.ipfsHash) {
      // For blockchain certificates, include IPFS and blockchain info
      qrData = JSON.stringify({
        type: 'vaccination_certificate',
        certificateType: certificateData.certificateType,
        childId: certificateData.childId,
        ipfsHash: certificateData.ipfsHash,
        blockchainTx: certificateData.blockchainTx,
        verified: true,
        generatedAt: certificateData.generatedAt
      });
    } else {
      // For local certificates, include basic info
      qrData = JSON.stringify({
        type: 'vaccination_certificate',
        certificateType: certificateData.certificateType,
        childId: certificateData.childId,
        verified: false,
        generatedAt: certificateData.generatedAt
      });
    }
    
    // Create QR code URL using a QR code service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    // Open QR code in new window
    window.open(qrCodeUrl, '_blank');
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'progress':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'school_readiness':
        return <GraduationCap className="w-5 h-5 text-green-500" />;
      case 'completion':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'school_readiness':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'completion':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Vaccination Certificates</h3>
          <p className="text-gray-600">Generate and download vaccination certificates for {childName}</p>
        </div>
      </div>

      {/* Certificate Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {certificateTypes.map((type) => (
          <div
            key={type.id}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              type.available 
                ? 'hover:shadow-md hover:scale-105' 
                : 'opacity-60 cursor-not-allowed'
            } ${type.bgColor} ${type.borderColor}`}
            onClick={() => type.available && checkEligibility(type.id)}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={type.color}>{type.icon}</div>
              <h4 className={`font-semibold ${type.color}`}>{type.name}</h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{type.description}</p>
            
            <div className="text-xs text-gray-500 mb-3">
              <strong>Requirements:</strong> {type.requirements}
            </div>

            {type.available ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Available
              </div>
            ) : (
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                Not yet available
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Eligibility Check Results */}
      {requirements && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {certificateTypes.find(t => t.id === certificateType)?.name} - Eligibility Check
            </h4>
            <button
              onClick={() => {
                setRequirements(null);
                setCertificateType('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {requirements.eligible ? (
            <div className="space-y-4">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Eligible for certificate generation</span>
              </div>

              {requirements.completionRate !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{requirements.completionRate}%</div>
                    <div className="text-sm text-blue-600">Completion Rate</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{requirements.completedVaccines?.length || 0}</div>
                    <div className="text-sm text-green-600">Completed Vaccines</div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{requirements.requiredVaccines?.length || 0}</div>
                    <div className="text-sm text-purple-600">Required Vaccines</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => generateCertificate(certificateType)}
                disabled={isGenerating}
                className="w-full bg-moh-green text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Certificate
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Not eligible for certificate generation</span>
              </div>
              
              <p className="text-gray-600">{requirements.reason}</p>

              {requirements.missingVaccines && requirements.missingVaccines.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Missing Age-Appropriate Vaccines:</h5>
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Age:</strong> {requirements.ageInMonths} months<br/>
                      <strong>Age-Appropriate Vaccines:</strong> {requirements.totalAgeAppropriate || requirements.requiredVaccines?.length || 0}<br/>
                      <strong>Completed:</strong> {requirements.completedAgeAppropriate || requirements.completedVaccines?.length || 0}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {requirements.missingVaccines.map((vaccine, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {vaccine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generated Certificate */}
      {generatedCertificate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Generated Certificate</h4>
            <button
              onClick={() => setGeneratedCertificate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(generatedCertificate.certificateType)}`}>
                {getStatusIcon(generatedCertificate.certificateType)}
                <span className="ml-2">{generatedCertificate.certificateType}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                Generated: {new Date(generatedCertificate.generatedAt).toLocaleString()}
              </div>
            </div>

            {generatedCertificate.verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Blockchain Verified Certificate</span>
                </div>
                <div className="text-sm text-green-600 mt-1">
                  This certificate is permanently stored on the blockchain and IPFS
                </div>
                
                {generatedCertificate.ipfsHash && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>IPFS Hash:</strong> {generatedCertificate.ipfsHash}
                  </div>
                )}
                
                {generatedCertificate.blockchainTx && (
                  <div className="mt-1 text-xs text-gray-600">
                    <strong>Blockchain TX:</strong> {generatedCertificate.blockchainTx}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* View on Blockchain Button */}
              {generatedCertificate.verified && generatedCertificate.blockchainTx && (
                <button
                  onClick={() => {
                    const network = 'holesky'; // This should come from certificate data
                    const url = `https://${network}.etherscan.io/tx/${generatedCertificate.blockchainTx}`;
                    window.open(url, '_blank');
                  }}
                  className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Blockchain
                </button>
              )}
              
              {/* Download Image Button */}
              <button
                onClick={() => downloadImage(generatedCertificate)}
                className="bg-moh-green text-white py-3 px-4 rounded-lg hover:bg-green-600 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </button>
              
              {/* Generate QR Code Button */}
              <button
                onClick={() => generateQRCode(generatedCertificate)}
                className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Generate QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Certificates */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Existing Certificates</h4>
          
          <div className="space-y-4">
            {certificates.map((cert, index) => (
              <div key={cert._id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cert.certificateType)}`}>
                      {getStatusIcon(cert.certificateType)}
                      <span className="ml-2">{cert.certificateType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      Generated: {cert.generatedAt ? new Date(cert.generatedAt).toLocaleString() : 'Unknown'}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {cert.ipfsUrl && (
                      <button
                        onClick={() => window.open(cert.ipfsUrl, '_blank')}
                        className="bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </button>
                    )}
                    
                    <button
                      onClick={() => downloadImage(cert)}
                      className="bg-moh-green text-white py-2 px-3 rounded-lg hover:bg-green-600 flex items-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
                
                {cert.ipfsHash && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>IPFS Hash:</strong> {cert.ipfsHash}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManager;
