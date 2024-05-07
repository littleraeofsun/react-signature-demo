"use client";

import { SignatureCaptureDocument } from "@/lib/interfaces";
import styles from './DocumentStep.module.scss';

interface DocumentStepProperties {
  document?: SignatureCaptureDocument;
  isCurrentDocument: boolean;
  currentPageIndex: number;
  signedPageIndices: number[];
  docClicked: () => void;
  stepClicked: (pageIndex: number) => void;
}

export const DocumentStep = ({document, isCurrentDocument, currentPageIndex: currentPage, signedPageIndices: signedPages, docClicked, stepClicked}: DocumentStepProperties) => {
  if (document) {
    const indexArray = Array(document.pageCount).fill(0).map((_, i) => i);

    const onDocClicked = () => {
      if (isCurrentDocument) docClicked();
    };

    const onStepClicked = (index:number) => {
      if (isCurrentDocument) stepClicked(index);
    };

    return (
      <div className={styles.UserDocumentStep + (isCurrentDocument ? ' ' + styles.CurrentDocument : '')}>
        <p className="h5 border-bottom border-primary mt-4" onClick={onDocClicked}>{ document.documentDescription }</p>
        {
          indexArray.map((pageIndex, i) => {
            const classes = [styles.SignatureDocumentPageStep];
            if (signedPages.includes(i))
              classes.push(styles.StepCompleted);         
            if (isCurrentDocument && i === currentPage)
              classes.push(styles.CurrentStep);

            return (            
              <div key={i} className={classes.join(' ')} onClick={() => onStepClicked(pageIndex)}>Page {pageIndex + 1} <i className={styles.StepCheck + " bi bi-check"}></i></div>
            )
          })
        }
      </div>
    )
  }
}