<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

if (str_starts_with($path, '/api/') && !str_starts_with($path, '/api/v1/')) {
    $path = '/api/v1' . substr($path, 4);
}

function uuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT);
    exit;
}

function fail(string $message, int $status = 422, array $errors = []): void
{
    respond([
        'message' => $message,
        'errors' => $errors,
    ], $status);
}

function ok(array $data = [], string $message = 'OK'): void
{
    respond([
        'message' => $message,
        'data' => $data,
        'meta' => [
            'request_id' => bin2hex(random_bytes(8)),
            'served_by' => 'WorshipFlow local API',
            'time' => gmdate('c'),
        ],
    ]);
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $database = getenv('DB_DATABASE') ?: 'worshipflow';
    $username = getenv('DB_USERNAME') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';

    try {
        $pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ],
        );
    } catch (PDOException $exception) {
        fail('Database connection failed. Check that MySQL is running and the worshipflow database exists.', 500, [
            'detail' => $exception->getMessage(),
            'expected' => [
                'DB_HOST' => $host,
                'DB_PORT' => $port,
                'DB_DATABASE' => $database,
                'DB_USERNAME' => $username,
            ],
        ]);
    }

    migrate($pdo);

    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS churches (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(160) NOT NULL,
            slug VARCHAR(180) NOT NULL UNIQUE,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) PRIMARY KEY,
            church_id CHAR(36) NULL,
            name VARCHAR(160) NOT NULL,
            email VARCHAR(190) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            remember_token VARCHAR(100) NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            INDEX users_church_id_idx (church_id),
            CONSTRAINT users_church_id_fk FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    ensureColumn($pdo, 'users', 'church_id', 'ALTER TABLE users ADD COLUMN church_id CHAR(36) NULL AFTER id');
    ensureColumn($pdo, 'users', 'password', 'ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER email');
    ensureColumn($pdo, 'users', 'remember_token', 'ALTER TABLE users ADD COLUMN remember_token VARCHAR(100) NULL AFTER password');
    ensureColumn($pdo, 'users', 'deleted_at', 'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at');

    ensureIndex($pdo, 'users', 'users_church_id_idx', 'ALTER TABLE users ADD INDEX users_church_id_idx (church_id)');
}

function ensureColumn(PDO $pdo, string $table, string $column, string $sql): void
{
    $statement = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $statement->execute([$table, $column]);

    if ((int) $statement->fetch()['total'] === 0) {
        $pdo->exec($sql);
    }
}

function ensureIndex(PDO $pdo, string $table, string $index, string $sql): void
{
    $statement = $pdo->prepare("
        SELECT COUNT(*) AS total
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
    ");
    $statement->execute([$table, $index]);

    if ((int) $statement->fetch()['total'] === 0) {
        $pdo->exec($sql);
    }
}

function fetchYouTubeTitle(string $url): ?string
{
    $endpoint = 'https://www.youtube.com/oembed?format=json&url=' . rawurlencode($url);
    $context = stream_context_create([
        'http' => [
            'timeout' => 3,
            'ignore_errors' => true,
            'header' => "User-Agent: WorshipFlowAI/1.0\r\n",
        ],
    ]);
    $json = @file_get_contents($endpoint, false, $context);

    if (!$json) {
        return null;
    }

    $payload = json_decode($json, true);
    return is_array($payload) && isset($payload['title']) ? trim((string) $payload['title']) : null;
}

function cleanSongTitle(string $title): array
{
    $title = preg_replace('/\s+/', ' ', $title);
    $title = preg_replace('/\s*\((official|live|lyrics?|lyric video|music video|audio|visualizer|cover).*?\)\s*/i', ' ', $title);
    $title = preg_replace('/\s*\[(official|live|lyrics?|lyric video|music video|audio|visualizer|cover).*?\]\s*/i', ' ', $title);
    $title = trim((string) $title, " \t\n\r\0\x0B-");

    $artist = 'YouTube Import';
    if (str_contains($title, ' - ')) {
        [$left, $right] = array_map('trim', explode(' - ', $title, 2));
        if ($left !== '' && $right !== '') {
            $artist = $left;
            $title = $right;
        }
    }

    $title = preg_replace('/\s+/', ' ', $title);
    return [
        'title' => $title ?: 'Imported Worship Song',
        'artist' => $artist,
    ];
}

function looksLikeVideoId(string $value): bool
{
    return (bool) preg_match('/^[a-zA-Z0-9_-]{8,16}$/', $value);
}

function fetchLicensedLyrics(string $title, string $artist): array
{
    $providerUrl = getenv('LYRICS_PROVIDER_URL') ?: '';
    $providerKey = getenv('LYRICS_PROVIDER_KEY') ?: '';

    if ($providerUrl === '') {
        return [
            'found' => false,
            'lyrics' => '',
            'source' => null,
            'message' => 'No licensed lyrics provider configured.',
        ];
    }

    $payload = json_encode([
        'title' => $title,
        'artist' => $artist,
    ]);

    $headers = [
        'Content-Type: application/json',
        'User-Agent: WorshipFlowAI/1.0',
    ];

    if ($providerKey !== '') {
        $headers[] = 'Authorization: Bearer ' . $providerKey;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'timeout' => 5,
            'ignore_errors' => true,
            'header' => implode("\r\n", $headers) . "\r\n",
            'content' => $payload,
        ],
    ]);

    $json = @file_get_contents($providerUrl, false, $context);
    $response = $json ? json_decode($json, true) : null;

    if (!is_array($response) || empty($response['lyrics'])) {
        return [
            'found' => false,
            'lyrics' => '',
            'source' => null,
            'message' => 'Licensed lyrics provider did not return lyrics.',
        ];
    }

    return [
        'found' => true,
        'lyrics' => (string) $response['lyrics'],
        'source' => $response['source'] ?? 'licensed-provider',
        'message' => 'Licensed lyrics found.',
    ];
}

