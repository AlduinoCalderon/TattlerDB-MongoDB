#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Script to initialize and run Scalar

console.log('\n🚀 Inicializando Documentación de API con Scalar 📚\n');

// Check if @scalar/cli is already installed
try {
  console.log('⏳ Checking dependencies...');
  execSync('npx @scalar/cli --version', { stdio: 'ignore' });
  console.log('✅ @scalar/cli is already installed.');
} catch (error) {
  console.log('⏳ Installing @scalar/cli...');
  execSync('npm install --no-save @scalar/cli', { stdio: 'inherit' });
  console.log('✅ @scalar/cli installed successfully.');
}

// Check that the required files exist
const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.json');
const scalarConfigPath = path.join(__dirname, '..', 'scalar.json');

if (!fs.existsSync(openApiPath)) {
  console.error('❌ Error: openapi.json file not found in the docs folder.');
  process.exit(1);
}

if (!fs.existsSync(scalarConfigPath)) {
  console.error('❌ Error: scalar.json file not found in the project root.');
  process.exit(1);
}

// Everything is ready, start Scalar
console.log('\n🌐 Starting the documentation server...');
console.log('\n📝 Documentation will be available at http://localhost:3000\n');

try {
  // Start the Scalar server with the correct command and specify the OpenAPI file
  execSync(`npx @scalar/cli document serve "./docs/openapi.json"`, { stdio: 'inherit' });
} catch (error) {
  console.error(`\n❌ Error starting Scalar: ${error.message}`);
  process.exit(1);
}