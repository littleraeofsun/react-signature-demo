import { Observable, combineLatest, from, map, pipe, switchMap } from "rxjs";
import { SignatureCaptureContext, SignatureProfileConfig, StandardPageValidators } from "./interfaces";
import { PDFDocument } from "pdf-lib";

/** Reusable Observable pipeline for processing a PDF response from a server */
const processPdf = () => pipe(
  switchMap((buffer: ArrayBuffer) => from(PDFDocument.load(buffer))),
  map(newPdf => ({
    pdfDocument: newPdf,
    pageCount: newPdf.getPageCount()
  }))
);

// Arbitrary paths to documents for the demo (these would normally be retrieved programmatically or derived from config files)
const mainDocUrl = 'http://127.0.0.1:8080/Primary%20Form.pdf';
const ackDocUrl = 'http://127.0.0.1:8080/Acknowledgment.pdf';

// local constants
const mainDocKey = 'main';
const ackDocKey = 'ack';

// document sourcing "api" calls (stubs for the demo process)
const mainDocApi$ = from(fetch(mainDocUrl).then(result => result.arrayBuffer())).pipe(processPdf());
const ackDocApi$ = from(fetch(ackDocUrl).then(result => result.arrayBuffer())).pipe(processPdf());


export function FetchSignatureCaptureDocuments(): Observable<SignatureCaptureContext> {
  return combineLatest([mainDocApi$,ackDocApi$]).pipe(
    map(([mainDocData, ackDocData]) => {
      const result = {
        documents: [{ documentKey: mainDocKey, documentDescription: 'Primary Form', ...mainDocData }, { documentKey: ackDocKey, documentDescription: 'Acknowledgment Form', ...ackDocData }],
        userProfiles: [{ // determines WHO is signing the documents
          profileDescription: 'Client',
          documentProfiles: [{ // determines WHICH documents they sign
            documentKey: mainDocKey,
            signatures: [offenderMainDocSignatureConfig, offenderMainDocLastPageSignatureConfig] // determines HOW they sign this document
          },{
            documentKey: ackDocKey,
            signatures: [offenderAckDocSignatureConfig]
          }]
        },{
          profileDescription: 'Witness',
          documentProfiles: [{
            documentKey: mainDocKey,
            signatures: [witnessMainDocSignatureConfig]
          },{
            documentKey: ackDocKey,
            signatures: [witnessAckDocSignatureConfig]
          }]
        }]
      };

      return result;
    })
  );
}

// document signature configurations
const offenderMainDocSignatureConfig: SignatureProfileConfig = {
  positionX: 378,
  positionY: 32,
  height: 35,
  width: 175,
  isOnPage: StandardPageValidators.SignatureIsOnAllButLastPage
}
const offenderMainDocLastPageSignatureConfig: SignatureProfileConfig = {
  positionX: 358,
  positionY: 57,
  height: 35,
  width: 175,
  isOnPage: StandardPageValidators.SignatureIsOnLastPageOnly
}
const offenderAckDocSignatureConfig: SignatureProfileConfig = {
  positionX: 350,
  positionY: 60,
  height: 35,
  width: 175,
  isOnPage: StandardPageValidators.SignatureIsOnAllPages
}

const witnessMainDocSignatureConfig: SignatureProfileConfig = {
  positionX: 80,
  positionY: 60,
  height: 35,
  width: 175,
  isOnPage: StandardPageValidators.SignatureIsOnLastPageOnly
}
const witnessAckDocSignatureConfig: SignatureProfileConfig = {
  positionX: 80,
  positionY: 60,
  height: 35,
  width: 175,
  isOnPage: StandardPageValidators.SignatureIsOnLastPageOnly
}
