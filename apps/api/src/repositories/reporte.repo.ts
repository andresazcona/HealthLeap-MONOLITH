import { FiltroReporte, ReporteCitaRow, ReporteResumen } from '../models/reporte';
import { query } from '../config/database';
import AppError from '../utils/AppError';
import logger from '../utils/logger';

class ReporteRepository {
  /**
   * Genera un reporte de citas según los filtros aplicados
   */
  async generarReporteCitas(filtro: FiltroReporte): Promise<ReporteCitaRow[]> {
    const where: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (filtro.desde) {
      where.push(`c.fecha_hora >= $${paramIndex}`);
      values.push(filtro.desde);
      paramIndex++;
    }
    
    if (filtro.hasta) {
      where.push(`c.fecha_hora <= $${paramIndex}`);
      values.push(filtro.hasta);
      paramIndex++;
    }
    
    if (filtro.estado) {
      where.push(`c.estado = $${paramIndex}`);
      values.push(filtro.estado);
      paramIndex++;
    }
    
    if (filtro.medico_id) {
      where.push(`c.medico_id = $${paramIndex}`);
      values.push(filtro.medico_id);
      paramIndex++;
    }
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    try {
      const result = await query(
        `SELECT 
            c.id,
            c.fecha_hora,
            c.estado,
            up.nombre as paciente_nombre,
            up.email as paciente_email,
            um.nombre as medico_nombre,
            m.especialidad,
            c.created_at
         FROM citas c
         JOIN usuarios up ON c.paciente_id = up.id
         JOIN medicos m ON c.medico_id = m.id
         JOIN usuarios um ON m.usuario_id = um.id
         ${whereClause}
         ORDER BY c.fecha_hora ASC`,
        values
      );
      
      if (!result) {
        return [];
      }
      
      return result.rows;
    } catch (error: any) {
      logger.error('Error al generar reporte de citas', { error: error.message });
      throw new AppError('Error al generar reporte', 500);
    }
  }

  /**
   * Genera un resumen estadístico de citas
   */
  async generarResumen(filtro: FiltroReporte): Promise<ReporteResumen> {
    const where: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (filtro.desde) {
      where.push(`c.fecha_hora >= $${paramIndex}`);
      values.push(filtro.desde);
      paramIndex++;
    }
    
    if (filtro.hasta) {
      where.push(`c.fecha_hora <= $${paramIndex}`);
      values.push(filtro.hasta);
      paramIndex++;
    }
    
    if (filtro.medico_id) {
      where.push(`c.medico_id = $${paramIndex}`);
      values.push(filtro.medico_id);
      paramIndex++;
    }
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    
    try {
      // Obtener los conteos por estado
      const totalResult = await query(
        `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN c.estado = 'agendada' THEN 1 ELSE 0 END) as agendadas,
            SUM(CASE WHEN c.estado = 'en espera' THEN 1 ELSE 0 END) as en_espera,
            SUM(CASE WHEN c.estado = 'atendida' THEN 1 ELSE 0 END) as atendidas,
            SUM(CASE WHEN c.estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
         FROM citas c
         ${whereClause}`,
        values
      );
      
      // Obtener la distribución por especialidad
      const especialidadResult = await query(
        `SELECT 
            m.especialidad,
            COUNT(*) as total
         FROM citas c
         JOIN medicos m ON c.medico_id = m.id
         ${whereClause}
         GROUP BY m.especialidad
         ORDER BY COUNT(*) DESC`,
        values
      );
      
      // Valores predeterminados en caso de que no haya resultados
      const defaultTotales = {
        total: '0',
        agendadas: '0',
        atendidas: '0',
        canceladas: '0',
        en_espera: '0'
      };
      
      // Construir el objeto de resumen
      const totales = totalResult?.rows[0] || defaultTotales;
      const porEspecialidad: Record<string, number> = {};
      
      if (especialidadResult?.rows) {
        especialidadResult.rows.forEach((row: any) => {
          porEspecialidad[row.especialidad] = parseInt(row.total);
        });
      }
      
      return {
        total: parseInt(totales.total) || 0,
        agendadas: parseInt(totales.agendadas) || 0,
        atendidas: parseInt(totales.atendidas) || 0,
        canceladas: parseInt(totales.canceladas) || 0,
        enEspera: parseInt(totales.en_espera) || 0,
        porEspecialidad
      };
    } catch (error: any) {
      logger.error('Error al generar resumen', { error: error.message });
      throw new AppError('Error al generar resumen estadístico', 500);
    }
  }
}

export default new ReporteRepository();