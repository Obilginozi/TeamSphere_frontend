# TeamSphere

Enterprise-grade **multi-tenant HR & time tracking platform** with web and mobile applications. Deploy as SaaS or on-premise with flexible subscription tiers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://openjdk.java.net/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2+-green.svg)](https://spring.io/projects/spring-boot)

## 📦 Repository Structure

TeamSphere is organized into multiple repositories for better maintainability:

- **[Backend](https://github.com/Obilginozi/TeamSphere_backend)** - Spring Boot 3.2 API server
- **[Frontend](https://github.com/Obilginozi/TeamSphere_frontend)** - React 18 web application
- **[Mobile](https://github.com/Obilginozi/TeamSphere_mobile)** - React Native mobile app
- **[Infrastructure](https://github.com/Obilginozi/TeamSphere_infrastructure)** - Docker, Kubernetes, and deployment configurations

### Cloning All Repositories

```bash
# Clone all repositories
git clone https://github.com/Obilginozi/TeamSphere_backend.git
git clone https://github.com/Obilginozi/TeamSphere_frontend.git
git clone https://github.com/Obilginozi/TeamSphere_mobile.git
git clone https://github.com/Obilginozi/TeamSphere_infrastructure.git
```

## 📚 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Deployment Models](#-deployment-models)
- [Development Setup](#-development-setup)
- [Configuration](#-configuration)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Security](#-security)
- [Monitoring](#-monitoring)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## 🚀 Quick Start

### Prerequisites

- **Java 17+** - Backend development
- **Node.js 18+** - Frontend and mobile development
- **PostgreSQL 13+** - Database
- **Docker & Docker Compose** - Containerization
- **React Native CLI** - Mobile development (optional)

### Development Setup

```bash
# Clone all repositories
git clone https://github.com/Obilginozi/TeamSphere_backend.git
git clone https://github.com/Obilginozi/TeamSphere_frontend.git
git clone https://github.com/Obilginozi/TeamSphere_mobile.git
git clone https://github.com/Obilginozi/TeamSphere_infrastructure.git

# Navigate to project root (if you have all repos in one directory)
cd teamsphere

# Start PostgreSQL (Docker)
docker run --name teamsphere-postgres \
  -e POSTGRES_DB=teamsphere_dev \
  -e POSTGRES_USER=teamsphere \
  -e POSTGRES_PASSWORD=teamsphere123 \
  -p 5432:5432 -d postgres:13

# Backend
cd TeamSphere_backend
mvn clean install
mvn spring-boot:run

# Frontend (new terminal)
cd TeamSphere_frontend
npm install
npm run dev

# Mobile (new terminal)
cd TeamSphere_mobile
npm install
npm run android  # or npm run ios
```

### Quick Setup with Scripts

```bash
# Use the automated setup script
cd infrastructure
./scripts/setup-dev.sh
```

### Windows Requirements Checker

For Windows users, you can use the built-in requirement checker to verify your setup:

```cmd
# Check all requirements (Java, Node.js, PostgreSQL, Maven, ports, database)
check-requirements.cmd

# Reset database if tables are corrupted or need to be recreated
reset-database.cmd
```

The `check-requirements.cmd` script will verify:
- ✅ Java 17+ installation
- ✅ Node.js 18+ installation  
- ✅ npm installation
- ✅ Maven installation
- ✅ PostgreSQL installation and service status
- ✅ Database connection
- ✅ Port availability (8080, 5173, 5432)
- ✅ Project structure

**Access Points:**
- 🌐 **Web App**: http://localhost:5173
- 🔌 **API**: http://localhost:8080
- 📱 **Mobile**: Android/iOS app
- 📖 **API Docs**: http://localhost:8080/api/swagger-ui.html

## 📋 Features

### Core Features

- ✅ **Multi-tenant Architecture** - Support multiple companies with data isolation
- ✅ **Role-based Access Control** - Admin, HR, Department Manager, Employee roles with granular permissions
- ✅ **Time Tracking** - Clock in/out with NFC/QR codes, manual entry, overtime calculation with dynamic method selection
- ✅ **QR Code Generation** - ISO/IEC 18004 compliant QR codes with company logo embedding and auto-refresh
- ✅ **Leave Management** - Request, approve, track leaves with workflow automation and comprehensive reason tracking
- ✅ **Device Management** - Bind and manage employee devices with security protocols and HR device matching interface
- ✅ **Internal Ticketing System** - Support and issue tracking with SLA management
- ✅ **Reports & Analytics** - Export to PDF/Excel with customizable dashboards
- ✅ **Mobile App** - React Native with offline support and biometric authentication
- ✅ **Profile Change Approval System** - Employee and Department Manager profile changes require HR approval before being applied
- ✅ **Department Management** - Department managers can manage their department employees, send announcements, and handle tickets
- ✅ **Shift Management** - 24-hour operations support with shift scheduling, employee assignments, and automatic shift rotation

### Advanced Features

- ✅ **Payment Integration** - Stripe, iyzico, PayTR, PayPal with subscription management
- ✅ **Bulk Employee Import** - Excel import with validation and error handling
- ✅ **Password Generation** - Automated employee passwords with security policies
- ✅ **Email Notifications** - Automated credential emails and system notifications
- ✅ **Phone Validation** - Country-specific validation with international support
- ✅ **System Monitoring** - Health checks, metrics, and performance monitoring
- ✅ **Multi-language Support** - i18n ready with English and Turkish support
- ✅ **Biometric Authentication** - Fingerprint and face recognition for mobile
- ✅ **NFC Integration** - Contactless clock in/out with device binding and validation
- ✅ **Offline Support** - Mobile app works offline with data synchronization
- ✅ **Dynamic Clock-In Methods** - Company-configurable clock-in methods (NFC, QR Code, Manual) with automatic method selection
- ✅ **HR Profile Approvals** - HR review and approval workflow for employee profile changes (name, email, phone, address, etc.) with change history tracking
- ✅ **QR Code with Logo** - Employee QR codes with embedded company logo and 15-second auto-refresh
- ✅ **HR Device Matching** - HR interface for matching employee devices with UUID validation and warnings for unmatched employees
- ✅ **Enhanced Data Seeder** - Comprehensive mock data generation including tickets, announcements, time logs with various scenarios, upcoming birthdays, and shift management data

## 🏗️ Architecture

### System Overview

TeamSphere implements a sophisticated multi-tenant SaaS architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │    │  Admin Panel    │
│   (React 18)    │    │ (React Native)  │    │   (React 18)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │     (Spring Boot 3.2)    │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Business Services     │
                    │   (Multi-tenant Logic)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Data Layer           │
                    │    (PostgreSQL 13+)      │
                    └───────────────────────────┘
```

### Backend (Spring Boot)

- **Framework**: Spring Boot 3.2 with Java 17
- **Database**: PostgreSQL with Flyway migrations
- **Security**: JWT authentication, role-based access control
- **APIs**: RESTful APIs with comprehensive Swagger documentation
- **Monitoring**: Health checks, metrics, structured logging
- **Architecture**: Multi-tenant with tenant isolation
- **Caching**: Redis for session management and data caching
  - Multi-level caching with configurable TTLs
  - Cache names: Companies (1h), Departments (30m), Users (30m), Employees (15m)
  - Automatic cache eviction on updates/deletes
- **Database Indexing**: 25+ performance indexes for optimal query performance
  - Composite indexes: (company_id, is_deleted) for common query patterns
  - Sorting indexes: created_at, updated_at for efficient sorting
  - Partial indexes: Only active records indexed (space-efficient)

### Frontend (React)

- **Framework**: React 18 with Vite build tool
- **UI Library**: Material-UI (MUI) with custom theming
- **State Management**: React Query for server state, Context API for client state
- **Routing**: React Router with protected routes and lazy loading
- **Internationalization**: i18next with English and Turkish support
- **PWA**: Progressive Web App capabilities
- **Responsive**: Mobile-first responsive design

### Mobile (React Native)

- **Framework**: React Native 0.73 with TypeScript
- **Features**: NFC scanning, QR codes, offline support, biometric auth
- **Platforms**: Android 8.0+ & iOS 12.0+
- **Security**: Device binding, secure storage, encrypted communication
- **Offline**: Local SQLite database with sync capabilities

### Infrastructure

- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Helm charts
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and data caching with multi-level cache strategy
- **Database Indexing**: 25+ performance indexes for query optimization
- **Monitoring**: Prometheus, Grafana, and ELK stack
- **CI/CD**: GitHub Actions with automated testing

## 🚀 Deployment Models

### 1. ☁️ SaaS Cloud (Multi-Tenant)

Deploy as a cloud service for multiple companies with subscription billing.

**Features:**
- Multi-company support with tenant isolation
- Subscription management with payment integration
- Automated onboarding and provisioning
- Scalable infrastructure with auto-scaling
- Centralized monitoring and management

**Use Cases:**
- SaaS providers offering HR services
- Multi-company organizations
- Service providers managing multiple clients

### 2. 🏢 On-Premise Docker (Single-Tenant)

Self-hosted solution with Docker Compose for single-tenant deployments.

**Features:**
- One-time license model
- Customer-managed infrastructure
- Docker deployment with easy updates
- License key management
- Full data control and privacy

**Use Cases:**
- Enterprise clients requiring data sovereignty
- Organizations with strict compliance requirements
- Companies preferring self-hosted solutions

### 3. ⚙️ Enterprise Kubernetes

High-availability enterprise deployment with advanced orchestration.

**Features:**
- Kubernetes orchestration with Helm charts
- High availability and fault tolerance
- Auto-scaling based on demand
- Enterprise support and SLA
- Advanced monitoring and alerting

**Use Cases:**
- Large enterprises with high availability requirements
- Organizations with complex infrastructure needs
- Companies requiring enterprise-grade support

## 🛠️ Development Setup

### Project Structure

```
teamsphere/
├── TeamSphere_backend/          # Spring Boot API
│   ├── src/main/java/          # Java source code
│   ├── src/main/resources/    # Configuration files
│   ├── src/test/               # Test files
│   └── pom.xml                 # Maven configuration
├── TeamSphere_frontend/        # React web app
│   ├── src/                    # React source code
│   ├── public/                 # Static assets
│   └── package.json           # Node.js dependencies
├── TeamSphere_mobile/           # React Native app
│   ├── shared/                 # Shared components and services
│   ├── android/                # Android-specific code
│   ├── ios/                     # iOS-specific code
│   └── package.json            # Node.js dependencies
├── TeamSphere_infrastructure/   # Docker & K8s configs
│   ├── deploy/                 # Kubernetes manifests
│   ├── scripts/                # Deployment scripts
│   └── docs/                   # Infrastructure documentation
└── marketing-website/          # Landing page
```

### Development Commands

```bash
# Backend Development
cd TeamSphere_backend
mvn clean install        # Install dependencies
mvn spring-boot:run      # Start development server
mvn test                # Run tests
mvn package             # Build JAR file

# Frontend Development
cd TeamSphere_frontend
npm install             # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Lint code

# Mobile Development
cd TeamSphere_mobile
npm install             # Install dependencies
npm run android         # Run on Android
npm run ios             # Run on iOS
npm run test            # Run tests

# Full Stack with Docker
cd TeamSphere_infrastructure
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
docker-compose logs     # View logs
```

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation

3. **Test Changes**
   ```bash
   # Backend tests
   mvn test
   
   # Frontend tests
   npm test
   
   # Mobile tests
   npm test
   ```

4. **Submit Pull Request**
   - Create descriptive PR with screenshots
   - Link related issues
   - Request appropriate reviewers

## 🔧 Configuration

### Environment Variables

See `.env.example` for frontend environment variables and `../TeamSphere_backend/.env.example` for backend environment variable documentation.

**Important**: For production deployments, ensure all security-related environment variables are properly configured:
- `JWT_SECRET` - Must be at least 32 characters, non-default value
- `CORS_ALLOWED_ORIGINS` - Whitelist your frontend domains
- `ENABLE_CSRF` - Set to `true` for production
- `ENABLE_SWAGGER` - Set to `false` for production
- `LOG_LEVEL` - Set to `INFO` or `WARN` for production

#### Backend Configuration
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=teamsphere_dev
DB_USERNAME=teamsphere
DB_PASSWORD=teamsphere123

# Security (REQUIRED for production)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=86400000

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
ENABLE_CSRF=true
ENABLE_SWAGGER=false

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=INFO  # DEBUG for development, INFO/WARN for production

# Monitoring - Sentry
SENTRY_ENABLED=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Monitoring - Log Aggregation
LOG_AGGREGATION_ENABLED=true
LOG_AGGREGATION_PROVIDER=elk  # elk, cloudwatch, datadog

# Monitoring - APM
APM_ENABLED=true
APM_PROVIDER=prometheus  # prometheus, newrelic, datadog

# Payment Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
IYZICO_API_KEY=your-iyzico-key
IYZICO_SECRET_KEY=your-iyzico-secret

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

#### Frontend Configuration
```env
# API Configuration
VITE_API_URL=http://localhost:8080/api
VITE_API_TIMEOUT=30000

# Payment Integration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false

# Internationalization
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,tr
```

#### Mobile Configuration
```env
# API Configuration
API_BASE_URL=http://localhost:8080/api
API_TIMEOUT=30000

# Security
ENCRYPTION_KEY=your-encryption-key
BIOMETRIC_ENABLED=true

# NFC Configuration
NFC_ENABLED=true
NFC_TIMEOUT=5000

# Offline Storage
OFFLINE_STORAGE_SIZE=50000000
SYNC_INTERVAL=300000
```

### Database Configuration

#### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE teamsphere_dev;

-- Create user
CREATE USER teamsphere WITH PASSWORD 'teamsphere123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE teamsphere_dev TO teamsphere;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### Redis Configuration

**Development:**
```yaml
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

**Production:**
```bash
# Environment Variables
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
CACHE_ENABLED=true
CACHE_TTL_COMPANIES=3600000  # 1 hour
CACHE_TTL_DEPARTMENTS=1800000  # 30 minutes
CACHE_TTL_USERS=1800000  # 30 minutes
CACHE_TTL_EMPLOYEES=900000  # 15 minutes
```

**Cache Strategy:**
- Companies: 1 hour TTL (rarely changes)
- Departments: 30 minutes TTL (moderate changes)
- Users: 30 minutes TTL (moderate changes)
- Employees: 15 minutes TTL (frequent changes)
- Automatic cache eviction on updates/deletes
- Multi-tenant cache isolation

## 🧪 Testing

### Testing Strategy

TeamSphere maintains **70%+ test coverage** with comprehensive test suites covering critical functionality.

#### Backend Testing
```bash
# Run all tests
mvn test

# Run with coverage report
mvn clean test jacoco:report
# Coverage report: target/site/jacoco/index.html

# Integration Tests
mvn test -Dtest=*IntegrationTest

# Service Tests
mvn test -Dtest=*ServiceTest

# Controller Tests
mvn test -Dtest=*ControllerTest

# Security Tests
mvn test -Dtest=*SecurityTest
```

#### Test Coverage

- **Current Coverage**: 70%+ (enforced by JaCoCo)
- **Test Types**:
  - Unit tests for services and utilities
  - Integration tests for controllers
  - Security tests for authentication/authorization
  - Multi-tenant isolation tests
  - Time tracking logic tests

#### Test Files

**Service Tests:**
- `AuthServiceTest.java` - Authentication and password management
- `TimeLogServiceTest.java` - Clock-in/out logic and validation
- `DepartmentServiceTest.java` - Department CRUD operations
- `LeaveRequestServiceTest.java` - Leave request management
- `CompanyServiceTest.java` - Company management
- `MultiTenantIsolationTest.java` - Multi-tenant data isolation

**Integration Tests:**
- `AuthControllerIntegrationTest.java` - Authentication endpoints
- `TimeLogControllerIntegrationTest.java` - Time tracking endpoints
- `EmployeeControllerIntegrationTest.java` - Employee management endpoints
- `LeaveRequestControllerIntegrationTest.java` - Leave request endpoints

**Security Tests:**
- `JwtUtilTest.java` - JWT token generation and validation
- `TenantContextTest.java` - Tenant context management

#### Frontend Testing
```bash
# Unit Tests
npm test

# Component Tests
npm run test:components

# E2E Tests
npm run test:e2e

# Visual Regression Tests
npm run test:visual
```

#### Mobile Testing
```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# Device Tests
npm run test:device

# E2E Tests
npm run test:e2e
```

### API Testing with Postman

1. **Import Collection**
   - Import from `infrastructure/docs/postman/TeamSphere-API.postman_collection.json`
   - Set environment variables
   - Configure authentication

2. **Test Scenarios**
   - Authentication flow
   - CRUD operations
   - Multi-tenant isolation
   - Error handling
   - Performance testing

3. **Automated Testing**
   ```bash
   # Run Postman tests
   newman run TeamSphere-API.postman_collection.json \
     --environment TeamSphere-Dev.postman_environment.json \
     --reporters cli,html
   ```

## 📚 Documentation

### Developer Guides

- **[Frontend Developer Guide](../TeamSphere_infrastructure/docs/FRONTEND_DEVELOPER_GUIDE.md)** - Complete React development guide
- **[Backend Developer Guide](../TeamSphere_infrastructure/docs/BACKEND_DEVELOPER_GUIDE.md)** - Spring Boot development guide
- **[Mobile Developer Guide](../TeamSphere_infrastructure/docs/MOBILE_DEVELOPER_GUIDE.md)** - React Native development guide
- **[Infrastructure Guide](../TeamSphere_infrastructure/docs/INFRASTRUCTURE_DEVELOPER_GUIDE.md)** - DevOps and deployment guide

### Setup Guides

- **[Development Setup Guide](../TeamSphere_infrastructure/docs/DEVELOPMENT_SETUP.md)** - Complete development environment setup
- **[Docker Deployment Guide](../TeamSphere_infrastructure/docs/DOCKER_DEPLOYMENT_GUIDE.md)** - Containerized deployment
- **[Setup Guide](../TeamSphere_infrastructure/docs/SETUP_GUIDE.md)** - Basic setup instructions
- **[Environment Setup Guide](../TeamSphere_backend/ENVIRONMENT_SETUP.md)** - Environment variable configuration
- **[Monitoring Setup Guide](../TeamSphere_backend/MONITORING_SETUP.md)** - Sentry, Log Aggregation, and APM setup

### API Documentation

- **[Postman API Testing Guide](../TeamSphere_infrastructure/docs/POSTMAN_API_TESTING_GUIDE.md)** - API testing with Postman
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html (development only, disabled in production)
- **OpenAPI Spec**: Available in `/api/v3/api-docs`

### Additional Resources

- **[Use Cases and Examples](../TeamSphere_infrastructure/docs/USE_CASES_AND_EXAMPLES.md)** - Real-world usage scenarios
- **[Exception Handling Guide](../TeamSphere_backend/EXCEPTION_HANDLING_GUIDE.md)** - Exception handling best practices
- **[Disaster Recovery Plan](../TeamSphere_infrastructure/docs/DISASTER_RECOVERY_PLAN.md)** - Backup and recovery procedures
- **[Production Readiness Checklist](../TeamSphere_infrastructure/docs/PRODUCTION_READINESS_CHECKLIST.md)** - Pre-production checklist
- **[Production Deployment Guide](../TeamSphere_infrastructure/docs/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Step-by-step production deployment
- **[Runbooks](../TeamSphere_infrastructure/docs/RUNBOOKS.md)** - Operational procedures and troubleshooting
- **[Incident Response Plan](../TeamSphere_infrastructure/docs/INCIDENT_RESPONSE_PLAN.md)** - Security and system incident procedures
- **[Performance Optimization](../TeamSphere_infrastructure/docs/PERFORMANCE_OPTIMIZATION_COMPLETED.md)** - Database indexing and caching strategy
- **[User Guide](../TeamSphere_infrastructure/docs/USER_GUIDE.md)** - End-user documentation and tutorials
- **Component Library**: Frontend component documentation
- **Database Schema**: ERD and table documentation
- **Architecture Diagrams**: System design documentation

## 🔐 Security

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication with configurable expiration
- **JWT Secret Validation**: Production-ready secret key validation (minimum 32 characters, non-default)
- **Role-based Access**: ADMIN, HR, DEPARTMENT_MANAGER, EMPLOYEE roles with granular permissions
- **Multi-factor Authentication**: Optional 2FA support
- **Session Management**: Secure session handling with timeout
- **Password Policies**: Configurable password requirements
- **Last Login Tracking**: Automatic tracking of user login timestamps

### Data Security

- **Encryption**: AES-256 encryption for sensitive data
- **HTTPS**: TLS 1.3 for all communications
- **Database Security**: Encrypted connections and data at rest
- **API Security**: 
  - **Rate Limiting**: IP-based rate limiting (100 req/min general, 5 req/min auth endpoints)
  - **CORS**: Configurable CORS with whitelist support (environment-based)
  - **CSRF Protection**: Environment-based CSRF protection (enabled in production)
  - **Input Validation**: Comprehensive validation with custom exception handling
- **Data Masking**: Sensitive data protection in logs and responses

### Production Security Features

- **JWT Secret Validation**: Automatic validation prevents default/weak secrets in production
- **Actuator Protection**: Actuator endpoints restricted to ADMIN role (except `/actuator/health`)
- **Swagger Disable**: Swagger UI automatically disabled in production
- **Environment-based Security**: Security features configurable via environment variables

### Mobile Security

- **Biometric Authentication**: Fingerprint and face recognition
- **Secure Storage**: Keychain (iOS) and Keystore (Android)
- **Device Binding**: NFC device registration and management
- **Certificate Pinning**: SSL certificate validation
- **Root/Jailbreak Detection**: Security checks for compromised devices

### Compliance

- **GDPR**: Data protection and privacy compliance
- **SOC 2**: Security and availability controls
- **ISO 27001**: Information security management
- **Audit Logging**: Comprehensive audit trails

## 📊 Monitoring & Observability

### Health Monitoring

- **Application Health**: Spring Boot Actuator endpoints (protected in production)
- **Database Health**: Connection pool monitoring
- **Service Health**: Dependency health checks
- **Performance Metrics**: Response times and throughput
- **Public Health Endpoint**: `/actuator/health` (publicly accessible)

### Logging

- **Structured Logging**: JSON format with correlation IDs and MDC context
- **Log Levels**: Environment-based logging (INFO/WARN in production, DEBUG in development)
- **Log Rotation**: Automatic log rotation with size limits
- **Centralized Logging**: ELK stack, CloudWatch, or Datadog integration support
- **Error Tracking**: 
  - **Sentry Integration**: Automatic error reporting and alerting
  - **Error Context**: Full context with company ID, user ID, request ID
- **Audit Logging**: Security and compliance logging

### Error Tracking (Sentry)

- **Automatic Error Capture**: Unhandled exceptions automatically sent to Sentry
- **Environment-based**: Configurable via `SENTRY_ENABLED`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
- **Error Context**: Rich context including user, company, request details
- **Release Tracking**: Automatic release tracking for better error correlation

### Application Performance Monitoring (APM)

- **Prometheus**: Metrics collection and monitoring
- **New Relic**: Optional APM integration
- **Datadog**: Optional APM integration
- **Custom Metrics**: Business-specific metrics tracking

### Metrics & Analytics

- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, disk usage
- **User Analytics**: Usage patterns and behavior
- **Performance Analytics**: Response times and error rates
- **SLA Monitoring**: Ticket SLA breach detection and notifications

### Alerting

- **Health Alerts**: Service down notifications
- **Performance Alerts**: Response time thresholds
- **Error Alerts**: Exception rate monitoring via Sentry
- **Security Alerts**: Suspicious activity detection
- **SLA Alerts**: Ticket SLA breach notifications to admins

## 📊 Default Credentials

### Test Users

After running the data seeder with `--reset` flag, the following test users are available:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@admin.com` | `password123` | Full system access |
| **HR (TechCorp)** | `sarah.johnson@techcorp.com` | `password123` | HR operations for TechCorp Solutions |
| **HR (TechCorp)** | `marcus.williams@techcorp.com` | `password123` | HR operations for TechCorp Solutions |
| **HR (GlobalBiz)** | `emily.rodriguez@globalbiz.com` | `password123` | HR operations for GlobalBiz Inc |
| **HR (GlobalBiz)** | `david.kim@globalbiz.com` | `password123` | HR operations for GlobalBiz Inc |
| **Dept Manager - Engineering (TechCorp)** | `robert.anderson@techcorp.com` | `password123` | Engineering Department Manager at TechCorp |
| **Dept Manager - Sales (TechCorp)** | `jennifer.martinez@techcorp.com` | `password123` | Sales & Marketing Department Manager at TechCorp |
| **Dept Manager - Operations (TechCorp)** | `william.taylor@techcorp.com` | `password123` | Operations Department Manager at TechCorp |
| **Dept Manager - Engineering (GlobalBiz)** | `patricia.wilson@globalbiz.com` | `password123` | Engineering Department Manager at GlobalBiz |
| **Dept Manager - Sales (GlobalBiz)** | `james.moore@globalbiz.com` | `password123` | Sales & Marketing Department Manager at GlobalBiz |
| **Dept Manager - Operations (GlobalBiz)** | `linda.jackson@globalbiz.com` | `password123` | Operations Department Manager at GlobalBiz |
| **Employee (TechCorp)** | `alexandra.martinez@techcorp.com` | `password123` | Senior Software Engineer at TechCorp Solutions |
| **Employee (TechCorp)** | `james.thompson@techcorp.com` | `password123` | Product Manager at TechCorp Solutions |
| **Employee (TechCorp)** | `priya.patel@techcorp.com` | `password123` | Senior Sales Executive at TechCorp Solutions |
| **Employee (TechCorp)** | `michael.chen@techcorp.com` | `password123` | Marketing Specialist at TechCorp Solutions |
| **Employee (TechCorp)** | `sofia.rodriguez@techcorp.com` | `password123` | Operations Coordinator at TechCorp Solutions |
| **Employee (GlobalBiz)** | `robert.anderson@globalbiz.com` | `password123` | Business Analyst at GlobalBiz Inc |
| **Employee (GlobalBiz)** | `emma.wilson@globalbiz.com` | `password123` | Senior Consultant at GlobalBiz Inc |
| **Employee (GlobalBiz)** | `ahmed.hassan@globalbiz.com` | `password123` | Account Manager at GlobalBiz Inc |
| **Employee (GlobalBiz)** | `olivia.taylor@globalbiz.com` | `password123` | Marketing Manager at GlobalBiz Inc |
| **Employee (GlobalBiz)** | `daniel.kim@globalbiz.com` | `password123` | Operations Analyst at GlobalBiz Inc |

**Note:** Each department in both companies has a Department Manager. They have access to manage their department employees, send department-specific announcements, and handle tickets from their department employees.

**Note:** All emails use company domains (@techcorp.com or @globalbiz.com). The seeder creates comprehensive mock data including:
- 90 days of time logs with various scenarios (early, on-time, late, overtime, half-day)
- Leave requests with all leave types and detailed reasons
- Support tickets with various statuses, priorities, and categories
- Company announcements from HR and Department Managers
- Calendar events (meetings, training, holidays)
- Profile change requests (PENDING, APPROVED, REJECTED statuses)
- Employees with upcoming birthdays (within 30 days)
- Realistic employee data with diverse names, positions, and contact information

### Profile Approval Workflow

**For Employees and Department Managers:**
1. Navigate to Profile page and click "Edit Profile"
2. Make changes to your profile information (name, email, phone, address, etc.)
3. Submit changes - they will be sent to HR for approval
4. You'll receive a notification that your request is pending review
5. Once approved by HR, changes are automatically applied to your profile

**For HR:**
1. Navigate to "Profile Approvals" page from the navigation menu
2. View all pending profile change requests from employees and department managers
3. Click on any request to see detailed changes (current vs. requested values)
4. Approve or reject requests with optional review notes
5. Approved changes are automatically applied to user profiles
6. View complete history of all profile change requests (pending, approved, rejected)

### Department Manager Features

Department Managers have a unique role that combines employee capabilities with management responsibilities:

**Employee Capabilities:**
- Clock in/out using NFC, QR Code, or Manual methods
- View personal time logs and leave requests
- Access personal profile and device management

**Management Capabilities:**
- **Department Announcements**: Send announcements to employees in their department
- **Employee Management**: View and manage employees in their assigned department
- **Hiring**: Create new employees (automatically assigned to their department)
- **Ticket Management**: 
  - Receive and respond to tickets from department employees
  - Create tickets to HR (not to Admin)
  - View all tickets from their department employees
- **Department Isolation**: All interactions are restricted to their department only

**Restrictions:**
- Cannot create company-wide announcements (only HR and Admin can)
- Cannot create tickets to Admin (only to HR)
- Cannot view or manage employees outside their department
- Profile changes require HR approval (same as employees)

### Database

- **Host**: localhost:5432
- **Database**: teamsphere_dev
- **Username**: teamsphere
- **Password**: teamsphere123

### Redis

- **Host**: localhost:6379
- **Password**: (none in development)

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Restart PostgreSQL
docker restart teamsphere-postgres

# Check connection
psql -h localhost -p 5432 -U teamsphere -d teamsphere_dev
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :8080  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL

# Kill processes using ports
sudo kill -9 $(lsof -t -i:8080)
```

#### Mobile Build Issues
```bash
# Clear React Native cache
cd mobile
npx react-native start --reset-cache

# Clean Android build
cd android && ./gradlew clean && cd ..

# Clean iOS build
cd ios && xcodebuild clean && cd ..
```

#### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Maven cache
mvn dependency:purge-local-repository
```

### Performance Issues

#### Slow API Responses
- **Check Cache Hit Rates**: Monitor Redis cache performance
  ```bash
  # Check cache metrics
  curl https://api.teamsphere.com/api/actuator/metrics/cache.gets
  curl https://api.teamsphere.com/api/actuator/metrics/cache.hits
  ```
- **Check Database Query Performance**: Review slow query logs
  ```sql
  -- Enable slow query log in PostgreSQL
  SET log_min_duration_statement = 1000;  -- Log queries >1s
  ```
- **Review Database Indexes**: Ensure indexes are being used
  ```sql
  -- Check index usage
  SELECT schemaname, tablename, indexname, idx_scan 
  FROM pg_stat_user_indexes 
  WHERE idx_scan = 0;
  ```
- **Review Connection Pool Settings**: Check HikariCP pool usage
  ```bash
  curl https://api.teamsphere.com/api/actuator/metrics/hikari.connections.active
  ```
- **Monitor Memory Usage**: Check JVM heap usage
  ```bash
  curl https://api.teamsphere.com/api/actuator/metrics/jvm.memory.used
  ```
- **Check for Memory Leaks**: Review heap dumps if needed

#### Frontend Performance
- Enable React DevTools Profiler
- Check bundle size with webpack-bundle-analyzer
- Optimize images and assets
- Implement code splitting

#### Mobile Performance
- Profile with React Native Performance Monitor
- Check memory usage
- Optimize images and assets
- Review native module usage

### Debug Mode

#### Backend Debug
```yaml
# application-dev.yml
logging:
  level:
    com.teamsphere: DEBUG
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
```

#### Frontend Debug
```env
# .env.development
VITE_ENABLE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

#### Mobile Debug
```bash
# Enable debug mode
npm run android -- --variant=debug
npm run ios -- --configuration=Debug
```

## 🤝 Contributing

### Getting Started

1. **Fork the Repositories**
   ```bash
   # Fork each repository on GitHub, then clone your forks
   git clone https://github.com/your-username/TeamSphere_backend.git
   git clone https://github.com/your-username/TeamSphere_frontend.git
   git clone https://github.com/your-username/TeamSphere_mobile.git
   git clone https://github.com/your-username/TeamSphere_infrastructure.git
   ```

2. **Set Up Development Environment**
   ```bash
   cd TeamSphere_infrastructure
   ./scripts/setup-dev.sh
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

#### Code Standards
- **Java**: Follow Google Java Style Guide
- **JavaScript/TypeScript**: Use ESLint and Prettier
- **React**: Follow React best practices
- **SQL**: Use consistent naming conventions

#### Testing Requirements
- Write unit tests for new functionality
- Include integration tests for API endpoints
- Add E2E tests for critical user flows
- Maintain test coverage above 80%

#### Documentation
- Update README for significant changes
- Document new API endpoints
- Add code comments for complex logic
- Update architecture diagrams if needed

#### Security Considerations
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines
- Use custom exceptions (ExceptionUtils) instead of RuntimeException
- Follow exception handling best practices (see [Exception Handling Guide](../TeamSphere_backend/EXCEPTION_HANDLING_GUIDE.md))

### Pull Request Process

1. **Create Pull Request**
   - Use descriptive title and description
   - Link related issues
   - Include screenshots for UI changes
   - Add test results

2. **Code Review**
   - Request appropriate reviewers
   - Address feedback promptly
   - Ensure all checks pass
   - Update documentation

3. **Merge Process**
   - Squash commits if needed
   - Use conventional commit messages
   - Update version numbers
   - Create release notes

### Issue Guidelines

#### Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide environment details
- Add relevant logs and screenshots

#### Feature Requests
- Use the feature request template
- Describe the use case
- Provide mockups if applicable
- Consider implementation complexity

## 📞 Support

### Getting Help

1. **Check Documentation**
   - Review relevant developer guides
   - Search existing documentation
   - Check troubleshooting section

2. **Community Support**
   - Search existing GitHub issues
   - Join our developer community
   - Participate in discussions

3. **Professional Support**
   - Create detailed GitHub issues
   - Contact the development team
   - Request enterprise support

### Resources

- **GitHub Issues**: 
  - [Backend Issues](https://github.com/Obilginozi/TeamSphere_backend/issues)
  - [Frontend Issues](https://github.com/Obilginozi/TeamSphere_frontend/issues)
  - [Mobile Issues](https://github.com/Obilginozi/TeamSphere_mobile/issues)
  - [Infrastructure Issues](https://github.com/Obilginozi/TeamSphere_infrastructure/issues)
- **Documentation**: [Full documentation](../TeamSphere_infrastructure/docs/)
- **API Reference**: [Swagger UI](http://localhost:8080/api/swagger-ui.html)

### Enterprise Support

For enterprise customers requiring dedicated support:

- **Priority Support**: Faster response times
- **Dedicated Resources**: Assigned support engineer
- **Custom Development**: Tailored features
- **Training**: Team training and onboarding
- **SLA**: Service level agreements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### License Summary

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No liability or warranty

## 🙏 Acknowledgments

- **Spring Boot Team** - Excellent backend framework
- **React Team** - Powerful frontend library
- **React Native Team** - Cross-platform mobile development
- **PostgreSQL Team** - Robust database system
- **Docker Team** - Containerization platform
- **Kubernetes Team** - Container orchestration
- **Material-UI Team** - Beautiful React components
- **Open Source Community** - Continuous inspiration and support

---

**Built with ❤️ for modern HR management**

**Last Updated**: January 2025  
**Version**: 3.1.0  
**Maintainers**: TeamSphere Development Team  
**Production Readiness**: 98% Complete

### Production Readiness

✅ **Production Ready**: All critical security, testing, monitoring, and performance requirements have been completed.

- ✅ Security hardening (JWT validation, CSRF, CORS, rate limiting, security headers, HTTPS enforcement)
- ✅ Test coverage 70%+ with comprehensive test suites
- ✅ Exception handling with custom exceptions
- ✅ Monitoring and error tracking (Sentry, APM, log aggregation)
- ✅ Automated backups and disaster recovery plan
- ✅ Environment configuration and documentation
- ✅ Code quality improvements (warnings fixed, deprecated methods updated)
- ✅ Performance optimization (database indexing, Redis caching)
- ✅ Production deployment documentation (Deployment Guide, Runbooks, Incident Response Plan)

### Recent Updates (v3.1.0)

#### 🔒 Security Enhancements
- ✅ **JWT Secret Validation**: Production-ready secret key validation (prevents default/weak secrets)
- ✅ **CSRF Protection**: Environment-based CSRF protection (enabled in production)
- ✅ **CORS Whitelist**: Configurable CORS with whitelist support (environment-based)
- ✅ **Rate Limiting**: IP-based rate limiting (100 req/min general, 5 req/min auth endpoints)
- ✅ **Actuator Protection**: Actuator endpoints restricted to ADMIN role (except `/actuator/health`)
- ✅ **Swagger Disable**: Swagger UI automatically disabled in production

#### 🧪 Testing & Quality
- ✅ **Test Coverage**: Increased to 70%+ with comprehensive test suites
- ✅ **New Test Suites**: 
  - Service tests (AuthService, TimeLogService, DepartmentService, LeaveRequestService, CompanyService)
  - Integration tests (AuthController, TimeLogController, EmployeeController, LeaveRequestController)
  - Security tests (JwtUtil, TenantContext)
  - Multi-tenant isolation tests
- ✅ **Code Quality**: Fixed 18 warnings and 15 deprecated method calls
- ✅ **Exception Handling**: Comprehensive exception handling with custom exceptions and utility classes

#### 📊 Monitoring & Observability
- ✅ **Sentry Integration**: Automatic error tracking and reporting
- ✅ **Log Aggregation**: Support for ELK, CloudWatch, Datadog
- ✅ **APM Integration**: Prometheus, New Relic, Datadog support
- ✅ **Structured Logging**: Enhanced logging with MDC context and correlation IDs
- ✅ **Environment-based Logging**: Configurable log levels (DEBUG/INFO/WARN)

#### 💾 Backup & Recovery
- ✅ **Automated Backups**: Scheduled backup scripts with S3 support
- ✅ **Disaster Recovery Plan**: Comprehensive DR plan with RTO/RPO targets
- ✅ **Backup Retention**: Configurable retention policies (daily, weekly, monthly)

#### ✨ Feature Completeness
- ✅ **SLA Notifications**: Automatic SLA breach detection and admin notifications
- ✅ **Last Login Tracking**: Automatic tracking of user login timestamps
- ✅ **Bulk Import Emails**: Email notifications for bulk employee imports

#### 🧹 Code Cleanup
- ✅ **Console Log Cleanup**: Removed 100+ unnecessary console.log statements from frontend
- ✅ **Production-ready**: Clean console output for production environments

#### ⚡ Performance Optimization
- ✅ **Database Indexing**: 25+ new indexes added (V31 migration)
  - Composite indexes for (company_id, is_deleted) pattern
  - Sorting indexes for created_at, updated_at
  - Partial indexes for active records only
  - Foreign key optimization indexes
- ✅ **Redis Caching**: Full caching strategy implementation
  - Cache configuration with different TTLs per cache name
  - Service method caching (CompanyService, DepartmentService)
  - Automatic cache eviction on updates/deletes
  - Multi-tenant cache isolation
- ✅ **Expected Performance Improvements**:
  - Database queries: 30-80% faster
  - API response times: 50-90% faster (on cache hits)
  - Database load: 40-60% reduction

#### 🔧 Code Quality & Configuration
- ✅ **Deprecated Methods**: All 15 deprecated method calls fixed
  - Company-filtered repository methods added
  - Multi-tenant isolation improved across all services
- ✅ **Configuration Management**: Hardcoded values moved to configuration
  - Mobile app URLs (iOS/Android) via environment variables
  - Support phone and email via configuration
  - Admin emails from database (with configuration fallback)
- ✅ **Production Deployment Documentation**:
  - Production Deployment Guide created
  - Runbooks for operational procedures
  - Incident Response Plan for security incidents

#### 🎯 Feature Enhancements
- ✅ **Fraud Detection**: Comprehensive fraud detection algorithms implemented
  - Geofencing validation (NFC reader location-based)
  - Time validation (working hours check)
  - Velocity checks (impossible travel detection using Haversine formula)
  - Device fingerprint mismatch detection
  - Multiple employees using same device detection
  - Automatic fraud flagging with detailed reasons
- ✅ **Trend Analysis**: Ticket trend analysis with predictive analytics
  - 7/30/90 day period comparisons
  - Trend direction calculation (increasing/decreasing/stable)
  - Percentage change calculations
  - Weighted overall trend analysis
- ✅ **User Guide**: Comprehensive end-user documentation
  - Getting started guide
  - Feature documentation (time tracking, leave management, etc.)
  - Troubleshooting section
  - FAQ section
  - Mobile app guide
  - Security & privacy information

### Previous Updates (v3.0.0)

- ✨ **Department Manager Role**: New role for department-level management
  - Department managers can send announcements to their department employees
  - Manage employees within their assigned department
  - Handle tickets from department employees (employees can create tickets to their manager)
  - Create tickets to HR (not to Admin)
  - Perform hiring operations for their department
  - All interactions are department-scoped for security and organization
  - Profile changes require HR approval (same as employees)
  - Can clock in/out like regular employees
- ✨ **Department-Based Announcements**: 
  - HR can send company-wide or department-specific announcements
  - Department managers can send announcements to their department only
  - Employees see company-wide announcements and their department announcements
- ✨ **Department-Based Ticket System**:
  - Employees' tickets are automatically assigned to their department manager (if exists) or HR
  - Department managers can respond to tickets from their department employees
  - Department managers can create tickets to HR (not Admin)
  - All ticket interactions respect department boundaries
- ✨ **HR Profile Approval System**: Employee and Department Manager profile changes now require HR approval before being applied
  - Employees and Department Managers submit profile change requests (name, email, phone, address, etc.)
  - HR reviews and approves/rejects changes through dedicated approval interface
  - Complete change history tracking with review notes
  - Automatic application of approved changes to user/employee records
- ✨ **Profile Approvals Page**: New HR interface for managing pending profile change requests
- ✨ **QR Code Generation**: ISO/IEC 18004 compliant QR codes with company logo embedding
- ✨ **Device Matching Interface**: HR can match employee devices with UUID validation
- ✨ **Dynamic Clock-In Methods**: Company-configurable clock-in methods with automatic selection
- ✨ **Enhanced Data Seeder**: Comprehensive mock data with tickets, announcements, and various time log scenarios
- 🔧 **API Path Fixes**: Resolved double `/api/api` path issues across all endpoints
- 🔧 **Database Migration Consolidation**: All migrations consolidated into single V1 file for easier setup
- 🔧 **Database Schema Updates**: Added `department_id` to `users` and `announcements` tables for department management
- 📱 **Mobile Improvements**: QR code modal with auto-refresh, device validation, and dynamic method selection

For questions, contributions, or enterprise support, please contact the development team or create an issue in the repository.