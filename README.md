# TattlerDB-MongoDB

A MongoDB database system for Tattler's nationwide restaurant directory application.

## Project Overview

This repository contains the database structure, import scripts, and documentation for Tattler's restaurant directory transformation project. The goal is to create a robust MongoDB database that supports personalized restaurant experiences and up-to-date restaurant information.

## Installation and Setup

### Prerequisites
- MongoDB 6.0 or higher
- Node.js 16.x or higher
- npm 8.x or higher

### Setting Up the Database

1. Clone this repository:
```bash
git clone https://github.com/AlduinoCalderon/TattlerDB-MongoDB.git
cd TattlerDB-MongoDB
```

2. Install dependencies:
```bash
npm install
```

3. Configure the database connection in the `.env` file (create from template):
```bash
cp .env.example .env
# Edit .env with your MongoDB connection details
```

4. Import the database structure:
```bash
npm run db:init
```

### Importing Data

To import data from CSV files into MongoDB:

```bash
# Place your CSV files in the /data directory
npm run import:data
```

## Running the API Server

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the server:**
    To start the server in development mode with automatic reloading:
    ```bash
    npm run dev
    ```
    The API will be available at `http://localhost:3001` (or the port configured in your `.env` file).


## API Documentation

This project uses **Scalar** for interactive API documentation, generated from the OpenAPI specification in [`docs/openapi.json`](./docs/openapi.json).

- **OpenAPI spec:** [`docs/openapi.json`](./docs/openapi.json) (canonical contract for all endpoints)
- **Scalar UI:**
  - Local: [http://localhost:3001/docs](http://localhost:3001/docs) (auto-served with API)
  - Standalone: `npm run docs` → [http://localhost:3000](http://localhost:3000)
- **Postman:** Import the OpenAPI spec directly for testing.

#### Updating or Validating the API Spec
If you change controllers or routes, update `docs/openapi.json` to match. You can validate the spec with [Swagger Editor](https://editor.swagger.io/) or [Spectral](https://github.com/stoplightio/spectral).

### API Endpoints (Summary)

#### Health Checks

| Method | Endpoint      | Description                  |
| :----- | :------------ | :--------------------------- |
| `GET`  | `/api/health` | Checks the API server status |
| `GET`  | `/api/health/ping` | Simple ping-pong health check |


#### Restaurants

All restaurant resources are stored in the `restaurants_google` collection and are identified by `data_id` (Google's unique place identifier). The API provides CRUD and search endpoints:

| Method   | Endpoint                                 | Description                                                        |
|----------|------------------------------------------|--------------------------------------------------------------------|
| `GET`    | `/api/restaurants`                       | List restaurants (paginated)                                       |
| `POST`   | `/api/restaurants`                       | Create or upsert a restaurant (by `data_id`)                       |
| `GET`    | `/api/restaurants/:data_id`              | Get a restaurant by `data_id`                                      |
| `PUT`    | `/api/restaurants/:data_id`              | Update a restaurant by `data_id` (partial updates allowed)         |
| `DELETE` | `/api/restaurants/:data_id`              | Soft-delete a restaurant (sets `deleted: true`)                    |
| `GET`    | `/api/restaurants/search/location`       | Find restaurants near a location (GeoJSON point, meters radius)    |
| `GET`    | `/api/restaurants/search/text`           | Text search for restaurants (by name, etc.)                        |

#### Reviews

Reviews are stored in the `reviews_google` collection and are identified by `review_id` (Google review ID) and reference `data_id` (parent place).

| Method   | Endpoint                                 | Description                                                        |
|----------|------------------------------------------|--------------------------------------------------------------------|
| `GET`    | `/api/reviews`                           | List reviews (paginated)                                           |
| `POST`   | `/api/reviews`                           | Create or upsert a review (must include `review_id` and `data_id`) |
| `GET`    | `/api/reviews/:review_id`                | Get a review by `review_id` (or fallback to internal `_id`)        |
| `PUT`    | `/api/reviews/:review_id`                | Update a review by `review_id`                                     |
| `DELETE` | `/api/reviews/:review_id`                | Soft-delete a review (sets `deleted: true`)                        |
| `GET`    | `/api/reviews/data/:data_id`             | Get all reviews for a place by `data_id`                           |

## Repository Structure

```
TattlerDB-MongoDB/
│

│
├── scripts/                # Utility scripts
│   ├── import.js           # serpApi import script
│   ├── download.js           # Database backup script
│   └── restore.js          # Database restore script
│
├── db/                     # Database configuration
│   ├── schema/             # Collection schemas
│   ├── indexes/            # Database indexing
│   └── init.js             # Database initialization
│
├── docs/                   # Project documentation
│   ├── roadmap.md          # Project roadmap
│   ├── backlog.md          # Project backlog
│   ├── gantt_chart.html    # Project Gantt chart
│   └── cover_page.tex      # LaTeX cover page
│
├── tests/                  # Test scripts
│
├── .env.example            # Environment variables template
├── package.json            # Project dependencies
└── README.md               # Repository documentation
```


## OpenAPI Specification (Canonical API Contract)

The canonical API contract is always [`docs/openapi.json`](./docs/openapi.json). This file is the source of truth for all endpoints, request/response schemas, and is used by Scalar and Postman for documentation and testing.

If you add or change endpoints, update this file and validate it with an OpenAPI linter or Swagger Editor.


## Example: Using the OpenAPI Spec in Postman

1. Open Postman and click "Import".
2. Select the `docs/openapi.json` file.
3. Postman will generate a collection with all endpoints and schemas for easy testing.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Versioning

Current version: 0.1.0

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

Project Manager: Alejandra - alejandra@tattler.mx  
Lead Developer: Elian - elian@tattler.mx  
Student Developer: Aldo Calderon - aldo.calderon@student.edu