const vscode = require('vscode');
const request = require('request');
const cheerio = require('cheerio');
const AsciiTable = require('ascii-table');

module.exports = class HacUtil {
    constructor() {

    }

    extractSessionId(response) {
        return response.headers["set-cookie"][0].split(";")[0];
    }

    extractCsrfToken(body) {
        let html = cheerio.load(body);
        return html("input[name=_csrf]").val();
    }

    createErrorInfo(errorMessage, response) {
        var ret = {};

        if (errorMessage) {
            ret.error = errorMessage;
        }

        if (response) {
            ret.responseStatusCode = response.statusCode;
        }

        return ret;
    }

    fetchCsrfTokenSessionId(successFunc, errorFunc) {
        let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url");
        // let hacUrl = "http://httpstat.us/404";

        let self = this;

        // get the login form and extract the CSRF token
        request(hacUrl, { timeout: 1000, strictSSL: false }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let csfr = self.extractCsrfToken(body);
                let sessionId = self.extractSessionId(response);
                successFunc(csfr, sessionId);
            } else {
                var errorMessage = error ? error.message : "Unknown error";
                errorFunc(self.createErrorInfo(errorMessage, response));
            }
        });
    }


    getCsrfTokenFromImpexPage(sessionId, successFunc, errorFunc) {
        let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url")
        let hacImpexUrl = hacUrl + "/console/impex/import";

        let headers = {
            Cookie: sessionId
        }

        let self = this;

        // get the login form and extract the CSRF token
        request({ url: hacImpexUrl, headers: headers, strictSSL: false }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let csfr = self.extractCsrfToken(body);
                successFunc(csfr, sessionId);
            } else {
                errorFunc(self.createErrorInfo(error, response.statusCode));
            }
        });
    }

    login(csrfToken, sessionId, successFunc, errorFunc) {
        let username = vscode.workspace.getConfiguration().get("hybris.hac.username");
        let password = vscode.workspace.getConfiguration().get("hybris.hac.password");

        let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url");
        var hacLoginUrl;

        if (hacUrl) {
            hacLoginUrl = hacUrl + "/j_spring_security_check";
        }

        let credentials = {
            j_username: username,
            j_password: password,
            _csrf: csrfToken
        };

        let headers = {
            Cookie: sessionId
        };

        let self = this;

        // login
        request.post({ url: hacLoginUrl, strictSSL: false, headers: headers, form: credentials }, function (error, response, body) {
            if (response.statusCode == 302) {
                //  successfully logged in

                let sessionId = self.extractSessionId(response);
                self.getCsrfTokenFromImpexPage(sessionId, successFunc, errorFunc);
            } else {
                // pass extracted error message
                errorFunc(response.statusCode);
            }
        });
    }

    executeImpex(impexContent, successFunc, errorFunc) {
        let self = this;

        self.fetchCsrfTokenSessionId(function (csrfToken, sessionId) {
            self.login(csrfToken, sessionId, function (csrfToken, sessionId) {
                let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url")
                var hacImpexActionUrl;

                if (hacUrl) {
                    hacImpexActionUrl = hacUrl + "/console/impex/import/upload?_csrf=" + csrfToken;
                    // hacImpexActionUrl = "http://localhost:3000";
                }

                let formContent = {
                    file: {
                        value: impexContent,
                        options: {
                            filename: 'vscode-import.impex',
                            contentType: 'application/octet-stream'
                        }
                    },
                    _csrf: csrfToken,
                    _distributedMode: "on",
                    _enableCodeExecution: "on",
                    _legacyMode: "on",
                    _sldEnabled: "on",
                    encoding: "UTF-8",
                    maxThreads: 1,
                    validationEnum: "IMPORT_STRICT"
                };

                let headers = {
                    Cookie: sessionId
                };

                // import impex
                request.post({ url: hacImpexActionUrl, strictSSL: false, headers: headers, formData: formContent }, function (error, response, body) {
                    var html = cheerio.load(body);
                    var impexResult = html(".impexResult > pre").text();

                    if (response.statusCode == 200 && !impexResult) {
                        successFunc();
                    } else {
                        errorFunc("\n" + (impexResult !== undefined ? impexResult.trim() : "<Unknown error>"));
                    }
                });
            }, function (statusCode) {
                errorFunc('Could not login with stored credentials (http status=' + statusCode + ').');
            });
        }, function (error) {
            errorFunc('Could not retrieve CSFR token (http status=' + error.responseStatusCode + '): ' + error.error);
        });
    }

    executeImpexValidation(impexContent, successFunc, errorFunc) {
        let self = this;

        self.fetchCsrfTokenSessionId(function (csrfToken, sessionId) {
            self.login(csrfToken, sessionId, function (csrfToken, sessionId) {
                let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url")
                var hacImpexActionUrl;

                if (hacUrl) {
                    hacImpexActionUrl = hacUrl + "/console/impex/import/validate";
                }

                let formContent = {
                    scriptContent: impexContent,
                    _csrf: csrfToken,
                    _distributedMode: "on",
                    _enableCodeExecution: "on",
                    _legacyMode: "on",
                    _sldEnabled: "on",
                    encoding: "UTF-8",
                    maxThreads: 1,
                    validationEnum: "IMPORT_STRICT"
                };

                let headers = {
                    Cookie: sessionId
                };

                // validate impex
                request.post({ url: hacImpexActionUrl, strictSSL: false, headers: headers, form: formContent }, function (error, response, body) {
                    var html = cheerio.load(body);
                    var impexResult = html("span#validationResultMsg[data-level='error']").attr("data-result");

                    if (response.statusCode == 200 && impexResult === undefined) {
                        successFunc();
                    } else {
                        errorFunc("\n" + (impexResult !== undefined ? impexResult.trim() : "<Unknown error>"));
                    }
                });
            }, function (statusCode) {
                errorFunc('Could not login with stored credentials (http status=' + statusCode + ').');
            });
        }, function (error) {
            errorFunc('Could not retrieve CSFR token (http status=' + error.responseStatusCode + '): ' + error.error);
        });
    }

    executeFlexibleSearch(query, isFlexQuery, successFunc, errorFunc) {
        let self = this;

        self.fetchCsrfTokenSessionId(function (csrfToken, sessionId) {
            self.login(csrfToken, sessionId, function (csrfToken, sessionId) {
                let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url")
                var hacImpexActionUrl;

                if (hacUrl) {
                    hacImpexActionUrl = hacUrl + "/console/flexsearch/execute";
                }

                let formContent = {
                    _csrf: csrfToken,
                    commit: false,
                    flexibleSearchQuery: isFlexQuery ? query : null,
                    locale: "en",
                    maxCount: 999999999,
                    sqlQuery: !isFlexQuery ? query : null,
                    user: "admin"
                };

                let headers = {
                    Cookie: sessionId
                };

                request.post({ url: hacImpexActionUrl, strictSSL: false, headers: headers, form: formContent }, function (error, response, body) {
                    var result = JSON.parse(body);

                    if (response.statusCode == 200 && result.exception == null) {
                        var output = result.resultList.length > 0 ? self.json2AsciiTable(result) : "No results returned."

                        successFunc(output);
                    } else {
                        errorFunc("Flexible search query could not be executed: " + result.exception.message);
                    }
                });
            }, function (statusCode) {
                errorFunc('Could not login with stored credentials (http status=' + statusCode + ').');
            });
        }, function (statusCode) {
            errorFunc('Could not retrieve CSFR token (http status=' + statusCode + ').');
        });
    }

    executeGroovyScript(script, scriptType, successFunc, errorFunc) {
        let self = this;

        self.fetchCsrfTokenSessionId(function (csrfToken, sessionId) {
            self.login(csrfToken, sessionId, function (csrfToken, sessionId) {
                let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url")
                var hacImpexActionUrl;

                if (hacUrl) {
                    hacImpexActionUrl = hacUrl + "/console/scripting/execute";
                }

                let formContent = {
                    _csrf: csrfToken,
                    commit: false,
                    scriptType: scriptType,
                    script: script
                };

                let headers = {
                    Cookie: sessionId
                };

                request.post({ url: hacImpexActionUrl, strictSSL: false, headers: headers, form: formContent }, function (error, response, body) {
                    var result = JSON.parse(body);

                    if (response.statusCode == 200 && result.stacktraceText == "") {
                        successFunc(result.executionResult, result.outputText);
                    } else {
                        errorFunc("Script execution failed: " + result.stacktraceText);
                    }
                });
            }, function (statusCode) {
                errorFunc('Could not login with stored credentials (http status=' + statusCode + ').');
            });
        }, function (statusCode) {
            errorFunc('Could not retrieve CSFR token (http status=' + statusCode + ').');
        });
    }


    json2AsciiTable(queryResultObject) {
        var table = new AsciiTable(new Date(), null);
        var headers = ["#"].concat(queryResultObject.headers);

        table.setHeading(headers);
        for (var x = 0; x < queryResultObject.resultList.length; x++) {
            var row = [x].concat(queryResultObject.resultList[x]);
            table.addRow(row);
        }

        return table.toString();
    }

    analyzePK(pk, successFunc, errorFunc) {
        let self = this;

        self.fetchCsrfTokenSessionId(function (csrfToken, sessionId) {
            self.login(csrfToken, sessionId, function (csrfToken, sessionId) {
                let hacUrl = vscode.workspace.getConfiguration().get("hybris.hac.url")
                var hacImpexActionUrl;

                if (hacUrl) {
                    hacImpexActionUrl = hacUrl + "/platform/pkanalyzer/analyze";
                }

                let formContent = {
                    _csrf: csrfToken,
                    pkString: pk
                };

                let headers = {
                    Cookie: sessionId
                };

                request.post({ url: hacImpexActionUrl, strictSSL: false, headers: headers, form: formContent }, function (error, response, body) {
                    if (response.statusCode == 200) {
                        var result = JSON.parse(body);

                        successFunc("Composed Type: " + result.pkComposedTypeCode);
                    } else {
                        errorFunc("Could not analyze PK: " + pk);
                    }
                });
            }, function (statusCode) {
                errorFunc('Could not login with stored credentials (http status=' + statusCode + ').');
            });
        }, function (statusCode) {
            errorFunc('Could not retrieve CSFR token (http status=' + statusCode + ').');
        });
    }
}