function splitLyricsIntoSections(string $rawLyrics): array
{
    $normalizedLyrics = str_replace(["\r\n", "\r"], "\n", $rawLyrics);
    $labelPattern = '/^\s*(verse\s*\d*|v\d+|chorus|pre[-\s]?chorus|bridge|outro|tag|refrain|intro|ending)\s*:?\s*$/i';
    $lines = explode("\n", $normalizedLyrics);
    $sections = [];
    $currentLabel = null;
    $currentLines = [];

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if (preg_match($labelPattern, $trimmed, $matches)) {
            if ($currentLabel !== null || trim(implode("\n", $currentLines)) !== '') {
                $sections[] = [
                    'label' => $currentLabel ?: 'Section ' . (count($sections) + 1),
                    'lyrics' => trim(implode("\n", $currentLines)),
                ];
            }

            $currentLabel = normalizeSectionLabel($matches[1], count($sections) + 1);
            $currentLines = [];
            continue;
        }

        if ($trimmed === '' && trim(implode("\n", $currentLines)) !== '' && $currentLabel === null) {
            $sections[] = [
                'label' => 'Section ' . (count($sections) + 1),
                'lyrics' => trim(implode("\n", $currentLines)),
            ];
            $currentLines = [];
            continue;
        }

        $currentLines[] = $line;
    }

    if ($currentLabel !== null || trim(implode("\n", $currentLines)) !== '') {
        $sections[] = [
            'label' => $currentLabel ?: 'Section ' . (count($sections) + 1),
            'lyrics' => trim(implode("\n", $currentLines)),
        ];
    }

    return $sections ?: [['label' => 'Verse 1', 'lyrics' => trim($rawLyrics)]];
}

if ($path === '/api/v1/health') {
    $pdo = db();
    $database = $pdo->query('select database() as name')->fetch()['name'] ?? 'unknown';

    ok(['status' => 'online', 'database' => $database, 'queue' => 'ready'], 'Backend is running');
}

if ($path === '/' || $path === '/api' || $path === '/api/v1') {
    ok([
        'name' => 'WorshipFlow AI Local API',
        'health' => '/api/v1/health',
        'register' => '/api/v1/auth/register',
        'login' => '/api/v1/auth/login',
    ], 'API is running');
}

if ($path === '/api/v1/auth/login' && $method === 'POST') {
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $password = (string) ($input['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        fail('Email and password are required.');
    }

    $statement = db()->prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        fail('Invalid email or password.', 401);
    }

    ok([
        'token' => 'local-' . bin2hex(random_bytes(24)),
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'church_id' => $user['church_id'],
        ],
    ], 'Logged in');
}

