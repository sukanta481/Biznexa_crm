<?php

/*
|--------------------------------------------------------------------------
| WhatsApp API Configuration
|--------------------------------------------------------------------------
|
| Add this to your config/services.php file under the 'whatsapp' key
|
*/

return [
    // ... other services ...

    'whatsapp' => [
        'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
        'api_version' => env('WHATSAPP_API_VERSION', 'v18.0'),
    ],
];

/*
|--------------------------------------------------------------------------
| Environment Variables (add to .env)
|--------------------------------------------------------------------------
|
| WHATSAPP_VERIFY_TOKEN=your_secure_verify_token_here
| WHATSAPP_ACCESS_TOKEN=your_meta_access_token
| WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
| WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
| WHATSAPP_API_VERSION=v18.0
|
*/
