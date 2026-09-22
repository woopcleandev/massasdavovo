import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { getBusinessStatus, BusinessStatusResult } from '../utils/businessHours';
import { Clock, Calendar, Sparkles, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface StoreStatusBannerProps {
  onOpenScheduleInfo?: () => void;
  compact?: boolean;
}

export const StoreStatusBanner: React.FC<StoreStatusBannerProps> = ({ onOpenScheduleInfo, compact = false }) => {
  const { settings } = useCompany();
  const [status, setStatus] = useState<BusinessStatusResult>(() =>
    getBusinessStatus(settings.operatingHours)
  );

  // Update status every 30 seconds
  useEffect(() => {
    const update = () => {
      setStatus(getBusinessStatus(settings.operatingHours));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [settings.operatingHours]);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition border ${
        status.isOpen
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      }`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status.isOpen ? 'bg-emerald-400' : 'bg-amber-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            status.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
          }`} />
        </span>
        <span>
          {status.isOpen ? 'Aberto Agora (18h-23h)' : `Fechado • Abre ${status.nextOpening.relativeLabel}`}
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-3xl p-4 sm:p-5 border shadow-xl transition-all relative overflow-hidden text-left ${
      status.isOpen
        ? 'dark-glass-card border-emerald-500/30 bg-emerald-950/20'
        : 'dark-glass-card border-amber-500/30 bg-amber-950/20'
    }`}>
      {/* Decorative ambient lighting */}
      <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
        status.isOpen ? 'bg-emerald-500/10' : 'bg-amber-500/15'
      }`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Status Icon Orb */}
          <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 flex items-center justify-center border shadow-inner ${
            status.isOpen
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10'
          }`}>
            {status.isOpen ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            ) : (
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                status.isOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {status.isOpen ? '🟢 ABERTO AGORA' : '⏰ FECHADO NO MOMENTO'}
              </span>

              <span className="text-[11px] opacity-70 font-semibold flex items-center gap-1">
                <span>{status.currentDayName}</span>
                <span>•</span>
                <span>{status.currentTimeStr}</span>
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black tracking-tight pt-0.5">
              {status.isOpen ? (
                <span>Recebendo pedidos agora para entrega ou retirada!</span>
              ) : (
                <span>Faça seu pedido agendado para o próximo dia de abertura</span>
              )}
            </h3>

            <p className="text-xs opacity-80 leading-relaxed font-normal">
              {status.isOpen ? (
                <span>Expediente: Terça a Domingo das {settings.operatingHours?.openTime || '18:00'} às {settings.operatingHours?.closeTime || '23:00'}.</span>
              ) : (
                <span>
                  Próxima abertura: <strong className="text-amber-400 font-bold">{status.nextOpening.relativeLabel}</strong>. Você pode adiantar a escolha dos seus pratos e agendar o horário de entrega na sacola!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action button / Badge info */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0">
          <div className="px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="block text-[10px] opacity-60 uppercase tracking-wider font-bold">Atendimento</span>
            <span className="text-xs font-black text-amber-400 font-mono">18:00 - 23:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
