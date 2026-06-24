<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
 * Canal privé pour les notifications temps réel.
 * Le canal est au format: private-notifications.{userId}.{companyId}.{roleId}
 * L'authentification du canal vérifie que le user du token correspond au userId du canal.
 */
Broadcast::channel('notifications.{userId}.{companyId}.{roleId}', function ($user, $userId, $companyId, $roleId) {
    return $user !== null && (string) $user->id === (string) $userId;
});
