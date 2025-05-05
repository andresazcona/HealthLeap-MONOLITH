import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { v4 as uuidv4 } from 'uuid';

interface CsvField {
  id: string;
  title: string;
}

export interface CsvGeneratorOptions {
  filename?: string;
  directory?: string;
}

/**
 * Genera un archivo CSV a partir de los datos y campos proporcionados
 * @returns Ruta al archivo CSV generado
 */
export async function generateCsv(
  headers: CsvField[],
  data: any[],
  options: CsvGeneratorOptions = {}
): Promise<string> {
  const directory = options.directory || path.join(process.cwd(), 'temp');
  const filename = options.filename || `report-${uuidv4()}.csv`;
  
  // Asegura que el directorio exista
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  
  const filepath = path.join(directory, filename);
  
  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: headers
  });
  
  await csvWriter.writeRecords(data);
  
  return filepath;
}

/**
 * Limpia archivos CSV temporales que son más antiguos que el umbral especificado (en milisegundos)
 */
export function cleanupOldCsvFiles(directory: string, ageThresholdMs = 3600000): void {
  if (!fs.existsSync(directory)) return;
  
  const files = fs.readdirSync(directory);
  const now = Date.now();
  
  files.forEach(file => {
    if (!file.endsWith('.csv')) return;
    
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtimeMs > ageThresholdMs) {
      fs.unlinkSync(filePath);
    }
  });
}