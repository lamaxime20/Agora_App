<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => 'string',
            'email_verified_at' => 'datetime',
        ];
    }

    public function clients()
    {
        return $this->hasMany(Client::class, 'commercial_id');
    }

    public function sessions()
    {
        return $this->hasMany(Session::class, 'user_id');
    }

    public function visites()
    {
        return $this->hasMany(VisiteClient::class, 'utilisateur_id');
    }

    public function facturesValidees()
    {
        return $this->hasMany(Facture::class, 'validee_par');
    }
}
