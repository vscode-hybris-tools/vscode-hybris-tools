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
        }, function (message) {
            logErrorOutput('Impex execution failed (' + editor.document.fileName + '): ' + message);
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
        }, function (message) {
            logErrorOutput('Impex execution failed (' + editor.document.fileName + '): ' + message);
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
        }, function (message) {
            logErrorOutput('Flexible search failed (' + editor.document.fileName + '): ' + message);
        });
    });
    context.subscriptions.push(runFlexibleSearchQuery);

    // RAW SQL SEARCH
    let runRawSqlQuery = vscode.commands.registerCommand('extension.runRawSqlQuery', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('No raw SQL query to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeFlexibleSearch(editorContent, false, function (queryResult) {
            logOutput("Raw SQL query result (" + editor.document.fileName + "): \n" + queryResult);
        }, function (message) {
            logErrorOutput('Raw SQL query failed (' + editor.document.fileName + '): ' + message);
        });
    });
    context.subscriptions.push(runRawSqlQuery);

    // EXECUTE GROOVY SCRIPT
    let executeGroovyScript = vscode.commands.registerCommand('extension.executeGroovyScript', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('Found no Groovy script to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeGroovyScript(editorContent, "groovy", function (result, outputText) {
            logOutput("Groovy script (" + editor.document.fileName + ") returned: " + result + "\nOutput:\n" + outputText);
        }, function (message) {
            logErrorOutput('Groovy script failed (' + editor.document.fileName + '): ' + message);
        });
    });
    context.subscriptions.push(executeGroovyScript);

    // EXECUTE GROOVY SCRIPT
    let executeGroovyScriptWithCommit = vscode.commands.registerCommand('extension.executeGroovyScriptWithCommit', function () {
        let editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('Found no Groovy script to run');
            return; // No open text editor
        }

        var editorContent = getEditorContent(editor);

        hacUtil.executeGroovyScript(editorContent, "groovy", function (result, outputText) {
            logOutput("Groovy script (" + editor.document.fileName + ") returned: " + result + "\nOutput:\n" + outputText);
        }, function (message) {
            logErrorOutput('Groovy script failed (' + editor.document.fileName + '): ' + message);
        }, true);
    });
    context.subscriptions.push(executeGroovyScriptWithCommit);

    // ANALYZE PK
    let analyzePK = vscode.commands.registerCommand('extension.analyzePK', function () {
        vscode.window.showInputBox({ 'placeHolder': 'Please enter PK ' }).then(function (value) {
            if (value !== undefined) {
                hacUtil.analyzePK(value, function (info) {
                    logOutput("PK: " + info);
                }, function (message) {
                    logErrorOutput('Could not analyze PK: ' + message);
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