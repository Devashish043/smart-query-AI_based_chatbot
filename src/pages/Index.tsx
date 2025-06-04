
import React from 'react';
import { AuthProvider, useAuth } from '../components/auth/AuthProvider';
import AuthForm from '../components/auth/AuthForm';
import EnhancedChatInterface from '../components/EnhancedChatInterface';
import DynamicBackground from '../components/DynamicBackground';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DynamicBackground />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <DynamicBackground />
      {user ? (
        <EnhancedChatInterface />
      ) : (
        <AuthForm onAuthSuccess={() => {}} />
      )}
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
