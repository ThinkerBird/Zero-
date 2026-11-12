/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-f0c192c2'], (function (workbox) { 'use strict';

  importScripts("sw-notifications.js");
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "sw-notifications.js",
    "revision": "477300dad9c11b0730d5643bb802141a"
  }, {
    "url": "index.html",
    "revision": "21e2d9fec97b8cfb7f7e751b6a11bfd9"
  }, {
    "url": "favicon.svg",
    "revision": "c04695f7f572eb9e67eb54ff523b3501"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8af0e4d4104a7790ea58d0a8585826cb"
  }, {
    "url": "404.html",
    "revision": "21e2d9fec97b8cfb7f7e751b6a11bfd9"
  }, {
    "url": "icons/icon-maskable-512.png",
    "revision": "4165a7f41b1350593e6bc25870dfda99"
  }, {
    "url": "icons/icon-512.png",
    "revision": "4165a7f41b1350593e6bc25870dfda99"
  }, {
    "url": "icons/icon-192.png",
    "revision": "2b1b6bcde85b1ef64a5c3e2330206e14"
  }, {
    "url": "icons/favicon.svg",
    "revision": "c04695f7f572eb9e67eb54ff523b3501"
  }, {
    "url": "icons/favicon-96x96.png",
    "revision": "51c9b2ca810dc6415f81bf45e543ab15"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "8af0e4d4104a7790ea58d0a8585826cb"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-D5pBCsJR.js",
    "revision": null
  }, {
    "url": "assets/web-Ci_xnX19.js",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-vietnamese-600-normal-OWROknRo.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-vietnamese-500-normal-DNRqzVM1.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-vietnamese-400-normal-CqNFfHCs.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-ext-600-normal-DObL3zCW.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-ext-600-normal-BfB_LPfz.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-ext-500-normal-ckzbgY84.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-ext-500-normal-Cut-4mMH.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-ext-400-normal-fXTG6kC5.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-ext-400-normal-Bc8Ftmh3.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-600-normal-C8RAYTDA.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-600-normal-BfsvjouI.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-500-normal-CJOVTJB7.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-500-normal-BWZEU5yA.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-400-normal-V6pRDFza.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-latin-400-normal-6-qcROiO.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-greek-600-normal-mc2nkWzM.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-greek-600-normal-H7WoG9Et.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-greek-500-normal-JpySY46c.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-greek-500-normal-D7SFKleX.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-greek-400-normal-C190GLew.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-greek-400-normal-B9oWc5Lo.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-cyrillic-600-normal-EVf6-Yzo.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-cyrillic-600-normal-8K4wrrwR.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-cyrillic-500-normal-DmUKJPL_.woff2",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-cyrillic-500-normal-DJqRU3vO.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-cyrillic-400-normal-ugxPyKxw.woff",
    "revision": null
  }, {
    "url": "assets/jetbrains-mono-cyrillic-400-normal-BEIGL1Tu.woff2",
    "revision": null
  }, {
    "url": "assets/index-CHhHAX9O.css",
    "revision": null
  }, {
    "url": "assets/index-B_rUJDGq.js",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-vietnamese-full-normal-D967Jins.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-tifinagh-full-normal-Pq2HyUjR.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-syriac-full-normal-CpRpKAhq.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-symbols-full-normal-Cu4Yx71x.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-nushu-full-normal-CfN8nJbD.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-math-full-normal-DBTmLsS9.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-latin-full-normal-BjtmYWLj.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-latin-ext-full-normal-CU3a2MK5.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-cherokee-full-normal-B8tzPoP3.woff2",
    "revision": null
  }, {
    "url": "assets/google-sans-flex-canadian-aboriginal-full-normal-CmFlc3F6.woff2",
    "revision": null
  }, {
    "url": "assets/creepster-latin-400-normal-DnKpM-ys.woff2",
    "revision": null
  }, {
    "url": "assets/creepster-latin-400-normal-DFidaany.woff",
    "revision": null
  }, {
    "url": "assets/aistudio/web-app-manifest-512x512_60da9ef7.png",
    "revision": null
  }, {
    "url": "assets/aistudio/web-app-manifest-192x192_3299a7ed.png",
    "revision": null
  }, {
    "url": "assets/aistudio/favicon_25969634.svg",
    "revision": null
  }, {
    "url": "assets/aistudio/favicon-96x96_06a1da0e.png",
    "revision": null
  }, {
    "url": "assets/aistudio/apple-touch-icon_6d469a77.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_20261112-124635_1_6841d4ed.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8af0e4d4104a7790ea58d0a8585826cb"
  }, {
    "url": "favicon.svg",
    "revision": "c04695f7f572eb9e67eb54ff523b3501"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "8af0e4d4104a7790ea58d0a8585826cb"
  }, {
    "url": "icons/favicon-96x96.png",
    "revision": "51c9b2ca810dc6415f81bf45e543ab15"
  }, {
    "url": "icons/favicon.svg",
    "revision": "c04695f7f572eb9e67eb54ff523b3501"
  }, {
    "url": "icons/icon-192.png",
    "revision": "2b1b6bcde85b1ef64a5c3e2330206e14"
  }, {
    "url": "icons/icon-512.png",
    "revision": "4165a7f41b1350593e6bc25870dfda99"
  }, {
    "url": "icons/icon-maskable-512.png",
    "revision": "4165a7f41b1350593e6bc25870dfda99"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4db37ef4776783a609cfd95c5df9c44a"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
