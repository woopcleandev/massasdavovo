import { OperatingHoursSettings } from '../types';

export const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const SHORT_DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export interface DayOperatingHours {
  isOpen: boolean;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}

/**
 * Horários Oficiais do Massas da Vovó em Primavera do Leste - MT:
 * - Domingo: Fechado
 * - Segunda a Quinta: 09:00 às 17:30
 * - Sexta-feira: 09:00 às 19:30
 * - Sábado: 09:00 às 13:00
 */
export const OFFICIAL_WEEKLY_HOURS: Record<number, DayOperatingHours> = {
  0: { isOpen: false, openTime: '09:00', closeTime: '17:30' }, // Domingo: Fechado
  1: { isOpen: true, openTime: '09:00', closeTime: '17:30' },  // Segunda: 09:00 às 17:30
  2: { isOpen: true, openTime: '09:00', closeTime: '17:30' },  // Terça: 09:00 às 17:30
  3: { isOpen: true, openTime: '09:00', closeTime: '17:30' },  // Quarta: 09:00 às 17:30
  4: { isOpen: true, openTime: '09:00', closeTime: '17:30' },  // Quinta: 09:00 às 17:30
  5: { isOpen: true, openTime: '09:00', closeTime: '19:30' },  // Sexta: 09:00 às 19:30
  6: { isOpen: true, openTime: '09:00', closeTime: '13:00' },  // Sábado: 09:00 às 13:00
};

export const DEFAULT_OPERATING_HOURS: OperatingHoursSettings = {
  openDays: [1, 2, 3, 4, 5, 6], // Segunda a Sábado aberto, Domingo fechado
  openTime: '09:00',
  closeTime: '17:30',
  forceStatus: 'auto',
};

export interface BusinessStatusResult {
  isOpen: boolean;
  statusText: string;
  badgeColor: 'emerald' | 'amber' | 'red';
  currentDayName: string;
  currentTimeStr: string;
  currentDateStr: string;
  isTodayOpenDay: boolean;
  hoursText: string;
  todayHoursText: string;
  nextOpening: {
    date: Date;
    dateStr: string; // YYYY-MM-DD
    formattedDate: string; // "Segunda-feira, 25/09"
    dayName: string;
    timeStr: string;
    relativeLabel: string; // "Hoje às 09:00" ou "Amanhã às 09:00"
  };
}

export interface DayScheduleOption {
  dateStr: string; // YYYY-MM-DD
  label: string; // "Hoje (Segunda, 25/09)", "Amanhã (Terça, 26/09)"
  shortLabel: string; // "Hoje", "Amanhã", "Seg 25/09"
  dayName: string;
  isToday: boolean;
  isTomorrow: boolean;
  times: string[]; // ["09:00", "09:30", ...]
}

/**
 * Format date to YYYY-MM-DD (local)
 */
export const toDateKey = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert HH:mm to minutes from midnight
 */
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Generate time slots in 30-min intervals between openTime and closeTime
 */
