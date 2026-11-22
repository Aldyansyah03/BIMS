<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    public string $token;
    public string $verificationUrl;
    public string $recipientName;

    public function __construct(string $token, string $email, string $recipientName = 'Pengguna BIMS', ?string $frontendUrl = null)
    {
        $this->token = $token;
        $this->recipientName = $recipientName;
        $base = self::resolveFrontendUrl($frontendUrl);
        $this->verificationUrl = "{$base}/verify-email?token={$token}&email=" . urlencode($email);
    }

    public static function resolveFrontendUrl(?string $customUrl = null): string
    {
        if (!empty($customUrl)) {
            return rtrim($customUrl, '/');
        }

        $envUrl = env('FRONTEND_URL');
        if (!empty($envUrl) && $envUrl !== 'http://localhost:5173') {
            return rtrim($envUrl, '/');
        }

        if (request() && !app()->environment('testing')) {
            $origin = request()->header('Origin') ?: request()->header('Referer');
            if (!empty($origin)) {
                $parsed = parse_url($origin);
                if (!empty($parsed['scheme']) && !empty($parsed['host'])) {
                    $port = !empty($parsed['port']) ? ':' . $parsed['port'] : '';
                    return "{$parsed['scheme']}://{$parsed['host']}{$port}";
                }
            }
        }

        if (app()->environment('production') || env('VERCEL') || !empty($_SERVER['VERCEL'])) {
            return 'https://bims-lms.vercel.app';
        }

        return !empty($envUrl) ? rtrim($envUrl, '/') : 'http://localhost:5173';
    }

    public function via(object $notifiable): array
    {
        // Gunakan mail channel jika MAIL_MAILER disetup, fallback ke database/log
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = !empty($notifiable->name) ? $notifiable->name : $this->recipientName;

        return (new MailMessage)
            ->subject('Verifikasi Alamat Email Akun BIMS Anda')
            ->greeting("Halo, {$name}!")
            ->line('Terima kasih telah mendaftar di BIMS (Bimbel Management System).')
            ->line('Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda sebelum melanjutkan ke tahap pembayaran:')
            ->action('Verifikasi Email Saya', $this->verificationUrl)
            ->line('Tautan verifikasi ini berlaku selama 24 jam.')
            ->line('Jika Anda tidak merasa mendaftar di BIMS, abaikan email ini.')
            ->salutation('Salam hormat, Tim BIMS');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'token' => $this->token,
            'verification_url' => $this->verificationUrl,
        ];
    }
}
