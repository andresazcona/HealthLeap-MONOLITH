import { Request, Response, NextFunction } from 'express';
import reporteService from '../services/reporte.service';
import { FiltroReporte } from '../models/reporte';
import path from 'path';
import fs from 'fs';

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
        medico_id: req.query.medicoId as string
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
        medico_id: req.query.medicoId as string
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
        medico_id: req.query.medicoId as string
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
      if (!req.user || req.user.rol !== 'medico') {
        return res.status(403).json({
          status: 'error',
          message: 'No autorizado'
        });
      }
      
      const medicoId = req.user.id;
      
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
    } catch (error) {
      next(error);
    }
  }
  
  // Mantener los métodos antiguos por compatibilidad
  async obtenerResumen(req: Request, res: Response, next: NextFunction) {
    return this.generarResumen(req, res, next);
  }
  
  async obtenerReporteCitasJSON(req: Request, res: Response, next: NextFunction) {
    return this.generarReporteCitas(req, res, next);
  }
  
  async obtenerReporteMisCitas(req: Request, res: Response, next: NextFunction) {
    return this.generarReporteMisCitas(req, res, next);
  }
}

export default new ReporteController();