# TeamSphere API - Postman Testing Guide

## Base URL
```
http://localhost:8080
```

## Test Users

All users have the password: `password`

| Email | Role | Purpose |
|-------|------|---------|
| admin@teamsphere.com | ADMIN | Full system access |
| hr@teamsphere.com | HR | HR management functions |
| employee@teamsphere.com | EMPLOYEE | Employee functions |

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Login ✅ TESTED
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "admin@teamsphere.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": null,
    "type": "Bearer",
    "id": 1,
    "email": "admin@teamsphere.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "companyId": 1,
    "companyName": "System Admin"
  }
}
```

**Notes:** Copy the `token` value for use in subsequent requests.

---

### 1.2 Login as HR
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "hr@teamsphere.com",
  "password": "password"
}
```

---

### 1.3 Login as Employee
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "employee@teamsphere.com",
  "password": "password"
}
```

---

### 1.4 Register New User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "authRequest": {
    "email": "newuser@example.com",
    "password": "password123"
  },
  "companyId": 1
}
```

---

### 1.5 Logout ✅ TESTED
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.6 Change Password
**POST** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Request Body:**
```json
{
  "oldPassword": "password",
  "newPassword": "newPassword123"
}
```

---

### 1.7 Request Password Reset
**POST** `/api/auth/reset-password`

**Request Body:**
```json
{
  "identifier": "admin@teamsphere.com",
  "identifierType": "EMAIL"
}
```

---

### 1.8 Verify Reset Code
**POST** `/api/auth/verify-reset-code`

**Request Body:**
```json
{
  "identifier": "admin@teamsphere.com",
  "code": "123456"
}
```

---

### 1.9 Confirm Password Reset
**POST** `/api/auth/reset-password/confirm`

**Request Body:**
```json
{
  "identifier": "admin@teamsphere.com",
  "code": "123456",
  "newPassword": "newPassword123"
}
```

---

### 1.10 Refresh Token
**POST** `/api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

---

## 2. COMPANY MANAGEMENT

### 2.1 Create Company (ADMIN only)
**POST** `/api/companies`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "description": "Enterprise software company",
  "domain": "acme.com",
  "contactEmail": "contact@acme.com",
  "subscriptionPlan": "PREMIUM"
}
```

**Subscription Plans:** `FREE`, `BASIC`, `STANDARD`, `PREMIUM`, `ENTERPRISE`

---

### 2.2 Get All Companies (ADMIN only)
**GET** `/api/companies`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 2.3 Get Company by ID
**GET** `/api/companies/{id}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/companies/1`

---

### 2.4 Get Company by Domain
**GET** `/api/companies/domain/{domain}`

**Example:** `/api/companies/domain/acme.com`

---

### 2.5 Get Company Settings
**GET** `/api/companies/{id}/settings`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/companies/1/settings`

---

### 2.6 Update Company (ADMIN only)
**PUT** `/api/companies/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "name": "Acme Corporation Updated",
  "description": "Updated description",
  "contactEmail": "contact@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Business St",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "postalCode": "94102"
}
```

---

### 2.7 Update Subscription Plan (ADMIN only)
**PUT** `/api/companies/{id}/subscription`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "subscriptionPlan": "ENTERPRISE"
}
```

---

### 2.8 Extend Subscription (ADMIN only)
**PUT** `/api/companies/{id}/extend`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Request Body:**
```json
{
  "months": 12
}
```

---

### 2.9 Delete Company (ADMIN only)
**DELETE** `/api/companies/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 2.10 Search Companies (ADMIN only)
**GET** `/api/companies/search?q=Acme`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 2.11 Get Expired Subscriptions (ADMIN only)
**GET** `/api/companies/expired`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 2.12 Get Expiring Subscriptions (ADMIN only)
**GET** `/api/companies/expiring?days=30`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 3. EMPLOYEE MANAGEMENT

### 3.1 Get All Employees (ADMIN, HR, COMPANY)
**GET** `/api/employee?page=0&size=20`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 3.2 Get Employee by ID
**GET** `/api/employee/{id}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/employee/1`

---

### 3.3 Create Employee (ADMIN, HR)
**POST** `/api/employee`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

**Request Body:**
```json
{
  "userId": 5,
  "employeeId": "EMP001",
  "departmentId": 1,
  "position": "Software Engineer",
  "hireDate": "2024-01-15",
  "salary": 75000.00,
  "workingHoursPerDay": 8,
  "employmentStatus": "ACTIVE",
  "phone": "+1-555-0101",
  "mobile": "+1-555-0102",
  "address": "456 Employee Ave",
  "birthDate": "1990-06-15",
  "idCardNumber": "ID123456",
  "annualLeaveBalance": 20,
  "sickLeaveBalance": 10
}
```

**Employment Status Options:** `ACTIVE`, `ON_LEAVE`, `TERMINATED`, `RESIGNED`

---

### 3.4 Update Employee (ADMIN, HR)
**PUT** `/api/employee/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

