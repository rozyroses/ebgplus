import { db } from '../../src/lib/supabase'
import { readStoredSession } from '../../src/lib/auth'

export type StudioInboxForm={id:string;title:string;slug:string}
export type StudioInboxSubmission={id:string;form_id:string;respondent_email:string|null;status:string;answers:Record<string,unknown>;submitted_by?:string|null;conversation_state?:'open'|'waiting_on_ebg'|'waiting_on_applicant'|'resolved';last_message_at?:string|null;created_at:string}
export type StudioInboxMessage={id:string;submission_id:string;sender_account_id:string;sender_label?:string|null;body:string;read_by_applicant?:boolean;read_by_staff?:boolean;created_at:string}
const token=()=>{const s=readStoredSession();if(!s)throw new Error('Studio session expired.');return s.access_token}
export async function loadStudioInbox(){const t=token();const [forms,submissions,messages]=await Promise.all([
  db.select<StudioInboxForm>('ebg_forms','order=created_at.desc',t),
  db.select<StudioInboxSubmission>('ebg_form_submissions','order=last_message_at.desc.nullslast,created_at.desc',t),
  db.select<StudioInboxMessage>('ebg_application_messages','order=created_at.desc',t),
]);return{forms,submissions,messages}}
export async function loadStudioThread(submissionId:string){return db.select<StudioInboxMessage>('ebg_application_messages',`submission_id=eq.${encodeURIComponent(submissionId)}&order=created_at.asc`,token())}
export async function sendStudioInboxMessage(submissionId:string,body:string,label='EBG Studio'){const s=readStoredSession();if(!s)throw new Error('Studio session expired.');const [row]=await db.insert<StudioInboxMessage>('ebg_application_messages',{submission_id:submissionId,sender_account_id:s.user.id,sender_label:label,body},s.access_token);return row}
export async function markStudioThreadRead(submissionId:string){return db.rpc<void>('mark_application_thread_read',{p_submission_id:submissionId,p_side:'staff'},token())}
export async function setStudioConversationState(submissionId:string,state:'open'|'waiting_on_ebg'|'waiting_on_applicant'|'resolved'){return db.rpc<void>('set_application_conversation_state',{p_submission_id:submissionId,p_state:state},token())}
