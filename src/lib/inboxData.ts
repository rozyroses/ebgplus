import { db } from './supabase'
import { readStoredSession } from './auth'

export type InboxSubmission={id:string;form_id:string;respondent_email:string|null;status:'new'|'reviewing'|'contacted'|'accepted'|'declined';answers:Record<string,unknown>;submitted_by?:string|null;conversation_state?:'open'|'waiting_on_ebg'|'waiting_on_applicant'|'resolved';last_message_at?:string|null;created_at:string}
export type InboxForm={id:string;title:string;slug:string;eyebrow:string}
export type InboxMessage={id:string;submission_id:string;sender_account_id:string;sender_label?:string|null;body:string;read_by_applicant?:boolean;read_by_staff?:boolean;created_at:string}
export type InboxNotification={id:string;account_id:string;title:string;text:string;link:string|null;read:boolean;kind?:string|null;submission_id?:string|null;created_at:string}

const session=()=>{const s=readStoredSession();if(!s)throw new Error('Sign in to open your EBG inbox.');return s}
export async function loadInboxNetwork(){const s=session();const [submissions,forms,messages,notifications]=await Promise.all([
  db.select<InboxSubmission>('ebg_form_submissions','order=last_message_at.desc.nullslast,created_at.desc',s.access_token),
  db.select<InboxForm>('ebg_forms','order=created_at.desc',s.access_token),
  db.select<InboxMessage>('ebg_application_messages','order=created_at.desc',s.access_token),
  db.select<InboxNotification>('account_notifications','order=created_at.desc',s.access_token),
]);return{submissions,forms,messages,notifications}}
export async function loadInboxThread(submissionId:string){const s=session();return db.select<InboxMessage>('ebg_application_messages',`submission_id=eq.${encodeURIComponent(submissionId)}&order=created_at.asc`,s.access_token)}
export async function sendInboxMessage(submissionId:string,body:string){const s=session();const [row]=await db.insert<InboxMessage>('ebg_application_messages',{submission_id:submissionId,sender_account_id:s.user.id,sender_label:'You',body},s.access_token);return row}
export async function markInboxThreadRead(submissionId:string){const s=session();return db.rpc<void>('mark_application_thread_read',{p_submission_id:submissionId,p_side:'applicant'},s.access_token)}
export async function markOneNetworkNotificationRead(id:string){const s=session();return db.update<InboxNotification>('account_notifications',`id=eq.${encodeURIComponent(id)}`,{read:true},s.access_token)}
export async function markAllNetworkNotificationsRead(){const s=session();return db.rpc<void>('mark_all_account_notifications_read',{},s.access_token)}
