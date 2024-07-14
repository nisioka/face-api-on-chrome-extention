import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {crx, defineManifest} from "@crxjs/vite-plugin";

export default defineConfig((opt) => {
  return {
    root: 'src',
    build: {
      outDir: '../dist',
      rollupOptions: {
        input: {
          content_script: resolve(__dirname, 'src/content_script.ts'),
          popup: resolve(__dirname, 'src/popup.ts')
        },
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
    plugins: [crx({manifest})],
  };
});

const manifest = defineManifest({
  manifest_version: 3,
  name: "Chrome Extension Sample",
  description: "Chrome Extension Sample",
  version: "0.1.1",
  minimum_chrome_version: "23",
  icons: {
    16: "icons/logo.png",
    24: "icons/logo.png",
    48: "icons/logo.png",
    128: "icons/logo.png"
  },
  permissions: [
    "webRequest",
    "activeTab",
    "storage"
  ],
  content_scripts: [
    {
      css: [
        "css/content_css.css"
      ],
      js: [
        "content_script.ts"
      ],
      matches: [
        "<all_urls>"
      ],
    }
  ],
  web_accessible_resources: [
    {
      matches: ["<all_urls>"],
      resources: [
        "css/content_css.css",
        "icons/loading.gif",
        "weights/ssd_mobilenetv1.weights",
        "weights/face_landmark_68_model.weights",
        "weights/face_landmark_68_tiny_model.weights",
        "weights/face_recognition_model.weights"
      ]
    }
  ],
  action: {
    default_popup: "popup.html"
  }

});
