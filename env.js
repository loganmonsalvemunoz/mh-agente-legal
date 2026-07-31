// Carga .env desde la ubicacion real del proyecto, no desde el cwd del proceso que lo
// lance (mismo fix que mh-automatizacion/env.js — necesario si algo arranca este server
// desde otra carpeta, ej. pm2 o un launch.json en la raiz del workspace).
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
