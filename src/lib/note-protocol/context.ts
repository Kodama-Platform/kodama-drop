import {
  createProtectionContext,
  type ProtectionContext,
} from "@kodama.page/core";

import {
  KNP_PRODUCT_ID,
  KNP_PROTOCOL_VERSION,
  KNP_SCHEMA_VERSION,
  OBJECT_ID_WORKBOOK,
  PURPOSE_NOTE_CONTENT,
  PURPOSE_NOTE_MANIFEST,
} from "./constants";

export function noteContentContext(input: {
  readonly placeId: string;
  readonly objectId?: string;
  readonly objectVersion: number;
  readonly epoch: number;
}): ProtectionContext {
  return createProtectionContext({
    productId: KNP_PRODUCT_ID,
    purpose: PURPOSE_NOTE_CONTENT,
    placeId: input.placeId,
    objectId: input.objectId ?? OBJECT_ID_WORKBOOK,
    schemaVersion: KNP_SCHEMA_VERSION,
    protocolVersion: KNP_PROTOCOL_VERSION,
    objectVersion: input.objectVersion,
    epoch: input.epoch,
  });
}

export function noteManifestContext(input: {
  readonly placeId: string;
  readonly objectId?: string;
  readonly objectVersion: number;
  readonly epoch: number;
}): ProtectionContext {
  return createProtectionContext({
    productId: KNP_PRODUCT_ID,
    purpose: PURPOSE_NOTE_MANIFEST,
    placeId: input.placeId,
    objectId: input.objectId ?? OBJECT_ID_WORKBOOK,
    schemaVersion: KNP_SCHEMA_VERSION,
    protocolVersion: KNP_PROTOCOL_VERSION,
    objectVersion: input.objectVersion,
    epoch: input.epoch,
  });
}
