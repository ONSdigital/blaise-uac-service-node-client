interface InstrumentUacDetails {
    [uac: string]: UacInfo;
}
interface InstrumentUacDetailsByCaseId {
    [case_id: string]: UacInfo;
}
interface UacInfo {
    instrument_name: string;
    case_id: string;
    postcode_attempts: number;
    postcode_attempt_timestamp: string;
    uac_chunks: UacChunks;
    FullUAC: string;
}
interface UacChunks {
    uac1: string;
    uac2: string;
    uac3: string;
    uac4?: string;
}
interface UacCount {
    count: number;
}
export type { InstrumentUacDetails, InstrumentUacDetailsByCaseId, UacCount };
