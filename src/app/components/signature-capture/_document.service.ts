import { SignatureProfileConfig, SignatureProfileDocument } from "@/lib/interfaces";
import { PDFDocument, PDFPage, degrees, rgb } from "pdf-lib";
import { Observable, forkJoin, from, iif, map, of, switchMap } from "rxjs";

/** DTO for facilitating the displaying and managing the signature acquisition state of pages in a PDF document */
export interface GeneratedSignaturePage {
  originalPage: PDFPage | null;
  unsignedPageContent: string;
  signedPageContent: string;

  requiredSignatures: SignatureProfileConfig[];
  hasBeenSigned: boolean;
}

/**
   * This method takes an original unsigned `PDFDocument` and builds out the `GeneratedSignaturePage` array needed for the `SignatureCapture` component.
   * 
   * Because the client needs to see the page before and after signing, we have to jump through a few hoops here:
   *  1. The original PDF has to be broken down into single-page PDF documents for each page
   *  2. We have to provide an unsigned single-page PDF and a signed single-page PDF so the component can display different states of the page to the user
   * 
   * @param documentProfile The original `SignatureProfileDocument` containing siganture config
   * @param pdfDocument The source `PDFDocument` used to generate the signature pages
   * @param signature The base64 string containing the image content for the signature
   * @returns An array of `GeneratedSignaturePage` objects representing each page of the original document
   */
export function GenerateSignaturePages(documentProfile: SignatureProfileDocument, pdfDocument: PDFDocument, signature: string): Observable<GeneratedSignaturePage[]> {
  // prebuild set of result pages with the relevant signatures
  const pdfPages = pdfDocument.getPages();
  const generatedPages = pdfPages.map((page, pageIndex) => {
    return { originalPage: page, hasBeenSigned: false, requiredSignatures: (documentProfile?.signatures ?? []).filter(sig => sig.isOnPage(pageIndex, pdfPages.length)) } as GeneratedSignaturePage;
  });

  // Build out unsigned and signed version of each page in the original document
  return forkJoin(
    // for each page of the original document...
    generatedPages.map((currentPage, currentPageIndex) => {
      // Step 1: create an "unsigned" version of each page with a red box placeholder on pages that require a signature
      return from(PDFDocument.create()) // start with a new empty PDF
        .pipe(
          // copy the current page from the original document into the new blank document
          switchMap(blankDocument => from(blankDocument.copyPages(pdfDocument, [currentPageIndex]))
            .pipe(
              map(copiedPageArray => {
                // we will only ever have a page count of 1
                let copiedPage = copiedPageArray[0];
                
                // for each signature config that `isOnPage` for the current page, apply the preview rectangle per the configuration
                currentPage.requiredSignatures.forEach((sig) => {
                  copiedPage.drawRectangle({
                    x: sig.positionX,
                    borderColor: rgb(1, 1, 0),
                    borderOpacity: .5,
                    color: rgb(1, 1, 0),
                    height: sig.height,
                    opacity: .25,
                    width: sig.width,
                    y: sig.positionY
                  });
                });

                blankDocument.addPage(copiedPage);
                return blankDocument;
              }),
              // squish everything back together
              switchMap(blankDocument => from(blankDocument.saveAsBase64({ dataUri: true }))),
              map(base64String => {
                currentPage.unsignedPageContent = base64String;
              })
            )),
          // Step 2: create a "signed" version of each page with the signature appearing on pages that require a signature
          switchMap(_ => from(PDFDocument.create()) // start with a new empty PDF
            .pipe(
              // copy the current page from the original document into the new blank document
              switchMap(blankDocument => from(blankDocument.copyPages(pdfDocument, [currentPageIndex]))
                .pipe(
                  // we will only ever have a page count of 1
                  map(copiedPageArray => copiedPageArray[0]),
                  switchMap(copiedPage =>
                    iif(
                      // if the signature is not required on this page...
                      () => currentPage.requiredSignatures.length === 0,
                      // then forward the page unchanged
                      of(copiedPage),
                      // otherwise, apply the signature(s) to the page
                      from(blankDocument.embedPng(signature)).pipe(
                        map(sigImage => {

                          // for each signature config that `isOnPage` for the current page, apply the final signature per the configuration
                          currentPage.requiredSignatures.forEach((sig) => { 
                            const signatureImageDimensions = sigImage.scaleToFit(sig.width, sig.height);
                            copiedPage.drawImage(sigImage, {
                              x: sig.positionX,
                              y: sig.positionY,
                              width: signatureImageDimensions.width,
                              height: signatureImageDimensions.height,
                              rotate: degrees(0),
                              opacity: 1
                            });
                          })
                          return copiedPage;
                        })
                      )
                    )
                  ),
                  map(page => {
                    blankDocument.addPage(page);
                    return blankDocument;
                  }),
                  // squish everything back together
                  switchMap(blankDocument => from(blankDocument.saveAsBase64({ dataUri: true }))),
                  map(base64String => {
                    currentPage.signedPageContent = base64String;

                    return currentPage;
                  })
                ))
            )
          ))
    })
  );
}

/**
 * This method takes a `GeneratedSignaturePage` array and compiles a final `PDFDocument` from the signed pages.
 * 
 * @param pages The `GeneratedSignaturePage` array resulting from a completed signing process in the `SignatureCapture` component
 * @returns The final compiled `PDFDocument`
 */
export function AggregateSignaturePages(pages: GeneratedSignaturePage[]) : Observable<PDFDocument> {
  // create a new blank PDFDocument
  return from(PDFDocument.create()).pipe(
    switchMap(newDocument =>
      // map all the signed pages from their base64 content strings into PDFPages
      forkJoin(
        pages.map(sigPage =>
          from(PDFDocument.load(sigPage.signedPageContent)).pipe(
            switchMap(signedPageDoc => from(newDocument.copyPages(signedPageDoc, [0]))),
            map(copiedPages => copiedPages[0])
          )
        )
      ).pipe(
        // add each of those final PDFPages to the new blank PDFDocument
        map(finalPages => {
          for (let i = 0; i < finalPages.length; i++)
            newDocument.addPage(finalPages[i]);

          return newDocument;
        })
      )
    )
  );
}


  /**
 * @remarks
 * Contains the various ways that the signature capture process will return the completed document.
 */
export interface SignedDocumentResult {
  /**
   * @remarks
   * This is the full dataUri string representing both the scheme and data for this document.
   */
  dataUriString: string,
  /**
   * @remarks
   * This is the leading scheme for the completed document containing both the MIME type as well as encoding.
   */
  scheme: string,
  /**
   * @remarks
   * This is the mime type which can base used when creating File or Blob objects from this result.
   */
  mimeType: string,
  /**
   * @remarks
   * This is the data portion comprising this document, without the scheme.
   */
  data: string,
  /**
   * @remarks
   * This is the final compiled PDF file document format that be used with pdf-lib.
   */
  pdfDocument: PDFDocument,
}

/**
 * This method takes a `PDFDocument`s and returns a model representing the contents in a variety of usable formats.
 * 
 * @param document The `PDFDocument` to convert
 * @returns The document contents as in various base64 formats
 */
export function PrepareDocumentResult(document: PDFDocument): Observable<SignedDocumentResult> {  
  return from(document.saveAsBase64({ dataUri: true})).pipe(map(base64result => {
    const [scheme, doc] = base64result.split(',');
    const mimeType = scheme.substring(5, scheme.indexOf(';'));

    return {
      data: doc,
      dataUriString: base64result,
      scheme,
      mimeType,
      pdfDocument: document
    }
  }));
}