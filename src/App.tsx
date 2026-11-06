/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { RegisterScreen } from './components/RegisterScreen.tsx';
import { DashboardScreen } from './components/DashboardScreen.tsx';
import { EmergencyModal } from './components/EmergencyModal.tsx';
import { Usuario } from './lib/supabase.ts';

// Generated authentic rural health photography
const HERO_IMAGE_URL = '/src/assets/images/rural_clinic_hero_1793967420159.jpg';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'dashboard'>('login');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [initialLoginMessage, setInitialLoginMessage] = useState<string | null>(null);

  // Check if a session was previously active in sessionStorage
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('ruralmed_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as Usuario;
        setCurrentUser(parsed);
        setCurrentScreen('dashboard');
      }
    } catch (e) {
      console.warn('No active session in sessionStorage', e);
    }
  }, []);

  const handleLoginSuccess = (usuario: Usuario) => {
    setCurrentUser(usuario);
    try {
      sessionStorage.setItem('ruralmed_user', JSON.stringify(usuario));
    } catch {
      // ignore
    }
    setCurrentScreen('dashboard');
  };

  const handleRegisterSuccess = (usuario: Usuario) => {
    // Show success message and redirect to login as specified in prompt
    setInitialLoginMessage(
      `Ficha creada exitosamente para ${usuario.nombre} ${usuario.apellidos}. Ingrese su RUT (${usuario.rut}) y su celular (${usuario.celular}) para acceder.`
    );
    setCurrentScreen('login');
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('ruralmed_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setInitialLoginMessage(null);
    setCurrentScreen('login');
  };

  // Font size multiplier class
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg [&_input]:text-lg [&_button]:text-lg [&_label]:text-base';
      case 'xl':
        return 'text-xl [&_input]:text-xl [&_button]:text-xl [&_label]:text-lg [&_p]:text-base';
      default:
        return 'text-base';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 ${getFontSizeClass()} transition-all duration-200`}>
      
      {/* Accessible Header with RuralMed Branding & Text Size Toolbar */}
      <Header
        fontSize={fontSize}
        setFontSize={setFontSize}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        currentScreen={currentScreen}
        userName={currentUser?.nombre}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onGoToRegister={() => {
              setInitialLoginMessage(null);
              setCurrentScreen('register');
            }}
            initialMessage={initialLoginMessage}
            heroImage={HERO_IMAGE_URL}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterScreen
            onBackToLogin={() => setCurrentScreen('login')}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}

        {currentScreen === 'dashboard' && currentUser && (
          <DashboardScreen
            usuario={currentUser}
            onLogout={handleLogout}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        )}
      </main>

      {/* Emergency Assistance Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />

    </div>
  );
}
