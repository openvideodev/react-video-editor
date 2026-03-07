export default class ThumbnailCache {
  private cache: Map<string | number, HTMLImageElement> = new Map();

  public getThumbnail(key: string | number): HTMLImageElement | undefined {
    return this.cache.get(key);
  }

  public setThumbnail(key: string | number, img: HTMLImageElement): void {
    this.cache.set(key, img);
  }

  public clearCacheButFallback(): void {
    const fallback = this.cache.get("fallback");
    this.cache.clear();
    if (fallback) {
      this.cache.set("fallback", fallback);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
