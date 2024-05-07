import { Observable, Subject, catchError, filter, from, iif, interval, map, of, repeat, switchMap, takeUntil, tap } from "rxjs";

// Again, yes, cutting corners for the demo
// This is the "local" SigWeb service for interacting with the tablet drivers
const apiUrl = 'http://tablet.sigwebtablet.com:47289/SigWeb/';

/** Method for reading property values from the SigWeb driver service (running on the local machine) */
function getSigWebProperty(property:string) {
  var xhr = new XMLHttpRequest();
  if (xhr) {
    xhr.open("GET", apiUrl + property + '?noCache=' + crypto.randomUUID(), false);
    xhr.send();
    if (xhr.readyState == 4 && xhr.status == 200) {
      return xhr.responseText;
    }
  }
  return "";
}
/** Method for reading blob values from the SigWeb driver service as you have to run async to control the response type */
function getSigWebBloblProperty(property:string) {
  return fetch(apiUrl + property + '?noCache=' + crypto.randomUUID(), { responseType: 'blob'} as Object);
}

/** Method for writing property values to the SigWeb driver service (running on the local machine) */
function setSigWebProperty(property: string) {
  var xhr = new XMLHttpRequest();
  if (xhr) {
    xhr.open("POST", apiUrl + property + '?noCache=' + crypto.randomUUID(), false);
    xhr.send();
  }
}

// These are the established ways of interacting with the tablet
const checkSigWebConnection = () => setSigWebProperty('TabletComTest/1');
const turnTabletOn = () => setSigWebProperty('TabletState/1');
const turnTabletOff = () => setSigWebProperty('TabletState/0');
const getTabletState = () => getSigWebProperty('TabletState');
const getTabletModelNumber = () => getSigWebProperty('TabletModelNumber');
const getSignatureImageBlob = () => getSigWebBloblProperty('SigImage/0');
const getSignatureImageBase64 = () => getSigWebBloblProperty('SigImage/1');
const resetSignaturePad = () => setSigWebProperty('Reset');
const clearSignaturePad = () => getSigWebProperty('ClearSignature');
const getScreenDataPoints = () => getSigWebProperty('TotalPoints');
const setJustificationMode = (mode: string) => setSigWebProperty('JustifyMode/' + mode);
const setDisplayWidth = (width: number) => setSigWebProperty('DisplayXSize/' + width);
const setDisplayHeight = (height: number) => setSigWebProperty('DisplayYSize/' + height);
const setImageWidth = (width: number) => setSigWebProperty('ImageXSize/' + width);
const setImageHeight = (height: number) => setSigWebProperty('ImageYSize/' + height);

const endCaptureRequested$: Subject<boolean> = new Subject();
/** Observable subject for streaming the preview image from the tablet when capture state is active. */
export const SignaturePreview$: Subject<Blob> = new Subject();

let previousScreenDataPoints = 0;
/**
 * Initializes the Topaz tablet and engages the capture state which can be observed via `SignaturePreview$`.
 * @param canvasWidth The width in pixels to cast the signature data stream
 * @param canvasHeight The height in pixels to cast the signature data stream
 */
export const BeginCapture = (canvasWidth: number, canvasHeight: number) => {
  const justificationMode = '5'; // this is a Topaz constant value
  resetSignaturePad();
  setJustificationMode(justificationMode);
  turnTabletOn();
  setDisplayWidth(canvasWidth);
  setDisplayHeight(canvasHeight);
  setImageWidth(canvasWidth);
  setImageHeight(canvasHeight);

  // begin polling the screen data endpoint until stop is requested
  interval(50).pipe(
    map(_ => parseInt(getScreenDataPoints(), 10)),
    filter(points => !isNaN(points) && points !== previousScreenDataPoints),
    tap(points => previousScreenDataPoints = points),
    switchMap(_ => getSignatureImageBlob()),
    switchMap(response => response.blob()),
    map(blob => SignaturePreview$.next(blob)),
    takeUntil(endCaptureRequested$)
  ).subscribe();
};

/**
 * Clears out the signature pad data stream so a fresh signature can be captured.
 */
export const ClearCapture = () => {
  clearSignaturePad();
}

/**
 * Concludes the capture stream process and emits the final signature data value to `SignaturePreview$`.
 */
export const EndCapture = () => {
  endCaptureRequested$.next(true);
  getSignatureImageBase64().then(response => {
    response.blob().then(blob => {
      SignaturePreview$.next(blob);
    })
  });
}