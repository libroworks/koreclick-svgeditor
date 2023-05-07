import * as vscode from "vscode";
import { KoreClickEditorProvider } from "./KoreClickEditor";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "koreclick-svgeditor" is now active!');

  let disposable = vscode.commands.registerCommand("koreclick-svgeditor.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from koreClick_svgeditor!");
  });
  context.subscriptions.push(disposable);

  context.subscriptions.push(KoreClickEditorProvider.register(context));
}

// this method is called when your extension is deactivated
export function deactivate() {}
