<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BrevoMailer
{
    private string $apiKey;
    private string $baseUrl;
    private string $senderName;
    private string $senderEmail;

    public function __construct()
    {
        $this->apiKey      = env('BREVO_API_KEY', '');
        $this->baseUrl     = env('BREVO_BASE_URL', 'https://api.brevo.com/v3/smtp/email');
        $this->senderName  = env('BREVO_SENDER_NAME', 'AGORA');
        $this->senderEmail = env('BREVO_SENDER_EMAIL', '');
    }

    public function sendOtpEmail(string $recipientEmail, string $recipientName, string $code): bool
    {
        return $this->send([
            'sender'      => ['name' => $this->senderName, 'email' => $this->senderEmail],
            'to'          => [['email' => $recipientEmail, 'name' => $recipientName]],
            'subject'     => 'Votre code de vérification AGORA',
            'htmlContent' => $this->otpTemplate($recipientName, $code),
        ]);
    }

    public function sendPasswordResetEmail(string $recipientEmail, string $recipientName, string $code): bool
    {
        return $this->send([
            'sender'      => ['name' => $this->senderName, 'email' => $this->senderEmail],
            'to'          => [['email' => $recipientEmail, 'name' => $recipientName]],
            'subject'     => 'Réinitialisation de votre mot de passe AGORA',
            'htmlContent' => $this->resetTemplate($recipientName, $code),
        ]);
    }

    private function send(array $payload): bool
    {
        try {
            $response = Http::withHeaders([
                'api-key'      => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl, $payload);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error('Brevo email error: ' . $e->getMessage());
            return false;
        }
    }

    private function otpTemplate(string $name, string $code): string
    {
        return <<<HTML
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff;border:1px solid #e8e8e8;border-radius:8px;">
            <h2 style="color:#1a1a1a;margin-bottom:8px;">Vérification de votre adresse e-mail</h2>
            <p style="color:#555;margin-bottom:24px;">Bonjour {$name}, voici votre code de vérification :</p>
            <div style="background:#f5f5f5;border-radius:6px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:700;color:#1a1a1a;">{$code}</div>
            <p style="color:#888;font-size:13px;margin-top:24px;">Ce code est valable pendant <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
        </div>
        HTML;
    }

    private function resetTemplate(string $name, string $code): string
    {
        return <<<HTML
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff;border:1px solid #e8e8e8;border-radius:8px;">
            <h2 style="color:#1a1a1a;margin-bottom:8px;">Réinitialisation de mot de passe</h2>
            <p style="color:#555;margin-bottom:24px;">Bonjour {$name}, voici votre code de réinitialisation :</p>
            <div style="background:#f5f5f5;border-radius:6px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:700;color:#1a1a1a;">{$code}</div>
            <p style="color:#888;font-size:13px;margin-top:24px;">Ce code est valable pendant <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.</p>
        </div>
        HTML;
    }
}
