import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Gift, 
  CheckCircle, 
  AlertCircle, 
  Wallet, 
  Award,
  ExternalLink,
  Info
} from 'lucide-react';
import { tokenRewardsAPI } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

interface TokenRewardsProps {
  children: any[];
  selectedChildId?: string;
}

interface EligibilityData {
  eligible: boolean;
  completedCount: number;
  requiredCount: number;
  isFullScheduleCompleted: boolean;
  estimatedReward: {
    baseReward: number;
    bonusReward: number;
    totalReward: number;
  };
}

interface RewardCalculation {
  eligibility: EligibilityData;
  reward: {
    baseReward: number;
    bonusReward: number;
    totalReward: number;
    message: string;
  };
  childInfo: {
    name: string;
    ageInMonths: number;
  };
}

interface ContractStats {
  name: string;
  symbol: string;
  totalSupply: string;
  totalRewardsDistributed: string;
  totalParentsRewarded: string;
  rewardPerChild: string;
  maxSupply: string;
}

const TokenRewards: React.FC<TokenRewardsProps> = ({ children, selectedChildId }) => {
  const { user: profile } = useAuth();
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [rewardCalculation, setRewardCalculation] = useState<RewardCalculation | null>(null);
  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChildId) {
      const child = children.find(c => c._id === selectedChildId);
      setSelectedChild(child);
      if (child) {
        checkEligibility(child._id);
        getRewardCalculation(child._id);
      }
    } else if (children.length > 0) {
      setSelectedChild(children[0]);
      checkEligibility(children[0]._id);
      getRewardCalculation(children[0]._id);
    }
    
    // Load contract statistics
    loadContractStats();
  }, [selectedChildId, children]);

  const loadContractStats = async () => {
    try {
      const response = await tokenRewardsAPI.getContractStats();
      if (response.success) {
        setContractStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load contract stats:', err);
    }
  };

  const checkEligibility = async (childId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await tokenRewardsAPI.checkEligibility(childId);
      if (response.success) {
        setEligibility(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const getRewardCalculation = async (childId: string) => {
    try {
      const response = await tokenRewardsAPI.getRewardCalculation(childId);
      if (response.success) {
        setRewardCalculation(response.data);
      }
    } catch (err: any) {
      console.error('Failed to get reward calculation:', err);
    }
  };

  const claimTokens = async () => {
    if (!selectedChild) {
      setError('Please select a child');
      return;
    }

    if (!profile?.walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await tokenRewardsAPI.claimTokens(selectedChild._id, profile.walletAddress);
      
      if (response.success) {
        if (response.data.simulated) {
          setSuccess(`🎉 Tokens simulated successfully! You would receive ${response.data.reward.totalReward} TAT for ${selectedChild.fullName}'s vaccination completion.`);
        } else {
          setSuccess(`🎉 TATEEMATY tokens claimed successfully! Transaction: ${response.data.transactionHash}. You received ${response.data.reward.totalReward} TAT.`);
        }
        
        // Refresh data
        checkEligibility(selectedChild._id);
        getRewardCalculation(selectedChild._id);
        loadContractStats();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to claim tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (childId: string) => {
    const child = children.find(c => c._id === childId);
    setSelectedChild(child);
    if (child) {
      checkEligibility(child._id);
      getRewardCalculation(child._id);
    }
  };

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center py-12">
          <Coins className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
          <p className="text-gray-500">Add a child to start earning TATEEMATY token rewards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Coins className="w-6 h-6 text-yellow-600 mr-3" />
              TATEEMATY Token Rewards
            </h2>
            <p className="text-gray-600">
              Earn TATEEMATY (TAT) tokens for completing your children's vaccination schedules on the Vanar Vanguard blockchain
            </p>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      {contractStats && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              TATEEMATY Contract Information
            </h3>
            <a 
              href="https://explorer-vanguard.vanarchain.com/address/0x3083AD49C27286DaB08881405F48ca50C96d80E6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-yellow-600 hover:text-yellow-700 flex items-center text-sm"
            >
              View on Explorer
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-yellow-700 font-medium">Token</p>
              <p className="text-yellow-900">{contractStats.name} ({contractStats.symbol})</p>
            </div>
            <div>
              <p className="text-yellow-700 font-medium">Reward per Child</p>
              <p className="text-yellow-900">{contractStats.rewardPerChild}</p>
            </div>
            <div>
              <p className="text-yellow-700 font-medium">Total Supply</p>
              <p className="text-yellow-900">{contractStats.totalSupply} TAT</p>
            </div>
            <div>
              <p className="text-yellow-700 font-medium">Parents Rewarded</p>
              <p className="text-yellow-900">{contractStats.totalParentsRewarded}</p>
            </div>
          </div>
        </div>
      )}

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Child
          </label>
          <select
            value={selectedChild?._id || ''}
            onChange={(e) => handleChildChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.fullName} ({Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Eligibility and Rewards */}
      {selectedChild && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eligibility Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Eligibility Status</h3>
              {eligibility?.eligible ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Checking eligibility...</p>
              </div>
            ) : eligibility ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Child:</span>
                  <span className="font-medium">{selectedChild.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vaccinations Completed:</span>
                  <span className="font-medium">{eligibility.completedCount} / {eligibility.requiredCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Full Schedule:</span>
                  <span className={`font-medium ${eligibility.isFullScheduleCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                    {eligibility.isFullScheduleCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Eligible for Rewards:</span>
                  <span className={`font-medium ${eligibility.eligible ? 'text-green-600' : 'text-yellow-600'}`}>
                    {eligibility.eligible ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {!eligibility.eligible && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You must complete 100% of the vaccination schedule to be eligible for TATEEMATY tokens.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No eligibility data available
              </div>
            )}
          </div>

          {/* Rewards Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Token Rewards</h3>
              <Gift className="w-6 h-6 text-yellow-600" />
            </div>
            
            {rewardCalculation ? (
              <div className="space-y-4">
                {rewardCalculation.reward.totalReward > 0 ? (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Full Completion Reward:</span>
                      <span className="font-bold text-green-700">
                        {rewardCalculation.reward.totalReward} TAT
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      🎉 All vaccinations completed! You've earned the full TATEEMATY reward.
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Progress:</span>
                      <span className="font-bold text-yellow-700">
                        {eligibility?.completedCount || 0} / {eligibility?.requiredCount || 0}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Complete all {eligibility?.requiredCount || 0} vaccinations to earn 500 TAT tokens
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">Total Reward:</span>
                    <span className="font-bold text-blue-700 text-lg">
                      {rewardCalculation.reward.totalReward} TAT
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {rewardCalculation.reward.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No reward data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Tokens */}
      {selectedChild && eligibility?.eligible && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Claim Your TATEEMATY Tokens
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Wallet Address:</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                  {profile?.walletAddress || 'Not connected'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                TATEEMATY tokens will be sent to your connected wallet address on the Vanar Vanguard blockchain
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Important:</strong> Each child can only be rewarded once. The smart contract prevents duplicate claims.
                  Tokens will be minted directly to your wallet address.
                </div>
              </div>
            </div>
            
            <button
              onClick={claimTokens}
              disabled={loading || !profile?.walletAddress}
              className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Claiming TATEEMATY Tokens...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5 mr-2" />
                  Claim {eligibility?.estimatedReward.totalReward} TAT
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenRewards;
