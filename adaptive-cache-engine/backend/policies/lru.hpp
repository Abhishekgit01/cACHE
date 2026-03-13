#pragma once
#include "../cache_engine.hpp"
#include <list>
#include <unordered_map>

class LRUCache : public CacheEngine {
public:
  explicit LRUCache(int capacity);
  AccessResult access(int key) override;
  std::vector<int> getState() const override;
  std::string policyName() const override { return "LRU"; }
  void clear() override;

private:
  std::list<int> order_;
  std::unordered_map<int, std::list<int>::iterator> map_;
};
