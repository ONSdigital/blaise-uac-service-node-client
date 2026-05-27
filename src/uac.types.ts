type Uacs = Record<string, Uac>;
type UacsByCaseId = Record<string, Uac>;

interface Uac {
  questionnaire_name: string;
  case_id: string;
  disabled: boolean;
  uac_chunks: UacChunks;
  full_uac?: string;
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

interface UacImport {
  uacs_imported: number;
}

interface UacEnableDisableResponse {
  message: string;
}

export type { Uac, UacChunks, UacCount, UacEnableDisableResponse, UacImport, Uacs, UacsByCaseId };
