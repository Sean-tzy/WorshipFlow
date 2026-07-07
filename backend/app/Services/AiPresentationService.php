<?php

namespace App\Services;

use App\Models\AiGenerationLog;
use App\Models\Church;
use App\Models\User;

final class AiPresentationService
{
    public function splitLyrics(Church $church, User $user, string $lyrics): array
    {
        $sections = [
            ['label' => 'Verse 1', 'lyrics' => trim($lyrics)],
        ];

        AiGenerationLog::query()->create([
            'church_id' => $church->id,
            'user_id' => $user->id,
            'feature' => 'lyrics.split',
            'input' => ['characters' => strlen($lyrics)],
            'output' => ['sections' => count($sections)],
        ]);

        return $sections;
    }

    public function recommendBackgrounds(Church $church, array $context): array
    {
        return [
            ['name' => 'Aurora Chapel', 'reason' => 'Warm bridge section with high energy finish.'],
            ['name' => 'Calm Waters', 'reason' => 'Low distraction verse background.'],
        ];
    }
}
