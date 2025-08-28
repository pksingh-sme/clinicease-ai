# ClinicEase AI - Step-by-Step AWS Deployment

This guide provides detailed, step-by-step instructions for deploying ClinicEase AI on AWS using ECS (Elastic Container Service).

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS account with administrator access
- [ ] AWS CLI installed and configured
- [ ] Docker installed locally
- [ ] Node.js 18+ installed locally
- [ ] ClinicEase AI source code
- [ ] Domain name (optional but recommended)

## Step 1: Prepare Your Local Environment

1. **Clone or navigate to your project directory**:
   ```bash
   cd /path/to/clinicease-ai
   ```

2. **Clean up development artifacts**:
   ```bash
   rm -rf .next node_modules .env.local
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Verify the build works**:
   ```bash
   npm run build
   ```

## Step 2: Create AWS RDS PostgreSQL Database

1. **Navigate to AWS RDS Console**:
   - Go to https://console.aws.amazon.com/rds/
   - Click "Create database"

2. **Configure database settings**:
   - Engine: PostgreSQL
   - Version: 13 or higher
   - Template: Dev/Test (or Production based on your needs)
   - DB instance identifier: `clinicease-db`
   - Master username: `clinicease_admin`
   - Master password: Generate a strong password and save it securely

3. **Configure instance settings**:
   - DB instance class: `db.t3.micro` for testing (upgrade for production)
   - Storage: 20GB GP2 (adjust as needed)
   - Storage autoscaling: Enable with threshold 85%

4. **Configure availability and durability**:
   - Multi-AZ deployment: No (for testing) / Yes (for production)

5. **Configure connectivity**:
   - Virtual private cloud (VPC): Default or your preferred VPC
   - DB subnet group: Default or existing
   - Public access: No (recommended for security)
   - VPC security group: Create new or use existing
   - Availability zone: No preference
   - Database port: 5432

6. **Additional configuration**:
   - Initial database name: `clinicease`
   - Backup retention period: 7 days
   - Encryption: Enable (recommended)

7. **Create database**:
   - Click "Create database"
   - Wait 5-10 minutes for creation to complete

8. **Note important database information**:
   - Endpoint (e.g., `clinicease-db.cluster-xxxxx.region.rds.amazonaws.com`)
   - Port: 5432
   - Database name: `clinicease`

## Step 3: Create AWS Secrets Manager Secrets

1. **Navigate to AWS Secrets Manager Console**:
   - Go to https://console.aws.amazon.com/secretsmanager/

2. **Create new secret**:
   - Click "Store a new secret"
   - Secret type: "Other type of secret"
   - Secret name: `clinicease/secrets`

3. **Add secret key-value pairs**:
   ```
   DATABASE_URL=postgresql://clinicease_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/clinicease
   JWT_SECRET=generate_strong_secret_here_32_chars_min
   NEXTAUTH_SECRET=generate_strong_secret_here_32_chars_min
   NEXTAUTH_URL=https://your-domain.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Configure encryption**:
   - Encryption key: aws/secretsmanager (or your KMS key)

5. **Click "Next" and review**:
   - Click "Store"

## Step 4: Prepare Docker Image

1. **Create Dockerfile in project root**:
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

2. **Create .dockerignore file**:
   ```
   node_modules
   .next
   .git
   .env*
   README.md
   ```

## Step 5: Build and Push Docker Image to ECR

1. **Create ECR repository**:
   ```bash
   aws ecr create-repository --repository-name clinicease-app
   ```

2. **Authenticate Docker to ECR**:
   ```bash
   aws ecr get-login-password --region YOUR_REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com
   ```

3. **Build Docker image**:
   ```bash
   docker build -t clinicease-app .
   ```

4. **Tag the image**:
   ```bash
   docker tag clinicease-app:latest YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/clinicease-app:latest
   ```

5. **Push image to ECR**:
   ```bash
   docker push YOUR_ACCOUNT_ID.dkr.ecr.YOUR_REGION.amazonaws.com/clinicease-app:latest
   ```

## Step 6: Create ECS Task Definition

