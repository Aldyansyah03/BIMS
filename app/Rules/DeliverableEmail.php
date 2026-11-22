<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class DeliverableEmail implements ValidationRule
{
    /**
     * Daftar domain email sementara (disposable/throwaway) yang dilarang
     */
    protected array $disposableDomains = [
        'mailinator.com',
        'tempmail.com',
        'temp-mail.org',
        '10minutemail.com',
        'guerrillamail.com',
        'guerrillamailblock.com',
        'sharklasers.com',
        'throwawaymail.com',
        'yopmail.com',
        'trashmail.com',
        'dispostable.com',
        'getairmail.com',
        'fakeinbox.com',
        'burnermail.io',
        'mohmal.com',
        'mytemp.email',
        'crazymailing.com',
        'tempail.com',
    ];

    /**
     * Deteksi kesalahan pengetikan umum pada domain email populer
     */
    protected array $domainTypos = [
        'gmai.com'    => 'gmail.com',
        'gamil.com'   => 'gmail.com',
        'gmial.com'   => 'gmail.com',
        'gmaill.com'  => 'gmail.com',
        'gmaik.com'   => 'gmail.com',
        'gmai.co'     => 'gmail.com',
        'gmaul.com'   => 'gmail.com',
        'yaho.com'    => 'yahoo.com',
        'yahooo.com'  => 'yahoo.com',
        'yaho.co.id'  => 'yahoo.co.id',
        'hotmial.com' => 'hotmail.com',
        'hotmai.com'  => 'hotmail.com',
        'outloo.com'  => 'outlook.com',
        'outlok.com'  => 'outlook.com',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value) || empty(trim($value))) {
            $fail('Alamat email wajib diisi.');
            return;
        }

        $email = trim($value);

        // 1. Validasi Sintaks Standar RFC
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $fail('Format alamat email tidak valid.');
            return;
        }

        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            $fail('Format alamat email tidak valid.');
            return;
        }

        $user = $parts[0];
        $domain = strtolower(trim($parts[1]));

        // Validasi username email (tidak boleh kosong atau karakter aneh berulang)
        if (strlen($user) === 0 || strlen($user) > 64) {
            $fail('Nama pengguna pada alamat email tidak valid.');
            return;
        }

        // 2. Validasi Struktur Domain (Harus memiliki TLD valid minimal 2 huruf)
        if (!str_contains($domain, '.') || preg_match('/\.[a-z]{2,}$/i', $domain) !== 1) {
            $fail('Domain email tidak valid. Pastikan alamat email diakhiri dengan ekstensi yang benar seperti .com, .id, atau .org.');
            return;
        }

        // 3. Deteksi Tipografi Domain Populer (Mencegah salah ketik yang tidak disengaja)
        if (isset($this->domainTypos[$domain])) {
            $suggested = $this->domainTypos[$domain];
            $fail("Domain email '@{$domain}' tampaknya salah ketik. Apakah maksud Anda '@{$suggested}'?");
            return;
        }

        // 4. Deteksi Domain Email Sementara / Disposable
        if (in_array($domain, $this->disposableDomains, true)) {
            $fail('Alamat email sementara (disposable email) tidak diizinkan. Silakan gunakan alamat email aktif Anda.');
            return;
        }

        // 5. Cek Keberadaan Domain & Server Penerima Email (DNS MX & A Record)
        // Di lingkungan test otomatis, izinkan domain mock bawaan Laravel seperti example.com
        $isTestMockDomain = app()->environment('testing') && in_array($domain, ['example.com', 'example.org', 'test.com', 'localhost'], true);

        if (!$isTestMockDomain) {
            $hasMx = @checkdnsrr($domain, 'MX');
            $hasA  = $hasMx ? true : @checkdnsrr($domain, 'A');

            if (!$hasMx && !$hasA) {
                $fail("Domain email '@{$domain}' tidak ditemukan di internet atau tidak dapat menerima email. Pastikan alamat email Anda sudah benar dan aktif.");
                return;
            }
        }
    }
}
