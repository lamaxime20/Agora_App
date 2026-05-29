<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Origines autorisées
    |--------------------------------------------------------------------------
    | Ajoutez ici l'URL du frontend (dev et/ou production).
    | Ne jamais mettre '*' avec supports_credentials = true.
    |
    | Exemples :
    |   'http://localhost:5173'   → Vite dev server
    |   'https://app.example.com' → Production
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env(
            'CORS_ALLOWED_ORIGINS',
            'http://localhost:5173,http://127.0.0.1:5173,https://agora-app-rouge.vercel.app,https://agora-app-1.onrender.com'
        ))
    ))),

    'allowed_origins_patterns' => [
        '#^https:\/\/.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Credentials (cookies)
    |--------------------------------------------------------------------------
    | Doit être true pour que les cookies HttpOnly (tokenAuth,
    | tokenAuthorization) soient envoyés et acceptés cross-origin.
    */

    'supports_credentials' => true,

];
