class ThumbnailCache {
  private cache: { [timestamp: number | string]: HTMLImageElement } = {};
  private maxCacheSize: number = 500; // Set a limit to the number of thumbnails
  private accessOrder: (number | string)[] = []; // Track access order

  public setThumbnail(timestamp: number | string, img: HTMLImageElement) {
    if (this.accessOrder.length >= this.maxCacheSize) {
      // Remove the least recently used thumbnail
      const oldestTimestamp = this.accessOrder.shift();
      if (oldestTimestamp !== undefined) {
        delete this.cache[oldestTimestamp];
      }
    }
    this.cache[timestamp] = img;
    this.accessOrder.push(timestamp); // Add to the end to indicate recent use
  }

  public getThumbnail(timestamp: number | string): HTMLImageElement | undefined {
    const img = this.cache[timestamp];
    if (img) {
      // Update access order when thumbnail is accessed
      this.accessOrder = this.accessOrder.filter((t) => t !== timestamp);
      this.accessOrder.push(timestamp); // Move to the end (most recently used)
    }
    return img;
  }

  public clearCache() {
    this.cache = {};
    this.accessOrder = [];
  }
  public clearCacheButFallback() {
    const fallback = this.getThumbnail("fallback");

    this.cache = {};
    this.accessOrder = [];
    this.setThumbnail("fallback", fallback!);
  }
}

export default ThumbnailCache;