**Request Body:**
```json
{
  "position": "Senior Software Engineer",
  "salary": 85000.00,
  "employmentStatus": "ACTIVE"
}
```

---

### 3.5 Delete Employee (ADMIN only)
**DELETE** `/api/employee/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 3.6 Search Employees
**GET** `/api/employee/search?search=John`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 3.7 Get Employees by Department
**GET** `/api/employee/department/{departmentId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/employee/department/1`

---

### 3.8 Export Employees to Excel
**GET** `/api/employee/export/excel`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:** Downloads Excel file

---

### 3.9 Get Employee by NFC Tag
**GET** `/api/employee/nfc/{nfcTagId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/employee/nfc/NFC123456`

---

### 3.10 Get Employee by QR Code
**GET** `/api/employee/qr/{qrCode}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/employee/qr/QR123456`

---

### 3.11 Get Current Employee
**GET** `/api/employee/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

## 4. TIME LOG / CLOCK IN-OUT

### 4.1 Clock In
**POST** `/api/time-logs/clock-in`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "employeeId": 1,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "method": "MOBILE_APP"
}
```

**Method Options:** `MOBILE_APP`, `WEB`, `NFC`, `QR_CODE`, `CARD`

---

### 4.2 Clock Out
**POST** `/api/time-logs/clock-out`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "employeeId": 1,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "method": "MOBILE_APP"
}
```

---

### 4.3 Get Current Status
**GET** `/api/time-logs/status/{employeeId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/time-logs/status/1`

**Response:**
```json
{
  "success": true,
  "data": {
    "isClockedIn": true,
    "checkInTime": "09:00:00",
    "checkOutTime": null,
    "workingHours": null
  }
}
```

---

### 4.4 Get Time Logs
**GET** `/api/time-logs?employeeId=1&startDate=2024-01-01&endDate=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

## 5. ACCESS CONTROL

### 5.1 Verify QR Access
**POST** `/api/access/verify/qr?qrCode=QR123456`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 5.2 Verify Card Access
**POST** `/api/access/verify/card?cardId=CARD123456`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 5.3 Get All Access Logs (ADMIN, HR, COMPANY)
**GET** `/api/access/logs`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 5.4 Get Employee Access Logs
**GET** `/api/access/logs/employee/{employeeId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/access/logs/employee/1`

---

### 5.5 Generate QR Code for Employee
**POST** `/api/access/generate-qr/{employeeId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/access/generate-qr/1`

---

## 6. DEVICE REGISTRATION (Mobile App)

### 6.1 Register Device
**POST** `/api/devices/register`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "deviceId": "device-uuid-123456",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "IOS",
  "osVersion": "17.0",
  "appVersion": "1.0.0",
  "deviceFingerprint": "fingerprint-hash-123456"
}
```

**Device Type Options:** `ANDROID`, `IOS`

---

### 6.2 Update Push Token
**PUT** `/api/devices/{deviceId}/token`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "pushToken": "fcm-token-or-apns-token"
}
```

**Example:** `/api/devices/device-uuid-123456/token`

---

## 7. TICKETS / SUPPORT

### 7.1 Get All Tickets
**GET** `/api/tickets?page=0&size=20`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 7.2 Get Ticket by ID
**GET** `/api/tickets/{id}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:** `/api/tickets/1`

---

### 7.3 Create Ticket
**POST** `/api/tickets`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "title": "Cannot clock in",
  "description": "Getting error when trying to clock in via mobile app",
  "priority": "HIGH",
  "category": "TECHNICAL"
}
```

**Priority Options:** `LOW`, `MEDIUM`, `HIGH`, `URGENT`
**Category Options:** `TECHNICAL`, `BILLING`, `GENERAL`, `FEATURE_REQUEST`

---

### 7.4 Update Ticket (ADMIN, HR, COMPANY)
**PUT** `/api/tickets/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_HR_OR_COMPANY_TOKEN
```

**Request Body:**
```json
{
  "title": "Cannot clock in - RESOLVED",
  "status": "RESOLVED",
  "priority": "MEDIUM"
}
```

**Status Options:** `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

---

### 7.5 Delete Ticket (ADMIN only)
**DELETE** `/api/tickets/{id}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 7.6 Assign Ticket (ADMIN, HR, COMPANY)
**POST** `/api/tickets/{id}/assign?assignedToId=2`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_HR_OR_COMPANY_TOKEN
```

---

### 7.7 Resolve Ticket (ADMIN, HR, COMPANY)
**POST** `/api/tickets/{id}/resolve`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_HR_OR_COMPANY_TOKEN
```

---

### 7.8 Get My Tickets
**GET** `/api/tickets/my-tickets`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 7.9 Get Assigned to Me Tickets (ADMIN, HR, COMPANY)
**GET** `/api/tickets/assigned-to-me`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_HR_OR_COMPANY_TOKEN
```

---

### 7.10 Search Tickets
**GET** `/api/tickets/search?search=clock`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

## 8. WORKDAY REPORTS

### 8.1 Get Workday Report (ADMIN, HR)
**GET** `/workday-reports/range?startWorkday=2024-01-01&endWorkday=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

**Note:** Workday starts at 04:00 AM and ends at 03:59 AM next day

---

### 8.2 Get Employee Workday Report (ADMIN, HR)
**GET** `/workday-reports/employee/{employeeId}?startWorkday=2024-01-01&endWorkday=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

**Example:** `/workday-reports/employee/1?startWorkday=2024-01-01&endWorkday=2024-01-31`

---

### 8.3 Get Workday Summary (ADMIN, HR)
**GET** `/workday-reports/summary?startWorkday=2024-01-01&endWorkday=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

---

### 8.4 Export Workday Report to Excel (ADMIN, HR)
**GET** `/workday-reports/export/excel?startWorkday=2024-01-01&endWorkday=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

**Response:** Downloads Excel file

---

### 8.5 Get Workday Calculation Info
**GET** `/workday-reports/info`

**Response:**
```json
{
  "success": true,
  "data": {
    "workdayStartTime": "04:00 AM",
    "workdayEndTime": "03:59 AM (next day)",
    "rule": "A workday starts at 04:00 AM and ends at 03:59 AM next day",
    "examples": [
      "Clock in at 11:00 PM Monday, Clock out at 2:00 AM Tuesday → Counts as Monday's workday",
      "Clock in at 1:00 AM Tuesday → Counts as Monday's workday (ends at 3:59 AM)",
      "Clock in at 4:00 AM Tuesday → Counts as Tuesday's workday"
    ]
  }
}
```

---

## 9. ACCOUNTING INTEGRATION

### 9.1 Sync Payroll Data (ADMIN, HR, COMPANY)
**POST** `/api/accounting/sync/payroll?startDate=2024-01-01&endDate=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 9.2 Sync Employee Data (ADMIN, HR)
**POST** `/api/accounting/sync/employee/{employeeId}`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN
```

**Example:** `/api/accounting/sync/employee/1`

---

### 9.3 Sync Time Logs (ADMIN, HR, COMPANY)
**POST** `/api/accounting/sync/timelogs?startDate=2024-01-01&endDate=2024-01-31`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 9.4 Test Accounting Connection (ADMIN, HR, COMPANY)
**GET** `/api/accounting/test-connection`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

## 10. MONITORING & SYSTEM (ADMIN only)

### 10.1 Get System Overview (ADMIN only)
**GET** `/api/monitoring/overview`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 10.2 Get Recent API Logs (ADMIN only)
**GET** `/api/monitoring/logs/recent?hours=24&limit=100`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 10.3 Get Recent Errors (ADMIN only)
**GET** `/api/monitoring/logs/errors?hours=24&limit=50`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 10.4 Get Slow Requests (ADMIN only)
**GET** `/api/monitoring/logs/slow?hours=24&thresholdMs=1000&limit=50`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 10.5 Get Top Endpoints (ADMIN only)
**GET** `/api/monitoring/stats/endpoints?hours=24`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 10.6 Get System Metrics (ADMIN only)
**GET** `/api/monitoring/metrics?metricType=CPU&hours=24`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Metric Types:** `CPU`, `MEMORY`, `API`, `DATABASE`

---

### 10.7 Get Metric Time Series (ADMIN only)
**GET** `/api/monitoring/metrics/timeseries?metricName=CPU_LOAD&hours=24`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 10.8 Health Check
**GET** `/api/monitoring/health`

---

## 11. ACCOUNT

### 11.1 Get Account Details
**GET** `/api/account/details`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

### 11.2 Get System Info
**GET** `/api/account/system-info`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

---

## SETTING UP POSTMAN

### Step 1: Create Environment Variables

1. Click on "Environments" in Postman
2. Create a new environment called "TeamSphere Local"
3. Add these variables:
   - `base_url` = `http://localhost:8080`
   - `token` = (will be set after login)
   - `admin_token` = (will be set after admin login)
   - `hr_token` = (will be set after HR login)
   - `employee_token` = (will be set after employee login)

### Step 2: Automatically Set Token After Login

In your login request:
1. Go to the "Tests" tab
2. Add this script:

```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.success && jsonData.data && jsonData.data.token) {
        pm.environment.set("token", jsonData.data.token);
        pm.environment.set("admin_token", jsonData.data.token);
        console.log("Token saved: " + jsonData.data.token);
    }
}
```

### Step 3: Use Variables in Requests

- URL: `{{base_url}}/api/auth/login`
- Headers: `Authorization: Bearer {{token}}`

---

## TESTING WORKFLOW

### Recommended Testing Order:

1. **Start with Login** to get your token
2. **Test Employee endpoints** (read operations)
3. **Test Time Log** operations (clock in/out)
4. **Test Access Control** (QR/Card verification)
5. **Test Tickets** (create, update, resolve)
6. **Test Workday Reports** (generate reports)
7. **Test Company Management** (ADMIN only)
8. **Test Monitoring** (ADMIN only)

---

## COMMON RESPONSE FORMAT

All endpoints return this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-20T10:30:00"
}
```

Error response:

```json
{
  "success": false,
  "message": "Error message here",
  "data": null,
  "timestamp": "2024-01-20T10:30:00"
}
```

---

## ROLE PERMISSIONS SUMMARY

| Endpoint Category | ADMIN | HR | COMPANY | EMPLOYEE |
|-------------------|-------|----|---------| ---------|
| Auth | ✓ | ✓ | ✓ | ✓ |
| Companies (Full) | ✓ | ✗ | ✗ | ✗ |
| Companies (Read) | ✓ | ✓ | ✓ | ✓ |
| Employees (Full) | ✓ | ✓ | ✗ | ✗ |
| Employees (Read) | ✓ | ✓ | ✓ | ✓ |
| Time Logs | ✓ | ✓ | ✗ | ✓ |
| Access Control | ✓ | ✓ | ✓ | ✓ |
| Devices | ✓ | ✓ | ✗ | ✓ |
| Tickets (Full) | ✓ | ✓ | ✓ | ✗ |
| Tickets (Create) | ✓ | ✓ | ✓ | ✓ |
| Workday Reports | ✓ | ✓ | ✗ | ✗ |
| Accounting | ✓ | ✓ | ✓ | ✗ |
| Monitoring | ✓ | ✗ | ✗ | ✗ |

---

## TROUBLESHOOTING

### 403 Forbidden
- Check if your token is valid and not expired
- Verify you have the correct role for the endpoint
- Ensure `Authorization: Bearer YOUR_TOKEN` header is set correctly

### 404 Not Found
- Verify the endpoint path is correct (some paths have `/api` prefix, some don't)
- Check if the resource ID exists

### 401 Unauthorized
- Token is missing or invalid
- Login again to get a fresh token

---

## API DOCUMENTATION

Swagger UI is available at:
```
http://localhost:8080/api/swagger-ui/index.html
```

OpenAPI JSON:
```
http://localhost:8080/api/v3/api-docs
```

---

**Last Updated:** October 22, 2025
**Version:** 1.0.0

