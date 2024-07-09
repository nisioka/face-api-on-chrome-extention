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
          // popup: resolve(__dirname, 'src/hello.html')
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
  version: "0.1.0",
  minimum_chrome_version: "23",
  icons: {
    16: "icons/logo.png",
    24: "icons/logo.png",
    48: "icons/logo.png",
    128: "icons/logo.png"
  },
  permissions: [
    "webRequest",
    "activeTab"
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
      run_at: "document_end"
    }
  ],
  web_accessible_resources: [
    {
      matches: ["<all_urls>"],
      resources: [
        "css/content_css.css",
        "weights/ssd_mobilenetv1.weights"
      ]
    }
  ]
});
