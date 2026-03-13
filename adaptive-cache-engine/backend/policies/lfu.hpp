#pragma once
#include "../cache_engine.hpp"
#include <list>
#include <unordered_map>

class LFUCache : public CacheEngine {
public:
  explicit LFUCache(int capacity);
  AccessResult access(int key) override;
  std::vector<int> getState() const override;
  std::string policyName() const override { return "LFU"; }
  void clear() override;

private:
  int minFreq_;
  std::unordered_map<int, int> keyFreq_;
  std::unordered_map<int, std::list<int>> freqList_;
  std::unordered_map<int, std::list<int>::iterator> keyIter_;
};
