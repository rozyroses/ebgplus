import { db } from '../../src/lib/supabase'
import { readStoredSession } from '../../src/lib/auth'

export type NetworkFormQuestion = { id:string; form_id:string; label:string; key:string; type:'text'|'email'|'number'|'textarea'|'select'; required:boolean; position:number; options:string[]|null; placeholder:string|null }
export type NetworkForm = { id:string; slug:string; title:string; eyebrow:string; description:string; status:'draft'|'open'|'closed'; submit_message:string; created_at:string; questions?:NetworkFormQuestion[] }
export type NetworkSubmission = { id:string; form_id:string; respondent_email:string|null; status:'new'|'reviewing'|'contacted'|'accepted'|'declined'; internal_notes:string; answers:Record<string,unknown>; submitted_by?:string|null; created_at:string }
export type NetworkMessage = { id:string; submission_id:string; sender_account_id:string; body:string; created_at:string }

const token = () => { const s = readStoredSession(); if (!s) throw new Error('Studio session expired.'); return s.access_token }
export async function loadForms(){ const t=token(); const forms=await db.select<NetworkForm>('ebg_forms','order=created_at.desc',t); const qs=await db.select<NetworkFormQuestion>('ebg_form_questions','order=position.asc',t); return forms.map(f=>({...f,questions:qs.filter(q=>q.form_id===f.id)})) }
export async function loadSubmissions(formId?:string){ const t=token(); return db.select<NetworkSubmission>('ebg_form_submissions',`${formId?`form_id=eq.${encodeURIComponent(formId)}&`:''}order=created_at.desc`,t) }
export async function createForm(input:{title:string;slug:string;eyebrow:string;description:string;status:NetworkForm['status'];submitMessage:string;questions:Array<Omit<NetworkFormQuestion,'id'|'form_id'>>}){ const t=token(); const [form]=await db.insert<NetworkForm>('ebg_forms',{title:input.title,slug:input.slug,eyebrow:input.eyebrow,description:input.description,status:input.status,submit_message:input.submitMessage},t); if(!form) throw new Error('Form could not be created.'); if(input.questions.length){ await db.insert<NetworkFormQuestion>('ebg_form_questions',input.questions.map((q,i)=>({...q,form_id:form.id,position:i})),t) } return form }
export async function updateForm(id:string,values:Partial<Pick<NetworkForm,'title'|'slug'|'eyebrow'|'description'|'status'|'submit_message'>>){ const t=token(); const [row]=await db.update<NetworkForm>('ebg_forms',`id=eq.${encodeURIComponent(id)}`,values,t); return row }
export async function deleteForm(id:string){ return db.remove<NetworkForm>('ebg_forms',`id=eq.${encodeURIComponent(id)}`,token()) }
export async function updateSubmission(id:string,values:Partial<Pick<NetworkSubmission,'status'|'internal_notes'>>){ const t=token(); const [row]=await db.update<NetworkSubmission>('ebg_form_submissions',`id=eq.${encodeURIComponent(id)}`,values,t); return row }
export async function loadMessages(submissionId:string){ return db.select<NetworkMessage>('ebg_application_messages',`submission_id=eq.${encodeURIComponent(submissionId)}&order=created_at.asc`,token()) }
export async function sendMessage(submissionId:string,body:string){ const s=readStoredSession(); if(!s) throw new Error('Studio session expired.'); const [row]=await db.insert<NetworkMessage>('ebg_application_messages',{submission_id:submissionId,sender_account_id:s.user.id,body},s.access_token); return row }
export async function setVerifiedBadge(accountId:string,badge:'artist'|'founder'|null){ return db.rpc<void>('set_account_verified_badge',{p_account_id:accountId,p_badge:badge},token()) }
