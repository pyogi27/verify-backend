# Postman Collection Setup Guide

## Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the file `Verify-Backend-APIs.postman_collection.json` for main APIs
4. Select the file `Service-Addition-API.postman_collection.json` for service addition APIs
5. Select the file `Service-Update-API.postman_collection.json` for service update APIs
6. Select the file `Verification-Generation-API.postman_collection.json` for verification generation APIs
7. Select the file `Verification-API.postman_collection.json` for verification APIs
8. Select the file `Resend-Verification-API.postman_collection.json` for resend verification APIs
9. The collections will be imported with all the APIs

## Collection Variables

The collections use the following variables that you need to set:

### 1. baseUrl
- **Value**: `http://localhost:3000`
- **Description**: Base URL of your API server

### 2. applicationCode
- **Value**: Application ID from the registration response
- **Description**: Used for key rotation, service addition, service update, verification generation, verification, and resend verification APIs

### 3. apiKey
- **Value**: API key from the registration response
- **Description**: Used for authentication in key rotation, service addition, service update, verification generation, verification, and resend verification

### 4. apiSecret
- **Value**: API secret from the registration response
- **Description**: Used for authentication in key rotation, service addition, service update, verification generation, verification, and resend verification

### 5. requestId
- **Value**: Request ID from verification generation response
- **Description**: Used for verification and resend verification API calls

### 6. token
- **Value**: Token from verification generation response
- **Description**: Used for verification API calls

## How to Set Variables

### Method 1: Collection Variables
1. Right-click on the collection
2. Select "Edit"
3. Go to "Variables" tab
4. Set the values for each variable

### Method 2: Environment Variables (Recommended)
1. Create a new environment
2. Add the variables with their values
3. Select the environment before running requests

## Testing Flow

### Step 1: Health Check
1. Run the "Health Check" request
2. Should return: `{"status":"OK","timestamp":"..."}`

### Step 2: Application Registration
1. Run the "Application Registration" request
2. Copy the response values:
   - `applicationCode` from `data[0].applicationCode`
   - `apiKey` from `data[0].applicationKey`
   - `apiSecret` from `data[0].applicationKeySecret`
3. Set these values in your collection variables

### Step 3: Key Rotation
1. Set the variables with values from Step 2
2. Run the "Key Rotation" request
3. The response will contain new API key and secret

### Step 4: Service Addition
1. Set the variables with values from Step 2
2. Run the "Add Services to Application" request
3. Add one or more services to your application

### Step 5: Service Update
1. Set the variables with values from Step 2
2. Run any of the "Update Service" requests
3. Update the configuration of existing services

### Step 6: Verification Generation
1. Set the variables with values from Step 2
2. Run any of the "Generate Verification" requests
3. Generate verification tokens for users
4. Copy the response values:
   - `requestId` from `data[0].requestId`
   - `token` from `data[0].token`
5. Set these values in your collection variables

### Step 7: Verification
1. Set the variables with values from Step 6
2. Run the "Verify Single Token" request
3. Verify the generated tokens

### Step 8: Resend Verification
1. Set the variables with values from Step 6
2. Run the "Resend Single Verification" request
3. Resend verification tokens for existing requests

## Example Responses

### Application Registration Success Response:
```json
{
  "data": [
    {
      "applicationName": "TestApp",
      "applicationCode": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
      "applicationKey": "app_m3o0jeuf8nkpvv8i04zwae",
      "applicationKeySecret": "j01r0pwcnp-x6ezh84c9ed",
      "applicationKeyExpiry": 1782639419,
      "servicesSubscribed": ["authMO"]
    }
  ],
  "responseMessages": [
    {
      "id": "l0q_V1XKebuh5lmqt1APUw",
      "type": "S",
      "text": "Application registered successfully"
    }
  ]
}
```

