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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
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
exports.readToolStream = exports.createRunner = exports.createCompleter = exports.createSystemMessage = void 0;
const openai_1 = __importDefault(require("openai"));
const schema_1 = require("./schema");
const toolchain_1 = require("./toolchain");
/**
 * Just to make code a bit more readable. I didn't need createUserMessage, etc. yet.
 */
function createSystemMessage(content) {
    return {
        role: 'system',
        content,
    };
}
exports.createSystemMessage = createSystemMessage;
/**
 * Gives you a function that runs a single LLM completion.
 * Has a little flag to force the use of tools.
 * Returns the completion message, with tool calls and all.
 */
function createCompleter(options) {
    const { apiKey, baseURL = 'https://api.openai.com/v1', model = schema_1.defaultModel, temperature = 0.2, forceTools = false } = options;
    const openai = new openai_1.default({ apiKey, baseURL });
    return (messages, toolChain) => __awaiter(this, void 0, void 0, function* () {
        const completionOptions = {
            model,
            messages,
            temperature,
        };
        if (toolChain) {
            completionOptions.tools = toolchain_1.ToolChain.toOpenAI(toolChain.tools);
            if (forceTools) {
                completionOptions.tool_choice = 'required';
            }
        }
        const completion = yield openai.chat.completions.create(completionOptions);
        return completion.choices[0].message;
    });
}
exports.createCompleter = createCompleter;
/**
 * Gives you a function that runs a tool chain,
 * until it runs one of its stop tools.
 */
function createRunner(options) {
    const { apiKey, baseURL, model, systemMessage, chatHistory, toolChain } = options;
    const completer = createCompleter({ apiKey, baseURL, model, forceTools: true });
    return function runner() {
        return __asyncGenerator(this, arguments, function* runner_1() {
            var _a, e_1, _b, _c;
            const messageWithToolCalls = yield __await(completer([systemMessage, ...chatHistory], toolChain));
            chatHistory.push(messageWithToolCalls);
            yield yield __await(messageWithToolCalls);
            try {
                for (var _d = true, _e = __asyncValues(toolChain.run(messageWithToolCalls)), _f; _f = yield __await(_e.next()), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const toolMessage = _c;
                    chatHistory.push(toolMessage);
                    yield yield __await(toolMessage);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (!toolChain.mustStop()) {
                yield __await(yield* __asyncDelegator(__asyncValues(runner())));
            }
        });
    };
}
exports.createRunner = createRunner;
function readToolStream(reader, handler, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const decoder = new TextDecoder('utf-8');
        while (true) {
            const { done, value } = yield reader.read();
            if (done) {
                if (callback) {
                    callback();
                }
                break;
            }
            const rawMessagesString = decoder.decode(value);
            const messagesJsonString = `[${rawMessagesString.replace(/}\s*?{/g, '},{')}]`; // Why no valid json? WHY?!
            const messages = JSON.parse(messagesJsonString);
            for (const message of messages) {
                handler(message);
            }
        }
    });
}
exports.readToolStream = readToolStream;
//# sourceMappingURL=utils.js.map