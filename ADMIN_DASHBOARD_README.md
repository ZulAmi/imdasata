# SATA Admin Dashboard Documentation

## Overview

The SATA Admin Dashboard provides comprehensive monitoring and management capabilities for healthcare staff to oversee the Student Assurance and Transfer Analysis (SATA) platform. This system offers real-time insights into user engagement, mental health trends, resource utilization, and system performance while maintaining strict privacy and HIPAA compliance.

## Features

### 🔐 Role-Based Access Control

The admin dashboard supports four distinct admin roles with tailored permissions:

1. **Super Admin** (`super_admin`)

   - Full system access and configuration
   - User management and role assignment
   - System-wide analytics and reporting
   - Access to all monitoring features

2. **Clinician** (`clinician`)

   - Patient assessment monitoring
   - High-risk user identification
   - Treatment outcome tracking
   - Healthcare provider export capabilities

3. **Analyst** (`analyst`)

   - Data analytics and trend analysis
   - Demographic insights and reporting
   - Resource utilization statistics
   - Performance metrics monitoring

4. **Staff Admin** (`staff_admin`)
   - Basic user engagement monitoring
   - Support ticket management
   - General system health monitoring
   - Limited administrative functions

### 📊 Real-Time Monitoring Dashboard

#### User Engagement Metrics

- **Active Users**: Real-time count of currently active users
- **Daily Registrations**: New user sign-ups over time
- **Session Duration**: Average time users spend on the platform
- **Feature Usage**: Most and least used platform features
- **Retention Rates**: User retention analytics over different time periods

#### Mental Health Assessment Trends

- **Assessment Completion Rates**: PHQ-4 and GAD-7 completion statistics
- **Risk Level Distribution**: Breakdown of users by mental health risk categories
- **Trend Analysis**: Mood score patterns and changes over time
- **Intervention Effectiveness**: Success rates of proactive interventions
- **Crisis Alert Monitoring**: Real-time alerts for high-risk situations

#### Resource Utilization Statistics

- **Service Usage**: Most accessed mental health resources
- **Referral Patterns**: Healthcare provider referral statistics
- **Response Times**: Average time to intervention or support
- **Resource Effectiveness**: User engagement with recommended resources
- **Capacity Planning**: System load and usage projections

#### Demographic Insights

- **Age Distribution**: User demographics (anonymized)
- **Geographic Patterns**: Usage patterns by region (privacy-protected)
- **Academic Level**: Student year/program distribution
- **Usage Patterns**: Peak usage times and seasonal trends
- **Accessibility Metrics**: Support tool usage and effectiveness

#### High-Risk User Identification

- **Anonymous Monitoring**: Privacy-protected high-risk user tracking
- **Risk Score Algorithms**: Automated risk assessment and alerts
- **Intervention Tracking**: Response to crisis interventions
- **Escalation Protocols**: Automated referral to appropriate services
- **Safety Monitoring**: Continuous safety assessment and reporting

#### Service Referral Tracking

- **Referral Outcomes**: Success rates and follow-up statistics
- **Provider Network**: Connected healthcare provider metrics
- **Wait Times**: Time from referral to service connection
- **Treatment Continuity**: Long-term engagement tracking
- **Quality Metrics**: Service satisfaction and effectiveness

#### System Performance Monitoring

- **Server Health**: Real-time system performance metrics
- **Database Performance**: Query response times and optimization
- **Azure Service Status**: Cognitive Services availability and performance
- **Error Rates**: System error tracking and resolution
- **Security Monitoring**: Authentication and access security metrics

## Demo Accounts

For testing and demonstration purposes, the following demo accounts are available:

```
Super Admin Demo:
- Username: demo_super
- Password: demo123
- Access: Full system capabilities

Clinician Demo:
- Username: demo_clinician
- Password: demo123
- Access: Clinical monitoring and patient assessment tools

Analyst Demo:
- Username: demo_analyst
- Password: demo123
- Access: Data analytics and reporting features

Staff Admin Demo:
- Username: demo_staff
- Password: demo123
- Access: Basic administrative functions
```

## Getting Started

