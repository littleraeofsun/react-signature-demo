"use client";

import { SignatureCaptureDocument, SignatureProfile, SignatureProfileDocument } from "@/lib/interfaces";
import styles from './UserProgressStep.module.scss';

interface UserProgressStepProperties {
  userProfile: SignatureProfile;
  isCurrentProfile: boolean;
  isProfileCompleted: boolean;
  documents: SignatureCaptureDocument[];
  currentDocumentIndex: number;
  completedDocumentIndices: number[];
}

export const UserProgressStep = ({userProfile, isCurrentProfile, isProfileCompleted, documents, currentDocumentIndex, completedDocumentIndices}: UserProgressStepProperties) => {
  if (documents) {
    
    // build classes
    const mainClasses = [styles.UserProgressStep];
    let title = `Not collecting ${userProfile.profileDescription} signatures yet.`;
    if (isProfileCompleted) {
      title = `${userProfile.profileDescription} signatures have been collected.`;
      mainClasses.push(styles.UserStepCompleted);
    }
    if (isCurrentProfile) {
      title = `${userProfile.profileDescription} is currently signing documents.`;
      mainClasses.push(styles.CurrentUserStep);
    }

    // method for building user document profile context information
    const buildContext = (docProfile: SignatureProfileDocument, docIndex: number): { document?: SignatureCaptureDocument , classes: string, title: string } => {      
      const document = documents.find(x => x.documentKey === docProfile.documentKey);
      const classes = [styles.UserDocumentStep];
      let title = ` has not yet begun signing `;
      if ((isCurrentProfile && completedDocumentIndices.includes(docIndex)) || isProfileCompleted) {
        classes.push(styles.StepCompleted);
        title = ` has finished signing `;
      }
      if (isCurrentProfile && currentDocumentIndex === docIndex) {
        classes.push(styles.CurrentStep);
        title = ` is currently signing `;
      }
      title = `${userProfile.profileDescription}${title}${document?.documentDescription}.`;

      return { document, classes: classes.join(' '), title };
    }

    return (
      <div className={mainClasses.join(' ')}>
        <div className={styles.UserTitle} title={title}>{ userProfile.profileDescription } Signatures</div>
        {
          userProfile.documentProfiles.map((docProfile, i) => {
            const { document, classes, title } = buildContext(docProfile, i);
            if (document) {
              return(
                <div key={i} className={classes} title={title}><i className={styles.StepCheck + " bi bi-check"}></i></div>
              );
            }
          })
        }
      </div>
    )
  }
}