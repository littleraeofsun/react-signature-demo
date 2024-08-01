"use client";

import { useEffect, useState } from "react";
import { BeginCapture, ClearCapture, EndCapture, SignaturePreview$ } from "./services/_topaz.service";
import { CropOutWhiteSpace, GetSampleSignature } from "./services/_image.service";
import styles from './TopazCapture.module.scss';

export interface TopazCaptureProps {
  /** Yields the base64 string data of the accepted signature */
  onCompleted: (signature: string) => void;
}

enum CaptureState { StartingPrompt, CapturingSignature, ClearingSignature, SignatureCaptured };

export function TopazCapture({onCompleted}: TopazCaptureProps) {
  // state
  const [captureState, setCaptureState] = useState<CaptureState>(CaptureState.StartingPrompt);
  const [previewSignature, setPreviewSignature] = useState<string>();
  const [finalSignature, setFinalSignature] = useState<string>();

  // effects
  useEffect(() => {
      SignaturePreview$.subscribe(blob => {
        setPreviewSignature(URL.createObjectURL(blob));
      });
    }, []);
  useEffect(() => {
      switch(captureState) {
        case CaptureState.CapturingSignature:
          EndCapture();
          BeginCapture(500, 100);
          break;
        case CaptureState.ClearingSignature:
          ClearCapture();
          setCaptureState(CaptureState.CapturingSignature);
          break;
        case CaptureState.SignatureCaptured:        
          EndCapture();
          break;
      }
    }, [captureState]);

  // local methods
  function useSampleSignature() {
    _onSignatureAccepted(GetSampleSignature());
  }
  function processFinalSignature(e: any) {
    setFinalSignature(CropOutWhiteSpace(e.target));
  }
  function _onSignatureAccepted(signature: string) {    
    setCaptureState(CaptureState.StartingPrompt);
    ClearCapture();
    setPreviewSignature('');
    setFinalSignature('');
    onCompleted(signature);
  }

  return (
    <div className={styles.TopazCapture}>
      { captureState === CaptureState.StartingPrompt &&
        <div className={styles.TopazCapturePrompt}>
          <p className="mb-4">You must provide a digital signature to apply to the documents.</p>
          <button className="btn btn-primary" onClick={() => setCaptureState(CaptureState.CapturingSignature)}>Continue</button>
          <button className="btn btn-outline-primary ms-3" onClick={useSampleSignature}>Use Sample Signature</button>
        </div>
      }
      { (captureState === CaptureState.CapturingSignature || captureState === CaptureState.ClearingSignature) &&
        <div className={styles.TopazCaptureAcquisition}>
          <p>Please use the signature pad to sign and submit your signatue below.
            This signature will be applied to any documents that you willfuly acknowledge in the next step.</p>

          { previewSignature &&
            <div className={styles.TopazSignaturePreview + ' mb-3 text-center '}>
              <img src={previewSignature} alt="Signature Preview" onLoad={processFinalSignature} />
            </div>
          }
          
          <div className="text-end mt-2">
            <button className="btn btn-outline-primary" onClick={() => setCaptureState(CaptureState.ClearingSignature)}>Clear</button>
            <button className="btn btn-primary ms-2" onClick={() => setCaptureState(CaptureState.SignatureCaptured)}>Submit</button>
          </div>
        </div>
      }
      { captureState === CaptureState.SignatureCaptured &&
        <div className={styles.TopazCaptureAcquisition}>
          <p>Here is a preview of your digital signature. If you are satisfied, click <b>Accept Signature</b> to proceed to the document review.</p>
          <p>If you would like to re-enter your signature, click <b>Recapture Signature</b>.</p>

          { previewSignature &&
            <div className={`${styles.TopazSignaturePreview} ${styles.FinalPreview} mb-3 text-center`}>
              <img src={previewSignature} alt="Signature Preview" onLoad={processFinalSignature} />
            </div>
          }

          <div className="text-end mt-2">
            <button className="btn btn-outline-primary" onClick={() => setCaptureState(CaptureState.ClearingSignature)}>Recapture Signature</button>
            <button className="btn btn-primary ms-2" onClick={() => _onSignatureAccepted(finalSignature ?? '')}>Accept Signature</button>
          </div>
        </div>
      }
    </div>
  );
}
