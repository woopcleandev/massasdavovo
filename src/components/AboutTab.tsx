import React from 'react';
import { RESTAURANT_INFO } from '../data';
import { useCompany } from '../context/CompanyContext';
import { MapPin, Phone, Clock, Heart, Award, ShieldCheck, Star, ExternalLink, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const AboutTab: React.FC = () => {
  const { settings } = useCompany();
  const activeWhatsapp = (settings.whatsappNumber || RESTAURANT_INFO.whatsappNumber).replace(/\D/g, '');
  const activePhone = settings.phone || RESTAURANT_INFO.phone;

  return (
    <div className="dark-glass-panel rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fade-in text-left shadow-2xl border border-white/10">
      {/* Restaurant Intro */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative p-1 rounded-full bg-white/10 backdrop-blur-md shadow-lg border border-amber-400/40 shrink-0 dish-halo">
          <img
            src={RESTAURANT_INFO.logo}
            alt={RESTAURANT_INFO.name}
            referrerPolicy="no-referrer"
            className="w-28 h-28 rounded-full object-cover relative z-10"
          />
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="dark-glass-pill rounded-full inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Massas Frescas & Molhos da Vovó</span>
            </span>
            <span className="dark-glass-pill rounded-full inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Primavera do Leste - MT</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{RESTAURANT_INFO.name}</h2>
          <p className="mt-2 text-sm opacity-80 leading-relaxed font-normal">{RESTAURANT_INFO.description}</p>
          
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2.5">
            <span className="dark-glass-pill rounded-full inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-rose-400">
              <Heart className="w-3.5 h-3.5 fill-rose-400" />
              <span>Receita de Família</span>
            </span>
            <span className="dark-glass-pill rounded-full inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Cozinha Artesanal</span>
            </span>
            <span className="dark-glass-pill rounded-full inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-yellow-300">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 no Google</span>
            </span>
          </div>
        </div>
      </div>

      {/* Info Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hours */}
        <div className="flex gap-3.5 p-5 rounded-3xl dark-glass-card border border-white/10">
          <div className="p-3 rounded-full bg-amber-400/10 text-amber-400 shrink-0 h-11 w-11 flex items-center justify-center border border-amber-400/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">Horário de Funcionamento</h4>
            <p className="mt-1 text-sm font-black leading-snug">{RESTAURANT_INFO.hours}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-emerald-400 font-extrabold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aberto para Entregas
            </span>
          </div>
        </div>

        {/* Contact Phone / WhatsApp */}
        <div className="flex gap-3.5 p-5 rounded-3xl dark-glass-card border border-white/10">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 h-11 w-11 flex items-center justify-center border border-emerald-500/20">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">WhatsApp / Atendimento</h4>
            <a
              href={`https://wa.me/${activeWhatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-sm font-black text-amber-400 hover:underline block leading-snug"
            >
              {activePhone}
            </a>
            <p className="text-[11px] opacity-70 mt-0.5">Clique para falar direto com nossa equipe</p>
          </div>
        </div>

        {/* Address */}
        <div className="flex gap-3.5 p-5 rounded-3xl dark-glass-card border border-white/10 sm:col-span-2">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400 shrink-0 h-11 w-11 flex items-center justify-center border border-red-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">Localização & Retirada</h4>
            <p className="mt-1 text-sm font-black leading-snug">{RESTAURANT_INFO.address}</p>
            <a
              href={RESTAURANT_INFO.googleMapsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-amber-400 hover:underline font-bold"
            >
              <span>Abrir no Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-stone-200 dark:border-white/10 pt-6">
        <h4 className="text-xs font-black text-stone-400 dark:text-gray-400 uppercase tracking-wider mb-3">Nosso Compromisso com Você</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mb-1" />
            <h5 className="text-xs font-bold text-stone-900 dark:text-white">Ingredientes Frescos</h5>
            <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5">Sem aditivos químicos ou conservantes industriais.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
            <Heart className="w-5 h-5 text-rose-500 dark:text-rose-400 mb-1" />
            <h5 className="text-xs font-bold text-stone-900 dark:text-white">Feito à Mão</h5>
            <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5">Cada massa recheada é moldada e fechada artesanalmente.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10">
            <Award className="w-5 h-5 text-amber-500 dark:text-amber-400 mb-1" />
            <h5 className="text-xs font-bold text-stone-900 dark:text-white">Entrega Cuidadosa</h5>
            <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5">Embalagens térmicas especiais que conservam textura e calor.</p>
          </div>
        </div>
      </div>

      {/* PWA Install Button Option */}
      <div className="border-t border-stone-200 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-black text-stone-900 dark:text-white">Instalar App no seu Dispositivo</h4>
          <p className="text-xs text-stone-500 dark:text-gray-400">Tenha o cardápio sempre à mão direto na sua tela inicial.</p>
        </div>
        <PWAInstallButton />
      </div>
    </div>
  );
};
