#pragma once
#include "../cache_engine.hpp"
#include <queue>
#include <unordered_map>

class FIFOCache : public CacheEngine {
public:
  explicit FIFOCache(int capacity);
  AccessResult access(int key) override;
  std::vector<int> getState() const override;
  std::string policyName() const override { return "FIFO"; }
  void clear() override;

private:
  std::queue<int> order_;
  std::unordered_map<int, bool> map_;
};
