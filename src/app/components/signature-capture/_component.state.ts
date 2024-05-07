import { SignatureCaptureContext } from "@/lib/interfaces";
import { GeneratedSignaturePage } from "./_document.service";

export interface SignatureCaptureState {
  context: SignatureCaptureContext;
  isRenderingPageSets: boolean;
  renderedPageSets: GeneratedSignaturePage[][];
  currentUserIndex: number;
  currentPageSetIndex: number;
  currentPageIndex: number;
}
export const initialSignatureCaptureState: SignatureCaptureState = {
  context: { userProfiles: [], documents: [] },
  isRenderingPageSets: false,
  renderedPageSets: [],
  currentUserIndex: 0,
  currentPageSetIndex: 0,
  currentPageIndex: 0,
}

interface Action {
  readonly type: string;
}
type SignatureCaptureAction<T> = Action & {
  payload: T;
}
const setContext = (payload: SignatureCaptureContext) : SignatureCaptureAction<typeof payload> => { return { type: 'setContext', payload }};
const beginRenderingPageSets = () : Action => { return { type: 'beginRenderingPageSets' }};
const setRenderedPageSets = (payload: GeneratedSignaturePage[][]) : SignatureCaptureAction<typeof payload> => { return { type: 'setRenderedPageSets', payload }};
const setCurrentUserIndex = (payload: number) : SignatureCaptureAction<typeof payload> => { return { type: 'setCurrentUserIndex', payload }};
const setCurrentPageSetIndex = (payload: number) : SignatureCaptureAction<typeof payload> => { return { type: 'setCurrentPageSetIndex', payload }};
const setCurrentPageIndex = (payload: number) : SignatureCaptureAction<typeof payload> => { return { type: 'setCurrentPageIndex', payload }};
const markCurrentPageAsSigned = () : Action => { return { type: 'markCurrentPageAsSigned' }};

const reducer = (state: SignatureCaptureState, action: Action) => {

}

