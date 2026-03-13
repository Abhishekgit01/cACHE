#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>

struct CacheMetrics {
    int totalAccesses = 0;
    int hits = 0;
    int misses = 0;
    int evictions = 0;
    int coldMisses = 0;
    int capacityMisses = 0;
    int conflictMisses = 0;
    double hitRate = 0.0;
    double missRate = 0.0;
    double avgLatency = 0.0;
    bool thrashing = false;
    double evictionRate = 0.0;
};

struct AccessResult {
    bool hit;
    int evictedKey; // -1 if no eviction
};

struct CacheBlock {
    int key;
    bool isHit;
    bool isEviction;
};

class CacheEngine {
public:
    virtual ~CacheEngine() = default;
    virtual AccessResult access(int key) = 0;
    virtual std::vector<int> getState() const = 0;
    virtual std::string policyName() const = 0;
    virtual void clear() = 0;

    void updateMetrics(int key, const AccessResult& result);
    CacheMetrics getMetrics() const;
    std::vector<CacheBlock> getBlocks() const;

protected:
    int capacity_;
    CacheMetrics metrics_;
    std::unordered_set<int> everSeen_;
    std::unordered_map<int, int> frequencyMap_;

    static constexpr double CACHE_LATENCY = 1.0;
    static constexpr double RAM_LATENCY = 100.0;
    static constexpr double THRASHING_THRESHOLD = 0.4;
};
