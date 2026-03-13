const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ── Load workloads ──
const workloadsPath = path.join(__dirname, '..', 'data', 'workloads.json');
const workloads = JSON.parse(fs.readFileSync(workloadsPath, 'utf-8'));

// ── In-memory cache for last simulation results ──
let lastMetrics = null;
let lastPolicyLog = [];
let lastCacheState = [];
let lastFrequencyMap = {};
let lastStepByStep = [];

// ═══════════════════════════════════════════════════════════
//  CACHE POLICIES  (pure JS — works without C++ compiler)
// ═══════════════════════════════════════════════════════════

class LRUCache {
  constructor(cap) { this.cap = cap; this.map = new Map(); }
  get name() { return 'LRU'; }
  access(key) {
    if (this.map.has(key)) {
      const val = this.map.get(key);
      this.map.delete(key);
      this.map.set(key, val);
      return { hit: true, evicted: -1 };
    }
    let evicted = -1;
    if (this.map.size >= this.cap) {
      const first = this.map.keys().next().value;
      this.map.delete(first);
      evicted = first;
    }
    this.map.set(key, true);
    return { hit: false, evicted };
  }
  state() { return [...this.map.keys()].reverse(); }
  clear() { this.map.clear(); }
}

class FIFOCache {
  constructor(cap) { this.cap = cap; this.queue = []; this.set = new Set(); }
  get name() { return 'FIFO'; }
  access(key) {
    if (this.set.has(key)) return { hit: true, evicted: -1 };
    let evicted = -1;
    if (this.set.size >= this.cap) {
      evicted = this.queue.shift();
      this.set.delete(evicted);
    }
    this.queue.push(key);
    this.set.add(key);
    return { hit: false, evicted };
  }
  state() { return [...this.queue]; }
  clear() { this.queue = []; this.set.clear(); }
}

class LFUCache {
  constructor(cap) {
    this.cap = cap;
    this.keyFreq = new Map();
    this.freqKeys = new Map();
    this.minFreq = 0;
  }
  get name() { return 'LFU'; }
  access(key) {
    if (this.keyFreq.has(key)) {
      const freq = this.keyFreq.get(key);
      this.freqKeys.get(freq).delete(key);
      if (this.freqKeys.get(freq).size === 0) {
        this.freqKeys.delete(freq);
        if (this.minFreq === freq) this.minFreq++;
      }
      this.keyFreq.set(key, freq + 1);
      if (!this.freqKeys.has(freq + 1)) this.freqKeys.set(freq + 1, new Set());
      this.freqKeys.get(freq + 1).add(key);
      return { hit: true, evicted: -1 };
    }
    let evicted = -1;
    if (this.keyFreq.size >= this.cap) {
      const minSet = this.freqKeys.get(this.minFreq);
      const victim = minSet.values().next().value;
      minSet.delete(victim);
      if (minSet.size === 0) this.freqKeys.delete(this.minFreq);
      this.keyFreq.delete(victim);
      evicted = victim;
    }
    this.keyFreq.set(key, 1);
    if (!this.freqKeys.has(1)) this.freqKeys.set(1, new Set());
    this.freqKeys.get(1).add(key);
    this.minFreq = 1;
    return { hit: false, evicted };
  }
  state() { return [...this.keyFreq.keys()]; }
  clear() { this.keyFreq.clear(); this.freqKeys.clear(); this.minFreq = 0; }
}

class LIFOCache {
  constructor(cap) { this.cap = cap; this.stack = []; this.set = new Set(); }
  get name() { return 'LIFO'; }
  access(key) {
    if (this.set.has(key)) return { hit: true, evicted: -1 };
    let evicted = -1;
    if (this.set.size >= this.cap) {
      evicted = this.stack.pop();
      this.set.delete(evicted);
    }
    this.stack.push(key);
    this.set.add(key);
    return { hit: false, evicted };
  }
  state() { return [...this.stack]; }
  clear() { this.stack = []; this.set.clear(); }
}

// ═══════════════════════════════════════════════════════════
//  ADAPTIVE CONTROLLER
// ═══════════════════════════════════════════════════════════

function analyzePattern(window) {
  if (window.length < 10) return { seq: 0, loop: 0, hotspot: 0 };

  // Sequential score
  let seqCount = 0;
  for (let i = 1; i < window.length; i++) {
    if (window[i] === window[i - 1] + 1) seqCount++;
  }
  const seq = seqCount / (window.length - 1);

  // Hotspot score
  const freq = {};
  for (const k of window) freq[k] = (freq[k] || 0) + 1;
  const maxFreq = Math.max(...Object.values(freq));
  const hotspot = maxFreq / window.length;

  // Loop score
  const unique = Object.keys(freq).length;
  const uniqueRatio = unique / window.length;
  let repeated = 0;
  for (const v of Object.values(freq)) if (v > 2) repeated++;
  const loop = (1 - uniqueRatio) * (repeated / unique);

  return { seq, loop, hotspot };
}

