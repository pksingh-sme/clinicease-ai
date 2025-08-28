# ClinicEase AI - AWS Deployment Guide

This guide provides detailed instructions for deploying the ClinicEase AI healthcare management system on AWS.

## Prerequisites

Before deploying to AWS, ensure you have:

1. An AWS account with appropriate permissions
2. AWS CLI installed and configured
3. Docker installed (for containerization)
4. Node.js 18+ installed locally
5. PostgreSQL database (can be on AWS RDS)
6. Domain name (optional but recommended)

## Architecture Overview

The ClinicEase AI application follows a modern cloud architecture:

- **Frontend**: Next.js application served through AWS S3 + CloudFront or ECS
- **Backend**: Next.js API routes running on AWS ECS or EC2
- **Database**: PostgreSQL on AWS RDS
- **Real-time Communication**: Socket.io through AWS ECS with proper networking
- **Authentication**: JWT with secure secrets management via AWS Secrets Manager
- **File Storage**: AWS S3 for profile images and document storage
- **Caching**: Optional AWS ElastiCache for Redis
- **Monitoring**: AWS CloudWatch for logs and metrics

## Required AWS Services

1. **Amazon S3** - Static asset storage
2. **Amazon RDS** - PostgreSQL database
3. **Amazon ECS** - Container orchestration for the application
4. **Amazon ECR** - Container registry
5. **Amazon VPC** - Network isolation
6. **Amazon ALB** - Load balancing
7. **Amazon Route 53** - DNS management (optional)
8. **AWS Certificate Manager** - SSL certificates
9. **AWS Secrets Manager** - Secure credential storage
10. **Amazon CloudFront** - CDN for global distribution (optional)

## Deployment Steps

### 1. Prepare the Application

1. Ensure all debug code has been removed
2. Update environment variables for production
3. Build the application:
   ```bash
   npm run build
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

### 3. Configure Environment Variables in AWS Secrets Manager

1. Navigate to AWS Secrets Manager
2. Create a new secret with key-value pairs:
   ```
   DATABASE_URL=postgresql://clinicease_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/clinicease
   JWT_SECRET=YOUR_STRONG_JWT_SECRET
   NEXTAUTH_SECRET=YOUR_STRONG_NEXTAUTH_SECRET
   NEXTAUTH_URL=https://your-domain.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY
   ```

### 4. Containerize the Application

Create a Dockerfile in the project root:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 5. Build and Push Docker Image to ECR

1. Create ECR repository:
   ```bash
   aws ecr create-repository --repository-name clinicease-app
   ```

2. Authenticate Docker to ECR:
   ```bash
   aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com
   ```

3. Build and push the image:
   ```bash
   docker build -t clinicease-app .
   docker tag clinicease-app:latest YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/clinicease-app:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/clinicease-app:latest
   ```

### 6. Deploy to AWS ECS

1. Create ECS cluster:
   ```bash
   aws ecs create-cluster --cluster-name clinicease-cluster
   ```

2. Create task definition (save as `task-definition.json`):
   ```json
   {
     "family": "clinicease-app",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "512",
     "memory": "1024",
     "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "clinicease-app",
         "image": "YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/clinicease-app:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "DATABASE_URL",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:DATABASE_URL::"
           },
           {
             "name": "JWT_SECRET",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:JWT_SECRET::"
           },
           {
             "name": "NEXTAUTH_SECRET",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:NEXTAUTH_SECRET::"
           },
           {
             "name": "NEXTAUTH_URL",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:NEXTAUTH_URL::"
           },
           {
             "name": "NEXT_PUBLIC_SITE_URL",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:NEXT_PUBLIC_SITE_URL::"
           },
           {
             "name": "STRIPE_SECRET_KEY",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:STRIPE_SECRET_KEY::"
           },
           {
             "name": "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease-secrets-XXXXXX:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY::"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/clinicease-app",
             "awslogs-region": "YOUR_REGION",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

3. Register the task definition:
   ```bash
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   ```

4. Create ECS service:
   ```bash
   aws ecs create-service \
     --cluster clinicease-cluster \
     --service-name clinicease-service \
     --task-definition clinicease-app \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],securityGroups=[sg-zzzzzzzz],assignPublicIp=ENABLED}"
   ```

### 7. Set up Load Balancer and DNS

1. Create Application Load Balancer
2. Configure target group to point to ECS service
3. Set up SSL certificate via AWS Certificate Manager
4. Configure Route 53 (if using custom domain) to point to ALB

### 8. Database Migration and Seeding

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

### 9. Configure S3 for Static Assets (Optional)

1. Create S3 bucket for static assets
2. Configure CORS settings
3. Update application to use S3 for profile images

## Environment Variables

The following environment variables must be configured in AWS Secrets Manager:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret for JWT token signing | random_string_32_chars |
| NEXTAUTH_SECRET | Secret for NextAuth.js | random_string_32_chars |
| NEXTAUTH_URL | Public URL of your app | https://your-domain.com |
| NEXT_PUBLIC_SITE_URL | Public site URL | https://your-domain.com |
| STRIPE_SECRET_KEY | Stripe secret key | sk_live_xxxxxxxxx |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key | pk_live_xxxxxxxxx |

## Security Considerations

1. **Network Security**:
   - Use VPC with private subnets for database
   - Restrict inbound/outbound traffic with security groups
   - Use AWS WAF for additional protection

2. **Data Security**:
   - Enable encryption at rest for RDS
   - Use SSL/TLS for all communications
   - Regular database backups with encryption

3. **Application Security**:
   - Keep dependencies updated
   - Use IAM roles instead of access keys
   - Regular security scanning

## Monitoring and Logging

1. **CloudWatch**:
   - Set up log groups for ECS tasks
   - Create metrics for application performance
   - Configure alarms for critical issues

2. **Health Checks**:
   - Configure ALB health checks
   - Set up custom health endpoints

3. **Alerting**:
   - Configure SNS topics for notifications
   - Set up CloudWatch alarms for key metrics

## Backup and Recovery

1. **Database**:
   - Enable automated backups in RDS
   - Configure retention period
   - Test restore procedures

2. **Application**:
   - Version control Docker images
   - Store configuration in infrastructure as code

## Scaling Considerations

1. **Vertical Scaling**:
   - Increase ECS task CPU/memory
   - Upgrade RDS instance class

2. **Horizontal Scaling**:
   - Increase desired count in ECS service
   - Use Auto Scaling policies based on metrics

## Troubleshooting

1. **Application Issues**:
   - Check CloudWatch logs
   - Verify environment variables
   - Test database connectivity

2. **Database Issues**:
   - Check RDS instance status
   - Verify security group rules
   - Review connection limits

3. **Networking Issues**:
   - Verify VPC configuration
   - Check security group rules
   - Confirm subnet settings

## Cost Optimization

1. **Right-sizing**:
   - Monitor resource utilization
   - Adjust instance types accordingly

2. **Reserved Instances**:
   - Consider reserved instances for steady workloads

3. **Auto Scaling**:
   - Scale down during low-traffic periods

## Maintenance

1. **Regular Updates**:
   - Update application code
   - Patch OS and dependencies
   - Rotate secrets periodically

2. **Monitoring**:
   - Review logs regularly
   - Update monitoring rules
   - Test alerting systems

---

This deployment guide provides a comprehensive approach to running ClinicEase AI on AWS. Adjust the configuration based on your specific requirements and scale.