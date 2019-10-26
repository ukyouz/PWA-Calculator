(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{6:function(e,t,n){"use strict";
/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */let o=null;const s=document.getElementById("butInstall");s.addEventListener("click",(function(e){o.prompt(),e.srcElement.setAttribute("hidden",!0),o.userChoice.then(e=>{"accepted"===e.outcome?console.log("User accepted the A2HS prompt",e):console.log("User dismissed the A2HS prompt",e),o=null})})),window.addEventListener("beforeinstallprompt",(function(e){o=e,s.removeAttribute("hidden")})),window.addEventListener("appinstalled",(function(e){console.log("Weather App was installed.",e)}))}}]);