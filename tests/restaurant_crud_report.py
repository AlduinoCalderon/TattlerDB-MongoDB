import os
import requests
import json
from datetime import datetime

BASE_URL = os.getenv("TATTLER_API_URL", "https://tattlerdb-mongodb.onrender.com")
HEADERS = {"Content-Type": "application/json"}

report = []
restaurant_id = None

# Datos de prueba
fake_restaurant = {
    "name": "Test Restaurante API",
    "location": {"type": "Point", "coordinates": [-99.1332, 19.4326]},
    "address": "Calle Falsa 123, CDMX",
    "categories": ["test-category"],
    "rating": 4.5,
    "priceRange": 2
}

updated_data = {
    "name": "Test Restaurante API Modificado",
    "rating": 3.0
}

def markdown_step(title, success, response=None, error=None):
    emoji = "✅" if success else "❌"
    report.append(f"### {emoji} {title}")
    if response is not None:
        try:
            body = json.dumps(response, indent=2, ensure_ascii=False)
        except Exception:
            body = str(response)
        report.append(f"```json\n{body}\n```")
    if error:
        report.append(f"**Error:** {error}")
    report.append("")

def main():
    global restaurant_id
    # 1. Crear restaurante
    try:
        r = requests.post(f"{BASE_URL}/api/restaurants", json=fake_restaurant, headers=HEADERS, timeout=10)
        data = r.json()
        restaurant_id = data.get("data", {}).get("_id") or data.get("_id")
        markdown_step("Crear restaurante (POST)", r.status_code == 201 and restaurant_id, data)
    except Exception as e:
        markdown_step("Crear restaurante (POST)", False, error=str(e))
        return

    # 2. Consultar por ID
    try:
        r = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}", timeout=10)
        data = r.json()
        markdown_step("Consultar restaurante por ID (GET)", r.status_code == 200, data)
    except Exception as e:
        markdown_step("Consultar restaurante por ID (GET)", False, error=str(e))

    # 3. Modificar restaurante
    try:
        r = requests.put(f"{BASE_URL}/api/restaurants/{restaurant_id}", json=updated_data, headers=HEADERS, timeout=10)
        data = r.json()
        markdown_step("Modificar restaurante (PUT)", r.status_code == 200, data)
    except Exception as e:
        markdown_step("Modificar restaurante (PUT)", False, error=str(e))

    # 4. Eliminar restaurante (lógico)
    try:
        r = requests.delete(f"{BASE_URL}/api/restaurants/{restaurant_id}", timeout=10)
        data = r.json()
        markdown_step("Eliminar restaurante (DELETE)", r.status_code == 200, data)
    except Exception as e:
        markdown_step("Eliminar restaurante (DELETE)", False, error=str(e))

    # 5. Consultar de nuevo (debe estar eliminado lógicamente)
    try:
        r = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}", timeout=10)
        data = r.json()
        # Considera éxito si el campo "deleted" o similar está en True, o si no se encuentra
        deleted = data.get("data", {}).get("deleted") or data.get("deleted")
        not_found = r.status_code == 404
        logic = (deleted is True) or not_found
        markdown_step("Consultar restaurante eliminado (GET)", logic, data)
    except Exception as e:
        markdown_step("Consultar restaurante eliminado (GET)", False, error=str(e))

    # 6. Resumen
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    report.insert(0, f"# Informe de pruebas CRUD de Restaurante\n\n_Ejecución: {now}_\n\nBase URL: `{BASE_URL}`\n")
    markdown = "\n".join(report)
    print(markdown)
    # Guardar en archivo
    with open("restaurant_crud_report.md", "w", encoding="utf-8") as f:
        f.write(markdown)

if __name__ == "__main__":
    main()