1. **Create task definition JSON file** (`task-definition.json`):
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
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:DATABASE_URL::"
           },
           {
             "name": "JWT_SECRET",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:JWT_SECRET::"
           },
           {
             "name": "NEXTAUTH_SECRET",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:NEXTAUTH_SECRET::"
           },
           {
             "name": "NEXTAUTH_URL",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:NEXTAUTH_URL::"
           },
           {
             "name": "NEXT_PUBLIC_SITE_URL",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:NEXT_PUBLIC_SITE_URL::"
           },
           {
             "name": "STRIPE_SECRET_KEY",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:STRIPE_SECRET_KEY::"
           },
           {
             "name": "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
             "valueFrom": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:clinicease/secrets:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY::"
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

2. **Register task definition**:
   ```bash
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   ```

## Step 7: Create ECS Cluster and Service

1. **Create ECS cluster**:
   ```bash
   aws ecs create-cluster --cluster-name clinicease-cluster
   ```

2. **Create CloudWatch log group**:
   ```bash
   aws logs create-log-group --log-group-name /ecs/clinicease-app
   ```

3. **Create ECS service**:
   ```bash
   aws ecs create-service \
     --cluster clinicease-cluster \
     --service-name clinicease-service \
     --task-definition clinicease-app \
     --desired-count 1 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxx,subnet-yyyyyyyy],securityGroups=[sg-zzzzzzzz],assignPublicIp=ENABLED}"
   ```

## Step 8: Set up Load Balancer

1. **Create target group**:
   ```bash
   aws elbv2 create-target-group \
     --name clinicease-target-group \
     --protocol HTTP \
     --port 3000 \
     --target-type ip \
     --vpc-id vpc-xxxxxxxx
   ```

2. **Create Application Load Balancer**:
   ```bash
   aws elbv2 create-load-balancer \
     --name clinicease-alb \
     --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
     --security-groups sg-zzzzzzzz
   ```

3. **Create listener**:
   ```bash
   aws elbv2 create-listener \
     --load-balancer-arn arn:aws:elasticloadbalancing:region:account:loadbalancer/app/clinicease-alb/xxxxxxxx \
     --protocol HTTP \
     --port 80 \
     --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account:targetgroup/clinicease-target-group/xxxxxxxx
   ```

4. **Register targets**:
   ```bash
   aws elbv2 register-targets \
     --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/clinicease-target-group/xxxxxxxx \
     --targets Id=container-instance-ip,Port=3000
   ```

## Step 9: Configure SSL and Custom Domain (Optional)

1. **Request SSL certificate**:
   - Navigate to AWS Certificate Manager
   - Request a public certificate for your domain
   - Validate via DNS or email

2. **Update listener for HTTPS**:
   ```bash
   aws elbv2 create-listener \
     --load-balancer-arn arn:aws:elasticloadbalancing:region:account:loadbalancer/app/clinicease-alb/xxxxxxxx \
     --protocol HTTPS \
     --port 443 \
     --certificates CertificateArn=arn:aws:acm:region:account:certificate/xxxxxxxx \
     --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:region:account:targetgroup/clinicease-target-group/xxxxxxxx
   ```

3. **Configure DNS**:
   - In Route 53 or your DNS provider, create an A record pointing to your ALB

## Step 10: Database Migration

1. **Install Prisma CLI locally**:
   ```bash
   npm install -g prisma
   ```

2. **Update your local .env file** with the RDS connection string:
   ```
   DATABASE_URL=postgresql://clinicease_admin:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/clinicease
   ```

3. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed database (optional)**:
   ```bash
   npx prisma db seed
   ```

## Step 11: Verify Deployment

1. **Check ECS service status**:
   ```bash
   aws ecs describe-services --cluster clinicease-cluster --services clinicease-service
   ```

2. **Check CloudWatch logs**:
   ```bash
   aws logs describe-log-streams --log-group-name /ecs/clinicease-app
   ```

3. **Access your application**:
   - Navigate to your ALB DNS name or custom domain
   - Verify the landing page loads correctly

## Step 12: Post-Deployment Configuration

1. **Create admin user**:
   - Register a new user through the application
   - Update the user's role to ADMIN in the database:
     ```sql
     UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin-email@example.com';
     ```

2. **Configure monitoring**:
   - Set up CloudWatch alarms for CPU/memory usage
   - Configure notifications for critical events

3. **Test all functionality**:
   - User registration and login
   - Appointment creation
   - Messaging system
   - Billing features
   - Profile management

## Troubleshooting Common Issues

### Application Won't Start
1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/clinicease-app --follow
   ```

2. Verify environment variables are correctly configured in Secrets Manager

3. Check database connectivity:
   ```bash
   telnet YOUR_RDS_ENDPOINT 5432
   ```

### Database Connection Issues
1. Verify security group rules allow traffic on port 5432
2. Check that the RDS instance is in a public subnet or has proper VPC configuration
3. Confirm the DATABASE_URL format is correct

### Load Balancer Health Checks Failing
1. Check that the container is listening on port 3000
2. Verify the health check path is accessible
3. Confirm security groups allow traffic from the ALB

### SSL/HTTPS Issues
1. Ensure the certificate is issued and not expired
2. Verify the listener is configured for port 443
3. Check that DNS records point to the correct ALB

## Scaling and Maintenance

### Horizontal Scaling
1. Increase desired count:
   ```bash
   aws ecs update-service --cluster clinicease-cluster --service clinicease-service --desired-count 2
   ```

### Vertical Scaling
1. Update task definition with higher CPU/memory values
2. Deregister old task definition
3. Update service to use new task definition

### Updates and Deployments
1. Build and push new Docker image with updated tag
2. Update task definition with new image tag
3. Update service to use new task definition:
   ```bash
   aws ecs update-service --cluster clinicease-cluster --service clinicease-service --task-definition clinicease-app:2
   ```

## Cost Management

### Monitor Costs
1. Use AWS Cost Explorer to track spending
2. Set up billing alerts for unexpected charges
3. Review resource utilization regularly

### Optimize Resources
1. Right-size EC2 instances based on actual usage
2. Use reserved instances for steady workloads
3. Enable auto-scaling to adjust resources based on demand

---

Following these steps will deploy ClinicEase AI to AWS with a production-ready configuration. Adjust the settings based on your specific requirements for security, performance, and cost.