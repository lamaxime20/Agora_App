<?php

namespace App\Enums;

enum NotificationType: string
{
    // Invitations
    case INVITATION             = 'INVITATION';
    case INVITATION_ACCEPTED    = 'INVITATION_ACCEPTED';
    case INVITATION_REFUSED     = 'INVITATION_REFUSED';

    // Tâches
    case TASK_ASSIGNED          = 'TASK_ASSIGNED';
    case TASK_UPDATED           = 'TASK_UPDATED';
    case TASK_COMPLETED         = 'TASK_COMPLETED';
    case TASK_CANCELLED         = 'TASK_CANCELLED';

    // Stock
    case STOCK_LOW              = 'STOCK_LOW';
    case STOCK_OUT              = 'STOCK_OUT';
    case STOCK_LOSS             = 'STOCK_LOSS';
    case RESTOCK_REQUESTED      = 'RESTOCK_REQUESTED';
    case RESTOCK_APPROVED       = 'RESTOCK_APPROVED';
    case RESTOCK_REJECTED       = 'RESTOCK_REJECTED';
    case RESTOCK_COMPLETED      = 'RESTOCK_COMPLETED';

    // Commandes
    case ORDER_CREATED          = 'ORDER_CREATED';
    case ORDER_VALIDATED        = 'ORDER_VALIDATED';
    case ORDER_CANCELLED        = 'ORDER_CANCELLED';

    // Paiements
    case PAYMENT_RECEIVED       = 'PAYMENT_RECEIVED';
    case PAYMENT_VALIDATED      = 'PAYMENT_VALIDATED';

    // Livraisons
    case DELIVERY_CREATED       = 'DELIVERY_CREATED';
    case DELIVERY_STARTED       = 'DELIVERY_STARTED';
    case DELIVERY_COMPLETED     = 'DELIVERY_COMPLETED';
    case DELIVERY_FAILED        = 'DELIVERY_FAILED';
    case DELIVERY_RETURNED      = 'DELIVERY_RETURNED';
    case DELIVERY_CANCELLED     = 'DELIVERY_CANCELLED';

    // Événements
    case EVENT_CREATED          = 'EVENT_CREATED';
    case EVENT_UPDATED          = 'EVENT_UPDATED';
}
