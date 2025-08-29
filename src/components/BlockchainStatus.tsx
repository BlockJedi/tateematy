import React from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface BlockchainStatusProps {
  isRecorded: boolean;
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: string;
  className?: string;
}

const BlockchainStatus: React.FC<BlockchainStatusProps> = ({
  isRecorded,
  transactionHash,
  blockNumber,
  timestamp,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (isRecorded) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (isRecorded) {
      return 'Blockchain Verified';
    }
    return 'Pending Blockchain';
  };

  const getStatusColor = () => {
    if (isRecorded) {
      return 'text-green-600';
    }
    return 'text-yellow-600';
  };

  const getExplorerUrl = () => {
    if (!transactionHash) return undefined;
    
    // Vanar Vanguard explorer - using the new contract address
    return `https://explorer.vanarchain.com/tx/${transactionHash}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      {isRecorded && transactionHash && (
        <a
          href={getExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center hover:underline"
          title="View on Blockchain Explorer"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View
        </a>
      )}
    </div>
  );
};

export default BlockchainStatus;