export const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
  const slots: string[] = [];
  const startMin = timeToMinutes(openTime);
  const endMin = timeToMinutes(closeTime);

  if (endMin <= startMin) {
    let curr = startMin;
    while (curr < 24 * 60) {
      const h = String(Math.floor(curr / 60)).padStart(2, '0');
      const m = String(curr % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
      curr += 30;
    }
    return slots;
  }

  let current = startMin;
  while (current <= endMin - 15) { // At least 15 min margin before closing
    const h = String(Math.floor(current / 60)).padStart(2, '0');
    const m = String(current % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += 30;
  }

  return slots;
};

/**
 * Check if the restaurant is currently OPEN or CLOSED and get rich status
 */
export const getBusinessStatus = (
  config: OperatingHoursSettings = DEFAULT_OPERATING_HOURS,
  now = new Date()
): BusinessStatusResult => {
  const currentDay = now.getDay(); // 0 (Domingo) to 6 (Sábado)
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;
  const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
  const currentDateStr = toDateKey(now);
  const currentDayName = DAY_NAMES[currentDay];

  const todaySchedule = OFFICIAL_WEEKLY_HOURS[currentDay] || {
    isOpen: config.openDays.includes(currentDay),
    openTime: config.openTime || '09:00',
    closeTime: config.closeTime || '17:30',
  };

  const isTodayOpenDay = todaySchedule.isOpen && (config.openDays ? config.openDays.includes(currentDay) : true);
  const openMinutes = timeToMinutes(todaySchedule.openTime);
  const closeMinutes = timeToMinutes(todaySchedule.closeTime);
  const isWithinHours = currentTimeMinutes >= openMinutes && currentTimeMinutes < closeMinutes;

  let isOpen = false;
  if (config.forceStatus === 'force_open') {
    isOpen = true;
  } else if (config.forceStatus === 'force_closed') {
    isOpen = false;
  } else {
    isOpen = isTodayOpenDay && isWithinHours;
  }

  // Calculate Next Opening Slot
  const nextOpening = calculateNextOpening(config, now);

  const todayHoursText = isTodayOpenDay
    ? `${todaySchedule.openTime} às ${todaySchedule.closeTime}`
    : 'Fechado hoje';

  const hoursText = 'Seg a Qui: 09h-17h30 • Sex: 09h-19h30 • Sáb: 09h-13h';

  return {
    isOpen,
    statusText: isOpen ? 'Aberto Agora' : 'Fechado no Momento (Agendamento Aberto)',
    badgeColor: isOpen ? 'emerald' : 'amber',
    currentDayName,
    currentTimeStr,
    currentDateStr,
    isTodayOpenDay,
    hoursText,
    todayHoursText,
    nextOpening,
  };
};

/**
 * Calculates the next upcoming open moment
 */
export const calculateNextOpening = (
  config: OperatingHoursSettings = DEFAULT_OPERATING_HOURS,
  now = new Date()
) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay();

  // Search forward up to 8 days
  for (let offset = 0; offset < 8; offset++) {
    const candidateDate = new Date(now);
    candidateDate.setDate(now.getDate() + offset);
    const candidateDay = candidateDate.getDay();

    const daySchedule = OFFICIAL_WEEKLY_HOURS[candidateDay];
    if (!daySchedule || !daySchedule.isOpen) {
      continue;
    }
    if (config.openDays && !config.openDays.includes(candidateDay)) {
      continue;
    }

    const openMinutes = timeToMinutes(daySchedule.openTime);

    // If candidate is today, check if opening time is in the future
    if (offset === 0) {
      if (currentMinutes < openMinutes) {
        const [oh, om] = daySchedule.openTime.split(':').map(Number);
        candidateDate.setHours(oh, om, 0, 0);

        const dateStr = toDateKey(candidateDate);
        const dayName = DAY_NAMES[candidateDay];
        const formattedDate = `${dayName}, ${String(candidateDate.getDate()).padStart(2, '0')}/${String(candidateDate.getMonth() + 1).padStart(2, '0')}`;
        
        return {
          date: candidateDate,
          dateStr,
          formattedDate,
          dayName,
          timeStr: daySchedule.openTime,
          relativeLabel: `Hoje às ${daySchedule.openTime}`,
        };
      }
      continue;
    }

    // Future open day
    const [oh, om] = daySchedule.openTime.split(':').map(Number);
    candidateDate.setHours(oh, om, 0, 0);

    const dateStr = toDateKey(candidateDate);
    const dayName = DAY_NAMES[candidateDay];
    const formattedDate = `${dayName}, ${String(candidateDate.getDate()).padStart(2, '0')}/${String(candidateDate.getMonth() + 1).padStart(2, '0')}`;
    const relativeLabel = offset === 1
      ? `Amanhã (${dayName}) às ${daySchedule.openTime}`
      : `${dayName} (${String(candidateDate.getDate()).padStart(2, '0')}/${String(candidateDate.getMonth() + 1).padStart(2, '0')}) às ${daySchedule.openTime}`;

    return {
      date: candidateDate,
      dateStr,
      formattedDate,
      dayName,
      timeStr: daySchedule.openTime,
      relativeLabel,
    };
  }

  // Fallback
  return {
    date: now,
    dateStr: toDateKey(now),
    formattedDate: `${DAY_NAMES[currentDay]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`,
    dayName: DAY_NAMES[currentDay],
    timeStr: '09:00',
    relativeLabel: 'Em breve às 09:00',
  };
};

/**
 * Returns available schedule days & time slots for the next 7 days based on day-specific schedules
 */
export const getAvailableScheduleSlots = (
  config: OperatingHoursSettings = DEFAULT_OPERATING_HOURS,
  now = new Date(),
  maxDays = 7
): DayScheduleOption[] => {
  const results: DayScheduleOption[] = [];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < maxDays; offset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + offset);
    const dayOfWeek = targetDate.getDay();

    const daySchedule = OFFICIAL_WEEKLY_HOURS[dayOfWeek];
    if (!daySchedule || !daySchedule.isOpen) {
      continue; // Skip closed days (e.g. Domingo)
    }

    if (config.openDays && !config.openDays.includes(dayOfWeek)) {
      continue;
    }

    const allPossibleSlots = generateTimeSlots(daySchedule.openTime, daySchedule.closeTime);

    const isToday = offset === 0;
    const isTomorrow = offset === 1;
    const dayName = DAY_NAMES[dayOfWeek];
    const shortDay = SHORT_DAY_NAMES[dayOfWeek];
    const dateStr = toDateKey(targetDate);
    const dayNum = String(targetDate.getDate()).padStart(2, '0');
    const monthNum = String(targetDate.getMonth() + 1).padStart(2, '0');

    // Filter available slots for today (must be at least 20 minutes in advance)
    let times = [...allPossibleSlots];
    if (isToday) {
      times = times.filter(t => {
        const slotMin = timeToMinutes(t);
        return slotMin > currentMinutes + 20; // 20 min preparation buffer
      });
    }

    if (times.length === 0) {
      continue; // No valid slots left for this day
    }

    let label = `${dayName} (${dayNum}/${monthNum})`;
    let shortLabel = `${shortDay} ${dayNum}/${monthNum}`;
    if (isToday) {
      label = `Hoje (${dayName}, ${dayNum}/${monthNum})`;
      shortLabel = `Hoje (${shortDay})`;
    } else if (isTomorrow) {
      label = `Amanhã (${dayName}, ${dayNum}/${monthNum})`;
      shortLabel = `Amanhã (${shortDay})`;
    }

    results.push({
      dateStr,
      label,
      shortLabel,
      dayName,
      isToday,
      isTomorrow,
      times,
    });
  }

  return results;
};
