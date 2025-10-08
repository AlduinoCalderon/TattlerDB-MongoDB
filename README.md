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

This project uses **Scalar** for interactive API documentation.

[**Scalar**](https://github.com/scalar/scalar) is a beautiful, open-source tool that generates API documentation from OpenAPI specifications with an interface similar to Postman directly within the documentation.

### Viewing the API Documentation

#### Local Development:

1. **Start the API server:**
   ```bash
   npm run dev
   ```
   The documentation will be available at `http://localhost:3001/docs`

2. **Alternative - standalone documentation server:**
   ```bash
   npm run docs
   ```
   This runs a separate documentation server at `http://localhost:3000`

#### Production Deployment:

When deployed to Render, the documentation is automatically integrated into the API server and available at `/docs`. No additional configuration needed!

### API Endpoints

#### Health Checks

| Method | Endpoint      | Description                  |
| :----- | :------------ | :--------------------------- |
| `GET`  | `/api/health` | Checks the API server status |
| `GET`  | `/api/health/ping` | Simple ping-pong health check |

#### Restaurants

| Method | Endpoint                             | Description                                                              | Parameters / Body                                                                                             |
| :----- | :----------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/restaurants`                   | Get a paginated list of all restaurants.                                 | **Query:** `page` (number), `limit` (number)                                                                  |
| `POST` | `/api/restaurants`                   | Create a new restaurant.                                                 | **Body:** JSON object with restaurant data.                                                                   |
| `GET`  | `/api/restaurants/:id`               | Get a single restaurant by its `id`.                                     | **Param:** `id` (string)                                                                                      |
| `PUT`  | `/api/restaurants/:id`               | Update an existing restaurant by its `id`.                               | **Param:** `id` (string), **Body:** JSON object with fields to update.                                        |
| `DELETE`| `/api/restaurants/:id`              | Delete a restaurant by its `id`.                                         | **Param:** `id` (string)                                                                                      |
| `GET`  | `/api/restaurants/search/location`   | Find restaurants near a specific geographic point.                       | **Query:** `longitude` (number), `latitude` (number), `distance` (number, in meters)                          |
| `GET`  | `/api/restaurants/search/text`       | Perform a text search on restaurant fields (like name and description).  | **Query:** `q` (string)                                                                                       |

## Repository Structure

```
TattlerDB-MongoDB/
│
├── data/                   # Sample data and CSV files
│   ├── restaurants.csv     # Sample restaurant data
│   └── categories.csv      # Restaurant categories
│
├── scripts/                # Utility scripts
│   ├── import.js           # CSV import script
│   ├── backup.js           # Database backup script
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

## Database Structure

### Collections

- **restaurants**: Main collection for restaurant information
  - name: Restaurant name
  - location: GeoJSON point with restaurant coordinates
  - address: Full address details
  - categories: Array of category IDs
  - rating: Average user rating
  - priceRange: Price category (1-4)

- **reviews**: User reviews and ratings
  - restaurantId: Reference to restaurant
  - userId: Reference to user (future implementation)
  - rating: Numeric rating (1-5)
  - comment: Text review
  - date: Review timestamp

- **categories**: Restaurant categories
  - name: Category name
  - description: Category description

### Indexes

- Restaurants: name (text index), location (2dsphere), categories
- Reviews: restaurantId, rating
- Categories: name

## Usage Examples

### Finding Restaurants Near a Location

```javascript
db.restaurants.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [-99.1332, 19.4326] // Mexico City coordinates
      },
      $maxDistance: 5000 // 5km radius
    }
  }
})
```

### Getting Restaurant Reviews

```javascript
db.reviews.find({
  restaurantId: ObjectId("restaurantIdHere")
})
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Versioning

We follow the XXX Versioning Guidelines (X.X.X):
- First X (Major Version): Significant changes that may not be backward compatible
- Second X (New Features): Addition of new functionalities
- Third X (Revisions): Minor bug fixes or corrections

Current version: 0.1.0

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Contact

Project Manager: Alejandra - alejandra@tattler.mx  
Lead Developer: Elian - elian@tattler.mx  
Student Developer: Aldo Calderon - aldo.calderon@student.edu