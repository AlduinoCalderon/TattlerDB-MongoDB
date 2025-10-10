# Informe de pruebas CRUD de Restaurante

_Ejecución: 2025-10-10 01:22 UTC_

Base URL: `https://tattlerdb-mongodb.onrender.com`

### ✅ Crear restaurante (POST)
```json
{
  "success": true,
  "data": {
    "name": "Test Restaurante API",
    "location": {
      "type": "Point",
      "coordinates": [
        -99.1332,
        19.4326
      ]
    },
    "address": "Calle Falsa 123, CDMX",
    "categories": [
      "test-category"
    ],
    "rating": 4.5,
    "priceRange": 2,
    "id": "68e85fdc51bf55ea9a89961f",
    "_id": "68e85fde51bf55ea9a899620"
  }
}
```

### ❌ Consultar restaurante por ID (GET)
```json
{
  "success": false,
  "error": {
    "message": "Restaurant with ID 68e85fde51bf55ea9a899620 not found",
    "stack": "ApiError: Restaurant with ID 68e85fde51bf55ea9a899620 not found\n    at ApiError.notFound (/opt/render/project/src/utils/apiError.js:13:12)\n    at getRestaurantById (/opt/render/project/src/controllers/restaurant.controller.js:69:24)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)"
  }
}
```

### ❌ Modificar restaurante (PUT)
```json
{
  "success": false,
  "error": {
    "message": "Restaurant with ID 68e85fde51bf55ea9a899620 not found",
    "stack": "ApiError: Restaurant with ID 68e85fde51bf55ea9a899620 not found\n    at ApiError.notFound (/opt/render/project/src/utils/apiError.js:13:12)\n    at /opt/render/project/src/controllers/restaurant.controller.js:161:26\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async Database.withConnection (/opt/render/project/src/utils/database.js:62:22)\n    at async updateRestaurant (/opt/render/project/src/controllers/restaurant.controller.js:155:22)"
  }
}
```

### ❌ Eliminar restaurante (DELETE)
```json
{
  "success": false,
  "error": {
    "message": "Restaurant with ID 68e85fde51bf55ea9a899620 not found",
    "stack": "ApiError: Restaurant with ID 68e85fde51bf55ea9a899620 not found\n    at ApiError.notFound (/opt/render/project/src/utils/apiError.js:13:12)\n    at /opt/render/project/src/controllers/restaurant.controller.js:201:26\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async Database.withConnection (/opt/render/project/src/utils/database.js:62:22)\n    at async deleteRestaurant (/opt/render/project/src/controllers/restaurant.controller.js:195:22)"
  }
}
```

### ✅ Consultar restaurante eliminado (GET)
```json
{
  "success": false,
  "error": {
    "message": "Restaurant with ID 68e85fde51bf55ea9a899620 not found",
    "stack": "ApiError: Restaurant with ID 68e85fde51bf55ea9a899620 not found\n    at ApiError.notFound (/opt/render/project/src/utils/apiError.js:13:12)\n    at getRestaurantById (/opt/render/project/src/controllers/restaurant.controller.js:69:24)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)"
  }
}
```
