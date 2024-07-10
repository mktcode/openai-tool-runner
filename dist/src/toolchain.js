"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolChain = void 0;
const zod_to_json_schema_1 = __importDefault(require("zod-to-json-schema"));
class ToolChain {
    constructor(options) {
        this.toolCalls = [];
        this.toolMessages = [];
        const { tools, stopWhen } = options;
        this.tools = tools;
        this.stopWhen = stopWhen || [];
    }
    run(message) {
        return __asyncGenerator(this, arguments, function* run_1() {
            this.toolCalls = message.tool_calls || [];
            this.toolMessages = [];
            for (const toolCall of this.toolCalls) {
                const toolMessage = yield __await(this.runTool(toolCall));
                this.toolMessages.push(toolMessage);
                yield yield __await(toolMessage);
            }
        });
    }
    mustStop() {
        return this.toolCalls.some(toolCall => this.stopWhen.some(tool => tool.name === toolCall.function.name));
    }
    runTool(toolCall) {
        return __awaiter(this, void 0, void 0, function* () {
            const tool = this.tools.find(tool => tool.name === toolCall.function.name);
            if (!tool) {
                throw new Error(`Tool not found: ${toolCall.function.name}`);
            }
            const args = JSON.parse(toolCall.function.arguments);
            const input = tool.inputSchema.parse(args);
            const result = yield tool.run(input);
            return {
                role: 'tool',
                content: JSON.stringify(result),
                tool_call_id: toolCall.id,
            };
        });
    }
    static toOpenAI(tools) {
        const type = 'function';
        return tools.map((agent) => {
            return {
                type,
                function: {
                    name: agent.name,
                    description: agent.description,
                    parameters: (0, zod_to_json_schema_1.default)(agent.inputSchema),
                },
            };
        });
    }
    getToolInput(toolName) {
        var _a;
        const args = (_a = this.toolCalls.find(toolCall => toolCall.function.name === toolName)) === null || _a === void 0 ? void 0 : _a.function.arguments;
        if (args) {
            return JSON.parse(args);
        }
        else {
            return null;
        }
    }
}
exports.ToolChain = ToolChain;
//# sourceMappingURL=toolchain.js.map