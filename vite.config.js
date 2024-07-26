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
  name: "Family Photo Finder",
  description: "Webページの写真の中から顔を自動検出して強調表示するChrome拡張機能です。",
  version: "1.0.1",
  minimum_chrome_version: "88",
  icons: {
    16: "icons/logo.png",
    24: "icons/logo.png",
    48: "icons/logo.png",
    128: "icons/logo.png"
  },
  permissions: [
    "storage"
  ],
  content_scripts: [
    {
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
        "weights/ssd_mobilenetv1.weights",
        "weights/face_landmark_68_model.weights",
        "weights/face_recognition_model.weights"
      ]
    }
  ],
  action: {
    default_popup: "popup.html"
  }

});
