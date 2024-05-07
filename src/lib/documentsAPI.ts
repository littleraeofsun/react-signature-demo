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

// Arbitrary 
const mainDocUrl = 'http://127.0.0.1:8080/Primary%20Form.pdf';
const ackDocUrl = 'http://127.0.0.1:8080/Acknowledgment.pdf';
const mainDocApi$ = from(fetch(mainDocUrl).then(result => result.arrayBuffer())).pipe(processPdf());
const ackDocApi$ = from(fetch(ackDocUrl).then(result => result.arrayBuffer())).pipe(processPdf());
const mainDocKey = 'main';
const ackDocKey = 'ack';

export function FetchSignatureCaptureDocuments(): Observable<SignatureCaptureContext> {
  return combineLatest([mainDocApi$,ackDocApi$]).pipe(
    map(([mainDocData, ackDocData]) => {
      const result = {
        documents: [{ documentKey: mainDocKey, documentDescription: 'Primary Form', ...mainDocData }, { documentKey: ackDocKey, documentDescription: 'Acknowledgment Form', ...ackDocData }],
        userProfiles: [{ // determines WHO is signing the documents
          profileDescription: 'Offender',
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
