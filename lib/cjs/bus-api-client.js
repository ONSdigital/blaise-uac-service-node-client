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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentDisabledUacDetailsMock = exports.InstrumentUacDetailsByCaseIdMock = exports.InstrumentUacDetailsMock = void 0;
var authentication_provider_1 = __importDefault(require("./authentication/authentication-provider"));
var axios_1 = __importDefault(require("axios"));
var instrument_uac_details_mocks_1 = require("./mock-objects/instrument-uac-details-mocks");
Object.defineProperty(exports, "InstrumentUacDetailsMock", { enumerable: true, get: function () { return instrument_uac_details_mocks_1.InstrumentUacDetailsMock; } });
Object.defineProperty(exports, "InstrumentUacDetailsByCaseIdMock", { enumerable: true, get: function () { return instrument_uac_details_mocks_1.InstrumentUacDetailsByCaseIdMock; } });
Object.defineProperty(exports, "InstrumentDisabledUacDetailsMock", { enumerable: true, get: function () { return instrument_uac_details_mocks_1.InstrumentDisabledUacDetailsMock; } });
var BusApiClient = /** @class */ (function () {
    function BusApiClient(BUS_API_URL, BUS_CLIENT_ID, timeoutInMs) {
        this.BUS_API_URL = BUS_API_URL;
        this.BUS_CLIENT_ID = BUS_CLIENT_ID;
        this.authProvider = new authentication_provider_1.default(BUS_CLIENT_ID);
        this.httpClient = axios_1.default.create();
        if (typeof timeoutInMs !== "undefined") {
            this.httpClient.defaults.timeout = 10000;
        }
    }
    BusApiClient.prototype.generateUacCodes = function (instrumentName, caseIds) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = {
                            "instrument_name": instrumentName,
                            "case_ids": caseIds
                        };
                        return [4 /*yield*/, this.post("/uacs/generate", data)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.generateUacCodesForInstrument = function (instrumentName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.post("/uacs/instrument/" + instrumentName, null)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.getUacCodeCount = function (instrumentName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("/uacs/instrument/" + instrumentName + "/count")];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.getUacCodes = function (instrumentName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("/uacs/instrument/" + instrumentName)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.getUacCodesByCaseId = function (instrumentName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("/uacs/instrument/" + instrumentName + "/bycaseid")];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.importUACs = function (uacs) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.post("/uacs/import", uacs)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.getDisabledUacCodes = function (instrumentName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("/uacs/uac/" + instrumentName + "/disabled")];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.enableUac = function (uac) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("/uacs/uac/enable/" + uac)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.disableUac = function (uac) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("/uacs/uac/disable/" + uac)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BusApiClient.prototype.url = function (url) {
        if (!url.startsWith("/")) {
            url = "/" + url;
        }
        return url;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BusApiClient.prototype.get = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var config, response;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {};
                        return [4 /*yield*/, this.authProvider.getAuthHeader()];
                    case 1:
                        config = (_a.headers = _b.sent(), _a);
                        return [4 /*yield*/, this.httpClient.get("" + this.BUS_API_URL + this.url(url), config)];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    BusApiClient.prototype.post = function (url, data) {
        return __awaiter(this, void 0, void 0, function () {
            var config, response;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = {};
                        return [4 /*yield*/, this.authProvider.getAuthHeader()];
                    case 1:
                        config = (_a.headers = _b.sent(),
                            _a.maxContentLength = Infinity,
                            _a.maxBodyLength = Infinity,
                            _a);
                        return [4 /*yield*/, this.httpClient.post("" + this.BUS_API_URL + this.url(url), data, config)];
                    case 2:
                        response = _b.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    return BusApiClient;
}());
exports.default = BusApiClient;
