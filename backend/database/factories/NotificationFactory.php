<?php

namespace Database\Factories;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'type'     => 'ORDER_CREATED',
            'title'    => 'Nouvelle commande enregistrée',
            'message'  => 'Une nouvelle commande vient d\'être enregistrée.',
            'priority' => 'medium',
            'data'     => null,
            'read_at'  => null,
            'archived_at' => null,
        ];
    }
}
