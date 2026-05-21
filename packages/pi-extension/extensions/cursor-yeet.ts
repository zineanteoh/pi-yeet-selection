import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

const HOST = "127.0.0.1";
const PORT = 17871;
const MAX_BODY_BYTES = 1024 * 1024;
const TOKEN_PATH = join(homedir(), ".pi", "cursor-yeet-token");

type SelectionPayload = {
	path: string;
	startLine: number;
	endLine: number;
	language?: string;
	text: string;
};

function getToken(): string {
	try {
		const existingToken = readFileSync(TOKEN_PATH, "utf8").trim();
		if (existingToken.length > 0) return existingToken;
	} catch {}

	mkdirSync(dirname(TOKEN_PATH), { recursive: true });
	const token = randomBytes(24).toString("hex");
	writeFileSync(TOKEN_PATH, `${token}\n`, { mode: 0o600 });
	return token;
}

function isSelectionPayload(value: unknown): value is SelectionPayload {
	if (value === null || typeof value !== "object") return false;
	if (!("path" in value) || typeof value.path !== "string") return false;
	if (!("startLine" in value) || typeof value.startLine !== "number") return false;
	if (!("endLine" in value) || typeof value.endLine !== "number") return false;
	if (!("text" in value) || typeof value.text !== "string") return false;
	if ("language" in value && value.language !== undefined && typeof value.language !== "string") return false;
	return true;
}

function formatSelectionPrompt(payload: SelectionPayload): string {
	const lineRef = payload.startLine === payload.endLine ? `${payload.path}:${payload.startLine}` : `${payload.path}:${payload.startLine}-${payload.endLine}`;
	const language = payload.language ?? "";

	return `Look at this selected code:\n\n${lineRef}\n\n\`\`\`${language}\n${payload.text}\n\`\`\`\n\n`;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
	response.writeHead(statusCode, { "content-type": "application/json" });
	response.end(JSON.stringify(body));
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
	let body = "";
	for await (const chunk of request) {
		body += chunk;
		if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
			throw new Error("Request body is too large.");
		}
	}
	return body;
}

export default function (pi: ExtensionAPI) {
	let server: Server | null = null;
	let latestContext: ExtensionContext | null = null;
	const token = getToken();

	async function handleSelectionRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
		if (request.method !== "POST" || request.url !== "/selection") {
			sendJson(response, 404, { ok: false, error: "Not found" });
			return;
		}

		if (request.headers["x-pi-yeet-token"] !== token) {
			sendJson(response, 401, { ok: false, error: "Unauthorized" });
			return;
		}

		if (latestContext === null || !latestContext.hasUI) {
			sendJson(response, 503, { ok: false, error: "No active interactive pi session" });
			return;
		}

		try {
			const body = await readRequestBody(request);
			const parsed: unknown = JSON.parse(body);
			if (!isSelectionPayload(parsed)) {
				sendJson(response, 400, { ok: false, error: "Invalid selection payload" });
				return;
			}

			const prefix = latestContext.ui.getEditorText().trim().length > 0 ? "\n\n" : "";
			latestContext.ui.pasteToEditor(`${prefix}${formatSelectionPrompt(parsed)}`);
			latestContext.ui.notify(`Yeeted ${parsed.path}:${parsed.startLine}-${parsed.endLine} from Cursor.`, "info");
			sendJson(response, 200, { ok: true });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			sendJson(response, 400, { ok: false, error: message });
		}
	}

	function startServer(ctx: ExtensionContext): void {
		latestContext = ctx;
		if (server !== null) return;

		server = createServer((request, response) => {
			handleSelectionRequest(request, response).catch((error: unknown) => {
				const message = error instanceof Error ? error.message : String(error);
				sendJson(response, 500, { ok: false, error: message });
			});
		});

		server.on("error", (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				ctx.ui.notify(`Cursor yeet server port ${PORT} is already in use. Run /reload if this is stale.`, "warning");
				return;
			}
			ctx.ui.notify(`Cursor yeet server failed: ${error.message}`, "error");
		});

		server.listen(PORT, HOST, () => {
			ctx.ui.notify(`Cursor yeet listening on http://${HOST}:${PORT}.`, "info");
		});
	}

	function stopServer(): void {
		latestContext = null;
		if (server === null) return;
		server.close();
		server = null;
	}

	pi.on("session_start", async (_event, ctx) => {
		startServer(ctx);
	});

	pi.on("session_shutdown", async () => {
		stopServer();
	});

	pi.registerCommand("cursor-yeet-status", {
		description: "Show Cursor yeet endpoint status",
		handler: async (_args, ctx) => {
			ctx.ui.notify(`Cursor yeet endpoint: http://${HOST}:${PORT}/selection`, "info");
		},
	});
}
