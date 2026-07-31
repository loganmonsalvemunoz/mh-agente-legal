// Utilidad: genera el hash bcrypt para ADMIN_PASSWORD_HASH en .env
// Uso: npm run hash-password -- "mi-clave-segura"
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run hash-password -- "tu-clave"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nCopia esta linea en tu archivo .env:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
