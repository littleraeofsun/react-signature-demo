"use client"

import { useState } from "react";
import { FetchSignatureCaptureDocuments } from "@/lib/documentsAPI";
import { SignatureCaptureContext } from "@/lib/interfaces";
import { SignatureCapture } from "./components/signature-capture/SignatureCapture";
import { SignedDocumentResult } from "./components/signature-capture/_document.service";

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [context, setContext] = useState({ documents: [], userProfiles: [] } as SignatureCaptureContext);
  const [finalDocs, setFinalDocs] = useState<SignedDocumentResult[]>([]);

  const onShowDemoClicked = () => {    
    const sub = FetchSignatureCaptureDocuments().subscribe(result => {
      setContext(result);
      setShowDemo(true)
    });
    return () => {
      sub.unsubscribe();
    }    
  }
  const onDocumentsSigned = (results: SignedDocumentResult[]) => {
    setFinalDocs(results);
    setShowDemo(false);
  }
  const onViewFileClicked = (index: number) => {
    const doc = finalDocs[index];
    const buffer = _convertToArrayBuffer(doc.data);

    const file = new Blob([buffer], { type: doc.mimeType});
    const fileUrl = URL.createObjectURL(file);

    window.open(fileUrl, '_blank');
  }

  const _convertToArrayBuffer = (data: string) => {
    const binaryString = window.atob(data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Signature Capture Demo</h1>
      <div>
      {
        finalDocs.map((_, i) => {
          return (
            <button key={i} type="button" className="btn btn-link me-3" onClick={() => onViewFileClicked(i)}>View File { i + 1 }</button>
          )
        })
      }
      </div>
      <button className="btn btn-primary" onClick={onShowDemoClicked}>Launch Demo</button>
      { showDemo && <SignatureCapture context={context} onQuit={() => setShowDemo(false)} onCompleted={onDocumentsSigned} /> }
    </main>
  );
}
