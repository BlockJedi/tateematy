import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  User, 
  Search, 
  Filter, 
  Download, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { vaccinationAPI } from '../lib/api';

interface VaccinationRecord {
  _id: string;
  childId: string;
  vaccineName: string;
  doseNumber: number;
  visitAge: string;
  dateGiven: string;
  givenBy: {
    _id: string;
    fullName: string;
  };
  location: string;
  notes?: string;
  createdAt: string;
  // Blockchain fields
  blockchainHash?: string;
  blockchainTxId?: string;
  blockchainBlockNumber?: number;
  blockchainTimestamp?: string;
  isBlockchainRecorded?: boolean;
}

interface Child {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
}

interface VaccinationRecordsProps {
  children?: Child[];
  showChildSelector?: boolean;
  selectedChildId?: string;
  onChildSelect?: (childId: string) => void;
}

const VaccinationRecords: React.FC<VaccinationRecordsProps> = ({
  children = [],
  showChildSelector = true,
  selectedChildId,
  onChildSelect
}) => {
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVaccine, setFilterVaccine] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'vaccine' | 'child'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available vaccines for filtering - dynamically generated from records
  const availableVaccines = React.useMemo(() => {
    const uniqueVaccines = new Set(records.map(record => record.vaccineName));
    return Array.from(uniqueVaccines).sort();
  }, [records]);

  useEffect(() => {
    console.log('🔍 VaccinationRecords useEffect triggered:', { selectedChildId, childrenCount: children.length });
    if (selectedChildId) {
      console.log('📋 Fetching records for selected child:', selectedChildId);
      fetchVaccinationRecords(selectedChildId);
    } else if (children.length > 0) {
      console.log('👥 Fetching records for all children:', children.length);
      // Fetch records for all children
      fetchAllVaccinationRecords();
    }
  }, [selectedChildId, children]);

  const fetchVaccinationRecords = async (childId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching vaccination records for child:', childId);
      const response = await vaccinationAPI.getHistory(childId);
      console.log('📋 API response:', response);
      if (response.success && response.data) {
        console.log('✅ Setting records:', response.data.length);
        setRecords(response.data);
      } else {
        console.log('❌ No data in response, setting empty array');
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Error fetching vaccination records:', err);
      setError(err.message || 'Failed to fetch vaccination records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVaccinationRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch records for all children
      const allRecords: VaccinationRecord[] = [];
      for (const child of children) {
        try {
          const response = await vaccinationAPI.getHistory(child._id);
          if (response.success && response.data) {
            // Add child information to each record
            const recordsWithChildInfo = response.data.map((record: VaccinationRecord) => ({
              ...record,
              childName: child.fullName,
              childDateOfBirth: child.dateOfBirth
            }));
            allRecords.push(...recordsWithChildInfo);
          }
        } catch (err) {
          console.error(`Error fetching records for child ${child._id}:`, err);
        }
      }
      
      setRecords(allRecords);
    } catch (err: any) {
      console.error('Error fetching all vaccination records:', err);
      setError(err.message || 'Failed to fetch vaccination records');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.vaccineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.givenBy?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record as any).childName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVaccine = !filterVaccine || record.vaccineName === filterVaccine;

    const matchesDateRange = (() => {
      if (filterDateRange === 'all') return true;
      
      const recordDate = new Date(record.dateGiven);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (filterDateRange) {
        case 'today': return daysDiff === 0;
        case 'week': return daysDiff <= 7;
        case 'month': return daysDiff <= 30;
        case 'year': return daysDiff <= 365;
        default: return true;
      }
    })();

    return matchesSearch && matchesVaccine && matchesDateRange;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.dateGiven).getTime() - new Date(b.dateGiven).getTime();
        break;
      case 'vaccine':
        comparison = a.vaccineName.localeCompare(b.vaccineName);
        break;
      case 'child':
        const childA = (a as any).childName || '';
        const childB = (b as any).childName || '';
        comparison = childA.localeCompare(childB);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVaccineStatus = (record: VaccinationRecord) => {
    const now = new Date();
    const recordDate = new Date(record.dateGiven);
    const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return { icon: <Clock className="w-4 h-4 text-blue-500" />, text: 'Today', color: 'text-blue-600' };
    if (daysDiff <= 7) return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Recent', color: 'text-green-600' };
    if (daysDiff <= 30) return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'This Month', color: 'text-green-600' };
    return { icon: <CheckCircle className="w-4 h-4 text-gray-500" />, text: 'Completed', color: 'text-gray-600' };
  };

  const exportToCSV = () => {
    const headers = ['Child Name', 'Vaccine', 'Dose', 'Visit Age', 'Date Given', 'Given By', 'Location', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...sortedRecords.map(record => [
        (record as any).childName || 'N/A',
        record.vaccineName,
        record.doseNumber,
        record.visitAge,
        formatDate(record.dateGiven),
        record.givenBy?.fullName || 'N/A',
        record.location,
        record.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaccination-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moh-green"></div>
        <span className="ml-2 text-gray-600">Loading vaccination records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vaccination Records</h2>
          <p className="text-gray-600">
            {selectedChildId 
              ? `Showing records for selected child` 
              : `Showing ${sortedRecords.length} vaccination records from ${children.length} children`
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moh-green"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Child Selector */}
      {showChildSelector && children.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Child
          </label>
          <select
            value={selectedChildId || ''}
            onChange={(e) => onChildSelect?.(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-moh-green focus:border-transparent"
          >
            <option value="">All Children</option>
            {children.map(child => (
              <option key={child._id} value={child._id}>
                {child.fullName} ({formatDate(child.dateOfBirth)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vaccines, location, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-moh-green focus:border-transparent"
              />
            </div>
          </div>

          {/* Vaccine Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine</label>
            <select
              value={filterVaccine}
              onChange={(e) => setFilterVaccine(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-moh-green focus:border-transparent"
            >
              <option value="">All Vaccines</option>
              {availableVaccines.map(vaccine => (
                <option key={vaccine} value={vaccine}>{vaccine}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-moh-green focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'date' | 'vaccine' | 'child');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-moh-green focus:border-transparent"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="vaccine-asc">Vaccine (A-Z)</option>
              <option value="vaccine-desc">Vaccine (Z-A)</option>
              <option value="child-asc">Child Name (A-Z)</option>
              <option value="child-desc">Child Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {sortedRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vaccination records found</h3>
            <p className="text-gray-500">
              {searchTerm || filterVaccine || filterDateRange !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'No vaccinations have been recorded yet.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {!selectedChildId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vaccine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Given
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Given By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Blockchain
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRecords.map((record) => {
                  const status = getVaccineStatus(record);
                  return (
                    <tr key={record._id} className="hover:bg-gray-50">
                      {!selectedChildId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {(record as any).childName || 'Unknown Child'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(record as any).childDateOfBirth && formatDate((record as any).childDateOfBirth)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.vaccineName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Dose {record.doseNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.visitAge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(record.dateGiven)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(record.dateGiven)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {record.givenBy?.fullName || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {record.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {status.icon}
                          <span className={`ml-2 text-sm font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        {/* Blockchain Status */}
                        {record.isBlockchainRecorded && (
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-green-600 font-medium">Blockchain Verified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.isBlockchainRecorded && record.blockchainTxId ? (
                          <div className="flex flex-col items-start space-y-1">
                            <a
                              href={`https://explorer.vanarchain.com/tx/${record.blockchainTxId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-moh-green hover:text-moh-green-dark inline-flex items-center"
                              title={`View on Blockchain Explorer\nTransaction: ${record.blockchainTxId.slice(0, 10)}...${record.blockchainTxId.slice(-8)}\nBlock: ${record.blockchainBlockNumber || 'N/A'}`}
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <div className="text-xs text-gray-500">
                              {record.blockchainTxId.slice(0, 8)}...{record.blockchainTxId.slice(-6)}
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="text-gray-400 cursor-not-allowed inline-flex items-center"
                            title="Not yet recorded on blockchain"
                            disabled
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {sortedRecords.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-moh-green">{sortedRecords.length}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(sortedRecords.map(r => r.vaccineName)).size}
              </div>
              <div className="text-sm text-gray-600">Unique Vaccines</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set(sortedRecords.map(r => r.givenBy?._id)).size}
              </div>
              <div className="text-sm text-gray-600">Healthcare Providers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(sortedRecords.map(r => r.location)).size}
              </div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sortedRecords.filter(r => r.isBlockchainRecorded).length}
              </div>
              <div className="text-sm text-gray-600">Blockchain Verified</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationRecords;
