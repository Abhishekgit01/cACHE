#include "adaptive_controller.hpp"
#include <algorithm>
#include <cmath>
#include <unordered_map>
#include <unordered_set>


AdaptiveController::AdaptiveController(int capacity)
    : capacity_(capacity), currentPolicyName_("LRU"), accessCount_(0) {
  engine_ = std::make_unique<LRUCache>(capacity);
}

AccessResult AdaptiveController::access(int key) {
  recentAccesses_.push_back(key);
  if ((int)recentAccesses_.size() > WINDOW_SIZE) {
    recentAccesses_.erase(recentAccesses_.begin());
  }
  accessCount_++;

  if (accessCount_ % ANALYSIS_INTERVAL == 0 &&
      (int)recentAccesses_.size() >= WINDOW_SIZE) {
    analyzeAndSwitch(accessCount_);
  }

  return engine_->access(key);
}

void AdaptiveController::analyzeAndSwitch(int accessIndex) {
  double seqScore = sequentialScore();
  double loopSc = loopScore();
  double hotSc = hotspotScore();

  CacheMetrics m = engine_->getMetrics();
  std::string bestPolicy = currentPolicyName_;
  std::string reason;

  if (m.evictionRate > 0.4) {
    // Thrashing detected — switch away from current policy
    if (currentPolicyName_ == "LRU") {
      bestPolicy = "LFU";
      reason = "Thrashing detected, switching from LRU";
    } else if (currentPolicyName_ == "LFU") {
      bestPolicy = "FIFO";
      reason = "Thrashing detected, switching from LFU";
    } else if (currentPolicyName_ == "FIFO") {
      bestPolicy = "LRU";
      reason = "Thrashing detected, switching from FIFO";
    } else {
      bestPolicy = "LRU";
      reason = "Thrashing detected, switching from LIFO";
    }
  } else if (seqScore > 0.6) {
    bestPolicy = "FIFO";
    reason = "Sequential pattern detected (score=" +
             std::to_string(seqScore).substr(0, 4) + ")";
  } else if (hotSc > 0.4) {
    bestPolicy = "LFU";
    reason = "Hotspot/frequency pattern detected (score=" +
             std::to_string(hotSc).substr(0, 4) + ")";
  } else if (loopSc > 0.3) {
    bestPolicy = "LRU";
    reason = "Loop/temporal locality pattern detected (score=" +
             std::to_string(loopSc).substr(0, 4) + ")";
  }

  if (bestPolicy != currentPolicyName_) {
    PolicySwitchEvent evt;
    evt.accessIndex = accessIndex;
    evt.fromPolicy = currentPolicyName_;
    evt.toPolicy = bestPolicy;
    evt.reason = reason;
    switchLog_.push_back(evt);

    // Rebuild engine with new policy preserving state
    auto state = engine_->getState();
    if (bestPolicy == "LRU")
      engine_ = std::make_unique<LRUCache>(capacity_);
    else if (bestPolicy == "FIFO")
      engine_ = std::make_unique<FIFOCache>(capacity_);
    else if (bestPolicy == "LFU")
      engine_ = std::make_unique<LFUCache>(capacity_);
    else if (bestPolicy == "LIFO")
      engine_ = std::make_unique<LIFOCache>(capacity_);

    // Warm up the new engine with current state
    for (int k : state)
      engine_->access(k);
    currentPolicyName_ = bestPolicy;
  }
}

double AdaptiveController::sequentialScore() const {
  if (recentAccesses_.size() < 2)
    return 0;
  int sequential = 0;
  for (size_t i = 1; i < recentAccesses_.size(); i++) {
    if (recentAccesses_[i] == recentAccesses_[i - 1] + 1)
      sequential++;
  }
  return (double)sequential / (recentAccesses_.size() - 1);
}

double AdaptiveController::loopScore() const {
  if (recentAccesses_.size() < 10)
    return 0;
  // Check for repeating subsequences
  std::unordered_map<int, int> freq;
  for (int k : recentAccesses_)
    freq[k]++;
  int repeated = 0;
  for (auto &p : freq) {
    if (p.second > 2)
      repeated++;
  }
  double uniqueRatio = (double)freq.size() / recentAccesses_.size();
  return (1.0 - uniqueRatio) * ((double)repeated / freq.size());
}

double AdaptiveController::hotspotScore() const {
  if (recentAccesses_.empty())
    return 0;
  std::unordered_map<int, int> freq;
  for (int k : recentAccesses_)
    freq[k]++;
  int maxFreq = 0;
  for (auto &p : freq)
    maxFreq = std::max(maxFreq, p.second);
  return (double)maxFreq / recentAccesses_.size();
}

CacheMetrics AdaptiveController::getMetrics() const {
  return engine_->getMetrics();
}

std::vector<int> AdaptiveController::getState() const {
  return engine_->getState();
}

std::string AdaptiveController::currentPolicy() const {
  return currentPolicyName_;
}

std::vector<PolicySwitchEvent> AdaptiveController::getSwitchLog() const {
  return switchLog_;
}
