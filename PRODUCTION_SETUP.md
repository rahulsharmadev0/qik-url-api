# Production Deployment Guide

## Environment Configuration Setup

Your application now supports smart environment-based configuration:

### 🛠️ Environment Files

- **Development**: `.env` (for local development)
- **Production**: `.env.production` (for production deployment)  
- **Testing**: Uses `test/setupEnv.js` (no .env file needed)

### 🚀 How It Works

The application automatically detects the environment using `NODE_ENV` and loads the appropriate configuration:

```bash
# Development (loads .env)
NODE_ENV=development npm run dev

# Production (loads .env.production)  
NODE_ENV=production npm run start
```

### 📋 Production Setup Checklist

#### 1. Firebase Service Account
For production, you need to set up Firebase service account credentials. Choose one of these options:

**Option A: Service Account File**
1. Download your Firebase service account key JSON file from Firebase Console
2. Place it in a secure location (not in your repo!)
3. Set the path in your `.env.production`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json
   ```

**Option B: Environment Variable**
1. Convert your service account JSON to a single-line string
2. Set it in your `.env.production`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
   ```

**Option C: Application Default Credentials** (for cloud deployments)
- If deploying to Google Cloud, App Engine, or Cloud Run, the application will automatically use ADC

#### 2. Redis Configuration
Your production Redis (Redis Cloud) is already configured in `.env.production`. Verify these values:
- `REDIS_HOST`: Your Redis Cloud endpoint
- `REDIS_PASSWORD`: Your Redis Cloud password
- `REDIS_USERNAME`: Usually 'default' for Redis Cloud
- `REDIS_PORT`: Your Redis Cloud port

#### 3. Environment Variables Validation
The application validates required environment variables on startup:
- `PORT`
- `REDIS_HOST` 
- `FIREBASE_PROJECT_ID`

### 🗂️ File Structure
```
qik_url/
├── .env                    # Development environment
├── .env.production        # Production environment  
├── src/
│   ├── config/
│   │   ├── env.js         # Smart environment loader
│   │   ├── firebase.js    # Firebase config with production support
│   │   └── redis.js       # Redis config with environment detection
│   └── server.js          # Updated to use smart config
```

### 📝 Available Scripts
- `npm run dev` - Development with file watching
- `npm run start` - Production mode
- `npm run start:prod` - Explicit production mode
- `npm run start:dev` - Explicit development mode

### 🔒 Security Notes
1. Never commit `.env.production` to version control if it contains real secrets
2. Use environment variables or secure secret management in production
3. The current `.env.production` should be updated with your real production values
4. Consider using services like HashiCorp Vault, AWS Secrets Manager, etc. for production secrets

### 🚨 Important Files to Secure
- Firebase service account key file
- `.env.production` (if containing real secrets)

### ✅ Testing Your Setup
1. Test development: `npm run dev`
2. Test production: `npm run start:prod` 
3. Check the console output for environment detection and service connections

The application will clearly show which environment it's running in and which services it's connected to.
