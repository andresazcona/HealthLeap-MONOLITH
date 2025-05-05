/**
 * Verifica si una fecha es un día laborable (lunes a viernes)
 */
export const isWeekday = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };
  
  /**
   * Retorna el inicio de un día (00:00:00)
   */
  export const startOfDay = (date: Date): Date => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  };
  
  /**
   * Retorna el fin de un día (23:59:59)
   */
  export const endOfDay = (date: Date): Date => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  };
  
  /**
   * Agrega un número específico de minutos a una fecha
   */
  export const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
  };
  
  /**
   * Formatea la fecha en formato YYYY-MM-DD
   */
  export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  /**
   * Formatea la hora en formato HH:MM
   */
  export const formatTime = (date: Date): string => {
    return date.toTimeString().substring(0, 5);
  };
  
  /**
   * Verifica si dos rangos de fechas se solapan
   */
  export const rangesOverlap = (
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean => {
    return start1 < end2 && start2 < end1;
  };