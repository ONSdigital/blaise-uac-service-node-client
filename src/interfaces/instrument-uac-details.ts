interface InstrumentUacDetails {
    [uac: string]: UacInfo
}

interface InstrumentUacDetailsByCaseId {
    [case_id: string]: UacInfo
}

interface UacInfo {
    instrument_name: string,
    case_id: string,
    uac_chunks: UacChunks,
    full_uac?: string,
}

interface UacChunks {
    uac1: string,
    uac2: string,
    uac3: string,
    uac4?: string,
}

interface UacCount {
    count: number
}

interface UacImport {
    uacs_imported: number
}

export type { InstrumentUacDetails, InstrumentUacDetailsByCaseId, UacCount, UacImport };