### Access the Admin Dashboard

1. Navigate to `/admin-login` to access the admin login page
2. Select your admin type (SATA Admin vs Legacy System)
3. Enter your credentials or use demo accounts for testing
4. Upon successful authentication, you'll be redirected to the appropriate dashboard view

### Navigation

The admin dashboard is organized into key sections:

- **Overview**: High-level metrics and alerts
- **Users**: User engagement and demographic insights
- **Assessments**: Mental health assessment monitoring
- **Resources**: Resource utilization and effectiveness
- **Referrals**: Service referral tracking and outcomes
- **System**: Performance monitoring and health checks
- **Settings**: Administrative configuration options

## Security and Privacy

### Data Protection

- All user data is anonymized in admin views
- HIPAA-compliant data handling and storage
- Role-based access controls prevent unauthorized data access
- Audit logging for all administrative actions

### Authentication Security

- Secure session management with automatic timeout
- Failed login attempt monitoring and alerting
- Multi-factor authentication support (configurable)
- Regular security audits and access reviews

### Privacy Compliance

- No personally identifiable information in dashboards
- Aggregated data reporting only
- Configurable data retention policies
- GDPR and HIPAA compliance frameworks

## Technical Architecture

### Frontend Components

- **AdminDashboard.tsx**: Main dashboard component with real-time metrics
- **admin-dashboard.tsx**: Page wrapper with authentication and routing
- **admin-login.tsx**: Enhanced login system with role-based access

### Backend Integration

- Azure Cognitive Services for voice sentiment analysis
- Real-time event processing with EventEmitter architecture
- Secure API endpoints for admin data access
- Database integration for user and assessment data

### Real-Time Features

- WebSocket connections for live metric updates
- Automated alert system for high-risk situations
- Real-time system health monitoring
- Dynamic dashboard updates without page refresh

## API Endpoints

### User Management

```
GET /api/admin/users/engagement - User engagement metrics
GET /api/admin/users/demographics - Demographic breakdowns
GET /api/admin/users/risk-assessment - High-risk user monitoring
```

### Assessment Analytics

```
GET /api/admin/assessments/trends - Assessment trend analysis
GET /api/admin/assessments/completion-rates - Completion statistics
GET /api/admin/assessments/risk-distribution - Risk level distribution
```

### System Monitoring

```
GET /api/admin/system/health - System performance metrics
GET /api/admin/system/errors - Error rates and logging
GET /api/admin/system/security - Security monitoring data
```

## Configuration

### Environment Variables

```
NEXT_PUBLIC_ADMIN_SESSION_TIMEOUT=3600000
NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true
NEXT_PUBLIC_AUDIT_LOGGING=true
AZURE_COGNITIVE_SERVICES_KEY=your_key_here
DATABASE_CONNECTION_STRING=your_connection_string
```

### Role Permissions

Role permissions can be configured in the admin settings panel:

- Feature access controls
- Data visibility settings
- Action authorization levels
- Custom role creation

## Troubleshooting

### Common Issues

1. **Login Authentication Failures**

   - Verify credentials are correct
   - Check if account is active and not locked
   - Ensure proper admin role assignment

2. **Dashboard Data Not Loading**

   - Check network connectivity
   - Verify API endpoint availability
   - Review browser console for JavaScript errors

3. **Real-Time Updates Not Working**
   - Confirm WebSocket connection is established
   - Check firewall settings for WebSocket traffic
   - Verify real-time service is running

### Support Contacts

For technical support or configuration assistance:

- System Administrator: admin@sata-platform.edu
- Technical Support: support@sata-platform.edu
- Security Team: security@sata-platform.edu

## Deployment Notes

### Production Considerations

- Configure SSL/TLS certificates for secure connections
- Set up monitoring and alerting for system health
- Implement backup and disaster recovery procedures
- Schedule regular security audits and updates

### Performance Optimization

- Enable caching for frequently accessed dashboard data
- Optimize database queries for large datasets
- Configure CDN for static assets
- Monitor and scale based on usage patterns

---

_Last Updated: December 2024_
_Version: 1.0.0_
_Contact: SATA Development Team_
