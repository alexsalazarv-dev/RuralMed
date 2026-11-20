/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { RegisterScreen } from './components/RegisterScreen.tsx';
import { DashboardScreen } from './components/DashboardScreen.tsx';
import { StaffDashboardScreen } from './components/StaffDashboardScreen.tsx';
import { AdminDashboardScreen } from './components/AdminDashboardScreen.tsx';
import { EmergencyModal } from './components/EmergencyModal.tsx';
import { Usuario } from './lib/supabase.ts';
import { Funcionario } from './lib/clinicData.ts';

// Generated authentic rural health photography
const HERO_IMAGE_URL = '/src/assets/images/rural_clinic_hero_1793967420159.jpg';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'login' | 'register' | 'dashboard' | 'staff-dashboard' | 'admin-dashboard'
  >('login');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Funcionario | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Funcionario | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [initialLoginMessage, setInitialLoginMessage] = useState<string | null>(null);

  // Restore active session from sessionStorage
  useEffect(() => {
    try {
      const savedAdmin = sessionStorage.getItem('ruralmed_admin');
      if (savedAdmin) {
        const parsedAdmin = JSON.parse(savedAdmin) as Funcionario;
        setCurrentAdmin(parsedAdmin);
        setCurrentScreen('admin-dashboard');
        return;
      }

      const savedStaff = sessionStorage.getItem('ruralmed_staff');
      if (savedStaff) {
        const parsedStaff = JSON.parse(savedStaff) as Funcionario;
        setCurrentStaff(parsedStaff);
        setCurrentScreen('staff-dashboard');
        return;
      }

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
    setCurrentStaff(null);
    setCurrentAdmin(null);
    try {
      sessionStorage.removeItem('ruralmed_staff');
      sessionStorage.removeItem('ruralmed_admin');
      sessionStorage.setItem('ruralmed_user', JSON.stringify(usuario));
    } catch {
      // ignore
    }
    setCurrentScreen('dashboard');
  };

  const handleStaffLoginSuccess = (funcionario: Funcionario) => {
    setCurrentStaff(funcionario);
    setCurrentUser(null);
    setCurrentAdmin(null);
    try {
      sessionStorage.removeItem('ruralmed_user');
      sessionStorage.removeItem('ruralmed_admin');
      sessionStorage.setItem('ruralmed_staff', JSON.stringify(funcionario));
    } catch {
      // ignore
    }
    setCurrentScreen('staff-dashboard');
  };

  const handleAdminLoginSuccess = (admin: Funcionario) => {
    setCurrentAdmin(admin);
    setCurrentUser(null);
    setCurrentStaff(null);
    try {
      sessionStorage.removeItem('ruralmed_user');
      sessionStorage.removeItem('ruralmed_staff');
      sessionStorage.setItem('ruralmed_admin', JSON.stringify(admin));
    } catch {
      // ignore
    }
    setCurrentScreen('admin-dashboard');
  };

  const handleRegisterSuccess = (usuario: Usuario) => {
    setInitialLoginMessage(
      `Ficha creada exitosamente para ${usuario.nombre} ${usuario.apellidos}. Ingrese su RUT (${usuario.rut}) y su celular (${usuario.celular}) para acceder.`
    );
    setCurrentScreen('login');
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('ruralmed_user');
      sessionStorage.removeItem('ruralmed_staff');
      sessionStorage.removeItem('ruralmed_admin');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setCurrentStaff(null);
    setCurrentAdmin(null);
    setInitialLoginMessage(null);
    setCurrentScreen('login');
  };

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

  const showPublicHeader =
    currentScreen === 'login' || currentScreen === 'register';

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 ${getFontSizeClass()} transition-all duration-200`}>
      {showPublicHeader && (
        <Header
          fontSize={fontSize}
          setFontSize={setFontSize}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
          currentScreen={currentScreen}
          userName={currentUser?.nombre}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1 flex flex-col justify-center">
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onStaffLoginSuccess={handleStaffLoginSuccess}
            onAdminLoginSuccess={handleAdminLoginSuccess}
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
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        )}

        {currentScreen === 'staff-dashboard' && currentStaff && (
          <StaffDashboardScreen
            funcionario={currentStaff}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'admin-dashboard' && currentAdmin && (
          <AdminDashboardScreen
            admin={currentAdmin}
            onLogout={handleLogout}
          />
        )}
      </main>

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
}
