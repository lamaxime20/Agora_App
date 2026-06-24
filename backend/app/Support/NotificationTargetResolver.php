<?php

namespace App\Support;

use App\Enums\NotificationType;

class NotificationTargetResolver
{
    private const ROLE_DIRECTEUR   = 'directeur';
    private const ROLE_STOCK_MGR   = 'manager_gestion_stock';
    private const ROLE_STOCK_EMP   = 'employe_gestion_stock';
    private const ROLE_VENTE_MGR   = 'manager_vente';
    private const ROLE_VENTE_EMP   = 'employe_vente';
    private const ROLE_FINANCE_MGR = 'manager_finances';
    private const ROLE_FINANCE_EMP = 'employe_finances';
    private const ROLE_LIVR_MGR    = 'manager_livraison';
    private const ROLE_LIVR_EMP    = 'employe_livraison';
    private const ROLE_RH_MGR      = 'manager_rh';
    private const ROLE_RH_EMP      = 'employe_rh';

    /**
     * Return the role names that should receive a given notification type.
     *
     * Returns null when targeting is handled by the caller (e.g., a specific livreur).
     */
    public static function rolesFor(NotificationType $type): ?array
    {
        return match ($type) {
            NotificationType::STOCK_LOSS         => [self::ROLE_DIRECTEUR],
            NotificationType::STOCK_LOW          => [self::ROLE_DIRECTEUR, self::ROLE_STOCK_MGR],
            NotificationType::STOCK_OUT          => [self::ROLE_DIRECTEUR, self::ROLE_STOCK_MGR, self::ROLE_STOCK_EMP],
            NotificationType::RESTOCK_REQUESTED  => [self::ROLE_DIRECTEUR],
            NotificationType::RESTOCK_APPROVED   => [self::ROLE_STOCK_MGR, self::ROLE_STOCK_EMP],
            NotificationType::RESTOCK_REJECTED   => [self::ROLE_STOCK_MGR, self::ROLE_STOCK_EMP],
            NotificationType::RESTOCK_COMPLETED  => [self::ROLE_DIRECTEUR, self::ROLE_STOCK_MGR],

            NotificationType::ORDER_CREATED      => [self::ROLE_FINANCE_MGR, self::ROLE_FINANCE_EMP],
            NotificationType::ORDER_CANCELLED    => [self::ROLE_FINANCE_MGR, self::ROLE_FINANCE_EMP],
            NotificationType::ORDER_VALIDATED    => [self::ROLE_VENTE_MGR, self::ROLE_VENTE_EMP],

            NotificationType::DELIVERY_CREATED   => null, // specific livreur — caller handles it
            NotificationType::DELIVERY_STARTED   => [self::ROLE_VENTE_MGR, self::ROLE_VENTE_EMP],
            NotificationType::DELIVERY_COMPLETED => [self::ROLE_VENTE_MGR, self::ROLE_VENTE_EMP, self::ROLE_FINANCE_MGR, self::ROLE_FINANCE_EMP, self::ROLE_STOCK_MGR, self::ROLE_STOCK_EMP],
            NotificationType::DELIVERY_FAILED    => [self::ROLE_DIRECTEUR, self::ROLE_VENTE_MGR, self::ROLE_VENTE_EMP],
            NotificationType::DELIVERY_RETURNED  => [self::ROLE_DIRECTEUR, self::ROLE_VENTE_MGR, self::ROLE_VENTE_EMP, self::ROLE_STOCK_MGR, self::ROLE_STOCK_EMP],
            NotificationType::DELIVERY_CANCELLED => [self::ROLE_VENTE_MGR, self::ROLE_VENTE_EMP],

            NotificationType::PAYMENT_RECEIVED   => [self::ROLE_DIRECTEUR, self::ROLE_FINANCE_MGR],
            NotificationType::PAYMENT_VALIDATED  => [self::ROLE_DIRECTEUR, self::ROLE_FINANCE_MGR],

            NotificationType::TASK_ASSIGNED      => null, // specific user — caller handles it
            NotificationType::TASK_UPDATED       => null,
            NotificationType::TASK_COMPLETED     => null,
            NotificationType::TASK_CANCELLED     => null,

            NotificationType::INVITATION         => null,
            NotificationType::INVITATION_ACCEPTED => null,
            NotificationType::INVITATION_REFUSED  => null,

            NotificationType::EVENT_CREATED      => null,
            NotificationType::EVENT_UPDATED      => null,
        };
    }
}