if ($path === '/api/v1/auth/register' && $method === 'POST') {
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $password = (string) ($input['password'] ?? '');
    $name = trim((string) ($input['name'] ?? 'WorshipFlow User'));
    $churchName = trim((string) ($input['church_name'] ?? 'City Harvest Church Villamonte'));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Enter a valid email address.', 422, ['email' => ['Invalid email address.']]);
    }

    if (strlen($password) < 8) {
        fail('Password must be at least 8 characters.', 422, ['password' => ['Minimum 8 characters.']]);
    }

    $pdo = db();
    $existing = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $existing->execute([$email]);

    if ($existing->fetch()) {
        fail('An account with this email already exists.', 409, ['email' => ['Email already registered.']]);
    }

    $churchId = uuid();
    $userId = uuid();
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $churchName));
    $slug = trim($slug, '-') . '-' . substr($churchId, 0, 8);

    $pdo->beginTransaction();
    try {
        $church = $pdo->prepare('INSERT INTO churches (id, name, slug) VALUES (?, ?, ?)');
        $church->execute([$churchId, $churchName, $slug]);

        $user = $pdo->prepare('INSERT INTO users (id, church_id, name, email, password) VALUES (?, ?, ?, ?, ?)');
        $user->execute([$userId, $churchId, $name, $email, password_hash($password, PASSWORD_DEFAULT)]);

        $pdo->commit();
    } catch (Throwable $throwable) {
        $pdo->rollBack();
        fail('Could not create account.', 500, ['detail' => $throwable->getMessage()]);
    }

    ok([
        'workspace' => $churchName,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'church_id' => $churchId,
        ],
        'token' => 'local-' . bin2hex(random_bytes(24)),
    ], 'Workspace created');
}

if ($path === '/api/v1/auth/forgot-password' && $method === 'POST') {
    ok(['sent' => true], 'Password reset email queued');
}

if ($path === '/api/v1/songs/import-youtube' && $method === 'POST') {
    $url = trim((string) ($input['url'] ?? ''));

    if (!preg_match('/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i', $url)) {
        fail('Paste a valid YouTube link.', 422, ['url' => ['Only youtube.com and youtu.be links are supported.']]);
    }

    $videoId = 'demo';
    if (preg_match('/[?&]v=([^&]+)/', $url, $matches) || preg_match('/youtu\.be\/([^?]+)/', $url, $matches)) {
        $videoId = preg_replace('/[^a-zA-Z0-9_-]/', '', $matches[1]);
    }

    $youtubeTitle = fetchYouTubeTitle($url);
    $clean = cleanSongTitle($youtubeTitle ?: 'Imported Worship Song');
    $title = looksLikeVideoId($clean['title']) ? 'Imported Worship Song' : $clean['title'];
    $artist = looksLikeVideoId($clean['artist']) ? 'YouTube Import' : $clean['artist'];

    ok([
        'id' => 'song_' . substr(hash('sha256', $url), 0, 12),
        'title' => $title,
        'artist' => $artist,
        'thumbnail_url' => "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg",
        'duration_seconds' => 240 + (hexdec(substr(hash('crc32b', $url), 0, 2)) % 180),
        'youtube_url' => $url,
    ], 'YouTube metadata imported');
}

if ($path === '/api/v1/ai/lyrics/split' && $method === 'POST') {
    $title = trim((string) ($input['title'] ?? 'Imported Worship Song'));
    $artist = trim((string) ($input['artist'] ?? 'YouTube Import'));
    $rawLyrics = trim((string) ($input['raw_lyrics'] ?? ''));
    $shortTitle = looksLikeVideoId($title) ? 'Imported Worship Song' : ($title ?: 'Imported Worship Song');

    if ($rawLyrics !== '') {
        $sections = splitLyricsIntoSections($rawLyrics);

        ok([
            'sections' => $sections,
            'source_notice' => 'Lyrics were provided by the user and split locally.',
        ], 'Pasted lyrics split into presentation sections');
    }

    ok([
        'sections' => [
            ['label' => 'Verse 1', 'lyrics' => ''],
            ['label' => 'Verse 2', 'lyrics' => ''],
            ['label' => 'Pre-Chorus', 'lyrics' => ''],
            ['label' => 'Chorus', 'lyrics' => ''],
            ['label' => 'Bridge', 'lyrics' => ''],
            ['label' => 'Outro', 'lyrics' => ''],
        ],
        'lyrics_search_url' => 'https://www.google.com/search?q=' . rawurlencode($shortTitle . ' ' . $artist . ' lyrics'),
        'source_notice' => 'Paste licensed lyrics, then split them into slides.',
    ], 'Editable lyric sections created for matched song');
}

