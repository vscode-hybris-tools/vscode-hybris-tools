const HacUtil = require('./src/hac-util');

const vscode = require('vscode');


function activate(context) {

    console.log('vscode-hybris-tools activated');

    var hacUtil = new HacUtil();

    let outputChannel = vscode.window.createOutputChannel("hybris-tools");

    let logOutput = function (text) {
        outputChannel.appendLine(text);
        outputChannel.show(true);
    }

    let logErrorOutput = function (text) {
        logOutput("ERROR: " + text);
    }

    let getEditorContent = function (editor) {
        let selection = editor.selection;

        var editorContent;
        if (!selection.isEmpty) {
            editorContent = editor.document.getText(selection)
        } else {
            editorContent = editor.document.getText();
        }

        return editorContent;
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let importImpex = vscode.commands.registerCommand('extension.importImpex', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No impex to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeImpex(editorContent, function () {
            vscode.window.showInformationMessage('Impex executed successfully.');
        }, function (errorMessage, impexResult) {
            // Display a message box to the user
            vscode.window.showErrorMessage(errorMessage);
            logErrorOutput(impexResult);
        });
    });
    context.subscriptions.push(importImpex);

    let validateImpex = vscode.commands.registerCommand('extension.validateImpex', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No impex to validate');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeImpexValidation(editorContent, function () {
            vscode.window.showInformationMessage('Impex validated successfully.');
        }, function (errorMessage, detailedMessage) {
            // Display a message box to the user
            vscode.window.showErrorMessage(errorMessage);
            logErrorOutput(detailedMessage);
        });
    });
    context.subscriptions.push(validateImpex);

    let runFlexibleSearchQuery = vscode.commands.registerCommand('extension.runFlexibleSearchQuery', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No impex to validate');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeFlexibleSearch(editorContent, function (queryResult) {
            vscode.window.showInformationMessage('Impex validated successfully.');
            logOutput("Flexible search result:");
            logOutput(queryResult);
        }, function (errorMessage, detailedMessage) {
            // Display a message box to the user
            vscode.window.showErrorMessage(errorMessage);
            logErrorOutput(detailedMessage);
        });
    });
    context.subscriptions.push(runFlexibleSearchQuery);

}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;