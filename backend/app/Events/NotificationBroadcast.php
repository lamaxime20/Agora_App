<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Notification $notification) {}

    public function broadcastOn(): PrivateChannel
    {
        $n = $this->notification;

        return new PrivateChannel(
            "notifications.{$n->user_id}.{$n->company_id}.{$n->role_id}"
        );
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        $n = $this->notification;

        return [
            'id'         => $n->id,
            'type'       => $n->type,
            'title'      => $n->title,
            'message'    => $n->message,
            'priority'   => $n->priority,
            'data'       => $n->data,
            'created_at' => $n->created_at?->toIso8601String(),
        ];
    }
}
