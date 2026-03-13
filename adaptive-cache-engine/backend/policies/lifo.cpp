#include "lifo.hpp"

LIFOCache::LIFOCache(int capacity) { capacity_ = capacity; }

AccessResult LIFOCache::access(int key) {
  AccessResult result{false, -1};
  if (map_.count(key)) {
    result.hit = true;
  } else {
    if ((int)map_.size() >= capacity_) {
      int evicted = stack_.back();
      stack_.pop_back();
      map_.erase(evicted);
      result.evictedKey = evicted;
    }
    stack_.push_back(key);
    map_[key] = true;
  }
  updateMetrics(key, result);
  return result;
}

std::vector<int> LIFOCache::getState() const { return stack_; }

void LIFOCache::clear() {
  stack_.clear();
  map_.clear();
  metrics_ = CacheMetrics{};
  everSeen_.clear();
  frequencyMap_.clear();
}
