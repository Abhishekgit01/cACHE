#include "lfu.hpp"

LFUCache::LFUCache(int capacity) : minFreq_(0) { capacity_ = capacity; }

AccessResult LFUCache::access(int key) {
  AccessResult result{false, -1};
  if (keyFreq_.count(key)) {
    result.hit = true;
    int freq = keyFreq_[key];
    freqList_[freq].erase(keyIter_[key]);
    if (freqList_[freq].empty()) {
      freqList_.erase(freq);
      if (minFreq_ == freq)
        minFreq_++;
    }
    keyFreq_[key] = freq + 1;
    freqList_[freq + 1].push_front(key);
    keyIter_[key] = freqList_[freq + 1].begin();
  } else {
    if ((int)keyFreq_.size() >= capacity_) {
      int evicted = freqList_[minFreq_].back();
      freqList_[minFreq_].pop_back();
      if (freqList_[minFreq_].empty())
        freqList_.erase(minFreq_);
      keyFreq_.erase(evicted);
      keyIter_.erase(evicted);
      result.evictedKey = evicted;
    }
    keyFreq_[key] = 1;
    freqList_[1].push_front(key);
    keyIter_[key] = freqList_[1].begin();
    minFreq_ = 1;
  }
  updateMetrics(key, result);
  return result;
}

std::vector<int> LFUCache::getState() const {
  std::vector<int> v;
  for (auto &p : keyFreq_)
    v.push_back(p.first);
  return v;
}

void LFUCache::clear() {
  keyFreq_.clear();
  freqList_.clear();
  keyIter_.clear();
  minFreq_ = 0;
  metrics_ = CacheMetrics{};
  everSeen_.clear();
  frequencyMap_.clear();
}
