<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Here you may specify a list of origins that should be allowed to make
    | requests to your application. The special value of "*" will allow
    | all origins to access the application.
    |
    */

    'allowed_origins' => [
        'http://localhost:5173', 
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed HTTP Methods
    |--------------------------------------------------------------------------
    |
    | This setting determines which HTTP methods are allowed for cross-origin
    | requests. You can either allow all methods or specify a list of methods.
    |
    */

    'allowed_methods' => ['*'], 

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    |
    | Specify the allowed headers that can be included in the request.
    | You can use "*" to allow all headers.
    |
    */

    'allowed_headers' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    |
    | You can specify which headers are allowed to be exposed to the browser.
    |
    */

    'exposed_headers' => [],

    /*
    |--------------------------------------------------------------------------
    | Max Age
    |--------------------------------------------------------------------------
    |
    | This setting defines the maximum time (in seconds) that the results of a
    | preflight request can be cached by the browser.
    |
    */

    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    |
    | If your application needs to include credentials (such as cookies) with
    | requests, set this option to true. If not, it should be false.
    |
    */

    'supports_credentials' => true,
];
