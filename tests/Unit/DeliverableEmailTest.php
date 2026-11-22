<?php

namespace Tests\Unit;

use App\Rules\DeliverableEmail;
use Tests\TestCase;

class DeliverableEmailTest extends TestCase
{
    public function test_rejects_empty_and_invalid_syntax()
    {
        $rule = new DeliverableEmail();
        $failed = false;

        $rule->validate('email', 'not-an-email', function ($msg) use (&$failed) {
            $failed = true;
        });
        $this->assertTrue($failed);

        $failed = false;
        $rule->validate('email', 'user@domain_without_tld', function ($msg) use (&$failed) {
            $failed = true;
        });
        $this->assertTrue($failed);
    }

    public function test_detects_common_domain_typos()
    {
        $rule = new DeliverableEmail();
        $message = '';

        $rule->validate('email', 'user@gmai.com', function ($msg) use (&$message) {
            $message = $msg;
        });
        $this->assertStringContainsString('gmail.com', $message);
    }

    public function test_rejects_disposable_email()
    {
        $rule = new DeliverableEmail();
        $message = '';

        $rule->validate('email', 'user@mailinator.com', function ($msg) use (&$message) {
            $message = $msg;
        });
        $this->assertStringContainsString('disposable', $message);
    }

    public function test_rejects_nonexistent_domains()
    {
        $rule = new DeliverableEmail();
        $failed = false;

        $rule->validate('email', 'user@nonexistentdomain123987fakedomain.org', function ($msg) use (&$failed) {
            $failed = true;
        });
        $this->assertTrue($failed);
    }

    public function test_accepts_valid_email()
    {
        $rule = new DeliverableEmail();
        $failed = false;

        $rule->validate('email', 'fachrulrozi705@gmail.com', function ($msg) use (&$failed) {
            $failed = true;
        });
        $this->assertFalse($failed);
    }
}
