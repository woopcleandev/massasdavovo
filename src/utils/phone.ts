/**
 * Phone number normalization utilities for Brazil (DDD + 8 or 9 digits)
 */
import { Order } from '../types';
import { formatPrice } from './format';

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  // Remove country code 55 if present and length >= 12 (e.g. 5566996523006 -> 66996523006)
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits;
}

export function formatWhatsappDisplay(phone: string): string {
  const digits = normalizePhoneNumber(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function arePhonesEqual(phone1: string, phone2: string): boolean {
  const p1 = normalizePhoneNumber(phone1);
  const p2 = normalizePhoneNumber(phone2);
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  // If one has 9 digits without DDD and other has DDD
  if (p1.length >= 8 && p2.length >= 8) {
    if (p1.endsWith(p2) || p2.endsWith(p1)) return true;
  }
  return false;
}

/**
 * Generates WhatsApp URL to confirm order with customer
 */
export function buildCustomerOrderConfirmationUrl(order: Order): string {
  const digits = normalizePhoneNumber(order.customerPhone);
  if (!digits) return '';

  const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const totalStr = formatPrice(order.grandTotal);

  let text = `Olá, *${order.customerName}*! 👋\n\n`;
  text += `Confirmamos com sucesso o recebimento do seu pedido *${order.orderNumber}* na *Massas da Vovó*! 🍝✨\n\n`;
  text += `👨‍🍳 *Status:* Seu pedido já foi enviado para a cozinha e está em preparo artesanal.\n`;
  text += `💰 *Valor Total:* ${totalStr}\n`;
  
  if (order.schedule?.isScheduled) {
    text += `⏰ *Agendamento:* ${order.schedule.displayLabel}\n`;
  } else if (order.deliveryType === 'delivery') {
    text += `🚀 *Entrega:* ${order.street || ''}, Nº ${order.number || ''} - ${order.neighborhood || ''}\n`;
  } else if (order.deliveryType === 'dine_in') {
    text += `🍽️ *Consumo Local:* Mesa/Comanda ${order.tableNumber || 'Salão'}\n`;
  } else {
    text += `🏪 *Retirada no Balcão*\n`;
  }

  text += `\nQualquer dúvida estamos à disposição por aqui! Bom apetite! 👵💛\n`;
  text += `🌐 Acesse nosso cardápio online: https://massasdavovo.vercel.app/`;

  return `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
}

/**
 * Generates WhatsApp URL to notify customer about order cancellation or missing item
 */
export function buildCustomerOrderCancellationUrl(order: Order, reason = 'Indisponibilidade temporária de ingredientes'): string {
  const digits = normalizePhoneNumber(order.customerPhone);
  if (!digits) return '';

  const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;

  let text = `Olá, *${order.customerName}*. 👋\n\n`;
  text += `Aqui é da equipe da *Massas da Vovó* referente ao seu pedido *${order.orderNumber}*.\n\n`;
  text += `⚠️ *Aviso Importante:* Infelizmente não conseguiremos prosseguir com este pedido no momento devido a: *${reason}*.\n\n`;
  text += `Pedimos sinceras desculpas pelo transtorno. Caso deseje substituir por outro prato do cardápio ou reagendar, basta nos responder por aqui ou acessar https://massasdavovo.vercel.app/ ! 🙏`;

  return `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`;
}