### Key Rotation Success Response:
```json
{
  "data": [
    {
      "applicationName": "TestApp",
      "applicationCode": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
      "applicationKey": "app_newkey123456789",
      "applicationKeySecret": "newsecret-123456789",
      "applicationKeyExpiry": 1782639419
    }
  ],
  "responseMessages": [
    {
      "type": "S",
      "id": "abc123",
      "text": "API key rotated successfully"
    }
  ],
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Key rotation completed successfully"
    }
  }
}
```

### Service Addition Success Response:
```json
{
  "data": [
    {
      "servicesSubscribed": ["authMO", "authEO"]
    }
  ],
  "responseMessages": [
    {
      "type": "S",
      "id": "abc123",
      "text": "Services added successfully"
    }
  ],
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Service addition completed successfully"
    }
  }
}
```

### Service Update Success Response:
```json
{
  "data": [null],
  "responseMessages": {
    "type": "S",
    "id": "abc123",
    "text": "Service updated successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Service update completed successfully"
    }
  }
}
```

### Verification Generation Success Response:
```json
{
  "data": [
    {
      "userIdentity": "+1234567890",
      "serviceType": "authMO",
      "requestId": "abc123-def456-ghi789",
      "token": "123456"
    }
  ],
  "responseMessages": {
    "type": "S",
    "id": "xyz789",
    "text": "Verification requests generated successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Verification generation completed successfully"
    }
  }
}
```

### Verification Success Response:
```json
{
  "data": [null],
  "responseMessages": {
    "type": "S",
    "id": "ver123",
    "text": "Verification completed successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Verification process completed successfully"
    }
  }
}
```

### Resend Verification Success Response:
```json
{
  "data": [
    {
      "userIdentity": "+1234567890",
      "serviceType": "authMO",
      "requestId": "abc123-def456-ghi789"
    }
  ],
  "responseMessages": {
    "type": "S",
    "id": "resend123",
    "text": "Verification tokens resent successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Resend verification completed successfully"
    }
  }
}
```

## API Endpoints

### Main APIs (Verify-Backend-APIs.postman_collection.json)
- `POST /applications` - Register new application
- `POST /applications/{applicationCode}/rotate-key` - Rotate API keys

### Service Addition APIs (Service-Addition-API.postman_collection.json)
- `POST /applications/{applicationCode}/services` - Add services to existing application

### Service Update APIs (Service-Update-API.postman_collection.json)
- `PUT /applications/{applicationCode}/services/{serviceType}` - Update service configuration

### Verification Generation APIs (Verification-Generation-API.postman_collection.json)
- `POST /applications/{applicationCode}/generate-verification` - Generate verification requests for users

### Verification APIs (Verification-API.postman_collection.json)
- `POST /applications/{applicationCode}/verify` - Verify tokens for authentication/verification requests

### Resend Verification APIs (Resend-Verification-API.postman_collection.json)
- `POST /applications/{applicationCode}/resend-verification` - Resend verification tokens for existing requests

## Service Types Available

The following service types can be added, updated, and used for verification generation:
- `authMO` - Mobile authentication using OTP
- `authEO` - Email authentication using OTP
- `verifyMO` - Mobile verification using OTP
- `verifyEO` - Email verification using OTP
- `verifyEL` - Email verification using link

## Troubleshooting

### Common Issues:

1. **Connection Refused**: Make sure your NestJS server is running on port 3000
2. **Unauthorized (401)**: Check that you're using the correct API key and secret
3. **Forbidden (403)**: Verify the application is active and not expired
4. **Not Found (404)**: Ensure the applicationCode is correct
5. **Conflict (409)**: Service already exists for the application or active verification request already exists
6. **Bad Request (400)**: Check the request payload format and validation

### Testing with Existing Applications:

If you want to test with existing applications, use these credentials:

**SecureApp:**
- Application Code: `c6b748e7-beea-425a-aeb5-703de16d8dc0`
- API Key: `app_m3o0jeuf8nkpvv8i04zwae`
- API Secret: `j01r0pwcnp-x6ezh84c9ed`

**ALM:**
- Application Code: `f5e5c2c4-07a0-41a0-84cd-d31bb87e81d9`
- API Key: `app_sdq0pwv7edl9d1y2bk2ysh`
- API Secret: `r3744sumhnn-9y8w7p37hmf`

