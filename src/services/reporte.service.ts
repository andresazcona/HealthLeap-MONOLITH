import reporteRepository from '../repositories/reporte.repo';
import { FiltroReporte, ReporteCitaRow, ReporteResumen } from '../models/reporte';
import { generateCsv } from '../utils/csv-generator';
import AppError from '../utils/AppError';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

class ReporteService {
  /**
   * Genera un reporte detallado de citas según filtros
   */
  async generarReporteCitas(filtros: FiltroReporte): Promise<ReporteCitaRow[]> {
    try {
      return await reporteRepository.generarReporteCitas(filtros);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al generar reporte de citas', { error });
      throw new AppError('Error al generar reporte de citas', 500);
    }
  }
  
  /**
   * Genera un reporte de citas para un médico específico
   */
  async generarReporteMisCitas(medicoId: string, filtros: FiltroReporte): Promise<ReporteCitaRow[]> {
    try {
      // Asegurarse de que sólo se incluyan las citas del médico
      const filtrosCompletos = { ...filtros, medico_id: medicoId };
      return await reporteRepository.generarReporteCitas(filtrosCompletos);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al generar reporte de citas del médico', { error, medicoId });
      throw new AppError('Error al generar reporte de citas', 500);
    }
  }
  
  /**
   * Genera un archivo CSV con el reporte de citas
   */
  async generarReporteCSV(filtros: FiltroReporte): Promise<string> {
    try {
      // Obtener los datos del reporte
      const citas = await reporteRepository.generarReporteCitas(filtros);
      
      if (citas.length === 0) {
        throw new AppError('No hay datos para generar el reporte', 400);
      }
      
      // Definir los encabezados del CSV
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'fecha_hora', title: 'Fecha y Hora' },
        { id: 'estado', title: 'Estado' },
        { id: 'paciente_nombre', title: 'Paciente' },
        { id: 'paciente_email', title: 'Email Paciente' },
        { id: 'medico_nombre', title: 'Médico' },
        { id: 'especialidad', title: 'Especialidad' },
        { id: 'created_at', title: 'Fecha Creación' }
      ];
      
      // Formatear los datos para el CSV
      const citasFormateadas = citas.map(cita => ({
        ...cita,
        fecha_hora: new Date(cita.fecha_hora).toLocaleString(),
        created_at: new Date(cita.created_at).toLocaleString()
      }));
      
      // Generar el archivo CSV
      const tempDir = path.join(process.cwd(), 'temp');
      
      // Verificar que existe el directorio temporal
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Nombre del archivo basado en la fecha
      const fileName = `reporte-citas-${new Date().toISOString().split('T')[0]}.csv`;
      
      const filePath = await generateCsv(headers, citasFormateadas, {
        directory: tempDir,
        filename: fileName
      });
      
      return filePath;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al generar reporte CSV', { error });
      throw new AppError('Error al generar reporte CSV', 500);
    }
  }
  
  /**
   * Genera un resumen estadístico de citas
   */
  async generarResumen(filtros: FiltroReporte): Promise<ReporteResumen> {
    try {
      return await reporteRepository.generarResumen(filtros);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al generar resumen estadístico', { error });
      throw new AppError('Error al generar resumen estadístico', 500);
    }
  }
}

export default new ReporteService();