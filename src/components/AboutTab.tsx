import React from 'react';
import { RESTAURANT_INFO } from '../data';
import { MapPin, Phone, Clock, Heart, Award, ShieldCheck, Map, Star } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const AboutTab: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-3xl mx-auto space-y-8 animate-fade-in text-left">
      {/* Restaurant Intro */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <img
          src={RESTAURANT_INFO.logo}
          alt={RESTAURANT_INFO.name}
          referrerPolicy="no-referrer"
          className="w-28 h-28 rounded-full object-cover shadow-md border-2 border-red-100"
        />
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-extrabold text-gray-900">{RESTAURANT_INFO.name}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{RESTAURANT_INFO.description}</p>
          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 border border-red-100">
              <Heart className="w-3.5 h-3.5 fill-red-600" />
              <span>Receita de Família</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-100">
              <Award className="w-3.5 h-3.5" />
              <span>Cozinha Artesanal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Info Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hours */}
        <div className="flex gap-3.5 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600 shrink-0 h-11 w-11 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horário de Funcionamento</h4>
            <p className="mt-1 text-sm font-bold text-gray-800 leading-snug">{RESTAURANT_INFO.hours}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aberto Agora
            </span>
          </div>
        </div>

        {/* Contact Phone / WhatsApp */}
        <div className="flex gap-3.5 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 shrink-0 h-11 w-11 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp / Telefone</h4>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-sm font-bold text-gray-800 block hover:text-emerald-600 underline leading-snug transition"
            >
              {RESTAURANT_INFO.phone}
            </a>
            <span className="text-[11px] text-gray-400 mt-1 block">Clique para iniciar conversa</span>
          </div>
        </div>
      </div>

      {/* Address & Google Maps integration */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-red-50/10 space-y-4">
        <div className="flex gap-3.5">
          <div className="p-3 rounded-xl bg-red-100 text-red-600 shrink-0 h-11 w-11 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Localização</h4>
            <p className="mt-1 text-sm font-bold text-gray-800 leading-snug">{RESTAURANT_INFO.address}</p>
            <p className="text-xs text-gray-400 mt-0.5">Primavera do Leste - MT</p>
          </div>
        </div>

        {/* Call to action to view on Maps & Reviews */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <a
            href={RESTAURANT_INFO.googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-md transition"
          >
            <Map className="w-4 h-4" />
            <span>Abrir no Google Maps</span>
          </a>

          <a
            href="https://maps.app.goo.gl/hecpUqJLLVd8EghW9"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 text-xs font-bold transition"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-amber-500" />
            <span>Avaliar com 5 Estrelas no Google</span>
          </a>
        </div>
      </div>

      {/* Trust & Policy Info */}
      <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-gray-500">
          <ShieldCheck className="w-5 h-5 text-gray-400" />
          <span className="text-xs">Aplicativo seguro • Suas informações de entrega ficam salvas somente no seu dispositivo.</span>
        </div>
        <div className="shrink-0">
          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
