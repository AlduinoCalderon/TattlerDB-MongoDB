# TattlerDB API Test Suite

This folder contains test scripts for the TattlerDB API.

## API Test Script

The `api_test.py` script tests all endpoints of the REST API and provides detailed logging of the requests, responses, and test results.

### Features

- Tests all CRUD operations for restaurants
- Tests health and monitoring endpoints
- Tests search functionality (geospatial and text search)
- Provides detailed, colorful console output
- Logs all requests and responses to files
- Generates test summary with success rate

### Requirements

- Python 3.6+
- Required Python packages (see `requirements.txt`)

### Installation

```bash
pip install -r requirements.txt
```

### Usage

```bash
# Run tests against the default API URL (http://localhost:3000/api/)
python api_test.py

# Run tests against a custom API URL
python api_test.py http://example.com/api/
```

### Output

The script generates:

1. Colorized console output showing test progress and results
2. Log files in the `logs` directory with timestamps
3. Summary of test results at the end

### Examples

Testing local API:
```bash
python api_test.py
```

Testing production API:
```bash
python api_test.py https://api.tattler.mx/api/
```

## Test Results

The script outputs detailed information about each test, including:

- Request method and URL
- Request parameters and body (if applicable)
- Response status code and time
- Response body
- Test assertions and results

At the end, a summary shows:
- Total number of tests run
- Number of passed and failed tests
- Success rate percentage
- Duration of the test run
- Path to the log file