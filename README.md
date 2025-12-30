# TierLister

A cool **FOSS** tool to create tierlists — built using **Tauri**, **SvelteKit**, and **TypeScript**.

---

<img width="1000" height="800" alt="image" src="https://github.com/user-attachments/assets/b70f89c4-bfb4-4250-84c9-4a5edb8de44a" />

<img width="1000" height="800" alt="image" src="https://github.com/user-attachments/assets/c858b12d-8bcc-4ea2-af9b-b2435d3972eb" />

<img width="1000" height="800" alt="image" src="https://github.com/user-attachments/assets/ac31105b-7795-4a06-8281-960f00a6ec2e" />

## 📝 Notes

You can attach **notes** to tierlist items to keep extra context (e.g. why it’s ranked there, reminders, tags, etc.).

- **View note tooltip:** hold **Ctrl** and **hover** the item

  <img width="570" height="204" alt="image" src="https://github.com/user-attachments/assets/85868495-6040-4a75-a098-93ea49cb10cc" />

  <br />

- **Edit note:** hold **Ctrl** and **click** the item

  <img width="570" height="236" alt="image" src="https://github.com/user-attachments/assets/555f8088-60e3-4f50-b8de-4b2e55c01280" />



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