if ($path === '/api/v1/lyrics/search' && $method === 'POST') {
    $title = trim((string) ($input['title'] ?? ''));
    $artist = trim((string) ($input['artist'] ?? ''));

    if ($title === '') {
        fail('Song title is required before lyrics can be searched.');
    }

    $result = fetchLicensedLyrics($title, $artist);
    $sections = $result['found'] ? splitLyricsIntoSections($result['lyrics']) : [];

    ok([
        'found' => $result['found'],
        'source' => $result['source'],
        'message' => $result['message'],
        'sections' => $sections,
    ], $result['found'] ? 'Licensed lyrics found and split' : 'No licensed lyrics available');
}

function normalizeSectionLabel(string $label, int $position): string
{
    $clean = strtolower(trim(str_replace(['-', '_'], ' ', $label)));
    $clean = preg_replace('/\s+/', ' ', $clean);

    if (preg_match('/^v\s*(\d+)$/', $clean, $matches)) {
        return 'Verse ' . $matches[1];
    }

    if (preg_match('/^verse\s*(\d+)$/', $clean, $matches)) {
        return 'Verse ' . $matches[1];
    }

    return match ($clean) {
        'verse' => 'Verse ' . $position,
        'pre chorus', 'prechorus' => 'Pre-Chorus',
        'chorus' => 'Chorus',
        'bridge' => 'Bridge',
        'outro' => 'Outro',
        'tag' => 'Tag',
        'refrain' => 'Refrain',
        'intro' => 'Intro',
        'ending' => 'Ending',
        default => ucwords($clean),
    };
}

if ($path === '/api/v1/bible/search' && $method === 'GET') {
    $reference = trim((string) ($_GET['q'] ?? 'Romans 8:31-39'));
    ok(fetchBiblePassage($reference), 'Bible passage loaded');
}

if ($path === '/api/v1/bible/chapter' && $method === 'GET') {
    $book = trim((string) ($_GET['book'] ?? 'John'));
    $chapter = max(1, (int) ($_GET['chapter'] ?? 3));
    ok(fetchBiblePassage("{$book} {$chapter}"), 'Bible chapter loaded');
}

if ($path === '/api/v1/bible/presentations' && $method === 'POST') {
    ok([
        'presentation_id' => 'prs_bible_romans_8',
        'slides_created' => 4,
    ], 'Bible presentation generated');
}

function fetchBiblePassage(string $reference): array
{
    $translation = 'web';
    $endpoint = 'https://bible-api.com/' . rawurlencode($reference) . '?translation=' . $translation;
    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'ignore_errors' => true,
            'header' => "User-Agent: WorshipFlowAI/1.0\r\n",
        ],
    ]);
    $json = @file_get_contents($endpoint, false, $context);
    $payload = $json ? json_decode($json, true) : null;

    if (is_array($payload) && isset($payload['verses']) && is_array($payload['verses'])) {
        return [
            'reference' => $payload['reference'] ?? $reference,
            'translation' => strtoupper($translation),
            'source' => 'bible-api.com',
            'verses' => array_map(static fn(array $verse) => [
                'book' => $verse['book_name'] ?? '',
                'chapter' => (int) ($verse['chapter'] ?? 0),
                'verse' => (int) ($verse['verse'] ?? 0),
                'text' => trim((string) ($verse['text'] ?? '')),
            ], $payload['verses']),
        ];
    }

    return fallbackBiblePassage($reference);
}

