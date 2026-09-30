import React, { useEffect, useState, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { normalizePhoneNumber } from '../utils/phone';
import { playCustomerStatusSound } from '../utils/audioAlerts';
import { formatTimeOnly } from '../utils/date';
import { Bell, BellRing, ChefHat, Bike, CheckCircle, XCircle, Clock, X, Eye, Sparkles, Volume2 } from 'lucide-react';

import { formatPrice } from '../utils/format';

interface NotificationToast {
  order: Order;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: number;
}

interface OrderStatusNotifierProps {
  onOpenOrderReceipt?: (order: Order) => void;
}

// Helper function to synthesize a pleasant multi-tone sound chime using Web Audio API
export const playOrderStatusSound = (status: OrderStatus) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Select pleasant musical frequencies according to the status
    let notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 (standard status chime)
    if (status === 'preparo') {
      notes = [523.25, 659.25, 783.99, 880.00]; // C5 -> E5 -> G5 -> A5 (Kitchen starting)
    } else if (status === 'entrega') {
      notes = [587.33, 739.99, 880.00, 1046.50]; // D5 -> F#5 -> A5 -> C6 (Delivery on the way!)
    } else if (status === 'concluido') {
      notes = [523.25, 659.25, 783.99, 1046.50]; // C5 -> E5 -> G5 -> C6 (Success Fanfare)
    } else if (status === 'cancelado') {
      notes = [440.00, 349.23, 293.66]; // A4 -> F4 -> D4 (Lower tone)
    }

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = status === 'cancelado' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
    });
  } catch (e) {
    console.warn('AudioContext playback error:', e);
  }
};

export const OrderStatusNotifier: React.FC<OrderStatusNotifierProps> = ({ onOpenOrderReceipt }) => {
  const { orders } = useCompany();
  const { userProfile, currentUser } = useAuth();

  const [activeToast, setActiveToast] = useState<NotificationToast | null>(null);
  const prevStatusesRef = useRef<Record<string, OrderStatus>>({});
  const isInitializedRef = useRef(false);

  // Identify customer's order IDs
  const getCustomerOrderIds = (): Set<string> => {
    const ids = new Set<string>();
    try {
      const localMyIds: string[] = JSON.parse(localStorage.getItem('vovo_my_order_ids') || '[]');
      localMyIds.forEach(id => ids.add(id));
    } catch (e) {
      console.error(e);
    }

    const currentWa = userProfile?.whatsapp ? normalizePhoneNumber(userProfile.whatsapp) : '';

    orders.forEach(o => {
      if (ids.has(o.id)) return;
      if (o.customerId && ((currentUser?.uid && o.customerId === currentUser.uid) || (userProfile?.id && o.customerId === userProfile.id))) {
        ids.add(o.id);
      } else if (currentWa && o.customerPhoneClean && currentWa === o.customerPhoneClean) {
        ids.add(o.id);
      }
    });

    return ids;
  };

  useEffect(() => {
    if (orders.length === 0) return;

    const customerOrderIds = getCustomerOrderIds();

    // First run: initialize ref map without triggering audio notifications
    if (!isInitializedRef.current) {
      orders.forEach(o => {
        if (customerOrderIds.has(o.id)) {
          prevStatusesRef.current[o.id] = o.status;
        }
      });
      isInitializedRef.current = true;
      return;
    }

    // Subsequent updates: check for status changes
    orders.forEach(o => {
      if (!customerOrderIds.has(o.id)) return;

      const prevStatus = prevStatusesRef.current[o.id];
      if (prevStatus && prevStatus !== o.status) {
        // Status changed! Play subtle customer notification sound
        playCustomerStatusSound(o.status);

        // Try native Web Notification if allowed
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`Pedido ${o.orderNumber} Atualizado!`, {
              body: getStatusText(o.status),
              icon: '/pwa-192x192.png'
            });
          } catch (e) {
            console.warn(e);
          }
        }

        setActiveToast({
          order: o,
          oldStatus: prevStatus,
          newStatus: o.status,
          timestamp: Date.now(),
        });
      }

      // Update ref
      prevStatusesRef.current[o.id] = o.status;
    });
  }, [orders, userProfile]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  if (!activeToast) return null;

  const { order, newStatus } = activeToast;

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'novo':
        return 'Pedido recebido com sucesso!';
      case 'preparo':
        return 'Seu pedido entrou em preparo na cozinha!';
      case 'entrega':
        return 'Seu pedido saiu para entrega com o motoboy!';
      case 'concluido':
        return 'Seu pedido foi entregue e concluído!';
      case 'cancelado':
        return 'Seu pedido foi cancelado.';
      default:
        return 'Status do pedido atualizado!';
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'novo':
        return { label: 'Recebido', bg: 'bg-amber-400 text-stone-950', icon: Clock };
      case 'preparo':
        return { label: 'Em Preparo', bg: 'bg-orange-500 text-white', icon: ChefHat };
      case 'entrega':
        return { label: 'Em Rota de Entrega', bg: 'bg-sky-500 text-white', icon: Bike };
      case 'concluido':
        return { label: 'Entregue / Concluído', bg: 'bg-emerald-500 text-white', icon: CheckCircle };
      case 'cancelado':
        return { label: 'Cancelado', bg: 'bg-rose-500 text-white', icon: XCircle };
      default:
        return { label: 'Atualizado', bg: 'bg-amber-400 text-stone-950', icon: Sparkles };
    }
  };

  const badge = getStatusBadge(newStatus);
  const StatusIcon = badge.icon;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-full animate-bounce-short">
      <div className="bg-stone-900/95 text-white border-2 border-amber-400 p-4 rounded-3xl shadow-2xl backdrop-blur-xl flex items-start gap-3.5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Status Icon */}
        <div className={`w-11 h-11 rounded-2xl ${badge.bg} flex items-center justify-center shrink-0 shadow-lg mt-0.5`}>
          <StatusIcon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-xs text-amber-400 bg-black/60 px-2 py-0.5 rounded-lg border border-amber-400/30">
              {order.orderNumber}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Alerta Sonoro</span>
            </span>
          </div>

          <p className="text-sm font-black text-white mt-1 leading-snug">
            {getStatusText(newStatus)}
          </p>

          <p className="text-xs text-stone-300 mt-0.5">
            Total: <strong>{formatPrice(order.grandTotal)}</strong>
          </p>

          {/* Action button */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenOrderReceipt) onOpenOrderReceipt(order);
                setActiveToast(null);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs py-1.5 px-3.5 rounded-full shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Acompanhar Pedido</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-stone-400 hover:text-white text-xs font-semibold py-1.5 px-2 cursor-pointer transition"
            >
              Ok, entendi
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setActiveToast(null)}
          className="absolute top-3 right-3 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
