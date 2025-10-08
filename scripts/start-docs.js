#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Script para inicializar y ejecutar Scalar

console.log('\n🚀 Inicializando Documentación de API con Scalar 📚\n');

// Verificar si ya tenemos @scalar/cli
try {
  console.log('⏳ Verificando dependencias...');
  execSync('npx @scalar/cli --version', { stdio: 'ignore' });
  console.log('✅ @scalar/cli ya está instalado.');
} catch (error) {
  console.log('⏳ Instalando @scalar/cli...');
  execSync('npm install --no-save @scalar/cli', { stdio: 'inherit' });
  console.log('✅ @scalar/cli instalado correctamente.');
}

// Verificar que tenemos los archivos necesarios
const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.json');
const scalarConfigPath = path.join(__dirname, '..', 'scalar.json');

if (!fs.existsSync(openApiPath)) {
  console.error('❌ Error: No se encontró el archivo openapi.json en la carpeta docs.');
  process.exit(1);
}

if (!fs.existsSync(scalarConfigPath)) {
  console.error('❌ Error: No se encontró el archivo scalar.json en la raíz del proyecto.');
  process.exit(1);
}

// Todo está listo, ejecutamos Scalar
console.log('\n🌐 Iniciando el servidor de documentación...');
console.log('\n📝 La documentación estará disponible en http://localhost:3000\n');

try {
  // Iniciar el servidor de Scalar con el comando correcto y especificando el archivo OpenAPI
  execSync(`npx @scalar/cli document serve "./docs/openapi.json"`, { stdio: 'inherit' });
} catch (error) {
  console.error(`\n❌ Error al iniciar Scalar: ${error.message}`);
  process.exit(1);
}