## Service Update API Details

### Request Format:
```json
{
  "data": [
    {
      "verificationLinkRoute": "string", // Optional, only for verifyEL
      "successCallback": {
        "callbackUrl": "string",
        "callbackMethod": "POST",
        "payload": {}
      },
      "errorCallback": {
        "callbackUrl": "string",
        "callbackMethod": "string",
        "payload": "string"
      },
      "verificationConfig": {
        "maxResendCount": 3,
        "maxAttemptCount": 3,
        "tokenLength": 6,
        "tokenPattern": "N",
        "expiryTime": 10000
      }
    }
  ]
}
```

### Response Format:
```json
{
  "data": [null],
  "responseMessages": {
    "type": "S",
    "id": "string",
    "text": "string"
  },
  "messages": {
    "resourceId": "string",
    "fieldMessages": [
      {
        "type": "string",
        "id": "string",
        "text": "string"
      }
    ],
    "resourceMessages": {
      "type": "string",
      "text": "string"
    }
  }
}
```

## Verification Generation API Details

### Request Format:
```json
{
  "data": [
    {
      "serviceType": "authMO",
      "userIdentity": "+1234567890"
    }
  ]
}
```

### Response Format:
```json
{
  "data": [
    {
      "userIdentity": "+1234567890",
      "serviceType": "authMO",
      "requestId": "abc123-def456-ghi789",
      "token": "123456"
    }
  ],
  "responseMessages": {
    "type": "S",
    "id": "xyz789",
    "text": "Verification requests generated successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Verification generation completed successfully"
    }
  }
}
```

## Verification API Details

### Request Format:
```json
{
  "data": [
    {
      "requestId": "abc123-def456-ghi789",
      "token": "123456"
    }
  ]
}
```

### Response Format:
```json
{
  "data": [null],
  "responseMessages": {
    "type": "S",
    "id": "ver123",
    "text": "Verification completed successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Verification process completed successfully"
    }
  }
}
```

### Error Responses:

**400 Bad Request (Invalid Token):**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err123",
    "text": "Invalid token provided: abc123-def456-ghi789"
  }
}
```

**400 Bad Request (Expired Request):**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err124",
    "text": "Verification request expired: abc123-def456-ghi789"
  }
}
```

**404 Not Found:**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err125",
    "text": "Verification request not found: invalid-request-id"
  }
}
```

**409 Conflict (Already Verified):**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err126",
    "text": "Verification request already verified: abc123-def456-ghi789"
  }
}
```

## Resend Verification API Details

### Request Format:
```json
{
  "data": [
    {
      "requestId": "abc123-def456-ghi789"
    }
  ]
}
```

### Response Format:
```json
{
  "data": [
    {
      "userIdentity": "+1234567890",
      "serviceType": "authMO",
      "requestId": "abc123-def456-ghi789"
    }
  ],
  "responseMessages": {
    "type": "S",
    "id": "resend123",
    "text": "Verification tokens resent successfully"
  },
  "messages": {
    "resourceId": "c6b748e7-beea-425a-aeb5-703de16d8dc0",
    "fieldMessages": [],
    "resourceMessages": {
      "type": "S",
      "text": "Resend verification completed successfully"
    }
  }
}
```

### Error Responses:

**400 Bad Request (Request Expired):**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err127",
    "text": "Verification request expired: abc123-def456-ghi789"
  }
}
```

**400 Bad Request (Max Resend Attempts Exceeded):**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err128",
    "text": "Maximum resend attempts exceeded: abc123-def456-ghi789"
  }
}
```

**404 Not Found:**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err129",
    "text": "Verification request not found: invalid-request-id"
  }
}
```

**409 Conflict (Already Verified):**
```json
{
  "data": [null],
  "responseMessages": {
    "type": "E",
    "id": "err130",
    "text": "Verification request already verified: abc123-def456-ghi789"
  }
}
```