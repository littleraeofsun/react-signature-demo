import { PDFDocument } from "pdf-lib";

/** Primary DTO for transporting a document signature session */
export interface SignatureCaptureContext {
  documents: SignatureCaptureDocument[];
  userProfiles: SignatureProfile[];
}

/** Internal contract for enforcing document keys across document-first and user-first signature capture data models */
export interface BaseSignatureDocument {
  documentKey: string;
}

/** DTO for transmitting a PDF document intended for Signature Capture (document-first) */
export interface SignatureCaptureDocument extends BaseSignatureDocument {
  documentDescription: string;
  pdfDocument: PDFDocument;
  pageCount: number;
}

/** DTO for transmititng Signature requirements and configuraiton for a given user (user-first) */
export interface SignatureProfile {
  profileDescription: string;
  documentProfiles: SignatureProfileDocument[];
}

/** DTO representing a specific document that a user will need to sign with the relevant signature configurations */
export interface SignatureProfileDocument extends BaseSignatureDocument {
  signatures: SignatureProfileConfig[];
}

/** Delegate format for methods that can be used to determine whether or not a given signature config applies to a specific page of a document */
export type SignatureProfileConfigPageValidator = (pageIndex: number, totalPages: number) => boolean;

/** DTO representing a signature configuration for a given user for a given document (M:N squishy stuff) */
export interface SignatureProfileConfig {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  /** This method is called to determine if the current signature should be applied to the page on the document.
   * Can be a custom method or one of the standard validators below can be used instead.
   */
  isOnPage: SignatureProfileConfigPageValidator;
}

/** Standard pre-made page validators for `SignatureProfileConfig.isOnPage` property */
const SignatureIsOnAllPages: SignatureProfileConfigPageValidator = () => true;
const SignatureIsOnFirstPageOnly: SignatureProfileConfigPageValidator = (index: number) => index === 0;
const SignatureIsOnLastPageOnly: SignatureProfileConfigPageValidator = (index: number, totalPages: number) => (index + 1) === totalPages;
const SignatureIsOnAllButFirstPage: SignatureProfileConfigPageValidator = (index: number) => index !== 0;
const SignatureIsOnAllButLastPage: SignatureProfileConfigPageValidator = (index: number, totalPages: number) => (index + 1) !== totalPages;
const SignatureIsOnOnlyEvenPages: SignatureProfileConfigPageValidator = (index: number) => (index % 2) === 0;
const SignatureIsOnOnlyOddPages: SignatureProfileConfigPageValidator = (index: number) => (index % 2) !== 0;
const SignatureIsOnAllButFirstAndLastPages: SignatureProfileConfigPageValidator = (index: number, totalPages: number) => index !== 0 && (index + 1) !== totalPages;

export const StandardPageValidators = {
  SignatureIsOnAllPages,
  SignatureIsOnFirstPageOnly,
  SignatureIsOnLastPageOnly,
  SignatureIsOnAllButFirstPage,
  SignatureIsOnAllButLastPage,
  SignatureIsOnOnlyEvenPages,
  SignatureIsOnOnlyOddPages,
  SignatureIsOnAllButFirstAndLastPages,
};