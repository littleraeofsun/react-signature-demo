"use client";

import { SignatureCaptureDocument, SignatureProfile } from "@/lib/interfaces";
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
  if (document) {
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

    return (
      <div className={mainClasses.join(' ')}>
        <div className={styles.UserTitle} title={title}>{ userProfile.profileDescription } Signatures</div>
        {
          userProfile.documentProfiles.map((docProfile, i) => {
            const document = documents.find(x => x.documentKey === docProfile.documentKey);
            const docClasses = [styles.UserDocumentStep];
            let titleInfixText = ` has not yet begun signing `;
            if ((isCurrentProfile && completedDocumentIndices.includes(i)) || isProfileCompleted) {
              docClasses.push(styles.StepCompleted);
              titleInfixText = ` has finished signing `;
            }
            if (isCurrentProfile && currentDocumentIndex === i) {
              docClasses.push(styles.CurrentStep);
              titleInfixText = ` is currently signing `;
            }

            if (document) {
              return(
                <div key={i} className={docClasses.join(' ')} title={`${userProfile.profileDescription}${titleInfixText}${document.documentDescription}.`}><i className={styles.StepCheck + " bi bi-check"}></i></div>
              );
            }
          })
        }
      </div>
    )
  }
}