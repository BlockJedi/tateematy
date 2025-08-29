// API service layer for communicating with the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    // Attach the full error response to the error object
    (error as any).response = { data: errorData, status: response.status };
    throw error;
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request function
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  // Connect wallet and get signature
  connectWallet: async (walletAddress: string, signature: string, message: string) => {
    return apiRequest('/auth/connect-wallet', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  },

  // Verify wallet signature
  verifySignature: async (walletAddress: string, signature: string, message: string) => {
    return apiRequest('/auth/verify-signature', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  },

  // Register new user
  register: async (userData: any) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (walletAddress: string, signature: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature }),
    });
  },
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Deactivate user account
  deactivateAccount: async () => {
    return apiRequest('/users/profile', {
      method: 'DELETE',
    });
  },

  // Get user's children (for parents)
  getChildren: async () => {
    return apiRequest('/users/children');
  },

  // Get healthcare provider's patients
  getPatients: async () => {
    return apiRequest('/users/patients');
  },

  // Get user statistics
  getStatistics: async () => {
    return apiRequest('/users/statistics');
  },
};

// Child API
export const childAPI = {
  // Get all children for a parent
  getAll: async () => {
    return apiRequest('/children');
  },

  // Add a new child
  add: async (childData: any) => {
    return apiRequest('/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  },

  // Get specific child details
  getById: async (childId: string) => {
    return apiRequest(`/children/${childId}`);
  },

  // Update child information
  update: async (childId: string, updateData: any) => {
    return apiRequest(`/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Deactivate a child
  deactivate: async (childId: string) => {
    return apiRequest(`/children/${childId}`, {
      method: 'DELETE',
    });
  },

  // Get child's vaccination schedule and status
  getVaccinations: async (childId: string) => {
    return apiRequest(`/children/${childId}/vaccinations`);
  },

  // Get upcoming vaccinations for a child
  getUpcomingVaccinations: async (childId: string, days: number = 30) => {
    return apiRequest(`/children/${childId}/upcoming?days=${days}`);
  },

  // Search children by multiple criteria (for doctors)
  search: async (searchQuery: string) => {
    return apiRequest(`/children/search?q=${encodeURIComponent(searchQuery)}`);
  },
};

// Vaccination API
export const vaccinationAPI = {
  // Add a new vaccination record
  addRecord: async (recordData: any) => {
    return apiRequest('/vaccinations', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  },

  // Get available doctors for vaccination recording
  getAvailableDoctors: async () => {
    return apiRequest('/doctors');
  },

  // Get vaccination progress for a child
  getProgress: async (childId: string) => {
    return apiRequest(`/vaccinations/progress/${childId}`);
  },

  // Get upcoming vaccines for a child
  getUpcoming: async (childId: string) => {
    return apiRequest(`/vaccinations/upcoming/${childId}`);
  },

  // Get overdue vaccines for a child
  getOverdue: async (childId: string) => {
    return apiRequest(`/vaccinations/overdue/${childId}`);
  },

  // Get vaccination history for a child
  getHistory: async (childId: string) => {
    return apiRequest(`/vaccinations/history/${childId}`);
  },

  // Get vaccination history for a doctor
  getHistoryByDoctor: async (doctorId: string) => {
    return apiRequest(`/vaccinations/doctor/${doctorId}/history`);
  },

  // Get vaccination statistics for a child
  getStats: async (childId: string) => {
    return apiRequest(`/vaccinations/stats/${childId}`);
  },

  // Check certificate eligibility
  checkCertificateEligibility: async (childId: string) => {
    return apiRequest(`/vaccinations/certificate/eligibility/${childId}`);
  },
};

// Schedule API
export const scheduleAPI = {
  // Get complete vaccination schedule
  getComplete: async () => {
    return apiRequest('/schedule');
  },

  // Get schedule by age
  getByAge: async (ageInMonths: number) => {
    return apiRequest(`/schedule/age/${ageInMonths}`);
  },

  // Get next vaccinations for a child
  getNextVaccinations: async (childId: string) => {
    return apiRequest(`/schedule/next/${childId}`);
  },

  // Get vaccine schedule for a specific vaccine
  getVaccineSchedule: async (vaccineName: string) => {
    return apiRequest(`/schedule/vaccine/${vaccineName}`);
  },

  // Get all required vaccines
  getRequiredVaccines: async () => {
    return apiRequest('/schedule/required');
  },

  // Get personalized schedule for a child
  getPersonalized: async (childId: string) => {
    return apiRequest(`/schedule/personalized/${childId}`);
  },

  // Get catch-up schedule for overdue vaccinations
  getCatchUp: async (childId: string) => {
    return apiRequest(`/schedule/catch-up/${childId}`);
  },

  // Get schedule statistics
  getStatistics: async () => {
    return apiRequest('/schedule/statistics');
  },

  // Get schedule recommendations
  getRecommendations: async (childId: string) => {
    return apiRequest(`/schedule/recommendations/${childId}`);
  },
};

// Token Rewards API
export const tokenRewardsAPI = {
  // Check eligibility for token rewards
  checkEligibility: async (childId: string) => {
    return apiRequest(`/token-rewards/eligibility/${childId}`);
  },

  // Claim tokens for vaccination completion
  claimTokens: async (childId: string, walletAddress: string) => {
    return apiRequest(`/token-rewards/claim/${childId}`, {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  },

  // Get parent's token information
  getParentInfo: async (walletAddress: string) => {
    return apiRequest(`/token-rewards/parent-info?walletAddress=${walletAddress}`);
  },

  // Get child's claim information
  getChildClaimInfo: async (childId: string, walletAddress: string) => {
    return apiRequest(`/token-rewards/child-claim/${childId}?walletAddress=${walletAddress}`);
  },

  // Get contract statistics
  getContractStats: async () => {
    return apiRequest('/token-rewards/contract-stats');
  },

  // Get reward calculation for a child
  getRewardCalculation: async (childId: string) => {
    return apiRequest(`/token-rewards/reward-calculation/${childId}`);
  },
};

// Doctor API
export const doctorAPI = {
  // Get all doctors
  getAll: async () => {
    return apiRequest('/doctors');
  },

  // Get doctor by ID
  getById: async (id: string) => {
    return apiRequest(`/doctors/${id}`);
  },

  // Create new doctor
  create: async (doctorData: any) => {
    return apiRequest('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  },

  // Update doctor
  update: async (id: string, doctorData: any) => {
    return apiRequest(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    });
  },

  // Delete doctor
  delete: async (id: string) => {
    return apiRequest(`/doctors/${id}`, {
      method: 'DELETE',
    });
  },

  // Get doctor statistics
  getStats: async (id: string) => {
    return apiRequest(`/doctors/${id}/stats`);
  },
};

// Certificate API
export const certificateAPI = {
  // Check certificate eligibility
  checkEligibility: async (childId: string, type: string) => {
    return apiRequest(`/certificates/eligibility/${childId}/${type}`);
  },

  // Generate certificate
  generate: async (childId: string, certificateType: string) => {
    return apiRequest('/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ childId, certificateType }),
    });
  },

  // Verify certificate on blockchain
  verify: async (ipfsHash: string, txHash: string) => {
    return apiRequest('/certificates/verify', {
      method: 'POST',
      body: JSON.stringify({ ipfsHash, txHash }),
    });
  },

  // Get certificate history
  getHistory: async (childId: string) => {
    return apiRequest(`/certificates/history/${childId}`);
  },

  // Download certificate
  download: async (certificateId: string) => {
    return apiRequest(`/certificates/download/${certificateId}`);
  },

  // Get existing certificates
  getExisting: async (childId: string) => {
    return apiRequest(`/certificates/existing/${childId}`);
  },

  // Download certificate image
  downloadImage: async (childId: string, certificateType: string) => {
    return apiRequest(`/certificates/download/${childId}/${certificateType}`);
  },
};

// Admin API
export const adminAPI = {
  // Get system statistics
  getStats: async () => {
    return apiRequest('/admin/stats');
  },

  // Get all users with pagination and search
  getUsers: async (params: { page?: number; limit?: number; search?: string; userType?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.userType) queryParams.append('userType', params.userType);
    
    const query = queryParams.toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },

  // Get user by ID
  getUserById: async (id: string) => {
    return apiRequest(`/admin/users/${id}`);
  },

  // Update user
  updateUser: async (id: string, userData: any) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Deactivate user
  deactivateUser: async (id: string) => {
    return apiRequest(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Reactivate user
  reactivateUser: async (id: string) => {
    return apiRequest(`/admin/users/${id}/reactivate`, {
      method: 'POST',
    });
  },

  // Get vaccination records
  getVaccinationRecords: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return apiRequest(`/admin/vaccination-records${query ? `?${query}` : ''}`);
  },
};

// Reminder API
export const reminderAPI = {
  // Create a new reminder
  create: async (reminderData: any) => {
    return apiRequest('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  },

  // Get reminders for a specific child
  getByChild: async (childId: string) => {
    return apiRequest(`/reminders/child/${childId}`);
  },

  // Get reminders for a parent
  getByParent: async (filters: any = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/reminders/parent?${queryParams}`);
  },

  // Update reminder status
  updateStatus: async (reminderId: string, status: string, additionalData: any = {}) => {
    return apiRequest(`/reminders/${reminderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...additionalData }),
    });
  },

  // Retry failed reminder
  retry: async (reminderId: string) => {
    return apiRequest(`/reminders/${reminderId}/retry`, {
      method: 'POST',
    });
  },

  // Cancel reminder
  cancel: async (reminderId: string) => {
    return apiRequest(`/reminders/${reminderId}/cancel`, {
      method: 'POST',
    });
  },

  // Get reminder statistics
  getStatistics: async () => {
    return apiRequest('/reminders/statistics');
  },
};



// Export all APIs
const api = {
  auth: authAPI,
  user: userAPI,
  child: childAPI,
  vaccination: vaccinationAPI,
  schedule: scheduleAPI,
  reminder: reminderAPI,
  certificate: certificateAPI,
  admin: adminAPI,
};

export default api;
