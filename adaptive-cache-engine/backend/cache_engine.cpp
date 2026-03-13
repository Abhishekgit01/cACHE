#include "cache_engine.hpp"

void CacheEngine::updateMetrics(int key, const AccessResult &result) {
  metrics_.totalAccesses++;
  if (result.hit) {
    metrics_.hits++;
  } else {
    metrics_.misses++;
    if (everSeen_.find(key) == everSeen_.end()) {
      metrics_.coldMisses++;
      everSeen_.insert(key);
    } else {
      metrics_.capacityMisses++;
    }
  }
  if (result.evictedKey >= 0) {
    metrics_.evictions++;
  }
  frequencyMap_[key]++;

  metrics_.hitRate = (double)metrics_.hits / metrics_.totalAccesses;
  metrics_.missRate = (double)metrics_.misses / metrics_.totalAccesses;
  metrics_.evictionRate = (double)metrics_.evictions / metrics_.totalAccesses;
  metrics_.avgLatency =
      (metrics_.hitRate * CACHE_LATENCY) + (metrics_.missRate * RAM_LATENCY);
  metrics_.thrashing = (metrics_.evictionRate > THRASHING_THRESHOLD);
}

CacheMetrics CacheEngine::getMetrics() const { return metrics_; }

std::vector<CacheBlock> CacheEngine::getBlocks() const {
  auto state = getState();
  std::vector<CacheBlock> blocks;
  for (int k : state) {
    blocks.push_back({k, false, false});
  }
  return blocks;
}
