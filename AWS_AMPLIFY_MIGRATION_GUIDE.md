# AWS Amplify Migration Guide

## What Changed?

This guide explains what was removed, what was added, and why each change was needed when migrating from Netlify to AWS Amplify.

---

## What Was Removed

### 1. **Netlify Configuration File** (`netlify.toml`)
   - **What it was:** A configuration file that told Netlify how to build and deploy your site
   - **Why removed:** AWS Amplify uses a different configuration file (`amplify.yml`) instead
   - **Impact:** No impact on functionality - just a different way to configure deployment

### 2. **Netlify Functions Directory** (`netlify/functions/create-affiliate.js`)
   - **What it was:** The backend code that handled affiliate sign-ups
   - **Why removed:** The same code was moved to AWS Amplify's Lambda function structure
   - **Impact:** The backend logic is identical - it just lives in a different location now

---

## What Was Added

### 1. **AWS Amplify Lambda Function** (`amplify/backend/function/createAffiliate/src/index.js`)
   - **What it is:** The same backend code, but now structured for AWS Lambda (Amplify's backend service)
   - **Why added:** AWS Amplify uses Lambda functions instead of Netlify functions
   - **What it does:** Exactly the same thing as before - creates affiliates, handles sign-ups, connects to Tapfiliate API
   - **No changes to logic:** All the business logic is identical

### 2. **Amplify Configuration File** (`amplify.yml`)
   - **What it is:** Tells AWS Amplify how to build and deploy your site
   - **Why added:** Replaces `netlify.toml` - this is how AWS Amplify knows what to do
   - **What it does:** Configures the build process (though this is a static site, so it's simple)

### 3. **Lambda Function Configuration Files**
   - **What they are:** Files that tell AWS how to set up the Lambda function
   - **Why added:** AWS needs these to know how to deploy and configure your backend
   - **What they do:** Define environment variables, permissions, and other settings

---

## Frontend Changes

### Updated API Endpoint
- **Before:** `/.netlify/functions/create-affiliate`
- **After:** `/api/create-affiliate`
- **Why:** AWS Amplify uses a different URL pattern for API endpoints
- **Impact:** The frontend now calls the AWS endpoint instead of the Netlify endpoint

---

## How It Works Now

### The Flow (Same as Before)
1. User fills out the sign-up form on your website
2. Frontend sends data to `/api/create-affiliate`
3. AWS Amplify routes this to your Lambda function
4. Lambda function processes the data and talks to Tapfiliate API
5. Response comes back to the frontend
6. User sees success or error message

**Nothing changed in this flow - only the platform changed!**

---

## Setting Up AWS Amplify

### Step 1: Connect GitHub to AWS Amplify
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click "New app" → "Host web app"
3. Choose "GitHub" as your source
4. Authorize AWS to access your GitHub repository
5. Select your repository and branch
6. AWS Amplify will automatically detect `amplify.yml`

### Step 2: Configure Environment Variables
1. In AWS Amplify Console, go to your app
2. Go to "Environment variables"
3. Add: `TAPFILIATE_API_KEY` with your Tapfiliate API key value
4. Save the changes

### Step 3: Set Up API Gateway (Required)
AWS Amplify Hosting doesn't automatically create API endpoints. You need to:

**Option A: Use AWS Amplify CLI (Recommended)**
1. Install AWS Amplify CLI: `npm install -g @aws-amplify/cli`
2. Run: `amplify init`
3. Run: `amplify add api`
4. Choose "REST API"
5. Follow the prompts to connect your Lambda function
6. Deploy: `amplify push`

**Option B: Manual Setup via AWS Console**
1. Go to AWS Lambda Console
2. Create a new function and upload the code from `amplify/backend/function/createAffiliate/src/index.js`
3. Set environment variable `TAPFILIATE_API_KEY`
4. Go to API Gateway Console
5. Create a new REST API
6. Create a POST method pointing to your Lambda function
7. Deploy the API
8. Update `script.js` to use your API Gateway endpoint URL

### Step 4: Deploy
1. AWS Amplify will automatically deploy when you push to GitHub
2. Or click "Redeploy this version" in the Amplify Console

---

## Important Notes

### Environment Variables
- **Where to set:** AWS Amplify Console → Environment variables
- **What to set:** `TAPFILIATE_API_KEY` = your Tapfiliate API key
- **Why needed:** The Lambda function needs this to talk to Tapfiliate

### API Endpoint URL
- If using Amplify CLI: The endpoint will be `/api/create-affiliate`
- If using manual setup: You'll get a URL like `https://xxxxx.execute-api.region.amazonaws.com/prod/create-affiliate`
- Update `script.js` line 71 if you need to use a full URL instead of a relative path

### Testing
- Test the endpoint after deployment
- Check AWS CloudWatch Logs if something doesn't work
- The Lambda function logs everything, so you can see what's happening

---

## Troubleshooting

### "API endpoint not found" error
- **Problem:** The API Gateway isn't set up or the URL is wrong
- **Solution:** Make sure API Gateway is configured and the endpoint URL in `script.js` is correct

### "API key not set" error
- **Problem:** The `TAPFILIATE_API_KEY` environment variable isn't set
- **Solution:** Go to AWS Amplify Console → Environment variables and add it

### Lambda function not working
- **Problem:** The function code might have an error
- **Solution:** Check AWS CloudWatch Logs for error messages

---

## Summary

**What stayed the same:**
- All the backend logic
- All the API endpoints and data flow
- All the business rules
- The frontend code (except the API URL)

**What changed:**
- Platform: Netlify → AWS Amplify
- Backend location: `netlify/functions/` → `amplify/backend/function/`
- Configuration file: `netlify.toml` → `amplify.yml`
- API endpoint URL: `/.netlify/functions/create-affiliate` → `/api/create-affiliate`

**Result:**
Everything works exactly the same, just on a different platform!

---

## Need Help?

- AWS Amplify Documentation: https://docs.amplify.aws
- AWS Lambda Documentation: https://docs.aws.amazon.com/lambda
- Check CloudWatch Logs for detailed error messages



