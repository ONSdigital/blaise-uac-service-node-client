import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import 'regenerator-runtime/runtime'
import BusApiClient, {InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock, InstrumentDisabledUacDetailsMock } from "../bus-api-client";

const mock = new MockAdapter(axios, {onNoMatch: "throwException"});
const busApiUrl = "testUri";
const busClientId = "1234534";

const instrumentName = "DST1234A";

const busApiClientTest = new BusApiClient(`http://${busApiUrl}`, busClientId);

describe("busApiClientTest", () => {
    describe("generate UAC codes for an instrument from a list of case IDs", () => {
        const caseIds = ["100000001", "100000002", "100000003"];

        beforeEach(() => {
            mock.onPost(`http://${busApiUrl}/uacs/generate`).reply(201,
                InstrumentUacDetailsMock,
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("Generates UACs for all cases contained within the instrument", async () => {
            let instrument = await busApiClientTest.generateUacCodes(instrumentName, caseIds);

            expect(instrument).toEqual(InstrumentUacDetailsMock);
        });
    });

    describe("generate UAC codes for an instrument", () => {
        beforeEach(() => {
            mock.onPost(`http://${busApiUrl}/uacs/instrument/${instrumentName}`).reply(201,
                InstrumentUacDetailsMock,
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("Generates UACs for all cases contained within the instrument", async () => {
            let instrument = await busApiClientTest.generateUacCodesForInstrument(instrumentName);

            expect(instrument).toEqual(InstrumentUacDetailsMock);
        });
    });

    describe("get UAC count for an instrument", () => {
        beforeEach(() => {
            mock.onGet(`http://${busApiUrl}/uacs/instrument/${instrumentName}/count`).reply(200,
                {count: 10},
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("returns a object containing a count of the number of UACs codes", async () => {
            let result = await busApiClientTest.getUacCodeCount(instrumentName);

            expect(result.count).toEqual(10);
        });
    });

    describe("get all UAC details for an instrument", () => {
        beforeEach(() => {
            mock.onGet(`http://${busApiUrl}/uacs/instrument/${instrumentName}`).reply(200,
                InstrumentUacDetailsMock,
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("returns a dictionary of all UAC details associated to the instrument with the UAC as the index", async () => {
            let instruments = await busApiClientTest.getUacCodes(instrumentName);

            expect(instruments).toEqual(InstrumentUacDetailsMock);
        });
    });

    describe("get all UAC details for an instrument by Case ID", () => {
        beforeEach(() => {
            mock.onGet(`http://${busApiUrl}/uacs/instrument/${instrumentName}/bycaseid`).reply(200,
                InstrumentUacDetailsByCaseIdMock,
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("returns a dictionary of all UAC details associated to the instrument with the Case ID as the index", async () => {
            let instruments = await busApiClientTest.getUacCodesByCaseId(instrumentName);

            expect(instruments).toEqual(InstrumentUacDetailsByCaseIdMock);
        });
    });

    describe("get all disabled UACs for an instrument", () => {
        beforeEach(() => {
            mock.onGet(`http://${busApiUrl}/uacs/uac/${instrumentName}/disabled`).reply(200,
                InstrumentDisabledUacDetailsMock,
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("returns a dictionary of all disabled UAC details associated to the instrument", async () => {
            let instruments = await busApiClientTest.getDisabledUacCodes(instrumentName);

            expect(instruments).toEqual(InstrumentDisabledUacDetailsMock);
        });
    });

    describe("import uacs", () => {
        beforeEach(() => {
            mock.onPost(`http://${busApiUrl}/uacs/import`).reply(200,
                {uacs_imported: 2},
            );
        });

        afterEach(() => {
            mock.reset();
        });

        it("returns a count of uacs imported", async () => {
            let uacImport = await busApiClientTest.importUACs(["123412341234", "432143214321"]);

            expect(uacImport.uacs_imported).toEqual(2);
        });
    })
});
