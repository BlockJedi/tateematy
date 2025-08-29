import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserTypes?: ('parent' | 'healthcare_provider' | 'admin')[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredUserTypes = [],
  redirectTo = '/'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has required user type
  if (requiredUserTypes.length > 0 && user && user.userType && !requiredUserTypes.includes(user.userType)) {
    // Redirect to appropriate dashboard based on user type
    let dashboardPath = '/';
    switch (user.userType) {
      case 'parent':
        dashboardPath = '/parent';
        break;
      case 'healthcare_provider':
        dashboardPath = '/healthcare-provider';
        break;
      case 'admin':
        dashboardPath = '/admin';
        break;
      default:
        // If userType is undefined or invalid, redirect to profile completion
        dashboardPath = '/profile-completion';
        break;
    }
    return <Navigate to={dashboardPath} replace />;
  }

  // Check if profile is complete (except for profile completion page)
  // For healthcare providers created by admin, they should have complete profiles
  // For parents, they need to complete their profile
  if (user && user.userType && !user.profileComplete && location.pathname !== '/profile-completion') {
    // If it's a healthcare provider, they shouldn't need profile completion
    // This indicates an admin-created doctor with incomplete profile
    if (user.userType === 'healthcare_provider') {
      console.warn('Healthcare provider has incomplete profile - this should not happen for admin-created doctors');
      // Still redirect to profile completion as fallback
      return <Navigate to="/profile-completion" replace />;
    }
    
    // For parents, redirect to profile completion
    if (user.userType === 'parent') {
      return <Navigate to="/profile-completion" replace />;
    }
  }

  // User is authenticated, has required permissions, and profile is complete
  return <>{children}</>;
};

export default ProtectedRoute;