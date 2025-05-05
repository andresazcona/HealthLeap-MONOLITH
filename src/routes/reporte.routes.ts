import { Router } from 'express';
import reporteController from '../controllers/reporte.controller';
import validateSchema from '../middlewares/validateSchema';
import { filtroReporteSchema } from '../validators/reporte.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();

// Rutas protegidas
router.use(authenticate);

// Rutas para administradores
router.post('/citas',
  authorize('admin'),
  validateSchema(filtroReporteSchema),
  reporteController.generarReporteCitas
);

router.post('/csv',
  authorize('admin'),
  validateSchema(filtroReporteSchema),
  reporteController.generarReporteCSV
);

router.get('/resumen',
  authorize('admin'),
  validateSchema(filtroReporteSchema),
  reporteController.generarResumen
);

// Rutas para médicos (solo sus propias citas)
router.post('/mis-citas',
  authorize('medico'),
  validateSchema(filtroReporteSchema),
  reporteController.generarReporteMisCitas
);

export default router;