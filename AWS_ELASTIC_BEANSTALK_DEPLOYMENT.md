# ClinicEase AI - AWS Elastic Beanstalk Deployment Guide

This guide provides an alternative, simpler deployment approach using AWS Elastic Beanstalk for the ClinicEase AI healthcare management system.

## Prerequisites

Before deploying to AWS Elastic Beanstalk, ensure you have:

1. An AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Elastic Beanstalk CLI (EB CLI) installed
4. Node.js 18+ installed locally
5. PostgreSQL database (can be on AWS RDS)

## Architecture Overview

When using Elastic Beanstalk, the architecture is simplified:

- **Application**: Next.js application deployed as a Node.js app
- **Database**: PostgreSQL on AWS RDS
- **Static Assets**: Served directly by the application (or optionally through S3/CloudFront)
- **Real-time Communication**: Socket.io through the same application server

## Required AWS Services

1. **AWS Elastic Beanstalk** - Application hosting
2. **Amazon RDS** - PostgreSQL database
3. **AWS Secrets Manager** - Secure credential storage
4. **Amazon S3** - Static asset storage (optional)
5. **Amazon Route 53** - DNS management (optional)

## Deployment Steps

### 1. Prepare the Application

1. Ensure all debug code has been removed
2. Update environment variables for production
3. Create a `.ebextensions` directory in your project root:
   ```bash
   mkdir .ebextensions
   ```

4. Create a configuration file for environment variables (`.ebextensions/environment.config`):
   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       NEXTAUTH_URL: https://your-domain.elasticbeanstalk.com
       NEXT_PUBLIC_SITE_URL: https://your-domain.elasticbeanstalk.com
   ```

5. Create a configuration file for health checks (`.ebextensions/healthcheck.config`):
   ```yaml
   option_settings:
     aws:elasticbeanstalk:healthreporting:system:
       SystemType: enhanced
     aws:elasticbeanstalk:application:
       Application Healthcheck URL: /api/health
   ```

6. Create a health check API endpoint (`src/app/api/health/route.ts`):
   ```typescript
   import { NextResponse } from 'next/server'
   
   export async function GET() {
     return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
   }
   ```

### 2. Set up AWS RDS for PostgreSQL

1. Navigate to AWS RDS Console
2. Create a new PostgreSQL database instance:
   - Engine: PostgreSQL 13+
   - Template: Production or Dev/Test based on your needs
   - DB instance identifier: `clinicease-db`
   - Master username: `clinicease_admin`
   - Master password: Generate a strong password
   - DB instance class: `db.t3.micro` (for testing) or higher for production
   - Storage: 20GB GP2 (adjust as needed)
   - VPC: Create or use existing
   - Public access: No (for security)
   - Security group: Create new or use existing
   - Database authentication: Password authentication
3. After creation, note the:
   - Endpoint (database host)
   - Port (5432)
   - Database name (default or create `clinicease`)

### 3. Configure Environment Variables

Instead of using AWS Secrets Manager, you can configure environment variables directly in Elastic Beanstalk:

1. In the Elastic Beanstalk console, go to your application's Configuration
2. In the Software category, modify environment properties
3. Add the following environment variables:
   ```
   DATABASE_URL=postgresql://clinicease_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/clinicease
   JWT_SECRET=YOUR_STRONG_JWT_SECRET
   NEXTAUTH_SECRET=YOUR_STRONG_NEXTAUTH_SECRET
   NEXTAUTH_URL=https://your-domain.elasticbeanstalk.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.elasticbeanstalk.com
   STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
   ```

### 4. Initialize Elastic Beanstalk Application

1. Initialize the EB CLI in your project directory:
   ```bash
   eb init
   ```

2. Select your region and application name when prompted
3. Choose Node.js as the platform
4. Select the appropriate platform version (Node.js 18+)

### 5. Create Environment and Deploy

1. Create and deploy to an environment:
   ```bash
   eb create production
   ```

2. When prompted, select the appropriate settings:
   - Instance type: t3.small or higher (t3.micro may not have enough memory)
   - Key pair: Create or select an existing one for SSH access
   - Database: Select "No" since we're using RDS

### 6. Configure Load Balancer (if needed)

If you need to scale horizontally:

1. In the Elastic Beanstalk console, go to Configuration
2. Modify the Load balancer settings to use Application Load Balancer
3. Configure health checks and scaling policies

### 7. Database Migration and Seeding

1. Connect to your RDS instance:
   ```bash
   psql -h YOUR_RDS_ENDPOINT -p 5432 -U clinicease_admin -d clinicease
   ```

2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Seed the database (optional):
   ```bash
   npx prisma db seed
   ```

### 8. Configure Custom Domain (Optional)

1. In the Elastic Beanstalk console, go to Configuration
2. In the Custom Domain category, add your domain
3. Configure DNS records in Route 53 or your DNS provider
4. Set up SSL certificate via AWS Certificate Manager

## Environment Variables

The following environment variables must be configured in Elastic Beanstalk:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret for JWT token signing | random_string_32_chars |
| NEXTAUTH_SECRET | Secret for NextAuth.js | random_string_32_chars |
| NEXTAUTH_URL | Public URL of your app | https://your-domain.elasticbeanstalk.com |
| NEXT_PUBLIC_SITE_URL | Public site URL | https://your-domain.elasticbeanstalk.com |
| STRIPE_SECRET_KEY | Stripe secret key | sk_live_xxxxxxxxx |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key | pk_live_xxxxxxxxx |

## Security Considerations

1. **Environment Variables**:
   - Store sensitive variables securely
   - Rotate secrets periodically

2. **Network Security**:
   - Use security groups to restrict access
   - Keep database in private subnets

3. **Application Security**:
   - Keep dependencies updated
   - Regular security scanning

## Monitoring and Logging

1. **CloudWatch**:
   - Elastic Beanstalk automatically integrates with CloudWatch
   - View logs in the EB console or via `eb logs`

2. **Health Checks**:
   - Monitor application health through the EB dashboard
   - Set up notifications for health changes

## Scaling

1. **Vertical Scaling**:
   - Change instance type in Configuration → Capacity

2. **Horizontal Scaling**:
   - Enable load balancing
   - Configure auto scaling policies

## Troubleshooting

1. **Deployment Issues**:
   - Check `eb logs` for detailed error messages
   - Verify environment variables are correctly set
   - Ensure database connectivity

2. **Application Issues**:
   - Monitor CloudWatch logs
   - Check health dashboard
   - Review recent deployments

## Cost Optimization

1. **Instance Selection**:
   - Start with smaller instances for testing
   - Monitor resource utilization
   - Scale appropriately

2. **Database Optimization**:
   - Use appropriate RDS instance class
   - Enable storage autoscaling if needed

## Maintenance

1. **Updates**:
   - Deploy new versions with `eb deploy`
   - Use blue/green deployments for zero-downtime updates

2. **Monitoring**:
   - Regularly review logs
   - Monitor resource utilization
   - Set up alerts for critical metrics

---

This deployment guide offers a simpler approach using AWS Elastic Beanstalk, which handles much of the infrastructure management for you while still providing good scalability and reliability.