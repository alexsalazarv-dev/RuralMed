import React from 'react';
import { Phone, AlertCircle, X, ShieldAlert, HeartHandshake } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const emergencyContacts = [
    {
      title: 'SAMU Ambulancia Rural',
      number: '131',
      desc: 'Emergencias médicas vitales, accidentes y rescate rural.',
      color: 'bg-rose-600 hover:bg-rose-700 text-white',
      badge: 'Atención 24/7 Gratis',
    },
    {
      title: 'Salud Responde (MINSAL)',
      number: '600 360 7777',
      desc: 'Orientación médica telefónica por enfermeras y médicos.',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'Consulta Telefónica Gratuita',
    },
    {
      title: 'Bomberos de Chile',
      number: '132',
      desc: 'Rescates en zonas de difícil acceso e incendios.',
      color: 'bg-amber-600 hover:bg-amber-700 text-white',
      badge: 'Rescate Rural',
    },
    {
      title: 'Carabineros de Chile',
      number: '133',
      desc: 'Seguridad y traslado de emergencia en retenes cordilleranos.',
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
      badge: 'Comisarías y Retenes',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-title"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 id="emergency-title" className="text-xl sm:text-2xl font-bold text-slate-900">
              Teléfonos de Urgencia Rural
            </h2>
            <p className="text-sm text-slate-500">
              Líneas directas sin costo desde teléfonos celulares o fijos
            </p>
          </div>
        </div>

        <div className="space-y-3 my-6">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.number}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{contact.title}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {contact.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{contact.desc}</p>
              </div>

              <a
                href={`tel:${contact.number.replace(/\s+/g, '')}`}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0 ${contact.color}`}
              >
                <Phone className="w-4 h-4" />
                Llamar {contact.number}
              </a>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs sm:text-sm text-emerald-900">
          <HeartHandshake className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <p>
            En caso de corte de señal en su sector, acérquese a su <strong>Posta de Salud Rural</strong> o al punto de radio vecinal más cercano.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors"
          >
            Volver a la aplicación
          </button>
        </div>
      </div>
    </div>
  );
};
