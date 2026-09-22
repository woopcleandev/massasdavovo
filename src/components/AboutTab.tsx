import React from 'react';
import { RESTAURANT_INFO } from '../data';
import { MapPin, Phone, Clock, Heart, Award, ShieldCheck, Map, Star } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const AboutTab: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fade-in text-left shadow-xl border border-white/80">
      {/* Restaurant Intro */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative p-1 rounded-full bg-white/70 backdrop-blur-md shadow-md border border-white/90 shrink-0">
          <img
            src={RESTAURANT_INFO.logo}
            alt={RESTAURANT_INFO.name}
            referrerPolicy="no-referrer"
            className="w-28 h-28 rounded-full object-cover border border-[#d4af37]/30"
          />
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">{RESTAURANT_INFO.name}</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed font-normal">{RESTAURANT_INFO.description}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2.5">
            <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600">
              <Heart className="w-3.5 h-3.5 fill-red-600" />
              <span>Receita de Família</span>
            </span>
            <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800">
              <Award className="w-3.5 h-3.5" />
              <span>Cozinha Artesanal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Info Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hours */}
        <div className="flex gap-3.5 p-5 rounded-2xl glass-card border border-white/80">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 shrink-0 h-11 w-11 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horário de Funcionamento</h4>
            <p className="mt-1 text-sm font-black text-gray-900 leading-snug">{RESTAURANT_INFO.hours}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-700 font-extrabold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aberto Agora
            </span>
          </div>
        </div>

        {/* Contact Phone / WhatsApp */}
        <div className="flex gap-3.5 p-5 rounded-2xl glass-card border border-white/80">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 shrink-0 h-11 w-11 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp / Telefone</h4>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-sm font-black text-gray-900 block hover:text-emerald-700 underline leading-snug transition"
            >
              {RESTAURANT_INFO.phone}
            </a>
            <span className="text-[11px] text-gray-400 mt-1 block">Clique para iniciar conversa no WhatsApp</span>
          </div>
        </div>
      </div>

      {/* Address & Google Maps integration */}
      <div className="p-6 rounded-2xl glass-card border border-white/80 space-y-4">
        <div className="flex gap-3.5">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-600 shrink-0 h-11 w-11 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Localização & Retirada</h4>
            <p className="mt-1 text-sm font-black text-gray-900 leading-snug">{RESTAURANT_INFO.address}</p>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Primavera do Leste - MT</p>
          </div>
        </div>

        {/* Call to action to view on Maps & Reviews */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <a
            href={RESTAURANT_INFO.googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full glass-button-primary px-5 py-2.5 text-xs font-black shadow-md cursor-pointer"
          >
            <Map className="w-4 h-4 text-[#f6e09e]" />
            <span>Abrir no Google Maps</span>
          </a>

          <a
            href="https://maps.app.goo.gl/hecpUqJLLVd8EghW9"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full glass-pill px-5 py-2.5 text-xs font-extrabold text-amber-900 cursor-pointer"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-amber-500" />
            <span>Avaliar com 5 Estrelas no Google</span>
          </a>
        </div>
      </div>

      {/* Trust & Policy Info */}
      <div className="pt-6 border-t border-white/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-gray-500">
          <ShieldCheck className="w-5 h-5 text-[#0b1c3f]" />
          <span className="text-xs">Aplicativo seguro • Suas informações de entrega ficam salvas somente no seu dispositivo.</span>
        </div>
        <div className="shrink-0">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
