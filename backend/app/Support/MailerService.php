<?php

namespace App\Support;

use App\Mail\PasswordResetMail;
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailerService
{
    private BrevoMailer $brevoMailer;

    public function __construct()
    {
        $this->brevoMailer = new BrevoMailer();
    }

    public function sendOtpEmail(string $recipientEmail, string $recipientName, string $code): bool
    {
        try {
            // Try sending with default mailer (SMTP)
            Mail::to($recipientEmail)->send(new OtpMail($recipientName, $code));
            return true;
        } catch (\Throwable $e) {
            Log::error('SMTP mail error: ' . $e->getMessage());

            // SMTP failed, send notification via Brevo
            $this->sendSmtpDownNotification($e->getMessage());

            // Fallback to Brevo
            return $this->brevoMailer->sendOtpEmail($recipientEmail, $recipientName, $code);
        }
    }

    public function sendPasswordResetEmail(string $recipientEmail, string $recipientName, string $code): bool
    {
        try {
            // Try sending with default mailer (SMTP)
            Mail::to($recipientEmail)->send(new PasswordResetMail($recipientName, $code));
            return true;
        } catch (\Throwable $e) {
            Log::error('SMTP mail error: ' . $e->getMessage());

            // SMTP failed, send notification via Brevo
            $this->sendSmtpDownNotification($e->getMessage());

            // Fallback to Brevo
            return $this->brevoMailer->sendPasswordResetEmail($recipientEmail, $recipientName, $code);
        }
    }

    private function sendSmtpDownNotification(string $errorMessage): void
    {
        $adminEmail = env('ADMIN_EMAIL');
        if (!$adminEmail) {
            Log::warning('ADMIN_EMAIL not set. Cannot send SMTP down notification.');
            return;
        }

        $appName = env('APP_NAME', 'Agora');
        $subject = "Alerte : Le service SMTP de {$appName} est en panne";
        $htmlContent = <<<HTML
        <div style="font-family:sans-serif;padding:16px;">
            <h2>Alerte de service de messagerie</h2>
            <p>Le système d'envoi d'e-mails SMTP pour l'application <strong>{$appName}</strong> a échoué. Le système a basculé sur Brevo.</p>
            <p><strong>Message d'erreur :</strong></p>
            <pre style="background-color:#f5f5f5;padding:10px;border-radius:4px;">{$errorMessage}</pre>
            <p>Veuillez vérifier la configuration de votre serveur SMTP.</p>
        </div>
        HTML;

        $payload = [
            'sender'      => ['name' => $this->brevoMailer->getSenderName(), 'email' => $this->brevoMailer->getSenderEmail()],
            'to'          => [['email' => $adminEmail, 'name' => 'Administrateur']],
            'subject'     => $subject,
            'htmlContent' => $htmlContent,
        ];

        $this->brevoMailer->send($payload);
    }
}