<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('churches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_path')->nullable();
            $table->string('timezone')->default('UTC');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('songs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('church_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['church_id', 'title']);
        });

        Schema::create('song_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('song_id')->constrained()->cascadeOnDelete();
            $table->string('label', 80);
            $table->text('lyrics');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('song_sections');
        Schema::dropIfExists('songs');
        Schema::dropIfExists('churches');
    }
};
