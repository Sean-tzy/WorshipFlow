CREATE TABLE churches (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  logo_path VARCHAR(255) NULL,
  timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
  settings JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (church_id) REFERENCES churches(id)
);

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

CREATE TABLE church_members (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY church_user_unique (church_id, user_id),
  INDEX church_members_status_idx (church_id, status),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE songs (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  title VARCHAR(190) NOT NULL,
  artist VARCHAR(190) NULL,
  youtube_url VARCHAR(255) NULL,
  thumbnail_url VARCHAR(255) NULL,
  duration_seconds INT NULL,
  metadata JSON NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX songs_church_title_idx (church_id, title),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE song_sections (
  id CHAR(36) PRIMARY KEY,
  song_id CHAR(36) NOT NULL,
  label VARCHAR(80) NOT NULL,
  lyrics TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE backgrounds (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(40) NOT NULL,
  source_path VARCHAR(255) NULL,
  palette JSON NULL,
  tags JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX backgrounds_type_idx (church_id, type),
  FOREIGN KEY (church_id) REFERENCES churches(id)
);

CREATE TABLE media_files (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  folder_id CHAR(36) NULL,
  name VARCHAR(190) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  disk VARCHAR(80) NOT NULL DEFAULT 'public',
  path VARCHAR(255) NOT NULL,
  thumbnail_path VARCHAR(255) NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  duration_seconds INT NULL,
  metadata JSON NULL,
  tags JSON NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX media_church_type_idx (church_id, mime_type),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE presentations (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  song_id CHAR(36) NULL,
  title VARCHAR(190) NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'song',
  status VARCHAR(60) NOT NULL DEFAULT 'draft',
  theme JSON NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX presentations_church_status_idx (church_id, status),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (song_id) REFERENCES songs(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE presentation_slides (
  id CHAR(36) PRIMARY KEY,
  presentation_id CHAR(36) NOT NULL,
  background_id CHAR(36) NULL,
  title VARCHAR(160) NULL,
  body TEXT NOT NULL,
  notes TEXT NULL,
  style JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
  FOREIGN KEY (background_id) REFERENCES backgrounds(id)
);

CREATE TABLE bible_books (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  testament VARCHAR(20) NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE bible_chapters (
  id CHAR(36) PRIMARY KEY,
  bible_book_id CHAR(36) NOT NULL,
  chapter_number INT NOT NULL,
  FOREIGN KEY (bible_book_id) REFERENCES bible_books(id)
);

CREATE TABLE bible_verses (
  id CHAR(36) PRIMARY KEY,
  bible_chapter_id CHAR(36) NOT NULL,
  verse_number INT NOT NULL,
  text TEXT NOT NULL,
  translation VARCHAR(30) NOT NULL DEFAULT 'WEB',
  FULLTEXT KEY bible_verses_text_fulltext (text),
  FOREIGN KEY (bible_chapter_id) REFERENCES bible_chapters(id)
);

CREATE TABLE service_plans (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  title VARCHAR(190) NOT NULL,
  service_date DATETIME NOT NULL,
  status VARCHAR(60) NOT NULL DEFAULT 'draft',
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  INDEX service_date_idx (church_id, service_date),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE service_plan_items (
  id CHAR(36) PRIMARY KEY,
  service_plan_id CHAR(36) NOT NULL,
  presentation_id CHAR(36) NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(190) NOT NULL,
  notes TEXT NULL,
  duration_seconds INT NULL,
  assigned_user_id CHAR(36) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (service_plan_id) REFERENCES service_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);

CREATE TABLE favorites (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  favoritable_type VARCHAR(120) NOT NULL,
  favoritable_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NULL,
  INDEX favorite_lookup_idx (church_id, user_id, favoritable_type, favoritable_id),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE presentation_views (
  id CHAR(36) PRIMARY KEY,
  presentation_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  context JSON NULL,
  FOREIGN KEY (presentation_id) REFERENCES presentations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  action VARCHAR(120) NOT NULL,
  subject_type VARCHAR(120) NULL,
  subject_id CHAR(36) NULL,
  properties JSON NULL,
  created_at TIMESTAMP NULL,
  INDEX activity_church_action_idx (church_id, action),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE settings (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  key_name VARCHAR(120) NOT NULL,
  value JSON NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY settings_church_key_unique (church_id, key_name),
  FOREIGN KEY (church_id) REFERENCES churches(id)
);

CREATE TABLE ai_generation_logs (
  id CHAR(36) PRIMARY KEY,
  church_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  feature VARCHAR(120) NOT NULL,
  prompt_hash VARCHAR(120) NULL,
  input JSON NULL,
  output JSON NULL,
  tokens_used INT NULL,
  latency_ms INT NULL,
  created_at TIMESTAMP NULL,
  INDEX ai_feature_idx (church_id, feature),
  FOREIGN KEY (church_id) REFERENCES churches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
