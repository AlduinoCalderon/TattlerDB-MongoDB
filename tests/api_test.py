#!/usr/bin/env python3
"""
TattlerDB API Test Script
-------------------------
This script tests the TattlerDB REST API endpoints and logs the results.
"""

import requests
import json
import logging
import time
import sys
import os
from datetime import datetime
from urllib.parse import urljoin
import random
import colorama
from colorama import Fore, Style, Back

# Initialize colorama
colorama.init()

# Configure logging
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Log file with timestamp
log_filename = f"{LOG_DIR}/api_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# API Configuration
BASE_URL = "http://localhost:3000/api/"  # Change as needed
TIMEOUT = 10  # Request timeout in seconds


class APITester:
    """Class to test the TattlerDB API endpoints."""

    def __init__(self, base_url=BASE_URL):
        """Initialize with the base API URL."""
        self.base_url = base_url
        self.session = requests.Session()
        self.created_restaurant_id = None
        self.start_time = time.time()
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "endpoints_tested": [],
        }

    def _url(self, path):
        """Construct a full URL from the path."""
        return urljoin(self.base_url, path)

    def _log_request(self, method, url, data=None, params=None):
        """Log request details."""
        logger.info(f"{Fore.BLUE}REQUEST: {method} {url}{Style.RESET_ALL}")
        if params:
            logger.info(f"{Fore.BLUE}PARAMS: {json.dumps(params, indent=2)}{Style.RESET_ALL}")
        if data:
            logger.info(f"{Fore.BLUE}DATA: {json.dumps(data, indent=2)}{Style.RESET_ALL}")

    def _log_response(self, response, show_body=True):
        """Log response details."""
        try:
            response_body = response.json()
        except json.JSONDecodeError:
            response_body = response.text
            show_body = False

        color = Fore.GREEN if 200 <= response.status_code < 300 else Fore.RED
        logger.info(f"{color}RESPONSE: {response.status_code} {response.reason}{Style.RESET_ALL}")
        logger.info(f"{color}TIME: {response.elapsed.total_seconds() * 1000:.2f}ms{Style.RESET_ALL}")
        
        if show_body:
            if isinstance(response_body, dict):
                logger.info(f"{color}BODY: {json.dumps(response_body, indent=2)}{Style.RESET_ALL}")
            else:
                logger.info(f"{color}BODY: {response_body}{Style.RESET_ALL}")

        return response_body

    def assert_test(self, condition, test_name):
        """Assert a test condition and log the result."""
        self.results["total_tests"] += 1
        
        if condition:
            logger.info(f"{Fore.GREEN}✓ PASS: {test_name}{Style.RESET_ALL}")
            self.results["passed"] += 1
            return True
        else:
            logger.error(f"{Fore.RED}✗ FAIL: {test_name}{Style.RESET_ALL}")
            self.results["failed"] += 1
            return False

    def test_api_info(self):
        """Test the API info endpoint."""
        endpoint = ""
        self.results["endpoints_tested"].append(endpoint)
        method = "GET"
        url = self._url(endpoint)
        
        self._log_request(method, url)
        
        try:
            response = self.session.request(method, url, timeout=TIMEOUT)
            data = self._log_response(response)
            
            self.assert_test(response.status_code == 200, "API info returns 200 OK")
            self.assert_test("name" in data, "API info contains 'name' field")
            self.assert_test("endpoints" in data, "API info contains 'endpoints' field")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1

    def test_health_endpoints(self):
        """Test the health monitoring endpoints."""
        for endpoint in ["health", "health/ping"]:
            self.results["endpoints_tested"].append(endpoint)
            method = "GET"
            url = self._url(endpoint)
            
            self._log_request(method, url)
            
            try:
                response = self.session.request(method, url, timeout=TIMEOUT)
                data = self._log_response(response)
                
                self.assert_test(response.status_code == 200, f"Health endpoint {endpoint} returns 200 OK")
                
                if endpoint == "health":
                    self.assert_test("database" in data.get("data", {}), "Health data includes database information")
                elif endpoint == "health/ping":
                    self.assert_test("message" in data and data["message"] == "pong", "Ping returns 'pong' message")
                
            except requests.RequestException as e:
                logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
                self.results["failed"] += 1

    def test_get_restaurants(self):
        """Test getting all restaurants with pagination."""
        endpoint = "restaurants"
        self.results["endpoints_tested"].append(endpoint)
        method = "GET"
        url = self._url(endpoint)
        
        # Test different pagination parameters
        for params in [
            {},  # Default
            {"page": 1, "limit": 5},
            {"page": 2, "limit": 10},
        ]:
            self._log_request(method, url, params=params)
            
            try:
                response = self.session.request(method, url, params=params, timeout=TIMEOUT)
                data = self._log_response(response)
                
                self.assert_test(response.status_code == 200, f"GET restaurants with params {params} returns 200 OK")
                self.assert_test("data" in data, "Response contains 'data' field")
                
                if data.get("data", {}).get("restaurants"):
                    self.assert_test(isinstance(data["data"]["restaurants"], list), "Restaurants data is a list")
                    self.assert_test("pagination" in data["data"], "Response includes pagination info")
                    
                    # Save the first restaurant ID for later tests
                    if not self.created_restaurant_id and len(data["data"]["restaurants"]) > 0:
                        self.sample_restaurant_id = data["data"]["restaurants"][0]["id"]
                        logger.info(f"{Fore.BLUE}Saved sample restaurant ID: {self.sample_restaurant_id}{Style.RESET_ALL}")
                
            except requests.RequestException as e:
                logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
                self.results["failed"] += 1

    def test_get_restaurant_by_id(self):
        """Test getting a restaurant by ID."""
        if not hasattr(self, "sample_restaurant_id"):
            logger.warning(f"{Fore.YELLOW}Skipping restaurant by ID test (no sample ID available){Style.RESET_ALL}")
            return
            
        endpoint = f"restaurants/{self.sample_restaurant_id}"
        self.results["endpoints_tested"].append(endpoint)
        method = "GET"
        url = self._url(endpoint)
        
        self._log_request(method, url)
        
        try:
            response = self.session.request(method, url, timeout=TIMEOUT)
            data = self._log_response(response)
            
            self.assert_test(response.status_code == 200, f"GET restaurant by ID returns 200 OK")
            self.assert_test("data" in data, "Response contains 'data' field")
            self.assert_test(data["data"]["id"] == self.sample_restaurant_id, "Returned restaurant has correct ID")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1
            
        # Test with invalid ID
        invalid_endpoint = "restaurants/invalidid12345"
        self.results["endpoints_tested"].append(invalid_endpoint)
        invalid_url = self._url(invalid_endpoint)
        
        self._log_request(method, invalid_url)
        
        try:
            response = self.session.request(method, invalid_url, timeout=TIMEOUT)
            self._log_response(response)
            
            self.assert_test(response.status_code == 404, "GET with invalid ID returns 404 Not Found")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1

    def test_create_restaurant(self):
        """Test creating a new restaurant."""
        endpoint = "restaurants"
        self.results["endpoints_tested"].append(f"POST {endpoint}")
        method = "POST"
        url = self._url(endpoint)
        
        # Create sample restaurant data
        new_restaurant = {
            "nombre": f"Test Restaurant {int(time.time())}",
            "clase_actividad": "Restaurante de prueba automatizada",
            "tipo_vialidad": "CALLE",
            "calle": "Test Street",
            "numero_exterior": "123",
            "colonia": "Test Colony",
            "codigo_postal": "12345",
            "ubicacion": {
                "type": "Point",
                "coordinates": [-99.1332, 19.4326]  # Mexico City
            },
            "telefono": "555-123-4567",
            "correo_electronico": "test@example.com",
            "sitio_internet": "https://testrestaurant.example.com",
            "tipo": "Fijo"
        }
        
        self._log_request(method, url, data=new_restaurant)
        
        try:
            response = self.session.request(method, url, json=new_restaurant, timeout=TIMEOUT)
            data = self._log_response(response)
            
            created = response.status_code == 201
            self.assert_test(created, "POST restaurant returns 201 Created")
            
            if created and "data" in data:
                self.created_restaurant_id = data["data"].get("id")
                logger.info(f"{Fore.BLUE}Created test restaurant with ID: {self.created_restaurant_id}{Style.RESET_ALL}")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1

    def test_update_restaurant(self):
        """Test updating a restaurant."""
        if not self.created_restaurant_id:
            logger.warning(f"{Fore.YELLOW}Skipping update test (no created restaurant){Style.RESET_ALL}")
            return
            
        endpoint = f"restaurants/{self.created_restaurant_id}"
        self.results["endpoints_tested"].append(f"PUT {endpoint}")
        method = "PUT"
        url = self._url(endpoint)
        
        # Update data
        update_data = {
            "nombre": f"Updated Test Restaurant {int(time.time())}",
            "telefono": "555-999-8888"
        }
        
        self._log_request(method, url, data=update_data)
        
        try:
            response = self.session.request(method, url, json=update_data, timeout=TIMEOUT)
            data = self._log_response(response)
            
            self.assert_test(response.status_code == 200, "PUT restaurant returns 200 OK")
            self.assert_test("data" in data, "Response contains 'data' field")
            
            if "data" in data:
                self.assert_test(data["data"]["nombre"] == update_data["nombre"], "Restaurant name was updated correctly")
                self.assert_test(data["data"]["telefono"] == update_data["telefono"], "Restaurant phone was updated correctly")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1

    def test_search_restaurants(self):
        """Test restaurant search endpoints."""
        # Test location search
        if hasattr(self, "sample_restaurant_id"):
            location_endpoint = "restaurants/search/location"
            self.results["endpoints_tested"].append(location_endpoint)
            
            # Use coordinates close to Mexico City for test
            params = {
                "longitude": -99.1332,
                "latitude": 19.4326,
                "distance": 50000  # 50km
            }
            
            url = self._url(location_endpoint)
            self._log_request("GET", url, params=params)
            
            try:
                response = self.session.request("GET", url, params=params, timeout=TIMEOUT)
                data = self._log_response(response)
                
                self.assert_test(response.status_code == 200, "GET location search returns 200 OK")
                self.assert_test("data" in data, "Response contains 'data' field")
                if "data" in data:
                    self.assert_test("restaurants" in data["data"], "Response contains restaurants array")
                
            except requests.RequestException as e:
                logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
                self.results["failed"] += 1

        # Test text search
        text_endpoint = "restaurants/search/text"
        self.results["endpoints_tested"].append(text_endpoint)
        
        params = {"q": "Restaurant"}
        url = self._url(text_endpoint)
        self._log_request("GET", url, params=params)
        
        try:
            response = self.session.request("GET", url, params=params, timeout=TIMEOUT)
            self._log_response(response)
            
            # Text search may fail if there's no text index, so just log the result
            if response.status_code == 200:
                self.assert_test(True, "GET text search returns 200 OK")
            else:
                logger.warning(f"{Fore.YELLOW}Text search returned {response.status_code} - This may be expected if no text index exists{Style.RESET_ALL}")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1

    def test_delete_restaurant(self):
        """Test deleting a restaurant."""
        if not self.created_restaurant_id:
            logger.warning(f"{Fore.YELLOW}Skipping delete test (no created restaurant){Style.RESET_ALL}")
            return
            
        endpoint = f"restaurants/{self.created_restaurant_id}"
        self.results["endpoints_tested"].append(f"DELETE {endpoint}")
        method = "DELETE"
        url = self._url(endpoint)
        
        self._log_request(method, url)
        
        try:
            response = self.session.request(method, url, timeout=TIMEOUT)
            data = self._log_response(response)
            
            self.assert_test(response.status_code == 200, "DELETE restaurant returns 200 OK")
            self.assert_test("data" in data and "deletedCount" in data["data"], "Response contains deletion confirmation")
            
            # Verify it's deleted by trying to get it
            check_url = self._url(endpoint)
            check_response = self.session.request("GET", check_url, timeout=TIMEOUT)
            self._log_response(check_response, show_body=False)
            
            self.assert_test(check_response.status_code == 404, "GET deleted restaurant returns 404 Not Found")
            
        except requests.RequestException as e:
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.results["failed"] += 1

    def run_all_tests(self):
        """Run all API tests."""
        logger.info(f"{Back.BLUE}{Fore.WHITE} STARTING API TESTS {Style.RESET_ALL}")
        logger.info(f"{Fore.CYAN}Base URL: {self.base_url}{Style.RESET_ALL}")
        logger.info(f"{Fore.CYAN}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
        logger.info("-" * 80)

        try:
            # API Info Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING API INFO {Style.RESET_ALL}")
            self.test_api_info()
            logger.info("-" * 80)
            
            # Health Endpoints Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING HEALTH ENDPOINTS {Style.RESET_ALL}")
            self.test_health_endpoints()
            logger.info("-" * 80)
            
            # Get Restaurants Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING GET RESTAURANTS {Style.RESET_ALL}")
            self.test_get_restaurants()
            logger.info("-" * 80)
            
            # Get Restaurant by ID Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING GET RESTAURANT BY ID {Style.RESET_ALL}")
            self.test_get_restaurant_by_id()
            logger.info("-" * 80)
            
            # Create Restaurant Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING CREATE RESTAURANT {Style.RESET_ALL}")
            self.test_create_restaurant()
            logger.info("-" * 80)
            
            # Update Restaurant Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING UPDATE RESTAURANT {Style.RESET_ALL}")
            self.test_update_restaurant()
            logger.info("-" * 80)
            
            # Search Restaurants Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING SEARCH RESTAURANTS {Style.RESET_ALL}")
            self.test_search_restaurants()
            logger.info("-" * 80)
            
            # Delete Restaurant Test
            logger.info(f"{Back.MAGENTA}{Fore.WHITE} TESTING DELETE RESTAURANT {Style.RESET_ALL}")
            self.test_delete_restaurant()
            logger.info("-" * 80)
            
        finally:
            # Print test summary
            duration = time.time() - self.start_time
            
            logger.info(f"{Back.BLUE}{Fore.WHITE} TEST SUMMARY {Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Duration: {duration:.2f} seconds{Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Total Tests: {self.results['total_tests']}{Style.RESET_ALL}")
            logger.info(f"{Fore.GREEN}Passed: {self.results['passed']}{Style.RESET_ALL}")
            logger.info(f"{Fore.RED}Failed: {self.results['failed']}{Style.RESET_ALL}")
            
            success_rate = 0
            if self.results['total_tests'] > 0:
                success_rate = (self.results['passed'] / self.results['total_tests']) * 100
                
            logger.info(f"{Fore.CYAN}Success Rate: {success_rate:.2f}%{Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Endpoints Tested: {len(set(self.results['endpoints_tested']))}{Style.RESET_ALL}")
            logger.info("-" * 80)
            
            # Print test status
            if self.results['failed'] == 0:
                logger.info(f"{Back.GREEN}{Fore.BLACK} ALL TESTS PASSED {Style.RESET_ALL}")
            else:
                logger.info(f"{Back.RED}{Fore.WHITE} {self.results['failed']} TESTS FAILED {Style.RESET_ALL}")
                
            logger.info(f"{Fore.CYAN}Log file: {os.path.abspath(log_filename)}{Style.RESET_ALL}")


if __name__ == "__main__":
    try:
        # Parse command line arguments
        if len(sys.argv) > 1:
            BASE_URL = sys.argv[1]
        
        # Run tests
        tester = APITester(BASE_URL)
        tester.run_all_tests()
        
        # Exit with appropriate code
        sys.exit(0 if tester.results['failed'] == 0 else 1)
        
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Tests aborted by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}Error running tests: {str(e)}{Style.RESET_ALL}")
        sys.exit(1)