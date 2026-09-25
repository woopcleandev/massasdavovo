/**
 * Audio Alert System for Massas da Vovó
 * 
 * - Admin / Cozinha: ALTO E DESTACADO (Sino duplo potente que toca 3x para nunca perder pedidos de delivery)
 * - Cliente: SUTIL E SUAVE (Notificação discreta e agradável)
 */

import { OrderStatus } from '../types';

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext not supported or blocked:', e);
    return null;
  }
};

/**
 * Unlock Audio Context on first user interaction
 */
export const unlockAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};

/**
 * LOUD ADMIN NEW ORDER ALARM (Alarme potente para o Painel Administrativo e Cozinha)
 * Triplo toque de campainha de restaurante com frequência nítida e volume alto
 */
export const playAdminNewOrderAlarm = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Chime chords: E6, G#6, B6, E7
    const chords = [
      { f1: 1318.51, f2: 1661.22, start: 0.0, dur: 0.35 },
      { f1: 1567.98, f2: 2093.00, start: 0.25, dur: 0.40 },
      { f1: 1318.51, f2: 1661.22, start: 0.70, dur: 0.35 },
      { f1: 1567.98, f2: 2093.00, start: 0.95, dur: 0.40 },
      { f1: 1760.00, f2: 2349.32, start: 1.40, dur: 0.60 },
    ];

    chords.forEach(c => {
      // Primary Oscillator
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(c.f1, now + c.start);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(c.f2, now + c.start);

      // High volume gain (0.85 - 0.95) for admin alert
      gain.gain.setValueAtTime(0, now + c.start);
      gain.gain.linearRampToValueAtTime(0.85, now + c.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.start + c.dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now + c.start);
      osc2.start(now + c.start);
      osc1.stop(now + c.start + c.dur);
      osc2.stop(now + c.start + c.dur);
    });
  } catch (e) {
    console.warn('Erro ao reproduzir alarme de novo pedido:', e);
  }
};

/**
 * SUBTLE CUSTOMER STATUS NOTIFICATION (Notificação sutil para o cliente)
 * Som suave, baixo e discreto (volume 0.15 - 0.20)
 */
export const playCustomerStatusSound = (status: OrderStatus) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    let notes = [523.25, 659.25]; // C5 -> E5 gentle ping
    if (status === 'preparo') {
      notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
    } else if (status === 'entrega') {
      notes = [659.25, 880.00]; // E5 -> A5
    } else if (status === 'concluido') {
      notes = [523.25, 659.25, 1046.50]; // C5 -> E5 -> C6
    } else if (status === 'cancelado') {
      notes = [440.00, 392.00]; // Soft lower tone
    }

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Gentle gain ramp (0.18 max)
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.28);
    });
  } catch (e) {
    console.warn('Erro ao reproduzir som sutil de status:', e);
  }
};

/**
 * POS Cash Register Bell (Chime de caixa / balcão)
 */
export const playCashRegisterChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [987.77, 1318.51, 1975.53]; // B5, E6, B6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.5, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  } catch (e) {
    console.warn('Erro ao tocar som de caixa:', e);
  }
};
