<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AiGenerationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackgroundController;
use App\Http\Controllers\Api\BibleController;
use App\Http\Controllers\Api\ChurchController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\PresentationController;
use App\Http\Controllers\Api\ServicePlanController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SongController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:api'])->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        Route::apiResource('users', UserController::class)->only(['index', 'show', 'update']);
        Route::apiResource('churches', ChurchController::class);
        Route::apiResource('songs', SongController::class);
        Route::post('/songs/import-youtube', [SongController::class, 'importYouTube']);
        Route::post('/songs/{song}/split-lyrics', [SongController::class, 'splitLyrics']);

        Route::apiResource('presentations', PresentationController::class);
        Route::post('/presentations/{presentation}/duplicate', [PresentationController::class, 'duplicate']);
        Route::post('/presentations/{presentation}/present', [PresentationController::class, 'present']);

        Route::apiResource('media', MediaController::class);
        Route::post('/media/{media}/thumbnail', [MediaController::class, 'generateThumbnail']);
        Route::apiResource('backgrounds', BackgroundController::class);

        Route::get('/bible/search', [BibleController::class, 'search']);
        Route::post('/bible/presentations', [BibleController::class, 'presentation']);

        Route::apiResource('service-plans', ServicePlanController::class);
        Route::post('/service-plans/{servicePlan}/reorder', [ServicePlanController::class, 'reorder']);

        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);

        Route::post('/ai/background-recommendations', [AiGenerationController::class, 'backgroundRecommendations']);
        Route::post('/ai/theme', [AiGenerationController::class, 'theme']);
        Route::post('/ai/lyrics/split', [AiGenerationController::class, 'splitLyrics']);
    });
});
