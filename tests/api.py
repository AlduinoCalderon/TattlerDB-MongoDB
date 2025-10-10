import os
import requests

BASE_URL = os.getenv("TATTLER_API_URL", "https://tattlerdb-mongodb.onrender.com")

endpoints = [
    (f"{BASE_URL}/api/health", "GET"),
    (f"{BASE_URL}/api/health/ping", "GET"),
    (f"{BASE_URL}/api/restaurants", "GET"),
    (f"{BASE_URL}/api/restaurants/search/location?longitude=-99.1332&latitude=19.4326&distance=5000", "GET"),
    (f"{BASE_URL}/api/restaurants/search/text?q=sushi", "GET"),
    (f"{BASE_URL}/docs", "GET"),
    (f"{BASE_URL}/docs/openapi.json", "GET"),
]

def test_endpoint(url, method):
    try:
        resp = requests.request(method, url, timeout=10)
        print(f"{method} {url} -> {resp.status_code}")
        try:
            print(resp.json())
        except Exception:
            print(resp.text)
        print("-" * 60)
    except Exception as e:
        print(f"Error with {url}: {e}")

if __name__ == "__main__":
    for url, method in endpoints:
        test_endpoint(url, method)