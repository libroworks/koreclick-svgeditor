import * as vscode from "vscode";
import { getNonce } from "./util";

export class KoreClickEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new KoreClickEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(KoreClickEditorProvider.viewType, provider);
    return providerRegistration;
  }

  private static readonly viewType = "koreclick-svgeditor.svgedit";

  private static readonly scratchCharacters = ["😸", "😹", "😺", "😻", "😼", "😽", "😾", "🙀", "😿", "🐱"];

  private static baseUrl = "http://localhost:8800/";

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when our custom editor is opened.
   *
   *
   */
  public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
    // const workDir = vscode.workspace.workspaceFolders[0].uri;
    // console.log("**workspace is " + workDir.toString());
    // console.log("**workspace is " + vscode.Uri.joinPath(this.context.extensionUri, "media").toString());
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      // localResourceRoots: [workDir, vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: "update",
        text: document.getText(),
        svguri: `${KoreClickEditorProvider.baseUrl}test.svg`,
        // document.uri.toString(),
      });
    }

    // Hook up event handlers so that we can synchronize the webview with the text document.
    //
    // The text document acts as our model, so we have to sync change in the document to our
    // editor and sync changes in the editor back to the document.
    //
    // Remember that a single text document can also be shared between multiple custom
    // editors (this happens for example when you split a custom editor)

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        updateWebview();
      }
    });

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Receive message from the webview.
    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "add":
          this.addNewScratch(document);
          return;

        case "delete":
          this.deleteScratch(document, e.id);
          return;
      }
    });

    updateWebview();
  }

  /**
   * Get the static html used for the editor webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "koreclick.js"));

    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css"));

    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css"));

    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", "koreclick_ui.css"));

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet" />
        <link href="${styleVSCodeUri}" rel="stylesheet" />
        <link href="${styleMainUri}" rel="stylesheet" />
        <title>kore wo click</title>
      </head>
      <body>
        <div class="kc-container">
          <div class="notes">
            <img id="img_svg" />
          </div>
          <select id="kcins-elemlist" size="20" class="kc-elemlist">
            <option>svg width="100" height="40"</option>
          </select>
          <div class="kc-console">
            <div class="kc-inspector">
              <label id="kcins-type">type</label>
              <label>class</label>
              <input id="kcins-class" type="text" placeholder="class name"/>
              <label>x1</label>
              <input id="kcins-x1" type="number" step="0.1" placeholder="0"/>
              <label>y1</label>
              <input id="kcins-y1" type="number" step="0.1" placeholder="0"/>
              <label>x2</label>
              <input id="kcins-x2" type="number" step="0.1" placeholder="0"/>
              <label>y2</label>
              <input id="kcins-y2" type="number" step="0.1" placeholder="0"/>
              <label>w</label>
              <input id="kcins-w" type="number" step="0.1" placeholder="0"/>
              <label>h</label>
              <input id="kcins-h" type="number" step="0.1" placeholder="0"/>
              <label>imgsrc</label>
              <input id="kcins-imgpath" type="file" placeholder="class name"/>
            </div>
            <div class="kc-toolbox">
              <button>LN</button>
              <button>PL</button>
              <button>BX</button>
              <button>T1</button>
              <button>T2</button>
            </div>
          </div>
        </div>
    
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  /**
   * Add a new scratch to the current document.
   */
  private addNewScratch(document: vscode.TextDocument) {
    const json = this.getDocumentAsJson(document);
    const character = KoreClickEditorProvider.scratchCharacters[Math.floor(Math.random() * KoreClickEditorProvider.scratchCharacters.length)];
    json.scratches = [
      ...(Array.isArray(json.scratches) ? json.scratches : []),
      {
        id: getNonce(),
        text: character,
        created: Date.now(),
      },
    ];

    return this.updateTextDocument(document, json);
  }

  /**
   * Delete an existing scratch from a document.
   */
  private deleteScratch(document: vscode.TextDocument, id: string) {
    const json = this.getDocumentAsJson(document);
    if (!Array.isArray(json.scratches)) {
      return;
    }

    json.scratches = json.scratches.filter((note: any) => note.id !== id);

    return this.updateTextDocument(document, json);
  }

  /**
   * Try to get a current document as json text.
   */
  private getDocumentAsJson(document: vscode.TextDocument): any {
    const text = document.getText();
    if (text.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Could not get document as json. Content is not valid json");
    }
  }

  /**
   * Write out the json to a given document.
   */
  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(json, null, 2));

    return vscode.workspace.applyEdit(edit);
  }
}
