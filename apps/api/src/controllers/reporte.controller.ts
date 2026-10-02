import { Request, Response, NextFunction } from 'express';
import reporteService from '../services/reporte.service';
import { FiltroReporte } from '../models/reporte';
import path from 'path';
import fs from 'fs';
import { getMedicoIdDelUsuario } from '../utils/medico-del-usuario';

class ReporteController {
  /**
   * Genera reporte de citas en formato JSON
   */
  async generarReporteCitas(req: Request, res: Response, next: NextFunction) {
    try {
      const filtro: FiltroReporte = {
        desde: req.query.desde ? new Date(req.query.desde as string) : undefined,
        hasta: req.query.hasta ? new Date(req.query.hasta as string) : undefined,
        estado: req.query.estado as string,
        medico_id: req.query.medico_id as string
      };
      
      const citas = await reporteService.generarReporteCitas(filtro);
      
      res.status(200).json({
        status: 'success',
        results: citas.length,
        data: citas
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Genera reporte de citas en formato CSV
   */
  async generarReporteCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const filtro: FiltroReporte = {
        desde: req.query.desde ? new Date(req.query.desde as string) : undefined,
        hasta: req.query.hasta ? new Date(req.query.hasta as string) : undefined,
        estado: req.query.estado as string,
        medico_id: req.query.medico_id as string
      };
      
      const filePath = await reporteService.generarReporteCSV(filtro);
      
      const fileName = path.basename(filePath);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      // Eliminar archivo después de enviarlo
      fileStream.on('end', () => {
        fs.unlink(filePath, () => {});
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Genera resumen estadístico de citas
   */
  async generarResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const filtro: FiltroReporte = {
        desde: req.query.desde ? new Date(req.query.desde as string) : undefined,
        hasta: req.query.hasta ? new Date(req.query.hasta as string) : undefined,
        medico_id: req.query.medico_id as string
      };
      
      const resumen = await reporteService.generarResumen(filtro);
      
      res.status(200).json({
        status: 'success',
        data: resumen
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Genera reporte de citas para un médico específico (sus propias citas)
   */
  async generarReporteMisCitas(req: Request, res: Response, next: NextFunction) {
    try {
      const medicoId = await getMedicoIdDelUsuario(req.user!.id);
      
      const filtro: FiltroReporte = {
        desde: req.query.desde ? new Date(req.query.desde as string) : undefined,
        hasta: req.query.hasta ? new Date(req.query.hasta as string) : undefined,
        estado: req.query.estado as string
      };
      
      const citas = await reporteService.generarReporteMisCitas(medicoId, filtro);
      
      res.status(200).json({
        status: 'success',
        results: citas.length,
        data: citas
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

export default new ReporteController();