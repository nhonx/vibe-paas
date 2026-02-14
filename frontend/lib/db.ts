import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'paas.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('static', 'serverside')),
    status TEXT NOT NULL CHECK(status IN ('stopped', 'running', 'building', 'failed')) DEFAULT 'stopped',
    source_type TEXT NOT NULL CHECK(source_type IN ('local', 'github')),
    source_path TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    port INTEGER,
    container_port INTEGER DEFAULT 80,
    container_id TEXT,
    launch_command TEXT,
    dockerfile_path TEXT,
    description TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
`);

// Migration: Add container_port column if it doesn't exist
try {
  db.exec(`ALTER TABLE projects ADD COLUMN container_port INTEGER DEFAULT 80`);
} catch (e) {
  // Column already exists, ignore
}

export interface Project {
  id: number;
  name: string;
  type: 'static' | 'serverside';
  status: 'stopped' | 'running' | 'building' | 'failed';
  source_type: 'local' | 'github';
  source_path: string;
  subdomain: string;
  port?: number;
  container_port?: number;
  container_id?: string;
  launch_command?: string;
  dockerfile_path?: string;
  description?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  type: 'static' | 'serverside';
  source_type: 'local' | 'github';
  source_path: string;
  launch_command?: string;
  container_port?: number;
  description?: string;
}

export const projectDb = {
  getAll(): Project[] {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
  },

  getById(id: number): Project | undefined {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  },

  getByName(name: string): Project | undefined {
    return db.prepare('SELECT * FROM projects WHERE name = ?').get(name) as Project | undefined;
  },

  create(data: ProjectCreate): Project {
    const stmt = db.prepare(`
      INSERT INTO projects (name, type, source_type, source_path, subdomain, launch_command, container_port, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.name,
      data.type,
      data.source_type,
      data.source_path,
      data.name, // subdomain same as name
      data.launch_command || null,
      data.container_port || 80,
      data.description || null
    );

    return this.getById(result.lastInsertRowid as number)!;
  },

  update(id: number, data: Partial<Project>): Project | undefined {
    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.getById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  },

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  getUsedPorts(): number[] {
    const rows = db.prepare('SELECT port FROM projects WHERE port IS NOT NULL').all() as { port: number }[];
    return rows.map(r => r.port);
  }
};

export default db;
