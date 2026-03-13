#include "fifo.hpp"
#include <vector>

FIFOCache::FIFOCache(int capacity) { capacity_ = capacity; }

AccessResult FIFOCache::access(int key) {
  AccessResult result{false, -1};
  if (map_.count(key)) {
    result.hit = true;
  } else {
    if ((int)map_.size() >= capacity_) {
      int evicted = order_.front();
      order_.pop();
      map_.erase(evicted);
      result.evictedKey = evicted;
    }
    order_.push(key);
    map_[key] = true;
  }
  updateMetrics(key, result);
  return result;
}

std::vector<int> FIFOCache::getState() const {
  std::queue<int> copy = order_;
  std::vector<int> v;
  while (!copy.empty()) {
    v.push_back(copy.front());
    copy.pop();
  }
  return v;
}

void FIFOCache::clear() {
  while (!order_.empty())
    order_.pop();
  map_.clear();
  metrics_ = CacheMetrics{};
  everSeen_.clear();
  frequencyMap_.clear();
}
