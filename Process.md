# Georgia State University - Loaner Laptop Management System

A comprehensive web application for managing equipment loans at GSU's J. Mack Robinson College of Business. Built with React frontend and Node.js/Express backend with SQLite database.

## 🎯 Key Features

### **NEW: Staff Loaner Application System**
- **Automated User Management**: Staff can create applications for students and GSU team members
- **Smart User Detection**: System automatically checks if user exists by email and Panther ID
- **Bulk Equipment Assignment**: Select multiple items for a single application
- **Form-Based Workflow**: Mirrors the physical loan form process
- **User Type Support**: Handles both students (@student.gsu.edu) and GSU Team (@gsu.edu)

### Core Functionality
- **Multi-Role Authentication**: Admin, Staff, and Borrower access levels
- **Equipment Inventory**: Complete asset tracking with RCB sticker numbers
- **Loan Management**: Request, approval, and return workflows
- **Location Restrictions**: Support for equipment that cannot leave building
- **Reporting & Analytics**: Comprehensive reports and overdue tracking
- **Real-time Dashboard**: Live statistics and pending request notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize the database with loaner application support**:
   ```bash
   npm run reset-db
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root**:
   ```bash
   cd ..
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the React development server**:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## 👥 Demo Accounts

After running `npm run reset-db`, these accounts are available:

| Username | Password | Role | User Type | Access Level |
|----------|----------|------|-----------|--------------|
| admin | admin123 | Admin | Admin | Full system access + user management |
| staff | staff123 | Staff | Staff | Equipment + loan management + applications |
| john.doe | user123 | Borrower | Student | Self-service loan requests |
| jane.smith | user123 | Borrower | GSU Team | Self-service loan requests |
| mike.wilson | user123 | Borrower | Student | Self-service loan requests |

## 📋 New Loaner Application Workflow

### For Staff Members

1. **Access Loaner Applications Tab**
   - Available to Admin and Staff roles only
   - Click "Create Application" to start

2. **Search or Create User**
   - Search existing users by name, email, or Panther ID
   - If user exists with matching email AND Panther ID: Updates their info
   - If no match found: Creates new user automatically

3. **Select Equipment**
   - Choose from available inventory items
   - Multiple items can be selected for one application
   - See RCB sticker numbers and building restrictions

4. **Complete Application Details**
   - Set expected return date
   - Provide reason for loan
   - Add borrower signature (optional)

5. **Automatic Processing**
   - Creates active loans immediately (staff approval implied)
   - Updates item statuses to "loaned"
   - Records staff member as approver

### User Type Guidelines

#### Students
- **Email Format**: `name@student.gsu.edu`
- **Panther ID**: `002XXXXXX` format
- **Restrictions**: Can only borrow items that can leave building (for remote use)

#### GSU Team
- **Email Format**: `name@gsu.edu`
- **Panther ID**: Any valid GSU Panther ID
- **Access**: Can borrow any available equipment

## 🗄 Database Schema Updates

### Enhanced Users Table
```sql
users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  panther_id TEXT UNIQUE,        -- NEW: GSU Panther ID
  phone TEXT,                    -- NEW: Contact phone
  role TEXT,                     -- admin, staff, borrower
  user_type TEXT,                -- NEW: student, GSU Team, staff, admin
  active INTEGER DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME
)
```

### Enhanced Items Table
```sql
items (
  id INTEGER PRIMARY KEY,
  asset_id TEXT UNIQUE NOT NULL,
  rcb_sticker_number TEXT UNIQUE, -- NEW: RCB sticker tracking
  type TEXT NOT NULL,
  category_id INTEGER,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expiry DATE,
  status TEXT DEFAULT 'available',
  condition TEXT DEFAULT 'good',
  location_id INTEGER,
  notes TEXT,
  can_leave_building INTEGER DEFAULT 1, -- NEW: Building restriction
  created_at DATETIME,
  updated_at DATETIME
)
```

### Enhanced Loans Table
```sql
loans (
  id INTEGER PRIMARY KEY,
  item_id INTEGER NOT NULL,
  borrower_id INTEGER NOT NULL,
  approved_by INTEGER,
  status TEXT DEFAULT 'pending',
  application_type TEXT DEFAULT 'self_service', -- NEW: self_service, staff_created
  request_date DATE NOT NULL,
  approved_date DATE,
  checkout_date DATE,
  expected_return DATE NOT NULL,
  actual_return DATE,
  reason TEXT NOT NULL,
  contact_phone TEXT,           -- NEW: Borrower contact
  borrower_signature TEXT,      -- NEW: Form signature
  staff_signature TEXT,         -- NEW: Staff signature
  return_condition TEXT,
  return_notes TEXT,
  equipment_returned INTEGER DEFAULT 0, -- NEW: Return confirmation
  created_at DATETIME,
  updated_at DATETIME
)
```

