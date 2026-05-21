const vscode = require('vscode');
const fs = require('fs');
const os = require('os');
const path = require('path');

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('piYeet.sendSelectionToPi', sendSelectionToPi),
    vscode.commands.registerCommand('piYeet.copySelectionPrompt', copySelectionPrompt)
  );
}

function deactivate() {}

async function sendSelectionToPi() {
  const payload = getSelectionPayload();
  if (!payload) return;

  const config = vscode.workspace.getConfiguration('piYeet');
  const endpoint = config.get('endpoint', 'http://127.0.0.1:17871/selection');
  const tokenPath = expandHome(config.get('tokenPath', '~/.pi/cursor-yeet-token'));

  try {
    const token = fs.readFileSync(tokenPath, 'utf8').trim();
    await postJson(endpoint, token, payload);
    vscode.window.showInformationMessage(`Yeeted ${formatLineRef(payload)} to Pi.`);
  } catch (error) {
    const prompt = formatSelectionPrompt(payload);
    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showWarningMessage(`Couldn't reach Pi yeet endpoint, copied prompt instead: ${getErrorMessage(error)}`);
  }
}

async function copySelectionPrompt() {
  const payload = getSelectionPayload();
  if (!payload) return;

  await vscode.env.clipboard.writeText(formatSelectionPrompt(payload));
  vscode.window.showInformationMessage(`Copied ${formatLineRef(payload)} prompt.`);
}

function getSelectionPayload() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor.');
    return undefined;
  }

  const document = editor.document;
  const selection = editor.selection;
  const effectiveSelection = selection.isEmpty ? document.lineAt(selection.active.line).range : selection;
  const text = document.getText(effectiveSelection);

  if (!text.trim()) {
    vscode.window.showWarningMessage('Selection is empty.');
    return undefined;
  }

  return {
    path: getDisplayPath(document),
    startLine: effectiveSelection.start.line + 1,
    endLine: effectiveSelection.end.character === 0 && effectiveSelection.end.line > effectiveSelection.start.line
      ? effectiveSelection.end.line
      : effectiveSelection.end.line + 1,
    language: document.languageId,
    text,
  };
}

function getDisplayPath(document) {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) return document.uri.fsPath;
  return path.relative(workspaceFolder.uri.fsPath, document.uri.fsPath);
}

function formatLineRef(payload) {
  if (payload.startLine === payload.endLine) return `${payload.path}:${payload.startLine}`;
  return `${payload.path}:${payload.startLine}-${payload.endLine}`;
}

function formatSelectionPrompt(payload) {
  return `Look at this selected code:\n\n${formatLineRef(payload)}\n\n\`\`\`${payload.language || ''}\n${payload.text}\n\`\`\`\n\n`;
}

function expandHome(filePath) {
  if (filePath === '~') return os.homedir();
  if (filePath.startsWith('~/')) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function postJson(endpoint, token, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const body = JSON.stringify(payload);
    const client = url.protocol === 'https:' ? require('https') : require('http');

    const request = client.request({
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'x-pi-yeet-token': token,
      },
      timeout: 1500,
    }, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => responseBody += chunk);
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
          return;
        }
        reject(new Error(responseBody || `HTTP ${response.statusCode}`));
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('Timed out'));
    });
    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

module.exports = { activate, deactivate };
