#!/usr/bin/env node
// Script para descargar datos de Google Maps (SerpApi) en lotes y guardarlos en /data/raw_google
// Busca restaurantes y negocios de comida en Monterrey y municipios cercanos


// Carga variables de entorno desde .env
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_KEY = process.env.SERPAPI_KEY;
if (!API_KEY) {
  console.error('❌ Debes definir SERPAPI_KEY en tu archivo .env');
  process.exit(1);
}
const RAW_DIR = path.join(__dirname, '../data/raw_google');
const MUNICIPIOS = [
  'Monterrey',
  'San Pedro Garza Garcia',
  'Apodaca',
  'Escobedo',
  'Guadalupe',
  'Santa Catarina'
];
const QUERY = 'restaurante OR comida OR antojitos OR taquería OR fonda';
const BATCH_SIZES = [50, 20];
const MAX_ATTEMPTS = [4, 10];
const MAX_TOTAL = 200;

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });


async function fetchPaginatedMunicipio(municipio, maxTotal = 200) {
  let total = 0;
  let page = 1;
  let nextPageToken = undefined;
  let batch = 0;
  while (total < maxTotal) {
    const url = `https://serpapi.com/search.json`;
    const params = {
      engine: 'google_maps',
      q: QUERY + ' ' + municipio,
      hl: 'es',
      google_domain: 'google.com.mx',
      type: 'search',
      num: 20,
      api_key: API_KEY
    };
    if (nextPageToken) params.next_page_token = nextPageToken;
    try {
      const { data } = await axios.get(url, { params, timeout: 20000 });
      if (data.local_results && data.local_results.length > 0) {
        const file = path.join(
          RAW_DIR,
          `google_${municipio.replace(/\s/g, '_')}_page${page}.json`
        );
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        console.log(`✅ Guardado batch de ${data.local_results.length} para ${municipio} (página ${page})`);
        total += data.local_results.length;
        page++;
        batch++;
        nextPageToken = data.serpapi_pagination?.next_page_token;
        if (!nextPageToken) break;
      } else {
        console.log(`⚠️ Sin resultados para ${municipio} (página ${page})`);
        break;
      }
    } catch (err) {
      console.log(`❌ Error en batch ${municipio} (página ${page}): ${err.message}`);
      break;
    }
    if (total >= maxTotal) break;
  }
  return total;
}

async function main() {
  let total = 0;
  for (const municipio of MUNICIPIOS) {
    const got = await fetchPaginatedMunicipio(municipio, MAX_TOTAL - total);
    total += got;
    if (total >= MAX_TOTAL) break;
  }
  console.log(`\n🎉 Descarga terminada. Total de elementos: ${total}`);
}

main();
