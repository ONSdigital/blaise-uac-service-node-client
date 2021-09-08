import {InstrumentUacDetails, InstrumentUacDetailsByCaseId} from "../interfaces/instrument-uac-details";

export const InstrumentUacDetailsMock: InstrumentUacDetails = {
    "000975653827": {
        instrument_name: "dst2106a",
        case_id: "100000001",
        postcode_attempts: 0,
        postcode_attempt_timestamp: "",
        uac_chunks: {
            uac1: "0009",
            uac2: "7565",
            uac3: "3827"
        },
        FullUAC: "000975653827"
    },
    "345365454564": {
        instrument_name: "dst2106a",
        case_id: "100000002",
        postcode_attempts: 0,
        postcode_attempt_timestamp: "",
        uac_chunks: {
            uac1: "3453",
            uac2: "6545",
            uac3: "4564"
        },
        FullUAC: "345365454564"
    },
    "978975785367": {
        instrument_name: "dst2106a",
        case_id: "100000003",
        postcode_attempts: 0,
        postcode_attempt_timestamp: "",
        uac_chunks: {
            uac1: "9789",
            uac2: "7578",
            uac3: "5367"
        },
        FullUAC: "978975785367"
    }
};

export const InstrumentUacDetailsByCaseIdMock: InstrumentUacDetailsByCaseId = {
    "100000001": {
        instrument_name: "dst2106a",
        case_id: "100000001",
        postcode_attempts: 0,
        postcode_attempt_timestamp: "",
        uac_chunks: {
            uac1: "0009",
            uac2: "7565",
            uac3: "3827"
        },
        FullUAC: "000975653827"
    },
    "100000002": {
        instrument_name: "dst2106a",
        case_id: "100000002",
        postcode_attempts: 0,
        postcode_attempt_timestamp: "",
        uac_chunks: {
            uac1: "3453",
            uac2: "6545",
            uac3: "4564"
        },
        FullUAC: "345365454564"
    },
    "100000003": {
        instrument_name: "dst2106a",
        case_id: "100000003",
        postcode_attempts: 0,
        postcode_attempt_timestamp: "",
        uac_chunks: {
            uac1: "9789",
            uac2: "7578",
            uac3: "5367"
        },
        FullUAC: "978975785367"
    }
};