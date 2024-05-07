"use client";

import styles from './DocumentMenu.module.scss';
import { Fragment } from "react";

interface DocumentMenuProperties {
  currentPageIndex: number;
  currentPageRequiresSignature: boolean;
  isCurrentPageSigned: boolean;
  totalPages: number;
  acknowledgeClicked: () => void;
  continueClicked: () => void;
}

export const DocumentMenu = ({currentPageIndex, currentPageRequiresSignature, isCurrentPageSigned, totalPages, acknowledgeClicked, continueClicked}: DocumentMenuProperties) => {
  const ackRequired = currentPageRequiresSignature && !isCurrentPageSigned;
  const isLastPage = currentPageIndex + 1 === totalPages;

  return (
    <div className={styles.DocumentMenu}>
      {
        ackRequired &&
        <Fragment>
          <p>By signing this page, you acknowledge that all of the information is complete and accurate to the best of your knowledge.</p>
          <button className="btn btn-primary" onClick={acknowledgeClicked}>Acknowledge & Sign</button>
        </Fragment>
      }
      {
        !ackRequired && !isLastPage &&
          <Fragment>
            {
              !currentPageRequiresSignature && <p>No signature is required for this page.</p>
            }
            <button className="btn btn-primary" onClick={continueClicked}>Continue</button>
          </Fragment>          
      }
      {
        !ackRequired && isLastPage &&
        <Fragment>
          <p>You have completed all of the signatures required for this document.</p>
          <button className="btn btn-primary" onClick={continueClicked}>Submit Document</button>
        </Fragment>
      }
    </div>
  )
}