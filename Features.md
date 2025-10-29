# Loaner Application Feature - Usage Guide

This guide walks you through the new staff-created loaner application feature that mirrors the physical loan form process.

## 🎯 Overview

The loaner application feature allows staff members to create loan applications on behalf of students and GSU team members. The system automatically handles user creation and matching based on the provided information.

## 👤 Who Can Use This Feature

- **Admin users**: Full access to create applications
- **Staff users**: Full access to create applications
- **Borrowers**: Cannot access this feature (they use self-service requests)

## 📋 Step-by-Step Process

### Step 1: Access the Feature

1. Log in as an admin or staff member
2. Navigate to the **"Loaner Apps"** tab in the main navigation
3. Click **"Create Application"** button

### Step 2: Search for Existing Users (Optional)

Before creating a new application, you can search for existing users:

1. Use the **"Search Existing Users"** field
2. Type any part of:
   - Name (e.g., "John")
   - Email (e.g., "jdoe3@student.gsu.edu")
   - Panther ID (e.g., "002345678")
3. Select a user from the dropdown to auto-fill their information

### Step 3: Fill Borrower Information

Complete all required fields marked with asterisks (*):

#### **Name** *
- Full name of the borrower
- Example: `John Doe`

#### **Email Address** *
- Must follow GSU email formats:
  - Students: `name@student.gsu.edu`
  - GSU Team: `name@gsu.edu`
- Example: `jdoe3@student.gsu.edu`

#### **Panther ID** *
- GSU identification number
- Students typically: `002XXXXXX`
- Example: `002345678`

#### **Contact Phone** *
- Phone number for contact
- Example: `404-555-1001`

#### **User Type** *
- Select from dropdown:
  - **Student**: For enrolled students
  - **GSU Team**: For faculty, staff, and other GSU personnel

### Step 4: Select Equipment

1. Browse the available equipment grid
2. Check the boxes next to items you want to include
3. Each item shows:
   - Asset ID (e.g., `LAP001`)
   - RCB Sticker Number (e.g., `RCB001`)
   - Equipment type and details
   - Location information
   - Building restrictions (if any)

**Important Notes:**
- Multiple items can be selected for one application
- Items marked "Cannot leave building" have location restrictions
- Only available items are shown

### Step 5: Complete Loan Details

#### **Expected Return Date** *
- Use the date picker
- Must be a future date
- Consider academic calendar and loan policies

#### **Reason for Request** *
- Detailed explanation of why the equipment is needed
- Examples:
  - "Research project requirements"
  - "Remote learning setup"
  - "Presentation preparation"

#### **Borrower Signature** (Optional)
- Enter the borrower's full name as their signature
- This field can be completed later if needed

### Step 6: Submit the Application

1. Review all information for accuracy
2. Click **"Create Application"**
3. The system will:
   - Check if the user exists (by email AND Panther ID)
   - Create a new user if no match is found
   - Update existing user information if found
   - Create active loans for all selected items
   - Set item statuses to "loaned"
   - Record you as the approving staff member

## 🔄 User Matching Logic

The system uses intelligent user matching:

### **Exact Match Found**
- User exists with same email AND Panther ID
- Updates their name, phone, and user type
- Creates loans under existing user account

### **No Match Found**
- Creates a new user account
- Generates username from email prefix
- Sets role as "borrower"
- Creates loans under new user account

### **Important**: Both email AND Panther ID must match for existing user detection

## 📊 What Happens After Submission

1. **Immediate Processing**:
   - Loans are created in "active" status
   - No approval needed (staff approval implied)
   - Equipment status updated to "loaned"

2. **User Account**:
   - New user can log in using email prefix as username
   - No password set initially (admin must set)
   - Account appears in user management

3. **Tracking**:
   - Loans marked as "staff_created" type
   - Your name recorded as approver
   - Application visible in loan management

## ✅ Best Practices

### Before Creating Applications
- [ ] Verify borrower information is accurate
- [ ] Confirm equipment is physically available
- [ ] Check building restrictions for user type
- [ ] Ensure return date aligns with policies

### During Application Creation
- [ ] Double-check email format and domain
- [ ] Verify Panther ID format
- [ ] Select appropriate user type
- [ ] Choose only needed equipment
- [ ] Provide detailed reason for request

### After Application Creation
- [ ] Inform borrower of loan details
- [ ] Provide return date and location
- [ ] Explain equipment usage policies
- [ ] Set up user account password if needed

## 🚨 Common Scenarios

### **Student Requesting Multiple Laptops**
```
Name: Sarah Johnson
Email: sjohnson5@student.gsu.edu
Panther ID: 002789012
User Type: Student
Equipment: LAP001, LAP003, MON001
Reason: Senior capstone project - need dual monitor setup
```

### **Faculty Member for Research**
```
Name: Dr. Michael Chen
Email: mchen@gsu.edu
Panther ID: F00001234
User Type: GSU Team
Equipment: TAB001, CAM001
Reason: Field research data collection
```

### **Existing User Additional Equipment**
```
Search: "john.doe" (finds existing user)
Additional Equipment: CAB001, MON002
Reason: Expanded workspace requirements
```

## 🔍 Monitoring and Reports

### Dashboard View
- New applications appear in pending requests
- Quick approve/deny options available
- User type and application type clearly marked

### Reports
- Loaner applications tracked separately
- Staff-created vs self-service distinction
- User type analytics available

### Loan Management
- Applications show "Staff Created" tag
- Full audit trail maintained
- Return processing same as other loans

## 🛠 Troubleshooting

### **User Not Found When Expected**
- Verify exact email and Panther ID match
- Check for typos in either field
- Previous records may have different format

### **Equipment Not Available**
- Item may be on loan to another user
- Check inventory status
- Verify building restrictions

### **Application Creation Failed**
- Check all required fields completed
- Verify email domain format
- Ensure at least one item selected
- Confirm future return date

## 📞 Getting Help

If you encounter issues with the loaner application feature:

1. **Check this guide** for common solutions
2. **Contact IT Support** for technical issues
3. **Review user permissions** if access denied
4. **Check database logs** for error details

---

This feature streamlines the loan process while maintaining proper tracking and user management. The system handles the complexity while you focus on serving borrowers efficiently.
