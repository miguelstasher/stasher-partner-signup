# Quick Setup Guide for AWS Amplify

This guide walks you through setting up your site on AWS Amplify step by step.

---

## Step 1: Push Code to GitHub

1. Make sure all your code is committed
2. Push to your GitHub repository
3. Note your repository name and branch (usually `main` or `master`)

---

## Step 2: Connect GitHub to AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Sign in with your AWS account (create one at aws.amazon.com if needed)
3. Click **"New app"** → **"Host web app"**
4. Choose **"GitHub"**
5. Authorize AWS to access your GitHub account
6. Select your repository
7. Select your branch (usually `main`)
8. Click **"Next"**

---

## Step 3: Configure Build Settings

AWS Amplify should automatically detect `amplify.yml`. If not:

1. In the build settings, you should see:
   ```
   version: 1
   frontend:
     phases:
       build:
         commands:
           - echo "No build commands needed"
     artifacts:
       baseDirectory: /
       files:
         - '**/*'
   ```
2. Click **"Next"**
3. Review and click **"Save and deploy"**

---

## Step 4: Set Up the Backend (Lambda Function)

AWS Amplify Hosting only deploys your frontend. You need to set up the backend separately.

### Option A: Using AWS Amplify CLI (Easier)

1. **Install Amplify CLI:**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Initialize Amplify in your project:**
   ```bash
   cd /path/to/your/project
   amplify init
   ```
   - Choose a name for your environment (e.g., `dev`)
   - Choose your editor
   - Choose the type of app: **JavaScript**
   - Choose framework: **None** (this is a static site)
   - Source directory: **.** (current directory)
   - Distribution directory: **.** (current directory)
   - Build command: **npm run-script build** (or leave empty)
   - Start command: **npm run-script start**

3. **Add API:**
   ```bash
   amplify add api
   ```
   - Choose: **REST**
   - Resource name: **createAffiliate** (or any name)
   - Path: **/create-affiliate**
   - Lambda function: **Create new function**
   - Function name: **createAffiliate**
   - Choose runtime: **Node.js 18.x** (or latest)
   - Choose function template: **Serverless ExpressJS function**
   - **OR** choose "Hello World" and replace the code with your function code
   - When asked about editing the function, choose **Yes**
   - Copy the code from `amplify/backend/function/createAffiliate/src/index.js` into the Lambda function

4. **Add environment variable:**
   ```bash
   amplify function update createAffiliate
   ```
   - Choose: **Environment variables configuration**
   - Add: `TAPFILIATE_API_KEY` with your API key value

5. **Deploy:**
   ```bash
   amplify push
   ```
   - This will create the API Gateway and Lambda function
   - Note the API endpoint URL that's displayed

6. **Update frontend:**
   - The API endpoint will be something like: `https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/create-affiliate`
   - Update `script.js` line 71 to use this full URL, OR
   - Configure Amplify to use a custom domain with `/api/create-affiliate` path

### Option B: Manual Setup via AWS Console (More Control)

1. **Create Lambda Function:**
   - Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
   - Click **"Create function"**
   - Choose **"Author from scratch"**
   - Function name: **createAffiliate**
   - Runtime: **Node.js 18.x** (or latest)
   - Click **"Create function"**
   - In the code editor, delete the default code
   - Copy and paste the code from `amplify/backend/function/createAffiliate/src/index.js`
   - Click **"Deploy"**

2. **Set Environment Variable:**
   - In Lambda function page, go to **"Configuration"** tab
   - Click **"Environment variables"**
   - Click **"Edit"**
   - Add: `TAPFILIATE_API_KEY` = your Tapfiliate API key
   - Click **"Save"**

3. **Create API Gateway:**
   - Go to [API Gateway Console](https://console.aws.amazon.com/apigateway)
   - Click **"Create API"**
   - Choose **"REST API"** → **"Build"**
   - Choose **"New API"**
   - API name: **createAffiliateAPI**
   - Click **"Create API"**

4. **Create Resource and Method:**
   - Click **"Actions"** → **"Create Resource"**
   - Resource name: **create-affiliate**
   - Resource path: **create-affiliate**
   - Check **"Enable API Gateway CORS"**
   - Click **"Create Resource"**
   - With the resource selected, click **"Actions"** → **"Create Method"**
   - Choose **"POST"**
   - Integration type: **Lambda Function**
   - Lambda region: Your region
   - Lambda function: **createAffiliate**
   - Click **"Save"** → **"OK"** (to give API Gateway permission)

5. **Enable CORS:**
   - Select the POST method
   - Click **"Actions"** → **"Enable CORS"**
   - Leave defaults and click **"Enable CORS"** → **"Yes, replace existing values"**

6. **Deploy API:**
   - Click **"Actions"** → **"Deploy API"**
   - Deployment stage: **New Stage**
   - Stage name: **prod**
   - Click **"Deploy"**
   - **Copy the Invoke URL** (looks like: `https://xxxxx.execute-api.region.amazonaws.com/prod`)

7. **Update Frontend:**
   - Your full endpoint will be: `https://xxxxx.execute-api.region.amazonaws.com/prod/create-affiliate`
   - Update `script.js` line 71 to use this full URL:
     ```javascript
     const BACKEND_API_URL = 'https://xxxxx.execute-api.region.amazonaws.com/prod/create-affiliate';
     ```
   - Commit and push to GitHub
   - AWS Amplify will automatically redeploy

---

## Step 5: Set Environment Variables in Amplify

1. In AWS Amplify Console, go to your app
2. Go to **"Environment variables"** in the left menu
3. Add: `TAPFILIATE_API_KEY` = your Tapfiliate API key
4. Click **"Save"**

**Note:** This sets it for the frontend build. The Lambda function needs its own environment variable (set in Step 4).

---

## Step 6: Test Your Deployment

1. Wait for Amplify to finish deploying (check the build log)
2. Visit your Amplify app URL (shown in the Amplify Console)
3. Try submitting the affiliate form
4. Check AWS CloudWatch Logs if there are errors:
   - Go to AWS Lambda Console
   - Click on your function
   - Go to **"Monitor"** tab → **"View CloudWatch logs"**

---

## Troubleshooting

### "CORS error" in browser
- Make sure CORS is enabled in API Gateway (Step 4, Option B, step 5)
- Check that the API Gateway endpoint URL is correct

### "API key not set" error
- Make sure you set `TAPFILIATE_API_KEY` in Lambda function environment variables
- Not just in Amplify Console - it needs to be in the Lambda function itself

### "Function not found" error
- Check that the API Gateway is pointing to the correct Lambda function
- Make sure the Lambda function is deployed

### Frontend can't reach API
- If using relative path `/api/create-affiliate`, make sure API Gateway is configured with a custom domain
- Otherwise, use the full API Gateway URL in `script.js`

---

## Next Steps

Once everything is working:
1. Set up a custom domain in Amplify Console (optional)
2. Configure automatic deployments from GitHub
3. Monitor usage in AWS CloudWatch
4. Set up alerts for errors (optional)

---

## Summary

**What you did:**
1. ✅ Connected GitHub to AWS Amplify
2. ✅ Deployed frontend (automatic)
3. ✅ Created Lambda function
4. ✅ Set up API Gateway
5. ✅ Configured environment variables
6. ✅ Updated frontend to use new endpoint

**Result:**
Your site now works on AWS Amplify instead of Netlify, with the exact same functionality!



