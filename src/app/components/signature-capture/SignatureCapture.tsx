"use client";
import { useEffect, useState } from 'react';
import { updateAtIndex } from '@/lib/array.utilities';
import { BaseSignatureDocument, SignatureCaptureContext, SignatureProfile } from '@/lib/interfaces';
import { AggregateSignaturePages, GenerateSignaturePages, GeneratedSignaturePage, PrepareDocumentResult, SignedDocumentResult } from './_document.service';
import { Spinner } from '../Spinner';
import { DocumentStep } from './DocumentStep';
import { UserProgressStep } from './UserProgressStep';
import { TopazCapture } from './TopazCapture';
import { DocumentMenu } from './DocumentMenu';
import styles from './SignatureCapture.module.scss';
import { combineLatest, of } from 'rxjs';
import { PDFDocument } from 'pdf-lib';

interface FinalDocument extends BaseSignatureDocument {
  pdf: PDFDocument;
  hasBeenCompleted: boolean;
}

interface SignatureCaptureProperties {
  context: SignatureCaptureContext;
  onQuit: () => void;
  onCompleted: (results: SignedDocumentResult[]) => void;
}
const offcanvasShowClassOn = ' show';
const offcanvasShowClassOff = '';

export const SignatureCapture = ({ context, onQuit, onCompleted }: SignatureCaptureProperties) => {
  // state
  const [finalDocs, setFinalDocs] = useState<FinalDocument[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentPageSets, setCurrentPageSets] = useState<GeneratedSignaturePage[][]>([]);
  const [isLoadingPageSet, setIsLoadingPageSet] = useState(false);
  const [currentDocumentPageSetIndex, setCurrentDocumentPageSetIndex] = useState(0);
  const [currentDocumentPageIndex, setCurrentDocumentPageIndex] = useState(0);
  const [offcanvasShowClass, setOffcanvasShowClass] = useState('');
  
  // state derivatives
  const currentUser = context.userProfiles[currentUserIndex];
  const currentPageSet = currentPageSets[currentDocumentPageSetIndex] ?? [];
  const currentPage = currentPageSet[currentDocumentPageIndex];
  const currentDocument = context.documents.find(x => x.documentKey === currentUser?.documentProfiles[currentDocumentPageSetIndex]?.documentKey);
  const isLastPage = currentDocumentPageIndex + 1 >= (currentDocument?.pageCount ?? 0);
  const isLastDocument = currentDocumentPageSetIndex + 1 >= (currentUser?.documentProfiles.length ?? 0);
  const currentPageRequiresSignatures = (currentPage?.requiredSignatures.length ?? 0) > 0;
  const currentPageSetCompleted = (currentPageSet?.length ?? 0) > 0 && currentPageSet?.every(page => page.hasBeenSigned || page.requiredSignatures.length === 0);

  // effects
  useEffect(() => {
    setCurrentUserIndex(0);
    setCurrentDocumentPageSetIndex(0);
    _acquireSignature();
  }, []);
  useEffect(() => {
    if (currentUserIndex > 0) {
      const sub = combineLatest(currentPageSets.map(set => AggregateSignaturePages(set)))
        .subscribe(docs => {
          setFinalDocs(docs.map((doc, i) => ({
            documentKey: currentUser?.documentProfiles[i]?.documentKey ?? '',
            pdf: doc,
            hasBeenCompleted: currentUserIndex >= context.userProfiles.length
          } as FinalDocument)));
          setTimeout(() => sub.unsubscribe(), 0);
        });
    }
    if (currentUserIndex < context.userProfiles.length) {
      setCurrentPageSets([]);
      setCurrentDocumentPageSetIndex(0);
      setCurrentDocumentPageIndex(0);
      _acquireSignature();
    }
  }, [currentUserIndex]);
  useEffect(() => {
    if (currentUserIndex >= context.userProfiles.length) {
      combineLatest(finalDocs.map(doc => PrepareDocumentResult(doc.pdf))).subscribe(results => onCompleted(results));
    }
  }, [finalDocs]);

  // local event handlers
  const onDocumentClicked = (docIndex: number) => {
    setCurrentDocumentPageSetIndex(docIndex);
    setCurrentDocumentPageIndex(0);
  }
  const onDocumentPageStepClicked = (docIndex: number, pageIndex: number) => {
    setCurrentDocumentPageSetIndex(docIndex);
    setCurrentDocumentPageIndex(pageIndex);
  }
  const onTopazCompleted = (signature: string) => {
    setOffcanvasShowClass(offcanvasShowClassOff);
    _generateNewPageSets(currentUser, signature);
  }
  const onPageAcknowledged = () => {
    setCurrentPageSets(sets => {
      const updatedItem = { ...sets[currentDocumentPageSetIndex][currentDocumentPageIndex], hasBeenSigned: true };
      const updatedSet = updateAtIndex(sets[currentDocumentPageSetIndex], updatedItem, currentDocumentPageIndex);
      return updateAtIndex(sets, updatedSet, currentDocumentPageSetIndex);
    });
  }
  const onPageNext = () => {
    if (!currentDocument) return;
    if (isLastPage) {
      if (isLastDocument) {
        setCurrentUserIndex(i => i + 1);
      } else {
        setCurrentDocumentPageIndex(0);
        setCurrentDocumentPageSetIndex(i => i + 1);
      }      
    } else {
      setCurrentDocumentPageIndex(i => i + 1);
    }
  }

  // local methods
  const _acquireSignature = () => {
    setOffcanvasShowClass(offcanvasShowClassOn);
  }
  const _generateNewPageSets = (userProfile: SignatureProfile, signature: string) => {
    setIsLoadingPageSet(true);
    setCurrentDocumentPageSetIndex(0);
    setCurrentDocumentPageIndex(0);

    const sub = combineLatest(userProfile.documentProfiles.map((docProfile, i) => {
      const pdfDocument = finalDocs.length > i ? finalDocs[i].pdf : context.documents.find(x => x.documentKey === docProfile.documentKey)?.pdfDocument;
      if (!pdfDocument) return of();
      return GenerateSignaturePages(docProfile, pdfDocument, signature);
    })).subscribe((generatedSets) => {
      setCurrentPageSets(generatedSets);
      setTimeout(() => sub.unsubscribe(), 0);
      setIsLoadingPageSet(false);
    });
  }

  return (
    <div className={styles.SignatureCaptureComponent}>
      <div className={styles.SignatureCaptureBody}>
        <div className={styles.SignatureCaptureProgress + ' p-4'}>
          <p className="h3">{currentUser?.profileDescription} Signatures</p>
          {
            currentUser?.documentProfiles.map((doc, i) => {
              const originalDocument = context.documents.find(d => d.documentKey === doc.documentKey);
              const signedPages = (currentPageSets[i] ?? []).map((page, i) => page.hasBeenSigned ? i : -1).filter(x => x >= 0);
              return (
                <DocumentStep key={i} document={originalDocument} isCurrentDocument={i === currentDocumentPageSetIndex}
                  currentPageIndex={currentDocumentPageIndex} signedPageIndices={signedPages}
                  docClicked={() => onDocumentClicked(i)} stepClicked={(step) => onDocumentPageStepClicked(i, step)} />
              );
            })
          }
        </div>
        { !isLoadingPageSet && !offcanvasShowClass && currentPage &&        
          <div className={styles.SignatureCaptureDocument}>  
            <div className={styles.SignatureCaptureDocumentPane}>
                <iframe title="Signature Capture Document Pane"
                  src={ (currentPage.hasBeenSigned
                      ? currentPage.signedPageContent
                      : currentPage.unsignedPageContent) + '#toolbar=0&navpanes=0' }>
                </iframe>
            </div>

            <div className={styles.SignatureCaptureDocumentActions + ' p-4'}>
              <DocumentMenu currentPageIndex={currentDocumentPageIndex}
                currentPageRequiresSignature={currentPageRequiresSignatures}
                isCurrentPageSigned={!!currentPage?.hasBeenSigned}
                totalPages={currentDocument?.pageCount ?? 0}
                acknowledgeClicked={onPageAcknowledged} continueClicked={onPageNext} />
            </div>
          </div>
        }
        { (isLoadingPageSet || offcanvasShowClass) &&
          <Spinner message="Generating documents..." />
        }
      </div>
      <div className={styles.SignatureCaptureFooter}>
        <div className={styles.SignatureCaptureFooterQuit + ' p-2 text-center'}>
          <button className="btn btn-outline-danger" onClick={() => onQuit()}>Quit & Discard Changes</button>
        </div>
        <div className={styles.SignatureCaptureFooterProgress}>
          {
            context.userProfiles.map((user, i) => {
              const profileCompleted = currentUserIndex > i || (currentUserIndex === i && isLastDocument && isLastPage && !!currentPage?.hasBeenSigned);
              const completedDocuments = (context.userProfiles[i]?.documentProfiles ?? []).map((_, i) => (profileCompleted || i < currentDocumentPageSetIndex || (i === currentDocumentPageSetIndex && currentPageSetCompleted)) ? i : -1).filter(x => x >= 0);
              return (
                <UserProgressStep key={i} userProfile={user} isCurrentProfile={currentUserIndex === i}
                  isProfileCompleted={profileCompleted} completedDocumentIndices={completedDocuments}
                  documents={context.documents} currentDocumentIndex={currentDocumentPageSetIndex} />
              )
            })
          }
        </div>
      </div>
      {
        !!offcanvasShowClass && <div className={styles.TopazCanvasBackdrop}></div>
      }
      <div className={styles.TopazOffcanvas + ' offcanvas' + offcanvasShowClass}>
        <div className="offcanvas-header">
          <p className="h4">{currentUser?.profileDescription} Signature Acquisition</p>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" onClick={() => onQuit()}></button>
        </div>
        <div className="offcanvas-body">
          <TopazCapture onCompleted={onTopazCompleted} />
        </div>
      </div>
    </div>
  );
}