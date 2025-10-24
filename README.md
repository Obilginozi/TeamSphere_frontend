# TeamSphere

Enterprise-grade **multi-tenant HR & time tracking platform** with web and mobile applications. Deploy as SaaS or on-premise with flexible subscription tiers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://openjdk.java.net/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2+-green.svg)](https://spring.io/projects/spring-boot)

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
# Clone the repository
git clone <repository-url>
cd teamsphere

# Start PostgreSQL (Docker)
docker run --name teamsphere-postgres \
  -e POSTGRES_DB=teamsphere_dev \
  -e POSTGRES_USER=teamsphere \
  -e POSTGRES_PASSWORD=teamsphere123 \
  -p 5432:5432 -d postgres:13

# Backend
cd backend
mvn clean install
mvn spring-boot:run

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Mobile (new terminal)
cd mobile
npm install
npm run android  # or npm run ios
```

### Quick Setup with Scripts

```bash
# Use the automated setup script
cd infrastructure
./scripts/setup-dev.sh
```

**Access Points:**
- 🌐 **Web App**: http://localhost:5173
- 🔌 **API**: http://localhost:8080
- 📱 **Mobile**: Android/iOS app
- 📖 **API Docs**: http://localhost:8080/api/swagger-ui.html

## 📋 Features

### Core Features

- ✅ **Multi-tenant Architecture** - Support multiple companies with data isolation
- ✅ **Role-based Access Control** - Admin, HR, Employee roles with granular permissions
- ✅ **Time Tracking** - Clock in/out with NFC/QR codes, manual entry, overtime calculation
- ✅ **Leave Management** - Request, approve, track leaves with workflow automation
- ✅ **Device Management** - Bind and manage employee devices with security protocols
- ✅ **Internal Ticketing System** - Support and issue tracking with SLA management
- ✅ **Reports & Analytics** - Export to PDF/Excel with customizable dashboards
- ✅ **Mobile App** - React Native with offline support and biometric authentication

### Advanced Features

- ✅ **Payment Integration** - Stripe, iyzico, PayTR, PayPal with subscription management
- ✅ **Bulk Employee Import** - Excel import with validation and error handling
- ✅ **Password Generation** - Automated employee passwords with security policies
- ✅ **Email Notifications** - Automated credential emails and system notifications
- ✅ **Phone Validation** - Country-specific validation with international support
- ✅ **System Monitoring** - Health checks, metrics, and performance monitoring
- ✅ **Multi-language Support** - i18n ready with English and Turkish support
- ✅ **Biometric Authentication** - Fingerprint and face recognition for mobile
- ✅ **NFC Integration** - Contactless clock in/out with device binding
- ✅ **Offline Support** - Mobile app works offline with data synchronization

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
- **Caching**: Redis for session management and caching

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
- **Caching**: Redis for session and data caching
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
├── backend/              # Spring Boot API
│   ├── src/main/java/   # Java source code
│   ├── src/main/resources/ # Configuration files
│   ├── src/test/        # Test files
│   └── pom.xml          # Maven configuration
├── frontend/            # React web app
│   ├── src/            # React source code
│   ├── public/         # Static assets
│   └── package.json    # Node.js dependencies
├── mobile/              # React Native app
│   ├── shared/         # Shared components and services
│   ├── android/        # Android-specific code
│   ├── ios/            # iOS-specific code
│   └── package.json    # Node.js dependencies
├── infrastructure/      # Docker & K8s configs
│   ├── deploy/         # Kubernetes manifests
│   ├── scripts/        # Deployment scripts
│   └── docs/           # Infrastructure documentation
└── marketing-website/   # Landing page
```

### Development Commands

```bash
# Backend Development
cd backend
mvn clean install        # Install dependencies
mvn spring-boot:run      # Start development server
mvn test                # Run tests
mvn package             # Build JAR file

# Frontend Development
cd frontend
npm install             # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Lint code

# Mobile Development
cd mobile
npm install             # Install dependencies
npm run android         # Run on Android
npm run ios             # Run on iOS
npm run test            # Run tests

# Full Stack with Docker
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

#### Backend Configuration
```env
# Database
DB_URL=jdbc:postgresql://localhost:5432/teamsphere_dev
DB_USERNAME=teamsphere
DB_PASSWORD=teamsphere123

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRATION=86400000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Payment Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
IYZICO_API_KEY=your-iyzico-key
IYZICO_SECRET_KEY=your-iyzico-secret

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Monitoring
ACTUATOR_ENABLED=true
METRICS_ENABLED=true
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
```yaml
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🧪 Testing

### Testing Strategy

#### Backend Testing
```bash
# Unit Tests
mvn test