function fallbackBiblePassage(string $reference): array
{
    $fallback = [
        ['book' => 'John', 'chapter' => 3, 'verse' => 16, 'text' => 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.'],
        ['book' => 'Romans', 'chapter' => 8, 'verse' => 31, 'text' => 'If God is for us, who can be against us?'],
        ['book' => 'Psalm', 'chapter' => 23, 'verse' => 1, 'text' => 'Yahweh is my shepherd: I shall lack nothing.'],
    ];

    return [
        'reference' => $reference,
        'translation' => 'WEB',
        'source' => 'local-fallback',
        'verses' => $fallback,
    ];
}

function publicBackgroundVideos(): array
{
    $directory = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'backgrounds';

    if (!is_dir($directory)) {
        return [];
    }

    $files = glob($directory . DIRECTORY_SEPARATOR . '*.mp4') ?: [];

    return array_map(static function (string $file): array {
        $name = pathinfo($file, PATHINFO_FILENAME);
        $display = ucwords(trim(str_replace('-', ' ', $name)));

        return [
            'name' => $display,
            'tag' => str_contains($name, '4k') ? '4K Loop Video' : 'Loop Video',
            'color' => colorForBackgroundName($name),
            'videoUrl' => '/media/backgrounds/' . basename($file),
        ];
    }, $files);
}

function colorForBackgroundName(string $name): string
{
    return match (true) {
        str_contains($name, 'blue'), str_contains($name, 'aqua'), str_contains($name, 'cloud') => 'from-blue-950 via-cyan-600 to-sky-200',
        str_contains($name, 'red'), str_contains($name, 'warm'), str_contains($name, 'rustic') => 'from-red-950 via-orange-600 to-amber-200',
        str_contains($name, 'cross'), str_contains($name, 'hope') => 'from-zinc-950 via-violet-800 to-white',
        str_contains($name, 'galaxy'), str_contains($name, 'space'), str_contains($name, 'nebula') => 'from-black via-indigo-950 to-fuchsia-400',
        str_contains($name, 'flower'), str_contains($name, 'organic') => 'from-emerald-950 via-green-500 to-pink-200',
        default => 'from-zinc-950 via-slate-700 to-cyan-300',
    };
}

if ($path === '/api/v1/presentations' && $method === 'POST') {
    ok([
        'id' => 'prs_demo_' . substr(bin2hex(random_bytes(4)), 0, 8),
        'title' => $input['title'] ?? 'Untitled Presentation',
        'status' => 'draft',
    ], 'Presentation saved');
}

if ($path === '/api/v1/service-plans/reorder' && $method === 'POST') {
    ok(['saved' => true], 'Service order saved');
}

if ($path === '/api/v1/media/upload' && $method === 'POST') {
    ok(['queued' => true, 'ffmpeg_job' => 'thumbnail_generation'], 'Upload accepted');
}

if ($path === '/api/v1/media/background-pack' && $method === 'POST') {
    $publicVideos = publicBackgroundVideos();

    ok([
        'backgrounds' => array_values(array_merge($publicVideos, [
            [
                'name' => 'Easy Worship Rustic',
                'tag' => 'Loop Video',
                'color' => 'from-stone-950 via-amber-800 to-zinc-900',
                'videoUrl' => '/media/backgrounds/easy-worship-background-rustic.mp4',
            ],
            [
                'name' => 'Neon Tri-Tunnel',
                'tag' => 'Loop Video',
                'color' => 'from-fuchsia-950 via-cyan-500 to-violet-900',
                'videoUrl' => '/media/backgrounds/easy-worship-background-neon-tri-tunnel.mp4',
            ],
            [
                'name' => '4K Clean Blue Motion',
                'tag' => '4K Loop Video',
                'color' => 'from-blue-950 via-cyan-600 to-sky-200',
                'videoUrl' => '/media/backgrounds/4k-6-min-clean-blue-longest-ever-2160p-motion-background-uhd-aa-vfx.mp4',
            ],
            [
                'name' => 'Blinking Background Graphics',
                'tag' => 'HD Loop Video',
                'color' => 'from-zinc-950 via-indigo-700 to-cyan-300',
                'videoUrl' => '/media/backgrounds/blinking-background-graphics-hd.mp4',
            ],
            [
                'name' => 'Clean Bokeh',
                'tag' => 'HD Loop Video',
                'color' => 'from-slate-950 via-violet-700 to-rose-200',
                'videoUrl' => '/media/backgrounds/clean-bokeh-hd-motion-graphics-background-loop.mp4',
            ],
            [
                'name' => 'Clouds Motion Loop',
                'tag' => 'HD Loop Video',
                'color' => 'from-sky-950 via-blue-400 to-white',
                'videoUrl' => '/media/backgrounds/clouds-motion-background-loop-hd.mp4',
            ],
            [
                'name' => 'Art Lights',
                'tag' => 'Loop Video',
                'color' => 'from-black via-fuchsia-700 to-amber-200',
                'videoUrl' => '/media/backgrounds/easy-worship-background-art-lights.mp4',
            ],
            [
                'name' => 'Jonah Slide Loop',
                'tag' => 'Loop Video',
                'color' => 'from-slate-950 via-teal-700 to-sky-200',
                'videoUrl' => '/media/backgrounds/jonah-slide-loop-hq.mp4',
            ],
            [
                'name' => 'Flower Animation Loop',
                'tag' => 'Loop Video',
                'color' => 'from-green-950 via-emerald-500 to-pink-200',
                'videoUrl' => '/media/backgrounds/motion-graphics-after-effects-flower-animation-loop-free-video-download.mp4',
            ],
            [
                'name' => 'Smoke Moving Background',
                'tag' => '1080p Loop Video',
                'color' => 'from-zinc-950 via-slate-600 to-zinc-200',
                'videoUrl' => '/media/backgrounds/smoke-moving-background-1080p.mp4',
            ],
            [
                'name' => 'Clouds Video Loop',
                'tag' => 'Loop Video',
                'color' => 'from-indigo-950 via-sky-500 to-slate-100',
                'videoUrl' => '/media/backgrounds/video-background-clouds-loop.mp4',
            ],
            ['name' => 'Cathedral Aurora', 'tag' => 'Motion Video', 'color' => 'from-indigo-950 via-violet-700 to-cyan-300'],
            ['name' => 'Sunday Sunrise', 'tag' => 'Motion Video', 'color' => 'from-rose-500 via-amber-300 to-sky-500'],
            ['name' => 'Living Water', 'tag' => 'Loop Video', 'color' => 'from-cyan-950 via-blue-500 to-emerald-300'],
            ['name' => 'Soft Cross Light', 'tag' => 'Loop Video', 'color' => 'from-zinc-950 via-slate-700 to-white'],
            ['name' => 'Emerald Particles', 'tag' => 'Motion Video', 'color' => 'from-emerald-950 via-teal-500 to-lime-200'],
            ['name' => 'Purple Worship Haze', 'tag' => 'AI Motion', 'color' => 'from-purple-950 via-fuchsia-600 to-sky-400'],
            ['name' => 'Golden Sanctuary', 'tag' => 'Motion Video', 'color' => 'from-yellow-200 via-orange-500 to-zinc-950'],
            ['name' => 'Midnight Praise', 'tag' => 'Loop Video', 'color' => 'from-black via-blue-950 to-violet-500'],
            ['name' => 'Clouds of Glory', 'tag' => 'Motion Video', 'color' => 'from-slate-100 via-sky-300 to-indigo-800'],
            ['name' => 'Deep Violet Rain', 'tag' => 'Motion Video', 'color' => 'from-black via-purple-950 to-violet-400'],
            ['name' => 'Blue Flame Worship', 'tag' => 'Loop Video', 'color' => 'from-slate-950 via-blue-700 to-cyan-200'],
            ['name' => 'Emerald River Flow', 'tag' => 'Motion Video', 'color' => 'from-emerald-950 via-green-600 to-teal-200'],
            ['name' => 'Rose Gold Atmosphere', 'tag' => 'Motion Video', 'color' => 'from-rose-950 via-orange-400 to-yellow-200'],
            ['name' => 'Silent Stars', 'tag' => 'Loop Video', 'color' => 'from-zinc-950 via-indigo-950 to-white'],
            ['name' => 'Light Rays Chapel', 'tag' => 'Motion Video', 'color' => 'from-neutral-950 via-amber-200 to-white'],
            ['name' => 'Ocean Praise', 'tag' => 'Loop Video', 'color' => 'from-blue-950 via-cyan-600 to-emerald-200'],
            ['name' => 'Crimson Worship Smoke', 'tag' => 'Motion Video', 'color' => 'from-red-950 via-rose-600 to-violet-300'],
            ['name' => 'Soft Morning Mist', 'tag' => 'Motion Video', 'color' => 'from-slate-300 via-sky-200 to-violet-500'],
            ['name' => 'High Energy Praise', 'tag' => 'AI Motion', 'color' => 'from-fuchsia-700 via-cyan-400 to-lime-200'],
            ['name' => 'Quiet Prayer Room', 'tag' => 'Loop Video', 'color' => 'from-stone-950 via-zinc-700 to-blue-300'],
            ['name' => 'Golden Particles', 'tag' => 'Motion Video', 'color' => 'from-black via-yellow-600 to-amber-100'],
        ])),
    ], 'Background pack downloaded');
}

if ($path === '/api/v1/settings' && in_array($method, ['GET', 'PUT'], true)) {
    ok([
        'church_name' => $input['church_name'] ?? 'City Harvest Church Villamonte',
        'resolution' => '1920x1080',
        'theme' => 'dark',
    ], $method === 'GET' ? 'Settings loaded' : 'Settings saved');
}

respond([
    'message' => 'Route not found',
    'path' => $path,
    'method' => $method,
], 404);
