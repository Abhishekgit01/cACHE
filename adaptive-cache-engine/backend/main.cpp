#include "adaptive_controller.hpp"
#include "cache_engine.hpp"
#include "policies/fifo.hpp"
#include "policies/lfu.hpp"
#include "policies/lifo.hpp"
#include "policies/lru.hpp"
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>


// Minimal JSON array parser for workloads
std::vector<int> parseTrace(const std::string &json, const std::string &key) {
  std::vector<int> trace;
  std::string searchKey = "\"" + key + "\"";
  size_t pos = json.find(searchKey);
  if (pos == std::string::npos)
    return trace;
  size_t start = json.find('[', pos);
  size_t end = json.find(']', start);
  if (start == std::string::npos || end == std::string::npos)
    return trace;
  std::string arr = json.substr(start + 1, end - start - 1);
  std::stringstream ss(arr);
  std::string token;
  while (std::getline(ss, token, ',')) {
    try {
      trace.push_back(std::stoi(token));
    } catch (...) {
    }
  }
  return trace;
}

int main(int argc, char *argv[]) {
  std::string policy = "lru";
  int cacheSize = 4;
  std::string workload = "sequential";
  std::string dataPath = "../data/workloads.json";

  for (int i = 1; i < argc; i++) {
    std::string arg = argv[i];
    if (arg == "--policy" && i + 1 < argc)
      policy = argv[++i];
    else if (arg == "--size" && i + 1 < argc)
      cacheSize = std::stoi(argv[++i]);
    else if (arg == "--workload" && i + 1 < argc)
      workload = argv[++i];
    else if (arg == "--data" && i + 1 < argc)
      dataPath = argv[++i];
  }

  std::ifstream file(dataPath);
  if (!file.is_open()) {
    std::cerr << "Error: Cannot open " << dataPath << std::endl;
    return 1;
  }
  std::string json((std::istreambuf_iterator<char>(file)),
                   std::istreambuf_iterator<char>());
  file.close();

  std::vector<int> trace = parseTrace(json, workload);
  if (trace.empty()) {
    std::cerr << "Error: Workload '" << workload << "' not found" << std::endl;
    return 1;
  }

  // Run simulation
  std::vector<std::vector<int>> stateHistory;
  std::vector<bool> hitHistory;
  std::vector<int> evictHistory;
  std::vector<std::string> policyLogEntries;
  std::unordered_map<int, int> accessFrequency;

  if (policy == "adaptive") {
    AdaptiveController ctrl(cacheSize);
    for (int key : trace) {
      auto res = ctrl.access(key);
      stateHistory.push_back(ctrl.getState());
      hitHistory.push_back(res.hit);
      evictHistory.push_back(res.evictedKey);
      accessFrequency[key]++;
    }
    auto metrics = ctrl.getMetrics();
    auto switchLog = ctrl.getSwitchLog();

    // Output JSON
    std::cout << "{";
    std::cout << "\"policy\":\"adaptive\",\"currentPolicy\":\""
              << ctrl.currentPolicy() << "\",";
    std::cout << "\"hitRate\":" << metrics.hitRate << ",";
    std::cout << "\"missRate\":" << metrics.missRate << ",";
    std::cout << "\"latency\":" << metrics.avgLatency << ",";
    std::cout << "\"evictions\":" << metrics.evictions << ",";
    std::cout << "\"thrashing\":" << (metrics.thrashing ? "true" : "false")
              << ",";
    std::cout << "\"coldMisses\":" << metrics.coldMisses << ",";
    std::cout << "\"capacityMisses\":" << metrics.capacityMisses << ",";
    std::cout << "\"conflictMisses\":" << metrics.conflictMisses << ",";
    std::cout << "\"totalAccesses\":" << metrics.totalAccesses << ",";
    std::cout << "\"evictionRate\":" << metrics.evictionRate << ",";

    // Cache state
    auto state = ctrl.getState();
    std::cout << "\"cacheState\":[";
    for (size_t i = 0; i < state.size(); i++) {
      if (i > 0)
        std::cout << ",";
      std::cout << state[i];
    }
    std::cout << "],";

    // Frequency map
    std::cout << "\"frequencyMap\":{";
    bool first = true;
    for (auto &p : accessFrequency) {
      if (!first)
        std::cout << ",";
      std::cout << "\"" << p.first << "\":" << p.second;
      first = false;
    }
    std::cout << "},";

    // Policy switch log
    std::cout << "\"policyLog\":[";
    for (size_t i = 0; i < switchLog.size(); i++) {
      if (i > 0)
        std::cout << ",";
      std::cout << "{\"index\":" << switchLog[i].accessIndex << ",\"from\":\""
                << switchLog[i].fromPolicy << "\",\"to\":\""
                << switchLog[i].toPolicy << "\",\"reason\":\""
                << switchLog[i].reason << "\"}";
    }
    std::cout << "]";
    std::cout << "}" << std::endl;
  } else {
    CacheEngine *engine = nullptr;
    if (policy == "lru")
      engine = new LRUCache(cacheSize);
    else if (policy == "fifo")
      engine = new FIFOCache(cacheSize);
    else if (policy == "lfu")
      engine = new LFUCache(cacheSize);
    else if (policy == "lifo")
      engine = new LIFOCache(cacheSize);
    else {
      std::cerr << "Unknown policy: " << policy << std::endl;
      return 1;
    }

    for (int key : trace) {
      auto res = engine->access(key);
      stateHistory.push_back(engine->getState());
      hitHistory.push_back(res.hit);
      evictHistory.push_back(res.evictedKey);
      accessFrequency[key]++;
    }
    auto metrics = engine->getMetrics();

    std::cout << "{";
    std::cout << "\"policy\":\"" << engine->policyName() << "\",";
    std::cout << "\"hitRate\":" << metrics.hitRate << ",";
    std::cout << "\"missRate\":" << metrics.missRate << ",";
    std::cout << "\"latency\":" << metrics.avgLatency << ",";
    std::cout << "\"evictions\":" << metrics.evictions << ",";
    std::cout << "\"thrashing\":" << (metrics.thrashing ? "true" : "false")
              << ",";
    std::cout << "\"coldMisses\":" << metrics.coldMisses << ",";
    std::cout << "\"capacityMisses\":" << metrics.capacityMisses << ",";
    std::cout << "\"conflictMisses\":" << metrics.conflictMisses << ",";
    std::cout << "\"totalAccesses\":" << metrics.totalAccesses << ",";
    std::cout << "\"evictionRate\":" << metrics.evictionRate << ",";

    auto state = engine->getState();
    std::cout << "\"cacheState\":[";
    for (size_t i = 0; i < state.size(); i++) {
      if (i > 0)
        std::cout << ",";
      std::cout << state[i];
    }
    std::cout << "],";

    std::cout << "\"frequencyMap\":{";
    bool first = true;
    for (auto &p : accessFrequency) {
      if (!first)
        std::cout << ",";
      std::cout << "\"" << p.first << "\":" << p.second;
      first = false;
    }
    std::cout << "},";

    std::cout << "\"policyLog\":[]";
    std::cout << "}" << std::endl;
    delete engine;
  }
  return 0;
}
