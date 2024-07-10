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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const src_1 = require("../src");
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
}
class JokeTool {
    constructor() {
        this.name = 'joke';
        this.description = 'A tool that tells jokes.';
        this.inputSchema = zod_1.z.object({
            topic: zod_1.z.string()
        });
        this.outputSchema = zod_1.z.object({
            setup: zod_1.z.string(),
            punchline: zod_1.z.string()
        });
    }
    run(args) {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('Running joke tool with args:', args);
            return {
                setup: 'Why did the chicken cross the road?',
                punchline: 'To get to the other side!'
            };
        });
    }
}
const toolChain = new src_1.ToolChain({
    tools: [
        new JokeTool()
    ]
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const runner = (0, src_1.createStraightRunner)({
            apiKey,
            systemMessage: (0, src_1.createSystemMessage)('You are a funny assistant.'),
            chatHistory: [],
            toolChain
        });
        try {
            for (var _d = true, _e = __asyncValues(runner()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const message = _c;
                console.log('Message:', message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
main();
//# sourceMappingURL=index.js.map