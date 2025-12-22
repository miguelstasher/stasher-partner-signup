# Create Affiliate Lambda Function

This Lambda function handles affiliate creation and management via the Tapfiliate API.

## Functionality

This function supports three modes:

1. **create_affiliate_only** - Creates an affiliate account (after Page 3)
2. **finalize_affiliate** - Finalizes affiliate info and enrolls in program (after last page)
3. **update_custom_fields** - Updates custom fields only (after Page 4)
4. **Legacy mode** - Creates affiliate and enrolls in one step (default behavior)

## Environment Variables

- `TAPFILIATE_API_KEY` - Your Tapfiliate API key (required)

## Deployment

This function is deployed as part of AWS Amplify. Set the environment variable in the Amplify Console under Environment variables.

## API Endpoint

The function is accessible via API Gateway at `/api/create-affiliate` (when configured via Amplify CLI) or via a custom API Gateway endpoint.

## Request Format

POST request with JSON body containing affiliate data. See the main function code for details on required fields for each mode.

## Response Format

JSON response with:
- `success`: boolean
- `affiliate_id`: ID of created/updated affiliate
- `program`: Program enrollment details (for finalize mode)
- `error`: Error message if something went wrong



