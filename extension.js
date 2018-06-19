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

    // IMPEX EXECUTION
    let importImpex = vscode.commands.registerCommand('extension.importImpex', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No impex to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeImpex(editorContent, function () {
            logOutput('Impex executed successfully: ' + editor.document.fileName);
        }, function (errorMessage, impexResult) {
            logErrorOutput('Impex execution failed (' + editor.document.fileName + '): ' + impexResult);
        });
    });
    context.subscriptions.push(importImpex);

    // IMPEX VALIDATION
    let validateImpex = vscode.commands.registerCommand('extension.validateImpex', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No impex to validate');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeImpexValidation(editorContent, function () {
            logOutput('Impex validated successfully: ' + editor.document.fileName);
        }, function (errorMessage, detailedMessage) {
            logErrorOutput('Impex execution failed (' + editor.document.fileName + '): ' + detailedMessage);
        });
    });
    context.subscriptions.push(validateImpex);

    // FLEXIBLE SEARCH
    let runFlexibleSearchQuery = vscode.commands.registerCommand('extension.runFlexibleSearchQuery', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No flexible search query to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeFlexibleSearch(editorContent, true, function (queryResult) {
            logOutput("Flexible search result (" + editor.document.fileName + "): \n" + queryResult);
        }, function (errorMessage, detailedMessage) {
            logErrorOutput('Flexible search failed (' + editor.document.fileName + '): ' + detailedMessage);
        });
    });
    context.subscriptions.push(runFlexibleSearchQuery);

    // RAW SQL SEARCH
    let runRawSqlQuery = vscode.commands.registerCommand('extension.runRawSqlQuery', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No raw SQL query  to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeFlexibleSearch(editorContent, false, function (queryResult) {
            logOutput("Raw SQL query result (" + editor.document.fileName + "): \n" + queryResult);
        }, function (errorMessage, detailedMessage) {
            logErrorOutput('Raw SQL query failed (' + editor.document.fileName + '): ' + detailedMessage);
        });
    });
    context.subscriptions.push(runRawSqlQuery);

    // ANALYZE PK
    let analyzePK = vscode.commands.registerCommand('extension.analyzePK', function () {
        vscode.window.showInputBox({ 'placeHolder': 'Please enter PK ' }).then(function (value) {
            if (value !== undefined) {
                hacUtil.analyzePK(value, function (info) {
                    logOutput("PK: " + info);
                }, function (errorMessage, detailedMessage) {
                    logErrorOutput('Could not analyze PK: ' + detailedMessage);
                });
            }
        });

    });
    context.subscriptions.push(analyzePK);

}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;