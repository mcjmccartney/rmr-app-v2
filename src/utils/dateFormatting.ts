import { format } from 'date-fns';

/**
 * Utility functions for consistent date formatting across the app
 * All dates are displayed in DD/MM/YYYY format with HH:mm time
 * Now works with separate date and time strings from Supabase
 */

// Format date string (YYYY-MM-DD) as DD/MM/YYYY
export const formatDate = (dateString: string): string => {
  if (!dateString) {
    console.warn('Missing date string');
    return 'Invalid Date';
  }

  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

// Format time string (HH:mm:ss or HH:mm) as HH:mm
export const formatTime = (timeString: string): string => {
  if (!timeString) {
    console.warn('Missing time string');
    return 'Invalid Time';
  }

  try {
    return timeString.substring(0, 5); // Take first 5 characters (HH:mm)
  } catch (error) {
    console.warn('Error formatting time:', timeString, error);
    return 'Invalid Time';
  }
};

// Format separate date and time strings as DD/MM/YYYY, HH:mm
export const formatDateTime = (dateString: string, timeString: string): string => {
  return `${formatDate(dateString)}, ${formatTime(timeString)}`;
};

// Create a combined Date object from separate date and time strings
export const combineDateAndTime = (dateString: string, timeString: string): Date => {
  // Handle null/undefined values
  if (!dateString || !timeString) {
    return new Date(); // Return current date as fallback
  }

  try {
    return new Date(`${dateString}T${timeString}`);
  } catch (error) {
    return new Date(); // Return current date as fallback
  }
};

// Format date for display in calendar headers (MMM yyyy)
export const formatMonthYear = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM yyyy');
};

// Format date string for grouping sessions by month (MMMM yyyy)
export const formatFullMonthYear = (dateString: string): string => {
  const dateObj = new Date(dateString);
  return format(dateObj, 'MMMM yyyy');
};

// Format day name with date for detailed display (EEEE, dd/MM/yyyy)
export const formatDayDate = (dateString: string): string => {
  if (!dateString) {
    console.warn('Missing date string for formatDayDate');
    return 'Invalid Date';
  }

  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid Date';
    }
    return format(dateObj, 'EEEE, dd/MM/yyyy');
  } catch (error) {
    console.warn('Error formatting day date:', dateString, error);
    return 'Invalid Date';
  }
};

// Format client name with all their dogs
export const formatClientWithAllDogs = (client: { firstName: string; lastName: string; dogName?: string; otherDogs?: string[] }): string => {
  const allDogs = [
    ...(client.dogName ? [client.dogName] : []),
    ...(client.otherDogs || [])
  ].filter(dog => dog.trim() !== '');

  if (allDogs.length === 0) return `${client.firstName} ${client.lastName}`;
  if (allDogs.length === 1) return `${client.firstName} ${client.lastName} w/ ${allDogs[0]}`;
  if (allDogs.length === 2) return `${client.firstName} ${client.lastName} w/ ${allDogs[0]} & ${allDogs[1]}`;

  const lastDog = allDogs.pop();
  return `${client.firstName} ${client.lastName} w/ ${allDogs.join(', ')} & ${lastDog}`;
};

// Format for HTML date input (yyyy-MM-dd)
export const formatForDateInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

// Format for HTML time input (HH:mm)
export const formatForTimeInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
};

// Parse date safely from database
export const parseDbDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // If the date string doesn't end with 'Z' or timezone info, treat it as UTC
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    return new Date(dateString + 'Z');
  }
  
  return new Date(dateString);
};
