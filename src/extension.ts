'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { constants } from 'os';
interface ISurroundItem {
    label: string;
    description?: string;
    detail?: string;
    snippet: string;
    disabled?: boolean;
}
interface ISurroundConfig {
    [key: string]: ISurroundItem
}
function getSurroundConfig():ISurroundConfig { // 获取配置
    let config = vscode.workspace.getConfiguration("surround-python");
    const items = <ISurroundConfig>config.get("with", {});
    const custom = <ISurroundConfig>config.get("custom", {});
    return {...items, ...custom}

}

function getEnableSurroundItems() {
    const items: ISurroundItem[] = [];
    const surroundConfig = getSurroundConfig(); // 获取配置
    console.log("surround-python, config", surroundConfig);
    Object.keys(surroundConfig).forEach(surroundItemKey => {
        const surroundItem: ISurroundItem = surroundConfig[surroundItemKey];
        if(!surroundItem.disabled) {
            items.push(surroundItem);
        }
    })
    return items;
}
function getQuickPickItems(surroundItems: ISurroundItem[]) {
    const items: vscode.QuickPickItem[] = [];
    surroundItems.forEach(surroundItem => {
        if (!surroundItem.disabled) {
            const {label, description} = surroundItem;
            items.push({
                label,
                description
            });
        }
    })
    return items;
}
function applySurroundItem(key: string) { // 调用命令
    const config=getSurroundConfig();
    if(vscode.window.activeTextEditor &&  config[key]) {
        const surroundItem:ISurroundItem = config[key];
        vscode.window.activeTextEditor.insertSnippet(new vscode.SnippetString(surroundItem.snippet));

    }
}
function applyQuickPick(item: vscode.QuickPickItem, surroundItems: ISurroundItem[]) { // 通过ctrl+shift+p调用命令
    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && item) {
        let surroundItem = surroundItems.find(s => item.label == s.label);
        if (surroundItem) {
            activeEditor.insertSnippet(new vscode.SnippetString(surroundItem.snippet));
        }
    }
}
function registerCommands(context: vscode.ExtensionContext) {
    const Config = getSurroundConfig();
    console.log("surround-python, config", Config);
    vscode.commands.getCommands().then(cmdList => {
        Object.keys(Config).forEach(key => {
            const cmdText = `surround-python.with.${key}`;
            if (cmdList.indexOf(cmdText) == -1) {
                context.subscriptions.push(
                    vscode.commands.registerCommand(cmdText, () => {
                        applySurroundItem(key); // 这个是调用命令？
                    })
                )
            } else {
                console.warn(`multiple command named ${cmdText}, replacing previous one`);
            }
        })
    });
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let quickPickItems: vscode.QuickPickItem[]; // 下拉框的内容
    let surroundItems: ISurroundItem[] = [];  // 配置的surround列表
    function update() {
        surroundItems = getEnableSurroundItems(); // 从配置里面读取surround选项
        quickPickItems = getQuickPickItems(surroundItems);
        registerCommands(context);
    }
    vscode.workspace.onDidChangeConfiguration(() => {
        update();
    })
    update();


    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log("surround-python",'Congratulations, your extension "surround-python" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('surround-python.with', () => {
        // The code you place here will be executed every time your command is executed
        vscode.window.showQuickPick(quickPickItems).then(item => {
            if(item) {
                applyQuickPick(item, surroundItems);
            }
        })
        // Display a message box to the user
        // vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}