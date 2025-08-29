import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import StatisticsPage from './pages/StatisticsPage';
import VaccinationSchedulePage from './pages/VaccinationSchedulePage';
import ContactPage from './pages/ContactPage';
import ParentDashboard from './pages/ParentDashboard';
import VaccinationCertificatePage from './pages/VaccinationCertificatePage';

import ProfileCompletionPage from './pages/ProfileCompletionPage';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/vaccination-schedule" element={<VaccinationSchedulePage />} />
              <Route path="/contact" element={<ContactPage />} />

              <Route path="/profile-completion" element={<ProfileCompletionPage />} />
              
              {/* Protected routes */}
              <Route 
                path="/parent" 
                element={
                  <ProtectedRoute requiredUserTypes={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/healthcare-provider" 
                element={
                  <ProtectedRoute requiredUserTypes={['healthcare_provider']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredUserTypes={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/certificate" 
                element={
                  <ProtectedRoute requiredUserTypes={['parent', 'healthcare_provider']}>
                    <VaccinationCertificatePage />
                  </ProtectedRoute>
                } 
              />

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
