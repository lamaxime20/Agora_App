<?php

namespace App\Support;

use App\Enums\NotificationType;
use App\Events\NotificationBroadcast;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Notify all users in the company that hold one of the given roles.
     */
    public function createForRoles(
        NotificationType $type,
        string $companyId,
        string $title,
        string $message,
        string $priority = 'medium',
        array $data = [],
        array $roleNames = []
    ): void {
        if (empty($roleNames)) {
            return;
        }

        try {
            $targets = DB::table('appartenir_entreprise as ae')
                ->join('roles_utilisateur as ru', 'ru.id', '=', 'ae.role_utilisateur_id')
                ->where('ae.entreprise_id', $companyId)
                ->where('ae.statut', 'actif')
                ->whereIn('ru.role', $roleNames)
                ->select(['ae.utilisateur_id as user_id', 'ae.role_utilisateur_id as role_id'])
                ->get();

            foreach ($targets as $target) {
                $this->createOne($type, $target->user_id, $companyId, $target->role_id, $title, $message, $priority, $data);
            }
        } catch (\Throwable $e) {
            Log::error('NotificationService::createForRoles failed', [
                'type'       => $type->value,
                'company_id' => $companyId,
                'message'    => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify a single specific user (e.g., assigned livreur, task assignee).
     */
    public function createForUser(
        NotificationType $type,
        string $userId,
        string $companyId,
        string $roleId,
        string $title,
        string $message,
        string $priority = 'medium',
        array $data = []
    ): void {
        try {
            $this->createOne($type, $userId, $companyId, $roleId, $title, $message, $priority, $data);
        } catch (\Throwable $e) {
            Log::error('NotificationService::createForUser failed', [
                'type'       => $type->value,
                'user_id'    => $userId,
                'company_id' => $companyId,
                'message'    => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify all users in the company that this notification type targets.
     * Resolves targets automatically via NotificationTargetResolver.
     */
    public function notifyByType(
        NotificationType $type,
        string $companyId,
        string $title,
        string $message,
        string $priority = 'medium',
        array $data = []
    ): void {
        $roles = NotificationTargetResolver::rolesFor($type);

        if ($roles === null) {
            return;
        }

        $this->createForRoles($type, $companyId, $title, $message, $priority, $data, $roles);
    }

    private function createOne(
        NotificationType $type,
        string $userId,
        string $companyId,
        string $roleId,
        string $title,
        string $message,
        string $priority,
        array $data
    ): void {
        $notification = Notification::create([
            'user_id'    => $userId,
            'company_id' => $companyId,
            'role_id'    => $roleId,
            'type'       => $type->value,
            'title'      => $title,
            'message'    => $message,
            'priority'   => $priority,
            'data'       => empty($data) ? null : $data,
        ]);

        broadcast(new NotificationBroadcast($notification))->toOthers();
    }
}
