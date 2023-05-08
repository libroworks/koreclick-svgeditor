// @ts-check

// Script run within the webview itself.
(function () {
  // Get a reference to the VS Code webview api.
  // We use this API to post messages back to our extension.

  // @ts-ignore
  const vscode = acquireVsCodeApi();
  let svgelems = null;
  let svgdom = null;
  const enum_class = 0;
  const enum_x1 = 1;
  const enum_y1 = 2;
  const enum_x2 = 3;
  const enum_y2 = 4;
  const enum_x3 = 5;
  const enum_y3 = 6;
  const enum_w = 7;
  const enum_h = 8;
  const enum_imgpath = 9;
  const enum_scale = 10;
  const enum_text = 11;
  const parameterlist = { defs: [], image: [enum_x1, enum_y1, enum_imgpath, enum_scale], rect: [enum_class, enum_x1, enum_y1, enum_w, enum_h], text: [enum_class, enum_x1, enum_y1, enum_text], polyline: [enum_class, enum_x1, enum_y1, enum_x2, enum_y2, enum_x3, enum_y3], line: [enum_class, enum_x1, enum_y1, enum_x2, enum_y2] };

  /* Render the document in the webview.
   */
  function updateContent(/** @type {string} */ text, /** @type {string} */ svguri, /** @type {number} */ lastSelect) {
    // SVGを表示
    console.log(svguri);
    if (!text) return;
    const imageSrcUtf8 = `data:image/svg+xml;utf-8,${encodeURIComponent(text)}`.replace(/\r|\n/g, "");

    const img_svg = /** @type {HTMLElement} */ (document.querySelector("#img_svg"));
    img_svg.setAttribute("src", imageSrcUtf8);

    // XML解析
    svgdom = null;
    svgelems = null;
    const parser = new DOMParser();
    svgdom = parser.parseFromString(text, "application/xml");
    if (svgdom.documentElement.nodeName == "parsererror") return;
    svgelems = svgdom.children[0].children;

    // const serializer = new XMLSerializer();

    // console.log(svgelems);

    // 要素をelemlistに表示
    const elemlist = /** @type {HTMLSelectElement} */ (document.querySelector("#kcins-elemlist"));
    elemlist.innerHTML = "";
    for (let index = 0; index < svgelems.length; index++) {
      // @ts-ignore
      elemlist.insertAdjacentHTML("beforeend", `<option>${index} ${svgelems[index].nodeName}.${svgelems[index].className.baseVal}</option>`);
    }
    console.log(`getlastselect is ${lastSelect}`);
    if (lastSelect > -1 && lastSelect < elemlist.length) {
      elemlist.selectedIndex = lastSelect;
    }

    // SVG要素選択イベント
    elemlist.onchange = function (e) {
      // console.log(e);
      // console.log(elemlist.selectedIndex);
      const cursvgnode = /** @type {SVGElement} */ svgelems[elemlist.selectedIndex];
      const kcinstype = /** @type {HTMLSelectElement} */ (document.querySelector("#kcins-type"));
      kcinstype.textContent = cursvgnode.nodeName;
      // 送信
      vscode.postMessage({ type: "select", lastSelect: elemlist.selectedIndex });
      console.log(`setlastselect is ${elemlist.selectedIndex}`);
      // input要素を非表示に
      const inputs = /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll("input"));
      // console.log(inputs);
      inputs.forEach(function (elem) {
        elem.disabled = true;
      });
      // SVG要素の値をinput要素に反映
      const enabledlist = parameterlist[cursvgnode.nodeName];
      if (enabledlist) {
        enabledlist.forEach(function (i) {
          inputs[i].disabled = false;
          switch (i) {
            case enum_class:
              inputs[i].value = cursvgnode.className.baseVal;
              break;
            case enum_x1:
              if (["rect", "image", "text"].includes(cursvgnode.nodeName)) {
                inputs[i].value = cursvgnode.getAttribute("x");
              } else if (cursvgnode.nodeName === "line") {
                inputs[i].value = cursvgnode.getAttribute("x1");
              }
              break;
            case enum_y1:
              if (["rect", "image", "text"].includes(cursvgnode.nodeName)) {
                inputs[i].value = cursvgnode.getAttribute("y");
              } else if (cursvgnode.nodeName === "line") {
                inputs[i].value = cursvgnode.getAttribute("y1");
              }
              break;
            case enum_x2:
              if (cursvgnode.nodeName === "line") {
                inputs[i].value = cursvgnode.getAttribute("x2");
              }
              break;
            case enum_y2:
              if (cursvgnode.nodeName === "line") {
                inputs[i].value = cursvgnode.getAttribute("y2");
              }
              break;
            case enum_w:
              if (cursvgnode.nodeName === "rect") {
                inputs[i].value = cursvgnode.getAttribute("width");
              }
              break;
            case enum_h:
              if (cursvgnode.nodeName === "rect") {
                inputs[i].value = cursvgnode.getAttribute("height");
              }
              break;
            case enum_text:
              if (cursvgnode.nodeName === "text") {
                inputs[i].value = cursvgnode.innerHTML;
              }
              break;
            case enum_scale:
              if (cursvgnode.nodeName === "image") {
                const scalevalue = cursvgnode.getAttribute("transform").replace(/[^0-9.]/g, "");
                inputs[i].value = scalevalue;
              }
              break;
          }
        });
        // polyline用の処理
        if (cursvgnode.nodeName === "polyline") {
          const points = cursvgnode.getAttribute("points").trim().split(" ");
          points.forEach(function (v, index) {
            const values = v.split(",");
            if (index === 0) {
              inputs[enum_x1].value = values[0];
              inputs[enum_y1].value = values[1];
            } else if (index === 1) {
              inputs[enum_x2].value = values[0];
              inputs[enum_y2].value = values[1];
            } else {
              inputs[enum_x3].value = values[0];
              inputs[enum_y3].value = values[1];
            }
          });
        }
      }
    };

    // 値変更の反映イベント
    const inputs = /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll("input"));
    // クラス名変更
    inputs[enum_class].onchange = function (e) {
      if (elemlist.selectedIndex < 0) return;
      if (svgelems === null) return;
      const cursvgnode = /** @type {SVGElement} */ svgelems[elemlist.selectedIndex];
      // @ts-ignore
      cursvgnode.setAttribute("class", e.target.value);
      const serializer = new XMLSerializer();
      const xmlstr = serializer.serializeToString(svgdom);
      vscode.postMessage({ type: "update", text: xmlstr, lastSelect: elemlist.selectedIndex });
      console.log(`postMessage is ${elemlist.selectedIndex}`);
    };
    // x1変更
    inputs[enum_x1].onchange = function (e) {
      if (elemlist.selectedIndex < 0) return;
      if (svgelems === null) return;
      console.log(inputs[enum_x1].value);
      const cursvgnode = /** @type {SVGElement} */ svgelems[elemlist.selectedIndex];
      if (["rect", "image", "text"].includes(cursvgnode.nodeName)) {
        cursvgnode.setAttribute("x", inputs[enum_x1].value);
      } else if (cursvgnode.nodeName === "line") {
        cursvgnode.setAttribute("x1", inputs[enum_x1].value);
      } else if (cursvgnode.nodeName === "polyline") {
        cursvgnode.setAttribute("points", `${inputs[enum_x1].value},${inputs[enum_y1].value} ${inputs[enum_x2].value},${inputs[enum_y2].value} ${inputs[enum_x3].value},${inputs[enum_y3].value}`);
      }
      const serializer = new XMLSerializer();
      const xmlstr = serializer.serializeToString(svgdom);
      const imageSrcUtf8 = `data:image/svg+xml;utf-8,${encodeURIComponent(xmlstr)}`.replace(/\r|\n/g, "");
      const img_svg = /** @type {HTMLElement} */ (document.querySelector("#img_svg"));
      img_svg.setAttribute("src", imageSrcUtf8);
      // vscode.postMessage({ type: "update", text: xmlstr, lastSelect: elemlist.selectedIndex });
    };
    // 遷移時かkeyup時に反映
    inputs[enum_x1].onblur = function (e) {
      const serializer = new XMLSerializer();
      const xmlstr = serializer.serializeToString(svgdom);
      vscode.postMessage({ type: "update", text: xmlstr, lastSelect: elemlist.selectedIndex });
    };
    inputs[enum_x1].onkeyup = function (e) {
      const serializer = new XMLSerializer();
      const xmlstr = serializer.serializeToString(svgdom);
      vscode.postMessage({ type: "update", text: xmlstr, lastSelect: elemlist.selectedIndex });
      console.log("keyup and update");
    };
    // for (let inputidx = enum_x1; inputidx < enum_h; inputidx++) {
    //   inputs[inputidx].addEventListener("change", function (e) {
    //     if (elemlist.selectedIndex < 0) return;
    //     if (svgelems === null) return;
    //     const cursvgnode = /** @type {SVGElement} */ svgelems[elemlist.selectedIndex];
    //     // @ts-ignore
    //     const id = e.target.getAttribute("id");
    //     switch (id) {
    //       case "kcins-x1":
    //         if (["rect", "image", "text"].includes(cursvgnode.nodeName)) {
    //           cursvgnode.setAttribute("x", inputs[inputidx].value);
    //         } else if (cursvgnode.nodeName === "line") {
    //           cursvgnode.setAttribute("x1", inputs[inputidx].value);
    //         } else if (cursvgnode.nodeName === "polyline") {
    //           cursvgnode.setAttribute("points", `${inputs[enum_x1].value},inputs[enum_y1].value} inputs[enum_x2].value},inputs[enum_y2].value inputs[enum_x3].value,inputs[enum_y3].value}}}`);
    //         }
    //         break;
    //       case "kcins-y1":
    //         if (["rect", "image", "text"].includes(cursvgnode.nodeName)) {
    //           cursvgnode.setAttribute("y", inputs[inputidx].value);
    //         } else if (cursvgnode.nodeName === "line") {
    //           cursvgnode.setAttribute("y1", inputs[inputidx].value);
    //         } else if (cursvgnode.nodeName === "polyline") {
    //           cursvgnode.setAttribute("points", `${inputs[enum_x1].value},inputs[enum_y1].value} inputs[enum_x2].value},inputs[enum_y2].value inputs[enum_x3].value,inputs[enum_y3].value}}}`);
    //         }
    //         break;
    //       case enum_x2:
    //         if (cursvgnode.nodeName === "line") {
    //           cursvgnode.setAttribute("x2", inputs[inputidx].value);
    //         } else if (cursvgnode.nodeName === "polyline") {
    //           cursvgnode.setAttribute("points", `${inputs[enum_x1].value},inputs[enum_y1].value} inputs[enum_x2].value},inputs[enum_y2].value inputs[enum_x3].value,inputs[enum_y3].value}}}`);
    //         }
    //         break;
    //       case enum_y2:
    //         if (cursvgnode.nodeName === "line") {
    //           cursvgnode.getAttribute("y2", inputs[inputidx].value);
    //         } else if (cursvgnode.nodeName === "polyline") {
    //           cursvgnode.setAttribute("points", `${inputs[enum_x1].value},inputs[enum_y1].value} inputs[enum_x2].value},inputs[enum_y2].value inputs[enum_x3].value,inputs[enum_y3].value}}}`);
    //         }
    //         break;
    //       case enum_w:
    //         if (cursvgnode.nodeName === "rect") {
    //           cursvgnode.getAttribute("width", inputs[inputidx].value);
    //         }
    //         break;
    //       case enum_h:
    //         if (cursvgnode.nodeName === "rect") {
    //           cursvgnode.getAttribute("height", inputs[inputidx].value);
    //         }
    //     }
    //     const serializer = new XMLSerializer();
    //     const xmlstr = serializer.serializeToString(svgdom);
    //     vscode.postMessage({ type: "update", text: xmlstr, lastSelect: elemlist.selectedIndex });
    //   });
    // }
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "update":
        const text = message.text;
        const svguri = message.svguri;
        const lastSelect = message.lastSelect;

        // Update our webview's content
        updateContent(text, svguri, lastSelect);

        // Then persist state information.
        // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
        vscode.setState({ text, svguri, lastSelect });

        return;
    }
  });

  // Webviews are normally torn down when not visible and re-created when they become visible again.
  // State lets us save information across these re-loads
  const state = vscode.getState();
  if (state) {
    updateContent(state.text, state.svguri, state.lastSelect);
  }
})();
