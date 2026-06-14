# 🎵 Decibel

A high-performance, real-time audio analysis and decibel-meter web application built with **React**, **Vite**, and the native **Web Audio API**. 

Features instant server start, seamless Hot Module Replacement (HMR), and a fluid, low-latency UI optimized for tracking environmental sound levels and audio frequencies.

---

## ✨ Features

* **Real-time Decibel Metering:** Accurate calculation of Sound Pressure Levels (SPL) using the browser's microphone stream.
* **Live Frequency Visualizer:** Clean canvas or SVG-based audio spectrum rendering (Waveform/Bar formats).
* **Audio Stats Tracking:** Instantly displays real-time `Min`, `Max`, and `Average` decibel thresholds.
* **Responsive Control Panel:** Quick toggle controls to start, pause, or mute audio tracking tracking seamlessly.
* **Blazing Fast DX:** Bundled via Vite with HMR for near-instantaneous development feedback loops.

---

## 🛠️ Architecture & Web Audio Pipeline

The application captures real-time environment sound using standard Web API specifications:

$$\text{User Microphone} \longrightarrow \text{MediaStreamAudioSourceNode} \longrightarrow \text{AnalyserNode (FFT)} \longrightarrow \text{Decibel State Calculation}$$

* **FFT Size:** Configured to sample high/low audio frequencies smoothly.
* **Smoothing Time Constant:** Applied to level out radical frame spikes for readable visual charts.

---

## 🚀 Tech Stack

* **Frontend Framework:** React (Functional Components & Hooks)
* **Build Tooling:** Vite (utilizing fast development bundling)
* **Audio Engine:** Web Audio API (`AudioContext`, `AnalyserNode`)
* **Linting & Code Quality:** ESLint with recommended React guidelines

---

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### Installation

1. **Clone the Repository:**
```bash
   git clone [https://github.com/aniruthramidi/decibel.git](https://github.com/aniruthramidi/decibel.git)
   cd decibel
