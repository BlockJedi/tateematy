import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import StatisticsPage from './pages/StatisticsPage';
import VaccinationSchedulePage from './pages/VaccinationSchedulePage';
import ContactPage from './pages/ContactPage';
import HealthcareProviderDashboard from './pages/HealthcareProviderDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RemindersPage from './pages/RemindersPage';
import VaccinationCertificatePage from './pages/VaccinationCertificatePage';
import WalletConnectPage from './pages/WalletConnectPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/vaccination-schedule" element={<VaccinationSchedulePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/healthcare-provider" element={<HealthcareProviderDashboard />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/certificate" element={<VaccinationCertificatePage />} />
            <Route path="/connect-wallet" element={<WalletConnectPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
