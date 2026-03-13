cmake_minimum_required(VERSION 3.10)
project(CacheSimulator)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(cache_sim
    main.cpp
    cache_engine.cpp
    policies/lru.cpp
    policies/fifo.cpp
    policies/lfu.cpp
    policies/lifo.cpp
    adaptive_controller.cpp
)
