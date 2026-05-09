import { promises as fs } from "fs";
import path from "path";

const CACHE_DIR = path.resolve(process.cwd(), ".cache/raw");
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function readCache<T>(key: string): Promise<T | null> {
  const file = path.join(CACHE_DIR, key);
  try {
    const raw = await fs.readFile(file, "utf-8");
    const entry = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - entry.ts > TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, key);
  await fs.writeFile(file, JSON.stringify({ ts: Date.now(), data }), "utf-8");
}

export async function writeCacheDir<T>(dir: string, key: string, data: T): Promise<void> {
  const target = path.resolve(process.cwd(), dir);
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, key), JSON.stringify(data), "utf-8");
}

export async function readCacheDir<T>(dir: string, key: string): Promise<T | null> {
  const file = path.resolve(process.cwd(), dir, key);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function listCacheDir(dir: string): Promise<string[]> {
  const target = path.resolve(process.cwd(), dir);
  try {
    return await fs.readdir(target);
  } catch {
    return [];
  }
}
