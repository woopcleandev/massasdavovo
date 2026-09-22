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

export const DEFAULT_OPERATING_HOURS: OperatingHoursSettings = {
  openDays: [2, 3, 4, 5, 6, 0], // Terça (2), Quarta (3), Quinta (4), Sexta (5), Sábado (6), Domingo (0). Segunda (1) é fechado.
  openTime: '18:00',
  closeTime: '23:00',
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
  nextOpening: {
    date: Date;
    dateStr: string; // YYYY-MM-DD
    formattedDate: string; // "Terça-feira, 23/09"
    dayName: string;
    timeStr: string;
    relativeLabel: string; // "Hoje às 18:00" ou "Amanhã (Quarta) às 18:00"
  };
}

export interface DayScheduleOption {
  dateStr: string; // YYYY-MM-DD
  label: string; // "Hoje (Terça, 23/09)", "Amanhã (Quarta, 24/09)", "Quinta-feira (25/09)"
  shortLabel: string; // "Hoje", "Amanhã", "Qui 25/09"
  dayName: string;
  isToday: boolean;
  isTomorrow: boolean;
  times: string[]; // ["18:00", "18:30", "19:00", ...]
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

  // If close is before start (e.g. overnight), handle standard evening hours
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
  while (current <= endMin - 15) { // Leave room before closing
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
  const effectiveConfig: OperatingHoursSettings = {
    openDays: config?.openDays?.length ? config.openDays : DEFAULT_OPERATING_HOURS.openDays,
    openTime: config?.openTime || DEFAULT_OPERATING_HOURS.openTime,
    closeTime: config?.closeTime || DEFAULT_OPERATING_HOURS.closeTime,
    forceStatus: config?.forceStatus || 'auto',
  };

  const currentDay = now.getDay(); // 0-6
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;
  const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
  const currentDateStr = toDateKey(now);
  const currentDayName = DAY_NAMES[currentDay];

  const openMinutes = timeToMinutes(effectiveConfig.openTime);
  const closeMinutes = timeToMinutes(effectiveConfig.closeTime);

  const isTodayOpenDay = effectiveConfig.openDays.includes(currentDay);
  const isWithinHours = currentTimeMinutes >= openMinutes && currentTimeMinutes < closeMinutes;

  let isOpen = false;
  if (effectiveConfig.forceStatus === 'force_open') {
    isOpen = true;
  } else if (effectiveConfig.forceStatus === 'force_closed') {
    isOpen = false;
  } else {
    isOpen = isTodayOpenDay && isWithinHours;
  }

  // Calculate Next Opening Slot
  const nextOpening = calculateNextOpening(effectiveConfig, now);

  const hoursText = `Terça a Domingo das ${effectiveConfig.openTime} às ${effectiveConfig.closeTime}`;

  return {
    isOpen,
    statusText: isOpen ? 'Aberto Agora' : 'Fechado no Momento',
    badgeColor: isOpen ? 'emerald' : 'amber',
    currentDayName,
    currentTimeStr,
    currentDateStr,
    isTodayOpenDay,
    hoursText,
    nextOpening,
  };
};

/**
 * Calculates the next upcoming open moment
 */
export const calculateNextOpening = (
  config: OperatingHoursSettings,
  now = new Date()
) => {
  const openMinutes = timeToMinutes(config.openTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDay = now.getDay();

  // Search forward up to 8 days
  for (let offset = 0; offset < 8; offset++) {
    const candidateDate = new Date(now);
    candidateDate.setDate(now.getDate() + offset);
    const candidateDay = candidateDate.getDay();

    if (!config.openDays.includes(candidateDay)) {
      continue;
    }

    // If candidate is today, check if opening time is in the future
    if (offset === 0) {
      if (currentMinutes < openMinutes) {
        // Opens today at openTime
        const [oh, om] = config.openTime.split(':').map(Number);
        candidateDate.setHours(oh, om, 0, 0);

        const dateStr = toDateKey(candidateDate);
        const dayName = DAY_NAMES[candidateDay];
        const formattedDate = `${dayName}, ${String(candidateDate.getDate()).padStart(2, '0')}/${String(candidateDate.getMonth() + 1).padStart(2, '0')}`;
        
        return {
          date: candidateDate,
          dateStr,
          formattedDate,
          dayName,
          timeStr: config.openTime,
          relativeLabel: `Hoje às ${config.openTime}`,
        };
      }
      // If today is already past opening hours, continue to next days
      continue;
    }

    // Future open day
    const [oh, om] = config.openTime.split(':').map(Number);
    candidateDate.setHours(oh, om, 0, 0);

    const dateStr = toDateKey(candidateDate);
    const dayName = DAY_NAMES[candidateDay];
    const formattedDate = `${dayName}, ${String(candidateDate.getDate()).padStart(2, '0')}/${String(candidateDate.getMonth() + 1).padStart(2, '0')}`;
    const relativeLabel = offset === 1
      ? `Amanhã (${dayName}) às ${config.openTime}`
      : `${dayName} (${String(candidateDate.getDate()).padStart(2, '0')}/${String(candidateDate.getMonth() + 1).padStart(2, '0')}) às ${config.openTime}`;

    return {
      date: candidateDate,
      dateStr,
      formattedDate,
      dayName,
      timeStr: config.openTime,
      relativeLabel,
    };
  }

  // Fallback
  return {
    date: now,
    dateStr: toDateKey(now),
    formattedDate: `${DAY_NAMES[currentDay]}, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`,
    dayName: DAY_NAMES[currentDay],
    timeStr: config.openTime,
    relativeLabel: `Em breve às ${config.openTime}`,
  };
};

/**
 * Returns available schedule days & time slots for the next 7 days
 */
export const getAvailableScheduleSlots = (
  config: OperatingHoursSettings = DEFAULT_OPERATING_HOURS,
  now = new Date(),
  maxDays = 7
): DayScheduleOption[] => {
  const effectiveConfig: OperatingHoursSettings = {
    openDays: config?.openDays?.length ? config.openDays : DEFAULT_OPERATING_HOURS.openDays,
    openTime: config?.openTime || DEFAULT_OPERATING_HOURS.openTime,
    closeTime: config?.closeTime || DEFAULT_OPERATING_HOURS.closeTime,
    forceStatus: config?.forceStatus || 'auto',
  };

  const allPossibleSlots = generateTimeSlots(effectiveConfig.openTime, effectiveConfig.closeTime);
  const results: DayScheduleOption[] = [];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < maxDays; offset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + offset);
    const dayOfWeek = targetDate.getDay();

    if (!effectiveConfig.openDays.includes(dayOfWeek)) {
      continue; // Skip closed days (e.g. Segunda)
    }

    const isToday = offset === 0;
    const isTomorrow = offset === 1;
    const dayName = DAY_NAMES[dayOfWeek];
    const shortDay = SHORT_DAY_NAMES[dayOfWeek];
    const dateStr = toDateKey(targetDate);
    const dayNum = String(targetDate.getDate()).padStart(2, '0');
    const monthNum = String(targetDate.getMonth() + 1).padStart(2, '0');

    // Filter available slots for today (must be at least 30 minutes in advance)
    let times = [...allPossibleSlots];
    if (isToday) {
      times = times.filter(t => {
        const slotMin = timeToMinutes(t);
        return slotMin > currentMinutes + 20; // At least 20 min preparation buffer
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
