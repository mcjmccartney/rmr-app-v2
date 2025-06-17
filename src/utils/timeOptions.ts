export interface TimeOption {
  value: string; // HH:mm format
  label: string; // Display format
}

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
  { value: 'Training', label: 'Training' },
  { value: 'Online Catchup', label: 'Online Catchup' },
  { value: 'Group', label: 'Group' },
  { value: 'RMR Live', label: 'RMR Live' },
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'Coaching', label: 'Coaching' }
];
