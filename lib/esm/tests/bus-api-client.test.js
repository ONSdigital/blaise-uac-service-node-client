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
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import 'regenerator-runtime/runtime';
import BusApiClient, { InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock, InstrumentDisabledUacDetailsMock } from "../bus-api-client";
var mock = new MockAdapter(axios, { onNoMatch: "throwException" });
var busApiUrl = "testUri";
var busClientId = "1234534";
var instrumentName = "DST1234A";
var busApiClientTest = new BusApiClient("http://" + busApiUrl, busClientId);
describe("busApiClientTest", function () {
    describe("generate UAC codes for an instrument from a list of case IDs", function () {
        var caseIds = ["100000001", "100000002", "100000003"];
        beforeEach(function () {
            mock.onPost("http://" + busApiUrl + "/uacs/generate").reply(201, InstrumentUacDetailsMock);
        });
        afterEach(function () {
            mock.reset();
        });
        it("Generates UACs for all cases contained within the instrument", function () { return __awaiter(void 0, void 0, void 0, function () {
            var instrument;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.generateUacCodes(instrumentName, caseIds)];
                    case 1:
                        instrument = _a.sent();
                        expect(instrument).toEqual(InstrumentUacDetailsMock);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("generate UAC codes for an instrument", function () {
        beforeEach(function () {
            mock.onPost("http://" + busApiUrl + "/uacs/instrument/" + instrumentName).reply(201, InstrumentUacDetailsMock);
        });
        afterEach(function () {
            mock.reset();
        });
        it("Generates UACs for all cases contained within the instrument", function () { return __awaiter(void 0, void 0, void 0, function () {
            var instrument;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.generateUacCodesForInstrument(instrumentName)];
                    case 1:
                        instrument = _a.sent();
                        expect(instrument).toEqual(InstrumentUacDetailsMock);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("get UAC count for an instrument", function () {
        beforeEach(function () {
            mock.onGet("http://" + busApiUrl + "/uacs/instrument/" + instrumentName + "/count").reply(200, { count: 10 });
        });
        afterEach(function () {
            mock.reset();
        });
        it("returns a object containing a count of the number of UACs codes", function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.getUacCodeCount(instrumentName)];
                    case 1:
                        result = _a.sent();
                        expect(result.count).toEqual(10);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("get all UAC details for an instrument", function () {
        beforeEach(function () {
            mock.onGet("http://" + busApiUrl + "/uacs/instrument/" + instrumentName).reply(200, InstrumentUacDetailsMock);
        });
        afterEach(function () {
            mock.reset();
        });
        it("returns a dictionary of all UAC details associated to the instrument with the UAC as the index", function () { return __awaiter(void 0, void 0, void 0, function () {
            var instruments;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.getUacCodes(instrumentName)];
                    case 1:
                        instruments = _a.sent();
                        expect(instruments).toEqual(InstrumentUacDetailsMock);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("get all UAC details for an instrument by Case ID", function () {
        beforeEach(function () {
            mock.onGet("http://" + busApiUrl + "/uacs/instrument/" + instrumentName + "/bycaseid").reply(200, InstrumentUacDetailsByCaseIdMock);
        });
        afterEach(function () {
            mock.reset();
        });
        it("returns a dictionary of all UAC details associated to the instrument with the Case ID as the index", function () { return __awaiter(void 0, void 0, void 0, function () {
            var instruments;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.getUacCodesByCaseId(instrumentName)];
                    case 1:
                        instruments = _a.sent();
                        expect(instruments).toEqual(InstrumentUacDetailsByCaseIdMock);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("get all disabled UACs for an instrument", function () {
        beforeEach(function () {
            mock.onGet("http://" + busApiUrl + "/uacs/uac/" + instrumentName + "/disabled").reply(200, InstrumentDisabledUacDetailsMock);
        });
        afterEach(function () {
            mock.reset();
        });
        it("returns a dictionary of all disabled UAC details associated to the instrument", function () { return __awaiter(void 0, void 0, void 0, function () {
            var instruments;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.getDisabledUacCodes(instrumentName)];
                    case 1:
                        instruments = _a.sent();
                        expect(instruments).toEqual(InstrumentDisabledUacDetailsMock);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("import uacs", function () {
        beforeEach(function () {
            mock.onPost("http://" + busApiUrl + "/uacs/import").reply(200, { uacs_imported: 2 });
        });
        afterEach(function () {
            mock.reset();
        });
        it("returns a count of uacs imported", function () { return __awaiter(void 0, void 0, void 0, function () {
            var uacImport;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, busApiClientTest.importUACs(["123412341234", "432143214321"])];
                    case 1:
                        uacImport = _a.sent();
                        expect(uacImport.uacs_imported).toEqual(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
