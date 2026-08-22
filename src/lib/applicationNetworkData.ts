import { db } from './supabase'
import { readStoredSession } from './auth'

export type ApplicantSubmission={id:string;form_id:string;respondent_email:string|null;status:'new'|'reviewing'|'contacted'|'accepted'|'declined';internal_notes:string;answers:Record<string,unknown>;created_at:string}
export type ApplicantMessage={id:string;submission_id:string;sender_account_id:string;body:string;created_at:string}
export type AccountNotification={id:string;account_id:string;title:string;text:string;link:string|null;read:boolean;created_at:string}
export type ApplicantForm={id:string;title:string;slug:string;eyebrow:string}
const session=()=>{const s=readStoredSession();if(!s)throw new Error('Sign in to view your applications.');return s}
export async function loadApplicantNetwork(){const s=session();const [submissions,forms,notifications]=await Promise.all([db.select<ApplicantSubmission>('ebg_form_submissions','order=created_at.desc',s.access_token),db.select<ApplicantForm>('ebg_forms','order=created_at.desc',s.access_token),db.select<AccountNotification>('account_notifications','order=created_at.desc',s.access_token)]);return{submissions,forms,notifications}}
export async function loadApplicantMessages(submissionId:string){const s=session();return db.select<ApplicantMessage>('ebg_application_messages',`submission_id=eq.${encodeURIComponent(submissionId)}&order=created_at.asc`,s.access_token)}
export async function sendApplicantMessage(submissionId:string,body:string){const s=session();const [row]=await db.insert<ApplicantMessage>('ebg_application_messages',{submission_id:submissionId,sender_account_id:s.user.id,body},s.access_token);return row}
export async function markNotificationRead(id:string){const s=session();return db.update<AccountNotification>('account_notifications',`id=eq.${encodeURIComponent(id)}`,{read:true},s.access_token)}
