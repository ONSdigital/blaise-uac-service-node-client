import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import 'regenerator-runtime/runtime'
import BusApiClient, {InstrumentUacDetailsMock, InstrumentUacDetailsByCaseIdMock} from "../bus-api-client";

const mock = new MockAdapter(axios, {onNoMatch: "throwException"});
const busApiUrl = "testUri";
const busClientId = "1234534";

const instrumentName = "DST1234A";

const busApiClientTest = new BusApiClient(`http://${busApiUrl}`, busClientId);

describe("busApiClientTest", () => {
describe("generate UAC codes for an instrument", () => {
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
});