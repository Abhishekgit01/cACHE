#include "lru.hpp"

LRUCache::LRUCache(int capacity) { capacity_ = capacity; }

AccessResult LRUCache::access(int key) {
  AccessResult result{false, -1};
  auto it = map_.find(key);
  if (it != map_.end()) {
    result.hit = true;
    order_.erase(it->second);
    order_.push_front(key);
    map_[key] = order_.begin();
  } else {
    if ((int)map_.size() >= capacity_) {
      int evicted = order_.back();
      order_.pop_back();
      map_.erase(evicted);
      result.evictedKey = evicted;
    }
    order_.push_front(key);
    map_[key] = order_.begin();
  }
  updateMetrics(key, result);
  return result;
}

std::vector<int> LRUCache::getState() const {
  return std::vector<int>(order_.begin(), order_.end());
}

void LRUCache::clear() {
  order_.clear();
  map_.clear();
  metrics_ = CacheMetrics{};
  everSeen_.clear();
  frequencyMap_.clear();
}
