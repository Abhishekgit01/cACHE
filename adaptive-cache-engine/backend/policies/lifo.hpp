#pragma once
#include "../cache_engine.hpp"
#include <unordered_map>
#include <vector>


class LIFOCache : public CacheEngine {
public:
  explicit LIFOCache(int capacity);
  AccessResult access(int key) override;
  std::vector<int> getState() const override;
  std::string policyName() const override { return "LIFO"; }
  void clear() override;

private:
  std::vector<int> stack_;
  std::unordered_map<int, bool> map_;
};