function runSimulation(policyName, cacheSize, trace) {
  const WINDOW = 50;
  const INTERVAL = 20;
  const CACHE_LAT = 1;
  const RAM_LAT = 100;

  let engine;
  const createEngine = (name, sz) => {
    switch (name) {
      case 'FIFO': return new FIFOCache(sz);
      case 'LFU': return new LFUCache(sz);
      case 'LIFO': return new LIFOCache(sz);
      default: return new LRUCache(sz);
    }
  };

  const isAdaptive = policyName === 'adaptive';
  let currentPolicyName = isAdaptive ? 'LRU' : policyName;
  engine = createEngine(currentPolicyName, cacheSize);

  let hits = 0, misses = 0, evictions = 0;
  let coldMisses = 0, capacityMisses = 0;
  const everSeen = new Set();
  const freqMap = {};
  const policyLog = [];
  const recentWindow = [];
  const steps = [];

  for (let i = 0; i < trace.length; i++) {
    const key = trace[i];
    recentWindow.push(key);
    if (recentWindow.length > WINDOW) recentWindow.shift();

    // Adaptive switching
    if (isAdaptive && i > 0 && i % INTERVAL === 0 && recentWindow.length >= WINDOW) {
      const scores = analyzePattern(recentWindow);
      const evRate = evictions / (i + 1);
      let best = currentPolicyName;
      let reason = '';

      if (evRate > 0.4) {
        const order = ['LRU', 'LFU', 'FIFO', 'LIFO'];
        best = order[(order.indexOf(currentPolicyName) + 1) % order.length];
        reason = `Thrashing detected (evRate=${evRate.toFixed(2)})`;
      } else if (scores.seq > 0.6) {
        best = 'FIFO';
        reason = `Sequential pattern (score=${scores.seq.toFixed(2)})`;
      } else if (scores.hotspot > 0.4) {
        best = 'LFU';
        reason = `Hotspot pattern (score=${scores.hotspot.toFixed(2)})`;
      } else if (scores.loop > 0.3) {
        best = 'LRU';
        reason = `Loop/temporal pattern (score=${scores.loop.toFixed(2)})`;
      }

      if (best !== currentPolicyName) {
        policyLog.push({ index: i, from: currentPolicyName, to: best, reason });
        const oldState = engine.state();
        engine = createEngine(best, cacheSize);
        for (const k of oldState) engine.access(k);
        currentPolicyName = best;
      }
    }

    const res = engine.access(key);
    freqMap[key] = (freqMap[key] || 0) + 1;

    if (res.hit) {
      hits++;
    } else {
      misses++;
      if (!everSeen.has(key)) { coldMisses++; everSeen.add(key); }
      else capacityMisses++;
    }
    if (res.evicted >= 0) evictions++;

    steps.push({
      index: i,
      key,
      hit: res.hit,
      evicted: res.evicted,
      cacheState: [...engine.state()],
      policy: currentPolicyName
    });
  }

  const total = trace.length;
  const hitRate = hits / total;
  const missRate = misses / total;
  const evictionRate = evictions / total;
  const latency = hitRate * CACHE_LAT + missRate * RAM_LAT;
  const thrashing = evictionRate > 0.4;

  return {
    policy: isAdaptive ? 'adaptive' : currentPolicyName,
    currentPolicy: currentPolicyName,
    hitRate: parseFloat(hitRate.toFixed(4)),
    missRate: parseFloat(missRate.toFixed(4)),
    latency: parseFloat(latency.toFixed(2)),
    evictions,
    evictionRate: parseFloat(evictionRate.toFixed(4)),
    thrashing,
    coldMisses,
    capacityMisses,
    conflictMisses: 0,
    totalAccesses: total,
    cacheState: engine.state(),
    frequencyMap: freqMap,
    policyLog,
    steps
  };
}

// Run comparison across all policies
function runComparison(cacheSize, trace) {
  const policies = ['FIFO', 'LRU', 'LFU', 'LIFO', 'adaptive'];
  const results = {};
  for (const p of policies) {
    const r = runSimulation(p, cacheSize, trace);
    results[p] = {
      hitRate: r.hitRate,
      missRate: r.missRate,
      latency: r.latency,
      evictions: r.evictions,
      evictionRate: r.evictionRate,
      thrashing: r.thrashing
    };
  }
  return results;
}

// ═══════════════════════════════════════════════════════════
//  REST ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.post('/run-simulation', (req, res) => {
  try {
    const { policy = 'LRU', cacheSize = 4, workload = 'sequential', customTrace = [] } = req.body;
    let trace = workloads[workload];

    if (workload === 'custom') {
      trace = customTrace;
    }

    if (!trace || trace.length === 0) return res.status(400).json({ error: `Invalid or empty workload: ${workload}` });

    const result = runSimulation(policy, parseInt(cacheSize), trace);
    const comparison = runComparison(parseInt(cacheSize), trace);

    lastMetrics = result;
    lastPolicyLog = result.policyLog;
    lastCacheState = result.cacheState;
    lastFrequencyMap = result.frequencyMap;
    lastStepByStep = result.steps;

    res.json({ ...result, comparison });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/metrics', (_req, res) => {
  if (!lastMetrics) return res.json({ error: 'No simulation run yet' });
  res.json(lastMetrics);
});

app.get('/policy-switch-log', (_req, res) => {
  res.json(lastPolicyLog);
});

app.get('/cache-state', (_req, res) => {
  res.json({ cacheState: lastCacheState, frequencyMap: lastFrequencyMap });
});

app.get('/steps', (_req, res) => {
  res.json(lastStepByStep);
});

app.get('/workloads', (_req, res) => {
  res.json(Object.keys(workloads));
});

// ── Start ──
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n  🚀  Cache Simulation API running on http://localhost:${PORT}\n`);
  console.log('  Endpoints:');
  console.log('    POST /run-simulation   { policy, cacheSize, workload }');
  console.log('    GET  /metrics');
  console.log('    GET  /policy-switch-log');
  console.log('    GET  /cache-state');
  console.log('    GET  /steps');
  console.log('    GET  /workloads\n');
});