## 🔌 New API Endpoints

### Loaner Applications
```bash
# Create loaner application (staff only)
POST /api/loaner-applications
{
  "name": "John Doe",
  "email": "jdoe3@student.gsu.edu",
  "panther_id": "002345678",
  "phone": "404-555-1001",
  "user_type": "student",
  "item_ids": [1, 3, 5],
  "expected_return": "2025-07-15",
  "reason": "Research project requirements",
  "borrower_signature": "John Doe"
}

# Search users for applications (staff only)
GET /api/users/search?q=john
```

### Enhanced Item Management
```bash
# Get available items (staff only)
GET /api/items/available

# Create item with RCB sticker and building restrictions
POST /api/items
{
  "asset_id": "LAP001",
  "rcb_sticker_number": "RCB001",
  "type": "Laptop",
  "brand": "Dell",
  "model": "Latitude 7420",
  "serial_number": "DL7420001",
  "can_leave_building": false
}
```

## 📊 Enhanced Reporting

### New Report Fields
- **RCB Sticker Numbers**: Track physical asset tags
- **User Types**: Distinguish between students and GSU team
- **Application Types**: Self-service vs staff-created loans
- **Panther IDs**: University identification tracking
- **Building Restrictions**: Equipment location requirements

### Report Types
1. **Inventory Report**: All equipment with RCB stickers and restrictions
2. **Loans Report**: Complete loan history with user details
3. **Overdue Report**: Past-due items with borrower contact info

## 🔒 Security & Permissions

### Role-Based Access Control

#### Admin
- Full system access
- User management
- All equipment and loan operations
- Create loaner applications
- Access all reports

#### Staff
- Equipment and loan management
- Create loaner applications
- Approve/deny loan requests
- Process returns
- Access operational reports

#### Borrower
- Self-service loan requests
- View own loan history
- Limited to loanable equipment

### Data Validation
- Email format validation (@student.gsu.edu, @gsu.edu)
- Panther ID format checking
- Equipment availability verification
- Building restriction enforcement

## 🛠 Development & Maintenance

### Available Scripts

```bash
# Backend
npm run dev          # Start with auto-reload
npm run start        # Production server
npm run reset-db     # Reset database with demo data
npm run backup       # Create database backup
npm run stats        # Show database statistics
npm run maintenance  # Run full maintenance suite

# Frontend
npm start           # Development server
npm run build       # Production build
npm test           # Run tests
```

### Database Maintenance

The system includes comprehensive maintenance tools:

```bash
# Show current statistics
npm run stats

# Create backups
npm run backup

# Run integrity checks and cleanup
npm run maintenance
```

## 📈 Production Deployment

### Environment Variables
```bash
# Required for production
JWT_SECRET=your-super-secure-32-character-secret-key
PORT=5000
NODE_ENV=production

# Database
DB_PATH=loaner_database.sqlite

# CORS (adjust for your domain)
CORS_ORIGIN=https://your-domain.com
```

### Security Checklist
- [ ] Change default JWT_SECRET
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up logging and monitoring
- [ ] Review user permissions

## 🎓 GSU-Specific Features

### Panther ID Integration
- Automatic validation of GSU Panther ID format
- Prevents duplicate registrations
- Links loans to university identification

### Email Domain Validation
- Students: `@student.gsu.edu` domains only
- Faculty/Staff: `@gsu.edu` domains
- Automatic user type assignment based on email

### Building Security
- Tracks equipment that cannot leave Buckhead Center
- Enforces location restrictions during loan creation
- Reports show building compliance status

### Academic Calendar Integration
- Default loan periods based on semester dates
- Holiday and break period restrictions
- Academic year reporting cycles

## 🐛 Troubleshooting

### Common Issues

1. **Database locked error**:
   ```bash
   npm run reset-db
   ```

2. **User not found during application**:
   - Verify email and Panther ID match exactly
   - Check for typos in email domain
   - Ensure Panther ID format is correct

3. **Equipment not available**:
   - Check if item is currently on loan
   - Verify building restrictions for user type
   - Confirm item status in inventory

4. **Permission denied**:
   - Verify user role and access level
   - Check JWT token expiration
   - Confirm user account is active

### Logging
- All API requests logged with timestamps
- Database operations tracked
- Authentication events recorded
- Error details captured for debugging

## 📞 Support

For technical support or questions about the loaner system:

- **IT Department**: Contact for system administration
- **Help Desk**: User account and access issues
- **Business Office**: Equipment and policy questions

## 📝 License

Internal use only - Georgia State University
J. Mack Robinson College of Business Technology Services

---

**Last Updated**: June 2025  
**Version**: 2.0 with Loaner Application Support
