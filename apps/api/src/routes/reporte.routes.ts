import { Router } from 'express';
import reporteController from '../controllers/reporte.controller';
import validateSchema from '../middlewares/validateSchema';
import { filtroReporteSchema } from '../validators/reporte.validator';
import authenticate from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const router = Router();
const filtro = validateSchema(filtroReporteSchema, 'query');

router.use(authenticate);

// Filtros por query string: ?desde=&hasta=&estado=&medico_id=
router.get('/citas', authorize('admin'), filtro, reporteController.generarReporteCitas);
router.get('/citas/csv', authorize('admin'), filtro, reporteController.generarReporteCSV);
router.get('/resumen', authorize('admin'), filtro, reporteController.generarResumen);
router.get('/mis-citas', authorize('medico'), filtro, reporteController.generarReporteMisCitas);

export default router;
