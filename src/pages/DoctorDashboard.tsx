import React, { useState, useEffect } from "react";
import { Users, Syringe, TrendingUp, Activity } from "lucide-react";
import { vaccinationAPI, doctorAPI } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";
import BlockchainStatus from "../components/BlockchainStatus";

interface VaccinationRecord {
  _id: string;
  childId: string;
  childName: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  location: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
  // Blockchain fields
  blockchainHash?: string;
  blockchainTxId?: string;
  blockchainBlockNumber?: number;
  blockchainTimestamp?: string;
  isBlockchainRecorded?: boolean;
}

interface DoctorStats {
  totalVaccinations: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
}

interface Child {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  parent: {
    _id: string;
    fullName: string;
    nationalId: string;
  };
}

interface DueVaccine {
  _id?: string;
  vaccineName: string;
  doseNumber: number;
  totalDoses: number;
  visitAge: string;
  ageInMonths: number;
  dueDate: Date;
  isOverdue: boolean;
  description: string;
}

interface VaccinationForm {
  childId: string;
  vaccineName: string;
  doseNumber: number;
  dateGiven: string;
  location: string;
  notes: string;
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showWarning, toasts, removeToast } = useToast();

  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [recentVaccinations, setRecentVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New vaccination management states
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [dueVaccines, setDueVaccines] = useState<DueVaccine[]>([]);
  const [selectedVaccine, setSelectedVaccine] = useState<DueVaccine | null>(null);
  const [vaccinationForm, setVaccinationForm] = useState<VaccinationForm>({
    childId: "",
    vaccineName: "",
    doseNumber: 1,
    dateGiven: new Date().toISOString().split("T")[0],
    location: "",
    notes: "",
  });
  const [submittingVaccination, setSubmittingVaccination] = useState(false);
  const [activeTab, setActiveTab] = useState("vaccinations");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user || !user._id) {
      showError("Authentication Error", "User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch doctor statistics
      const statsResponse = await doctorAPI.getStats(user._id);
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Fetch recent vaccinations by this doctor (last 10)
      const vaccinationsResponse = await vaccinationAPI.getHistoryByDoctor(user._id);
      if (vaccinationsResponse.success) {
        setRecentVaccinations(vaccinationsResponse.data.slice(0, 10));
      }

      // Fetch available children for vaccination
      await fetchAvailableChildren();

      // Removed unnecessary dashboard loaded toast
    } catch (err: any) {
      console.error("Dashboard data fetch error:", err);
      showError("Data Fetch Error", err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableChildren = async () => {
    try {
      // Fetch children available for vaccination with proper authentication
      const response = await fetch("http://localhost:5001/api/children/available", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched children:", data);
        setChildren(data.data || []);
        // Removed unnecessary success toast
      } else {
        console.error("Failed to fetch children:", response.status);
        const errorData = await response.json();
        console.error("Error details:", errorData);
        setChildren([]);
        showError("Children Fetch Error", errorData.message || "Failed to fetch available children");
      }
    } catch (error) {
      console.error("Error fetching children:", error);
      setChildren([]);
      showError("Network Error", "Failed to connect to server while fetching children");
    }
  };

  const fetchDueVaccines = async (childId: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/vaccinations/progress/${childId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched due vaccines:", data);

        // Transform the data to match our DueVaccine interface
        const dueVaccinesList: DueVaccine[] = [];
        const childAgeInMonths = data.data?.ageInMonths || 0;
        
        console.log(`🧒 Child Age: ${childAgeInMonths} months`);
        console.log(`📊 Total Age Groups: ${Object.keys(data.data?.progress || {}).length}`);

        if (data.data && data.data.progress) {
          Object.keys(data.data.progress).forEach((ageGroup) => {
            const group = data.data.progress[ageGroup];
            
            // Only show vaccines that are actually due now for the child's age
            if (group.status !== "completed" && group.pending && group.pending.length > 0) {
              console.log(`🔍 Checking ${ageGroup}: ${group.pending.length} pending vaccines`);
              
              group.pending.forEach((vaccine: any) => {
                // Check if this vaccine is actually due now
                const vaccineAgeInMonths = vaccine.ageInMonths || 0;
                const isDueNow = vaccineAgeInMonths <= childAgeInMonths;
                const isOverdue = vaccineAgeInMonths < childAgeInMonths;
                
                console.log(`   💉 ${vaccine.vaccineName}: Age ${vaccineAgeInMonths} months, Due: ${isDueNow}, Overdue: ${isOverdue}`);
                
                // Only add vaccines that are due now or overdue
                if (isDueNow) {
                  dueVaccinesList.push({
                    vaccineName: vaccine.vaccineName, // Keep the original vaccine name with dose number
                    doseNumber: vaccine.doseNumber || 1,
                    totalDoses: vaccine.totalDoses || 1,
                    visitAge: ageGroup,
                    ageInMonths: vaccine.ageInMonths || 0,
                    dueDate: new Date(vaccine.scheduledDate || Date.now()),
                    isOverdue: isOverdue,
                    description: vaccine.description || "",
                  });
                  console.log(`   ✅ Added to due list: ${vaccine.vaccineName}`);
                } else {
                  console.log(`   ❌ Skipped - not due yet`);
                }
              });
            }
          });
        }
        
        console.log(`�� Final Due Vaccines List: ${dueVaccinesList.length} vaccines`);
        dueVaccinesList.forEach((vaccine, index) => {
          console.log(`   ${index + 1}. ${vaccine.vaccineName} (${vaccine.visitAge}) - ${vaccine.isOverdue ? 'OVERDUE' : 'DUE'}`);
        });

        setDueVaccines(dueVaccinesList);

        // Removed unnecessary info toast for due vaccines found
        if (dueVaccinesList.length === 0) {
          showSuccess("All Vaccines Up to Date", `${selectedChild?.fullName} has no pending vaccines`);
        }
      } else {
        console.error("Failed to fetch due vaccines:", response.status);
        setDueVaccines([]);
        showError("Vaccine Progress Error", "Failed to fetch vaccination progress");
      }
    } catch (error) {
      console.error("Error fetching due vaccines:", error);
      setDueVaccines([]);
      showError("Network Error", "Failed to connect to server while fetching vaccine progress");
    }
  };

  const handleChildSelect = (childId: string) => {
    const child = children.find((c) => c._id === childId);
    setSelectedChild(child || null);
    if (childId) {
      fetchDueVaccines(childId);
    } else {
      setDueVaccines([]);
    }
  };

  const handleVaccineSelect = (vaccine: DueVaccine) => {
    console.log('💉 Selected vaccine:', vaccine);
    setSelectedVaccine(vaccine);
    const updatedForm = {
      ...vaccinationForm,
      childId: selectedChild?._id || "",
      vaccineName: vaccine.vaccineName, // Keep the original vaccine name with dose number
      doseNumber: vaccine.doseNumber,
      dateGiven: new Date().toISOString().split("T")[0],
      location: "", // Reset location for new vaccine
      notes: "" // Reset notes for new vaccine
    };
    console.log('📝 Updated vaccination form:', updatedForm);
    setVaccinationForm(updatedForm);
  };

  const handleAddVaccination = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    const validationErrors = [];
    
    if (!vaccinationForm.childId) {
      validationErrors.push("Child must be selected");
    }
    
    if (!vaccinationForm.vaccineName) {
      validationErrors.push("Vaccine must be selected");
    }
    
    // Validate vaccine name format
    const validBaseVaccineNames = [
      'IPV', 'DTaP', 'Hepatitis B', 'Hib', 'PCV', 'Rotavirus', 
      'OPV', 'BCG', 'Measles', 'MCV4', 'MMR', 'Varicella', 
      'Hepatitis A', 'HPV'
    ];
    
    // Check if it's a valid base vaccine name
    if (validBaseVaccineNames.includes(vaccinationForm.vaccineName)) {
      // Valid base name
    } else {
      // Check if it's a valid vaccine name with dose number (e.g., MCV4-1, DTaP-2)
      const baseVaccine = vaccinationForm.vaccineName.replace(/-\d+$/, '');
      if (validBaseVaccineNames.includes(baseVaccine)) {
        // Valid dose-specific name
      } else {
        validationErrors.push(`Invalid vaccine name: ${vaccinationForm.vaccineName}`);
      }
    }
    
    if (!vaccinationForm.location || vaccinationForm.location.trim() === "") {
      validationErrors.push("Location is required");
    }
    
    if (!vaccinationForm.dateGiven) {
      validationErrors.push("Date is required");
    }
    
    if (!user?._id) {
      validationErrors.push("User not authenticated");
    }

    if (validationErrors.length > 0) {
      showError("Validation Error", validationErrors.join(", "));
      return;
    }

    try {
      setSubmittingVaccination(true);

      // Prepare the vaccination data with all required fields
      const vaccinationData = {
        ...vaccinationForm,
        givenBy: user!._id, // Add the doctor's user ID (we already validated user exists above)
        dateGiven: new Date(vaccinationForm.dateGiven).toISOString() // Ensure proper date format
      };

      console.log('📝 Submitting vaccination data:', vaccinationData);

      const response = await fetch("http://localhost:5001/api/vaccinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(vaccinationData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Vaccination added successfully:", result);

        showSuccess(
          "Vaccination Recorded",
          `Successfully recorded ${vaccinationForm.vaccineName} for ${selectedChild?.fullName}. Recording on blockchain...`
        );

        // Reset form
        setVaccinationForm({
          childId: "",
          vaccineName: "",
          doseNumber: 1,
          dateGiven: new Date().toISOString().split("T")[0],
          location: "",
          notes: "",
        });
        setSelectedVaccine(null);

        // Refresh the due vaccines list for the current child (silently)
        if (selectedChild?._id) {
          await fetchDueVaccines(selectedChild._id);
        }

        // Also refresh dashboard data for stats (silently)
        await fetchDashboardData();
      } else {
        console.error("Vaccination recording failed:", result);
        showError("Recording Failed", result.message || "Failed to add vaccination record");
        
        // Show more detailed error information
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors.map((err: any) => `${err.param}: ${err.msg}`).join(', ');
          showError("Validation Errors", errorMessages);
        }
      }
    } catch (error: any) {
      console.error("Error adding vaccination:", error);
      showError("Network Error", error.message || "Failed to add vaccination record");
    } finally {
      setSubmittingVaccination(false);
    }
  };

  // Filter children based on search term
  const filteredChildren = children.filter((child) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      child.fullName.toLowerCase().includes(searchLower) ||
      child.parent?.fullName?.toLowerCase().includes(searchLower) ||
      child.parent?.nationalId?.includes(searchTerm) ||
      child.gender.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moh-green"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600">Welcome back, Dr. {user?.fullName || "Doctor"}</p>
      </div>

      <div className="flex">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            {[
              { id: "vaccinations", label: "Vaccinations", icon: Syringe },
              { id: "children", label: "Children", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-moh-green text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">

      {/* Vaccinations Tab */}
      {activeTab === "vaccinations" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Child Selection */}
          <div className="mb-6">
            <label htmlFor="childSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for a child by name, parent name, or national ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-moh-green focus:border-transparent transition-colors mb-3"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors">
                    <span className="text-white text-xs">×</span>
                  </div>
                </button>
              )}
            </div>

            <select
              id="childSelect"
              value={selectedChild?._id || ""}
              onChange={(e) => handleChildSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-moh-green focus:border-transparent"
            >
              <option value="">Choose a child...</option>
              {filteredChildren.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.fullName} - {child.parent?.fullName} ({child.parent?.nationalId})
                </option>
              ))}
            </select>

            {searchTerm && filteredChildren.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No children found matching "{searchTerm}". Try a different search term.
              </p>
            )}
          </div>

          {selectedChild && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column - Due Vaccines */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Syringe className="w-5 h-5 mr-2 text-moh-green" />
                    Due Vaccines
                  </h3>
                  {/* Removed sync and debug buttons */}
                </div>

                {dueVaccines.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Syringe className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="font-medium text-gray-700 mb-2">All Vaccines Up to Date!</h4>
                    <p className="text-sm text-gray-500">{selectedChild.fullName} has no pending vaccines</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {dueVaccines.map((vaccine, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                          vaccine.isOverdue
                            ? "border-red-300 bg-red-50 hover:bg-red-100"
                            : "border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
                        } ${
                          selectedVaccine?.vaccineName === vaccine.vaccineName &&
                          selectedVaccine?.doseNumber === vaccine.doseNumber
                            ? "ring-2 ring-moh-green ring-offset-2"
                            : ""
                        }`}
                        onClick={() => handleVaccineSelect(vaccine)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{vaccine.vaccineName}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Dose {vaccine.doseNumber} of {vaccine.totalDoses} • {vaccine.visitAge}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Due: {vaccine.dueDate.toLocaleDateString()}</span>
                              {vaccine.isOverdue && <span className="text-red-600 font-medium">OVERDUE</span>}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{vaccine.description}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVaccineSelect(vaccine);
                            }}
                            className="px-3 py-1.5 bg-moh-green text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Recording Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                {selectedVaccine ? (
                  <form onSubmit={handleAddVaccination} className="h-full">
                    <div className="mb-6">
                                             <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                         <Activity className="w-5 h-5 mr-2 text-blue-600" />
                         Recording Form
                       </h3>
                      <p className="text-sm text-gray-600">
                        Recording {selectedVaccine.vaccineName} for {selectedChild.fullName}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name</label>
                        <input
                          type="text"
                          value={vaccinationForm.vaccineName}
                          onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccineName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          readOnly
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dose Number</label>
                          <input
                            type="number"
                            value={vaccinationForm.doseNumber}
                            onChange={(e) =>
                              setVaccinationForm({ ...vaccinationForm, doseNumber: parseInt(e.target.value) })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date Given</label>
                          <input
                            type="date"
                            value={vaccinationForm.dateGiven}
                            onChange={(e) => setVaccinationForm({ ...vaccinationForm, dateGiven: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={vaccinationForm.location}
                          onChange={(e) => setVaccinationForm({ ...vaccinationForm, location: e.target.value })}
                          placeholder="e.g., Left arm, Right thigh"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={vaccinationForm.notes}
                          onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                          placeholder="Any additional notes or observations..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVaccine(null);
                          setVaccinationForm({
                            childId: "",
                            vaccineName: "",
                            doseNumber: 1,
                            dateGiven: new Date().toISOString().split("T")[0],
                            location: "",
                            notes: "",
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingVaccination}
                        className="px-4 py-2 bg-moh-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingVaccination ? "Recording..." : "Record Vaccination"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Syringe className="w-8 h-8 text-blue-500" />
                      </div>
                      <h4 className="font-medium text-gray-700 mb-2">No Vaccine Selected</h4>
                      <p className="text-sm text-gray-500">
                        Select a vaccine from the left panel to record vaccination
                      </p>
                    </div>
                  </div>
                )}

                {/* Blockchain Verification Section */}
                {recentVaccinations.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                      Recent Vaccinations & Blockchain Status
                    </h4>
                    
                    <div className="space-y-3">
                      {recentVaccinations.slice(0, 5).map((vaccination) => (
                        <div key={vaccination._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-moh-green/10 rounded-full flex items-center justify-center">
                                <Syringe className="w-4 h-4 text-moh-green" />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {vaccination.vaccineName} - Dose {vaccination.doseNumber}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {vaccination.childName} • {new Date(vaccination.dateGiven).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {/* Blockchain Status */}
                            <BlockchainStatus
                              isRecorded={vaccination.isBlockchainRecorded || false}
                              transactionHash={vaccination.blockchainTxId}
                              blockNumber={vaccination.blockchainBlockNumber}
                              timestamp={vaccination.blockchainTimestamp}
                            />
                          </div>
                          
                          {/* Blockchain Details */}
                          {vaccination.isBlockchainRecorded && vaccination.blockchainTxId && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Transaction:</span>
                                  <div className="font-mono bg-gray-100 px-2 py-1 rounded mt-1 truncate">
                                    {vaccination.blockchainTxId.slice(0, 10)}...{vaccination.blockchainTxId.slice(-8)}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Block:</span>
                                  <div className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                                    {vaccination.blockchainBlockNumber || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedChild && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Child</h3>
              <p className="text-gray-500">Choose a child from the dropdown above to view their vaccination schedule</p>
            </div>
          )}
        </div>
      )}

      {/* Children Tab */}
      {activeTab === "children" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Available Children</h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredChildren.length} of {children.length} children
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by child name, parent name, national ID, or gender..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-moh-green focus:border-transparent transition-colors"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors">
                    <span className="text-white text-xs">×</span>
                  </div>
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                Showing results for: <span className="font-medium text-gray-900">"{searchTerm}"</span>
              </p>
            )}
          </div>

          {filteredChildren.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChildren.map((child) => (
                <div
                  key={child._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{child.fullName}</h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        child.gender.toLowerCase() === "male"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {child.gender}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                                         <p className="flex items-center">
                       <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                       DOB: {new Date(child.dateOfBirth).toLocaleDateString()}
                     </p>
                    <p className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      Parent: {child.parent?.fullName}
                    </p>
                                         <p className="flex items-center">
                       <Activity className="w-4 h-4 mr-2 text-gray-400" />
                       ID: {child.parent?.nationalId}
                     </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setActiveTab("vaccinations");
                        handleChildSelect(child._id);
                      }}
                      className="w-full px-3 py-2 bg-moh-green text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Syringe className="w-4 h-4 mr-2" />
                      Record Vaccination
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Children Found</h3>
              <p className="text-gray-500 mb-4">No children match your search criteria</p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Children Available</h3>
              <p className="text-gray-500">No children are currently registered in the system</p>
            </div>
          )}
        </div>
      )}
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default DoctorDashboard;
