export interface TimeOption {
  value: string;
  label: string;
}

export const generateHourOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    options.push({
      value: hourStr,
      label: hourStr
    });
  }

  return options;
};

export const generateMinuteOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];

  for (let minute = 0; minute < 60; minute += 5) {
    const minuteStr = minute.toString().padStart(2, '0');
    options.push({
      value: minuteStr,
      label: minuteStr
    });
  }

  return options;
};

// Legacy function for backward compatibility
export const generateTimeOptions = (): TimeOption[] => {
  const options: TimeOption[] = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const value = `${hourStr}:${minuteStr}`;
      const label = `${hourStr}:${minuteStr}`;

      options.push({ value, label });
    }
  }

  return options;
};

export const sessionTypeOptions = [
  { value: 'In-Person', label: 'In-Person' },
  { value: 'Online', label: 'Online' },
  { value: 'Training - 1hr', label: 'Training - 1hr' },
  { value: 'Training - 30mins', label: 'Training - 30mins' },
  { value: 'Online Catchup', label: 'Online Catchup' },
  { value: 'Group', label: 'Group' },
  { value: 'RMR Live', label: 'RMR Live' },
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'Coaching', label: 'Coaching' }
];
