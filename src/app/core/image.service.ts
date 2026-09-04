import { Injectable } from '@angular/core';

const BASIC_AUTH = 'Basic MTEzMjQ4ODM6NjAtZGF5ZnJlZXRyaWFs';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private cache = new Map<string, string>();

  private toProxyUrl(url: string): string {
    try {
      const u = new URL(url, window.location.origin);
      if (u.origin !== window.location.origin && /etempurl|jtempurl|localhost:\d+|127\.0\.0\.1/.test(u.host)) {
        return u.pathname + u.search;
      }
    } catch {
      /* fall through */
    }
    return url;
  }

  async resolve(url: string): Promise<string> {
    if (!url) return url;
    const cached = this.cache.get(url);
    if (cached) return cached;
    const proxyUrl = this.toProxyUrl(url);
    try {
      const res = await fetch(proxyUrl, { headers: { Authorization: BASIC_AUTH } });
      if (!res.ok) return url;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      this.cache.set(url, objectUrl);
      return objectUrl;
    } catch {
      return url;
    }
  }

  resolveSync(url: string | null): string | null {
    if (!url) return null;
    return this.cache.get(url) || url;
  }

  clear(): void {
    for (const blobUrl of this.cache.values()) {
      if (blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
    }
    this.cache.clear();
  }
}
