#pragma once
#include "cache_engine.hpp"
#include "policies/fifo.hpp"
#include "policies/lfu.hpp"
#include "policies/lifo.hpp"
#include "policies/lru.hpp"
#include <memory>
#include <string>
#include <vector>


struct PolicySwitchEvent {
  int accessIndex;
  std::string fromPolicy;
  std::string toPolicy;
  std::string reason;
};

class AdaptiveController {
public:
  explicit AdaptiveController(int capacity);

  AccessResult access(int key);
  CacheMetrics getMetrics() const;
  std::vector<int> getState() const;
  std::string currentPolicy() const;
  std::vector<PolicySwitchEvent> getSwitchLog() const;

private:
  void analyzeAndSwitch(int accessIndex);
  double sequentialScore() const;
  double loopScore() const;
  double hotspotScore() const;

  int capacity_;
  std::unique_ptr<CacheEngine> engine_;
  std::string currentPolicyName_;
  std::vector<int> recentAccesses_;
  std::vector<PolicySwitchEvent> switchLog_;
  int accessCount_;
  static constexpr int WINDOW_SIZE = 50;
  static constexpr int ANALYSIS_INTERVAL = 20;
};