# Integration Tests
mvn test -Dtest=*IntegrationTest

# API Tests
mvn test -Dtest=*ControllerTest

# Performance Tests
mvn test -Dtest=*PerformanceTest
```

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

- **[Frontend Developer Guide](infrastructure/docs/FRONTEND_DEVELOPER_GUIDE.md)** - Complete React development guide
- **[Backend Developer Guide](infrastructure/docs/BACKEND_DEVELOPER_GUIDE.md)** - Spring Boot development guide
- **[Mobile Developer Guide](infrastructure/docs/MOBILE_DEVELOPER_GUIDE.md)** - React Native development guide
- **[Infrastructure Guide](infrastructure/docs/INFRASTRUCTURE_DEVELOPER_GUIDE.md)** - DevOps and deployment guide

### Setup Guides

- **[Development Setup Guide](infrastructure/docs/DEVELOPMENT_SETUP.md)** - Complete development environment setup
- **[Docker Deployment Guide](infrastructure/docs/DOCKER_DEPLOYMENT_GUIDE.md)** - Containerized deployment
- **[Setup Guide](infrastructure/docs/SETUP_GUIDE.md)** - Basic setup instructions

### API Documentation

- **[Postman API Testing Guide](infrastructure/docs/POSTMAN_API_TESTING_GUIDE.md)** - API testing with Postman
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html (when running)
- **OpenAPI Spec**: Available in `/api/v3/api-docs`

### Additional Resources

- **[Use Cases and Examples](infrastructure/docs/USE_CASES_AND_EXAMPLES.md)** - Real-world usage scenarios
- **Component Library**: Frontend component documentation
- **Database Schema**: ERD and table documentation
- **Architecture Diagrams**: System design documentation

## 🔐 Security

### Authentication & Authorization

- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-based Access**: ADMIN, HR, EMPLOYEE roles with granular permissions
- **Multi-factor Authentication**: Optional 2FA support
- **Session Management**: Secure session handling with timeout
- **Password Policies**: Configurable password requirements

### Data Security

- **Encryption**: AES-256 encryption for sensitive data
- **HTTPS**: TLS 1.3 for all communications
- **Database Security**: Encrypted connections and data at rest
- **API Security**: Rate limiting, CORS, and input validation
- **Data Masking**: Sensitive data protection in logs and responses

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

- **Application Health**: Spring Boot Actuator endpoints
- **Database Health**: Connection pool monitoring
- **Service Health**: Dependency health checks
- **Performance Metrics**: Response times and throughput

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: Configurable logging levels
- **Centralized Logging**: ELK stack integration
- **Error Tracking**: Automatic error reporting and alerting
- **Audit Logging**: Security and compliance logging

### Metrics & Analytics

- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, disk usage
- **User Analytics**: Usage patterns and behavior
- **Performance Analytics**: Response times and error rates

### Alerting

- **Health Alerts**: Service down notifications
- **Performance Alerts**: Response time thresholds
- **Error Alerts**: Exception rate monitoring
- **Security Alerts**: Suspicious activity detection

## 📊 Default Credentials

### Test Users

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@teamsphere.com` | `password` | Full system access |
| **HR Manager** | `hr@teamsphere.com` | `password` | HR operations access |
| **Employee** | `employee@teamsphere.com` | `password` | Basic employee access |

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
- Check database query performance
- Review connection pool settings
- Monitor memory usage
- Check for memory leaks

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

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/teamsphere.git
   cd teamsphere
   ```

2. **Set Up Development Environment**
   ```bash
   cd infrastructure
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

- **GitHub Issues**: [Create an issue](https://github.com/your-org/teamsphere/issues)
- **Discussions**: [Join discussions](https://github.com/your-org/teamsphere/discussions)
- **Documentation**: [Full documentation](infrastructure/docs/)
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
**Version**: 2.0.0  
**Maintainers**: TeamSphere Development Team

For questions, contributions, or enterprise support, please contact the development team or create an issue in the repository.