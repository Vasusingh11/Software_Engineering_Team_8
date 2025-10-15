# Loaner Laptop Management - Backend API

A Node.js/Express REST API with SQLite database for managing equipment loans in organizations.

## 📋 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin, Staff, and Borrower roles
- **Inventory Tracking**: Complete item lifecycle management
- **Loan Management**: Request, approval, and return workflows
- **Reporting**: Dashboard stats and overdue item tracking
- **Database**: SQLite with comprehensive schema and relationships

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Copy the .env file and update with your settings
   cp .env.example .env
   ```

3. **Initialize the database**:
   ```bash
   npm run reset-db
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 🔐 Demo Accounts

After running `npm run reset-db`, these demo accounts are available:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | admin123 | Admin | Full system access |
| staff | staff123 | Staff | Inventory + loan management |
| john.doe | user123 | Borrower | Request loans only |
| jane.smith | user123 | Borrower | Request loans only |
| mike.wilson | user123 | Borrower | Request loans only |

## 📊 Database Schema

### Tables
- **users**: User accounts and authentication
- **categories**: Equipment categories (Laptops, Monitors, etc.)
- **locations**: Physical locations for equipment
- **items**: Inventory items with full details
- **loans**: Loan requests and transactions
- **maintenance_logs**: Equipment maintenance history

### Key Features
- Foreign key relationships for data integrity
- Comprehensive audit trail with timestamps
- Role-based data access controls
- Automatic status updates for items and loans

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)

### Users
- `GET /api/users` - List all users (admin only)
- `GET /api/users/profile` - Get current user profile

### Inventory
- `GET /api/items` - List all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item (admin/staff)
- `PUT /api/items/:id` - Update item (admin/staff)
- `DELETE /api/items/:id` - Delete item (admin only)

### Categories & Locations
- `GET /api/categories` - List equipment categories
- `GET /api/locations` - List locations

### Loans
- `GET /api/loans` - List loans (filtered by role)
- `POST /api/loans` - Create loan request
- `POST /api/loans/:id/approve` - Approve loan (admin/staff)
- `POST /api/loans/:id/deny` - Deny loan (admin/staff)
- `POST /api/loans/:id/return` - Return item (admin/staff)

### Reports
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports/overdue` - Overdue loans report (admin/staff)

### System
- `GET /api/health` - Health check and system info

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 24-hour expiration with secure secrets
- **Role-based Access**: Granular permission controls
- **SQL Injection Protection**: Parameterized queries
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Configurable cross-origin policies

## 📚 Available Scripts

```bash
# Development
npm run dev          # Start with nodemon (auto-restart)
npm start           # Start production server

# Database
npm run reset-db    # Reset database with fresh demo data
npm run init-db     # Initialize database (deprecated)
```

## 🗄 Database Location

The SQLite database is stored as:
- **File**: `loaner_database.sqlite`
- **Location**: Backend project root
- **Backup**: Recommended to backup this file regularly

## 🌍 Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Security (REQUIRED: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Database
DB_PATH=loaner_database.sqlite

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚧 Development Notes

### Adding New Features
1. Update database schema in `scripts/resetDatabase.js`
2. Add new routes in `server.js`
3. Update API documentation

### Testing the API
Use tools like Postman or curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get items (with token)
curl -X GET http://localhost:5000/api/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Troubleshooting

### Common Issues

1. **Database locked error**:
   ```bash
   # Stop the server and restart
   npm run reset-db
   ```

2. **Permission denied**:
   - Check file permissions on database file
   - Ensure database directory is writable

3. **Port already in use**:
   ```bash
   # Change PORT in .env file or:
   PORT=5001 npm run dev
   ```

### Logging
- All API requests are logged to console
- Database errors are captured and logged
- Authentication events are tracked

## 📈 Production Deployment

### Before deploying:
1. Change `JWT_SECRET` to a secure 32+ character string
2. Set `NODE_ENV=production`
3. Configure proper CORS origins
4. Set up database backups
5. Configure reverse proxy (nginx/Apache)
6. Set up SSL certificates
7. Configure logging to files

### Recommended Production Structure:
```
/var/www/loaner-api/
├── server.js
├── package.json
├── .env (secure secrets)
├── loaner_database.sqlite
├── logs/
└── backups/
```

## 📝 License

Internal use only - Company Equipment Management System

## 🤝 Support

For technical support or feature requests, contact the IT department.