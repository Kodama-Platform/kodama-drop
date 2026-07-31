/** KNP-1 protocol identity + KSC product bindings. */
export const KNP_PROTOCOL = "knp-1" as const;
export const KNP_SUITE = "KSC_V1" as const;
export const KNP_PRODUCT_ID = "note" as const;
export const KNP_SCHEMA_VERSION = 1 as const;
export const KNP_PROTOCOL_VERSION = 1 as const;

export const PURPOSE_NOTE_CONTENT = "note-content" as const;
export const PURPOSE_NOTE_MANIFEST = "note-manifest" as const;
export const PURPOSE_OWNER_WRAP = "owner-wrap" as const;
export const PURPOSE_READER_WRAP = "reader-wrap" as const;
export const PURPOSE_STATE_HEADER = "state-header" as const;
export const PURPOSE_POLICY = "policy" as const;

export const OBJECT_ID_WORKBOOK = "workbook" as const;
