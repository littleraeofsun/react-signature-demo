"use client"

import { useState } from "react";
import { FetchSignatureCaptureDocuments } from "@/lib/documentsAPI";
import { SignatureCaptureContext } from "@/lib/interfaces";
import { SignatureCapture } from "./components/signature-capture/SignatureCapture";
import { SignedDocumentResult } from "./components/signature-capture/services/_document.service";

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
    <main className="">
      <nav className="navbar sticky-top navbar-light">
        <div className="container pt-3 pb-4 border-bottom">
          <span className="navbar-brand mb-0 h1">React Signature Capture Demo</span>
          <div className="d-flex">
            <button className="btn btn-primary rounded-pill" onClick={onShowDemoClicked}>Launch Demo</button>
          </div>
        </div>
      </nav>
      <div className="container mt-4">
        <div className="row">
          <div className="col-6">
            <div className="card card-body demo-card p-3">
              <h2 className="mb-3">Topaz Signature Tablet</h2>
              <p>This demo incorporates the <a href="https://topazsystems.com/standard/t-s460.html" target="_blank">Topaz T-S460-HSB-R Signature Tablet</a> for the collection of signatures, though you have the option of using a stock signature if desired. Once collected, these signatures are then procedurally applied to PDF documents.</p>
              <h2 className="my-3">PDF Lib</h2>
              <p>This demo also incorporates the <a href="https://pdf-lib.js.org/">PDF Lib</a> package for manipulating PDF documents. Given a PDF document and a series of signature configurations, the app will apply collected signatures to the designated pages of a document.</p>
            </div>        
          </div>
          <div className="col-6">
            <div className="card card-body demo-card p-3">
              <h2 className="mb-3">Document Preview</h2>
              <p>In this demo, you will be walking through a signing process of two documents &#40;<a href="http://127.0.0.1:8080/Primary%20Form.pdf" target="_blank">Primary Form</a>, <a href="http://127.0.0.1:8080/Acknowledgment.pdf" target="_blank">Acknowledgment Form</a>&#41; on behalf of a Client and a Witness.</p>
              <h2 className="my-3">Signed Documents</h2>
              { finalDocs.length === 0 && <p className="fst-italic">You have not signed any documents yet. Click "Launch Demo" to begin signing.</p> }            
              {
                finalDocs.map((_, i) => {
                  return (
                    <button key={i} type="button" className="btn btn-link text-start" onClick={() => onViewFileClicked(i)}>View File { i + 1 }</button>
                  )
                })
              }
            </div>        
          </div>
        </div>
      </div>
      { showDemo && <SignatureCapture context={context} onQuit={() => setShowDemo(false)} onCompleted={onDocumentsSigned} /> }
    </main>
  );
}
