# TierLister

A cool **FOSS** tool to create tierlists — built using **Tauri**, **SvelteKit**, and **TypeScript**.

---

<img width="600" height="400" alt="image" src="https://github.com/user-attachments/assets/6784d9fe-1457-4534-98d5-bded643eca1b" />

<img width="600" height="400" alt="image" src="https://github.com/user-attachments/assets/5b434fc8-23a6-4702-a356-941ddba7bc62" />

<img width="600" height="400" alt="image" src="https://github.com/user-attachments/assets/c283f78f-e149-4bd8-bec2-accdac2fa451" />


---

## 📥 How to Install (End Users)

To use TierLister without setting up a development environment:

👉 **Download the latest release** from the [GitHub Releases page](https://github.com/eduardoghi/tierlister/releases).

---

## 💻 For Developers

### 📦 Development Prerequisites

These are only required **if you’re building from source** or running in development mode:

* [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/downloads/) <img width="400" height="300" alt="Build Tools screenshot" src="https://github.com/user-attachments/assets/e37f06f6-f700-4eea-ad9f-6788431540c3" />
* [Node.js](https://nodejs.org/en/download)
* [Rust](https://www.rust-lang.org/tools/install)
* [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section)
  *(Most modern Windows systems already have this.)*

---

## 🚀 Clone & Install (Development)

```bash
git clone https://github.com/eduardoghi/tierlister.git
cd tierlister
npm install
```

---

## 🧪 Run in Development

```bash
npm run tauri dev
```

---

## 🏗️ Build for Release

```bash
npm run tauri build
```

---

## 📁 Build Artifacts (Default Path)

```
src-tauri\target\release\bundle
