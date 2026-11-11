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
    "url": "index.html",
    "revision": "c490fe3f32c59984137062fa49d11936"
  }, {
    "url": "favicon.svg",
    "revision": "c04695f7f572eb9e67eb54ff523b3501"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8af0e4d4104a7790ea58d0a8585826cb"
  }, {
    "url": "404.html",
    "revision": "c490fe3f32c59984137062fa49d11936"
  }, {
    "url": "icons/icon-maskable-512.png",
    "revision": "f3bede31f9ae36c555f028b5b04c72af"
  }, {
    "url": "icons/icon-512.png",
    "revision": "f3bede31f9ae36c555f028b5b04c72af"
  }, {
    "url": "icons/icon-192.png",
    "revision": "627af0f313925eac1a16d8ff0cc4d0bf"
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
    "url": "assets/inter-vietnamese-700-normal-DlLaEgI2.woff2",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-700-normal-BZaoP0fm.woff",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-600-normal-Cc8MFFhd.woff2",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-600-normal-BuLX-rYi.woff",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-500-normal-mJboJaSs.woff",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-500-normal-DOriooB6.woff2",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-400-normal-DMkecbls.woff2",
    "revision": null
  }, {
    "url": "assets/inter-vietnamese-400-normal-Bbgyi5SW.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-700-normal-TidjK2hL.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-700-normal-Ca8adRJv.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-600-normal-D2bJ5OIk.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-600-normal-CIVaiw4L.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-500-normal-CV4jyFjo.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-500-normal-BxGbmqWO.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-400-normal-C1nco2VV.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-ext-400-normal-77YHD8bZ.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-700-normal-Yt3aPRUw.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-700-normal-BLAVimhd.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-600-normal-LgqL8muc.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-600-normal-CiBQ2DWP.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-500-normal-Cerq10X2.woff2",
    "revision": null
  }, {
    "url": "assets/inter-latin-500-normal-BL9OpVg8.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-400-normal-CyCys3Eg.woff",
    "revision": null
  }, {
    "url": "assets/inter-latin-400-normal-C38fXH4l.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-700-normal-qfdV9bQt.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-700-normal-BoQ6DsYi.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-600-normal-DRtmH8MT.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-600-normal-B8X0CLgF.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-500-normal-C4iEst2y.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-500-normal-2j5mBUwD.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-400-normal-KugGGMne.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-ext-400-normal-DGGRlc-M.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-700-normal-C3JjAnD8.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-700-normal-BUv2fZ6O.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-600-normal-plRanbMR.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-600-normal-BZpKdvQh.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-500-normal-Xzm54t5V.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-500-normal-BIZE56-Y.woff2",
    "revision": null
  }, {
    "url": "assets/inter-greek-400-normal-q2sYcFCs.woff",
    "revision": null
  }, {
    "url": "assets/inter-greek-400-normal-B4URO6DV.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-700-normal-LO58E6JB.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-700-normal-BjwYoWNd.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-600-normal-Dfes3d0z.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-600-normal-Bcila6Z-.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-500-normal-BmqWE9Dz.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-500-normal-B0yAr1jD.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-400-normal-DQukG94-.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-ext-400-normal-BQZuk6qB.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-700-normal-DrXBdSj3.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-700-normal-CjBOestx.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-600-normal-CWCymEST.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-600-normal-4D_pXhcN.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-500-normal-CxZf_p3X.woff",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-500-normal-BasfLYem.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-400-normal-obahsSVq.woff2",
    "revision": null
  }, {
    "url": "assets/inter-cyrillic-400-normal-HOLc17fK.woff",
    "revision": null
  }, {
    "url": "assets/index-Tj-MRSIv.css",
    "revision": null
  }, {
    "url": "assets/index-MzKkoAuR.js",
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
    "revision": "627af0f313925eac1a16d8ff0cc4d0bf"
  }, {
    "url": "icons/icon-512.png",
    "revision": "f3bede31f9ae36c555f028b5b04c72af"
  }, {
    "url": "icons/icon-maskable-512.png",
    "revision": "f3bede31f9ae36c555f028b5b04c72af"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4db37ef4776783a609cfd95c5df9c44a"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
