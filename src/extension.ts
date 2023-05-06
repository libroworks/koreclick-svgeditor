import * as vscode from "vscode";
import { KoreClickEditorProvider } from "./KoreClickEditor";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "koreclick-svgeditor" is now active!');

  let disposable = vscode.commands.registerCommand("koreclick-svgeditor.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from koreClick_svgeditor!");
  });
  context.subscriptions.push(disposable);

  context.subscriptions.push(KoreClickEditorProvider.register(context));

  // Webサーバ起動
  // const targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
  // if (!targetPath) {
  //   vscode.window.showWarningMessage("[Live Server] フォルダを開いた状態で実行してください");
  //   return;
  // }

  // type Request = http.IncomingMessage | { url: string };
  // type Response = http.ServerResponse;

  // const hostname = "127.0.0.1";
  // const port = 8800;
  // const dirPublic = targetPath;
  // const indexFile = "index.html";

  // const service = function (req: Request, res: Response) {
  //   const pathname = req.url ?? "";
  //   const root = path.resolve(dirPublic);
  //   const file = path.join(root, pathname);

  //   const extname = String(path.extname(pathname)).toLowerCase();
  //   const mimeTypes = {
  //     ".html": "text/html",
  //     ".js": "text/javascript",
  //     ".css": "text/css",
  //     ".json": "application/json",
  //     ".png": "image/png",
  //     ".jpg": "image/jpg",
  //     ".gif": "image/gif",
  //     ".svg": "image/svg+xml",
  //     ".wav": "audio/wav",
  //     ".mp4": "video/mp4",
  //     ".woff": "application/font-woff",
  //     ".ttf": "application/font-ttf",
  //     ".eot": "application/vnd.ms-fontobject",
  //     ".otf": "application/font-otf",
  //     ".wasm": "application/wasm",
  //   };

  //   const contentType = mimeTypes[extname] || "application/octet-stream";

  //   fs.stat(file, (err, stat) => {
  //     if (err) {
  //       console.log("err", err);
  //       res.write("err");
  //       res.end();
  //       return;
  //     }

  //     if (stat.isDirectory()) {
  //       service({ url: `${req.url}/${indexFile}` }, res);
  //     }

  //     if (stat.isFile()) {
  //       const stream = fs.createReadStream(file);
  //       stream.pipe(res);
  //       res.writeHead(200, { "Content-Type": contentType });
  //       console.log(req.url);
  //     }
  //   });
  // };

  // const listener = function (req: Request, res: Response) {
  //   service(req, res);
  // };

  // const server = http.createServer(listener);
  // server.listen(port, hostname);
}

// this method is called when your extension is deactivated
export function deactivate() {}
