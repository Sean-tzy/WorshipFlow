<?php

namespace App\Repositories;

use App\Models\Presentation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class PresentationRepository
{
    public function paginatedForChurch(string $churchId, array $filters = []): LengthAwarePaginator
    {
        return Presentation::query()
            ->where('church_id', $churchId)
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 20);
    }
}
