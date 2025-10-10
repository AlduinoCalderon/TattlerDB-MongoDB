#!/usr/bin/env python3
"""
TattlerDB API Test Script
-------------------------
This script tests the TattlerDB REST API endpoints and logs the results
with detailed reporting capabilities.
"""

import requests
import json
import logging
import time
import sys
import os
from datetime import datetime
from urllib.parse import urljoin, urlencode
import random
import colorama
from colorama import Fore, Style, Back
import platform
import textwrap
import statistics

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
BASE_URL = "http://localhost:3001/api/"  # Change as needed
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
            "skipped": 0,
            "response_times": [],
            "test_details": {},
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
        """
        Log response details with enhanced output.
        
        Returns:
            tuple: (response_body, response_time_ms)
        """
        # Calculate response time in ms
        response_time_ms = response.elapsed.total_seconds() * 1000
        
        try:
            response_body = response.json()
        except json.JSONDecodeError:
            response_body = response.text
            show_body = False

        # Determine color based on status code
        if 200 <= response.status_code < 300:
            color = Fore.GREEN
            status_icon = "✓"
        elif 300 <= response.status_code < 400:
            color = Fore.YELLOW
            status_icon = "⚠"
        else:
            color = Fore.RED
            status_icon = "✗"
        
        # Log response details
        logger.info(f"{color}RESPONSE: {status_icon} {response.status_code} {response.reason}{Style.RESET_ALL}")
        logger.info(f"{color}TIME: {response_time_ms:.2f}ms{Style.RESET_ALL}")
        
        # Log headers if they contain interesting information
        important_headers = ['content-type', 'content-length', 'cache-control', 'etag']
        headers_to_show = {k: v for k, v in response.headers.items() if k.lower() in important_headers}
        if headers_to_show:
            logger.info(f"{color}HEADERS: {json.dumps(headers_to_show, indent=2)}{Style.RESET_ALL}")
        
        # Log body with better formatting
        if show_body:
            if isinstance(response_body, dict):
                # Pretty formatting for JSON
                json_str = json.dumps(response_body, indent=2)
                if len(json_str) > 1000:  # If response is too long, truncate it
                    truncated_json = json_str[:1000] + "...\n(Response truncated, full data available in test results)"
                    logger.info(f"{color}BODY (truncated): {truncated_json}{Style.RESET_ALL}")
                else:
                    logger.info(f"{color}BODY: {json_str}{Style.RESET_ALL}")
            else:
                # Text response, possibly truncate
                if len(str(response_body)) > 1000:
                    truncated_text = str(response_body)[:1000] + "...\n(Response truncated)"
                    logger.info(f"{color}BODY (truncated): {truncated_text}{Style.RESET_ALL}")
                else:
                    logger.info(f"{color}BODY: {response_body}{Style.RESET_ALL}")

        return response_body, response_time_ms

    def assert_test(self, condition, test_name, details=None, endpoint=None, response_time=None, response_body=None):
        """
        Assert a test condition and log the result with detailed information.
        
        Args:
            condition: Boolean result of the test assertion
            test_name: Name/description of the test
            details: Additional details about the test
            endpoint: API endpoint being tested
            response_time: Response time in milliseconds
            response_body: Response body for detailed logging
        """
        self.results["total_tests"] += 1
        
        # Create test details structure
        test_info = {
            "name": test_name,
            "passed": condition,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "details": details or "No additional details",
            "endpoint": endpoint,
            "response_time": response_time,
            "response_body": response_body
        }
        
        # Save test details to results
        if test_name not in self.results["test_details"]:
            self.results["test_details"][test_name] = []
        self.results["test_details"][test_name].append(test_info)
        
        # Record response time if provided
        if response_time:
            self.results["response_times"].append(response_time)
        
        if condition:
            logger.info(f"{Fore.GREEN}✓ PASS: {test_name}{Style.RESET_ALL}")
            if details:
                logger.info(f"{Fore.GREEN}  Details: {details}{Style.RESET_ALL}")
            if response_time:
                logger.info(f"{Fore.GREEN}  Response Time: {response_time:.2f}ms{Style.RESET_ALL}")
            self.results["passed"] += 1
            return True
        else:
            logger.error(f"{Fore.RED}✗ FAIL: {test_name}{Style.RESET_ALL}")
            if details:
                logger.error(f"{Fore.RED}  Details: {details}{Style.RESET_ALL}")
            if response_time:
                logger.info(f"{Fore.RED}  Response Time: {response_time:.2f}ms{Style.RESET_ALL}")
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
            data, response_time_ms = self._log_response(response)
            
            # More detailed test assertions with timing and response info
            self.assert_test(
                response.status_code == 200, 
                "API info returns 200 OK",
                f"Got status code: {response.status_code}",
                endpoint,
                response_time_ms,
                data
            )
            
            self.assert_test(
                "name" in data, 
                "API info contains 'name' field",
                f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a JSON object'}",
                endpoint,
                response_time_ms,
                data
            )
            
            self.assert_test(
                "endpoints" in data, 
                "API info contains 'endpoints' field",
                f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a JSON object'}",
                endpoint,
                response_time_ms,
                data
            )
            
        except requests.RequestException as e:
            error_msg = f"Connection error: {str(e)}"
            logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
            self.assert_test(False, "API info endpoint is accessible", error_msg, endpoint)

    def test_health_endpoints(self):
        """Test the health monitoring endpoints."""
        for endpoint in ["health", "health/ping"]:
            self.results["endpoints_tested"].append(endpoint)
            method = "GET"
            url = self._url(endpoint)
            
            self._log_request(method, url)
            
            try:
                response = self.session.request(method, url, timeout=TIMEOUT)
                data, response_time_ms = self._log_response(response)
                
                self.assert_test(
                    response.status_code == 200, 
                    f"Health endpoint {endpoint} returns 200 OK",
                    f"Got status code: {response.status_code}",
                    endpoint,
                    response_time_ms,
                    data
                )
                
                if endpoint == "health":
                    self.assert_test(
                        "database" in data.get("data", {}), 
                        "Health data includes database information",
                        f"Data keys: {list(data.get('data', {}).keys()) if isinstance(data, dict) and 'data' in data else 'No data field'}",
                        endpoint,
                        response_time_ms,
                        data
                    )
                elif endpoint == "health/ping":
                    self.assert_test(
                        "message" in data and data["message"] == "pong", 
                        "Ping returns 'pong' message",
                        f"Message: {data.get('message', 'No message found')}",
                        endpoint,
                        response_time_ms,
                        data
                    )
                
            except requests.RequestException as e:
                error_msg = f"Connection error: {str(e)}"
                logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
                self.assert_test(False, f"Health endpoint {endpoint} is accessible", error_msg, endpoint)

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
                data, response_time_ms = self._log_response(response)
                
                # Create a descriptive test name based on the parameters
                param_desc = "default" if not params else f"page={params.get('page', 1)}, limit={params.get('limit', 10)}"
                
                self.assert_test(
                    response.status_code == 200, 
                    f"GET restaurants with {param_desc} returns 200 OK",
                    f"Got status code: {response.status_code}",
                    f"{endpoint}?{urlencode(params)}",
                    response_time_ms,
                    data
                )
                
                self.assert_test(
                    "data" in data, 
                    f"Response contains 'data' field ({param_desc})",
                    f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a JSON object'}",
                    f"{endpoint}?{urlencode(params)}",
                    response_time_ms,
                    data
                )
                
                if data.get("data", {}).get("restaurants"):
                    self.assert_test(
                        isinstance(data["data"]["restaurants"], list), 
                        f"Restaurants data is a list ({param_desc})",
                        f"Got type: {type(data['data']['restaurants']).__name__}, length: {len(data['data']['restaurants'])}",
                        f"{endpoint}?{urlencode(params)}",
                        response_time_ms,
                        data
                    )
                    
                    self.assert_test(
                        "pagination" in data["data"], 
                        f"Response includes pagination info ({param_desc})",
                        f"Data keys: {list(data['data'].keys()) if isinstance(data['data'], dict) else 'Not a JSON object'}",
                        f"{endpoint}?{urlencode(params)}",
                        response_time_ms,
                        data
                    )
                    
                    # Save the first restaurant ID for later tests
                    if not self.created_restaurant_id and len(data["data"]["restaurants"]) > 0:
                        self.sample_restaurant_id = data["data"]["restaurants"][0]["id"]
                        logger.info(f"{Fore.BLUE}Saved sample restaurant ID: {self.sample_restaurant_id}{Style.RESET_ALL}")
                
            except requests.RequestException as e:
                error_msg = f"Connection error: {str(e)}"
                logger.error(f"{Fore.RED}REQUEST ERROR: {str(e)}{Style.RESET_ALL}")
                self.assert_test(
                    False, 
                    f"GET restaurants with {param_desc} is accessible", 
                    error_msg, 
                    f"{endpoint}?{urlencode(params)}"
                )

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
            # Generate detailed test summary
            duration = time.time() - self.start_time
            
            logger.info(f"{Back.BLUE}{Fore.WHITE} TEST SUMMARY {Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Duration: {duration:.2f} seconds{Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Total Tests: {self.results['total_tests']}{Style.RESET_ALL}")
            logger.info(f"{Fore.GREEN}Passed: {self.results['passed']}{Style.RESET_ALL}")
            logger.info(f"{Fore.RED}Failed: {self.results['failed']}{Style.RESET_ALL}")
            logger.info(f"{Fore.YELLOW}Skipped: {self.results['skipped']}{Style.RESET_ALL}")
            
            success_rate = 0
            if self.results['total_tests'] > 0:
                success_rate = (self.results['passed'] / self.results['total_tests']) * 100
            
            # Calculate response time statistics if available
            response_time_stats = {}
            if self.results['response_times']:
                response_time_stats = {
                    'min': min(self.results['response_times']),
                    'max': max(self.results['response_times']),
                    'avg': statistics.mean(self.results['response_times']),
                    'median': statistics.median(self.results['response_times'])
                }
                logger.info(f"{Fore.CYAN}Response Time Stats:{Style.RESET_ALL}")
                logger.info(f"{Fore.CYAN}  Min: {response_time_stats['min']:.2f}ms{Style.RESET_ALL}")
                logger.info(f"{Fore.CYAN}  Max: {response_time_stats['max']:.2f}ms{Style.RESET_ALL}")
                logger.info(f"{Fore.CYAN}  Avg: {response_time_stats['avg']:.2f}ms{Style.RESET_ALL}")
                logger.info(f"{Fore.CYAN}  Median: {response_time_stats['median']:.2f}ms{Style.RESET_ALL}")
            
            logger.info(f"{Fore.CYAN}Success Rate: {success_rate:.2f}%{Style.RESET_ALL}")
            
            # List all tested endpoints with their methods
            endpoints = set(self.results['endpoints_tested'])
            logger.info(f"{Fore.CYAN}Endpoints Tested: {len(endpoints)}{Style.RESET_ALL}")
            for endpoint in sorted(endpoints):
                logger.info(f"{Fore.CYAN}  - {endpoint}{Style.RESET_ALL}")
            
            logger.info("-" * 80)
            
            # Summary of failed tests if any
            if self.results['failed'] > 0:
                logger.info(f"{Back.RED}{Fore.WHITE} FAILED TESTS SUMMARY {Style.RESET_ALL}")
                for test_name, test_infos in self.results['test_details'].items():
                    failed_tests = [t for t in test_infos if not t['passed']]
                    if failed_tests:
                        for test in failed_tests:
                            logger.error(f"{Fore.RED}✗ {test_name}: {test['details']}{Style.RESET_ALL}")
                            logger.error(f"{Fore.RED}  Endpoint: {test['endpoint']}{Style.RESET_ALL}")
                logger.info("-" * 80)
            
            # System information
            logger.info(f"{Back.BLUE}{Fore.WHITE} ENVIRONMENT INFORMATION {Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Python Version: {platform.python_version()}{Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}OS: {platform.system()} {platform.version()}{Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}API URL: {self.base_url}{Style.RESET_ALL}")
            logger.info(f"{Fore.CYAN}Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
            logger.info("-" * 80)
            
            # Print test status
            if self.results['failed'] == 0:
                logger.info(f"{Back.GREEN}{Fore.BLACK} ALL TESTS PASSED {Style.RESET_ALL}")
            else:
                logger.info(f"{Back.RED}{Fore.WHITE} {self.results['failed']} TESTS FAILED {Style.RESET_ALL}")
                
            logger.info(f"{Fore.CYAN}Log file: {os.path.abspath(log_filename)}{Style.RESET_ALL}")
            
            # Generate detailed test report to file
            try:
                self._generate_text_report()
            except Exception as e:
                logger.error(f"{Fore.RED}Error generating detailed report: {str(e)}{Style.RESET_ALL}")
                
    def _generate_text_report(self):
        """Generate a detailed text test report."""
        # Create reports directory if it doesn't exist
        report_dir = "reports"
        if not os.path.exists(report_dir):
            os.makedirs(report_dir)
            
        # Create report filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_filename = f"{report_dir}/api_test_report_{timestamp}.txt"
        
        # Calculate duration
        duration = time.time() - self.start_time
        
        # Calculate success rate
        success_rate = 0
        if self.results['total_tests'] > 0:
            success_rate = (self.results['passed'] / self.results['total_tests']) * 100
            
        # Calculate response time statistics if available
        response_time_stats = {}
        if self.results['response_times']:
            response_time_stats = {
                'min': min(self.results['response_times']),
                'max': max(self.results['response_times']),
                'avg': statistics.mean(self.results['response_times']),
                'median': statistics.median(self.results['response_times'])
            }
        
        # Generate text report
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write(" " * 30 + "TATTLERDB API TEST REPORT\n")
            f.write("="*80 + "\n\n")
            
            f.write(f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"API URL: {self.base_url}\n\n")
            
            f.write("-"*80 + "\n")
            f.write("TEST SUMMARY\n")
            f.write("-"*80 + "\n")
            f.write(f"Total Tests: {self.results['total_tests']}\n")
            f.write(f"Passed: {self.results['passed']}\n")
            f.write(f"Failed: {self.results['failed']}\n")
            f.write(f"Skipped: {self.results['skipped']}\n")
            f.write(f"Success Rate: {success_rate:.2f}%\n")
            f.write(f"Duration: {duration:.2f} seconds\n\n")
            
            # Write response time stats if available
            if response_time_stats:
                f.write("RESPONSE TIME STATISTICS\n")
                f.write("-"*80 + "\n")
                f.write(f"Min: {response_time_stats['min']:.2f}ms\n")
                f.write(f"Max: {response_time_stats['max']:.2f}ms\n")
                f.write(f"Avg: {response_time_stats['avg']:.2f}ms\n")
                f.write(f"Median: {response_time_stats['median']:.2f}ms\n\n")
            
            # Write tested endpoints
            f.write("TESTED ENDPOINTS\n")
            f.write("-"*80 + "\n")
            endpoints = set(self.results['endpoints_tested'])
            for endpoint in sorted(endpoints):
                f.write(f"- {endpoint}\n")
            f.write("\n")
            
            # Write detailed test results
            f.write("DETAILED TEST RESULTS\n")
            f.write("-"*80 + "\n")
            for test_name, test_infos in self.results['test_details'].items():
                f.write(f"\n{test_name}:\n")
                f.write("-" * len(test_name) + ":\n")
                
                for i, test in enumerate(test_infos, 1):
                    status = "PASS" if test['passed'] else "FAIL"
                    f.write(f"  {i}. [{status}] Endpoint: {test['endpoint'] or 'N/A'}\n")
                    
                    if test['response_time']:
                        f.write(f"     Response Time: {test['response_time']:.2f}ms\n")
                    
                    if test['details']:
                        f.write(f"     Details: {test['details']}\n")
                    
                    f.write("\n")
            
            # Write environment info
            f.write("ENVIRONMENT INFORMATION\n")
            f.write("-"*80 + "\n")
            f.write(f"Python Version: {platform.python_version()}\n")
            f.write(f"OS: {platform.system()} {platform.version()}\n")
            f.write(f"Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Log File: {os.path.abspath(log_filename)}\n")
            
        logger.info(f"{Fore.GREEN}Detailed text report generated: {os.path.abspath(report_filename)}{Style.RESET_ALL}")


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