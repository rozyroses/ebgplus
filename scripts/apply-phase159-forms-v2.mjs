import fs from 'node:fs'

const appPath = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(appPath, 'utf8')
if (source.includes('// EBG_PHASE159_FORMS_V2')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.59 patch failed: ${label}`)
  source = next
}

source = source.replace(
  "import './phase158-mobile-polish.css'",
  "import './phase158-mobile-polish.css'\nimport { loadPublicForm, loadPublicForms, loadStaffForms, loadStaffSubmissions, submitEbgForm, updateFormStatus, updateSubmission, type EbgForm, type EbgFormSubmission } from './lib/formsV2Data'\nimport './phase159-forms-v2.css'\n\n// EBG_PHASE159_FORMS_V2",
)

source = source.replace(
  `<Route path="/" element={<LandingPage cms={cms} />} />`,
  `<Route path="/" element={window.location.hostname === 'forms.ebgplus.app' ? <EbgFormsV2Home /> : <LandingPage cms={cms} />} />`,
)

must(
  `<Route path="/forms" element={<EbgFormsPage cms={cms} />} />`,
  `<Route path="/forms" element={<EbgFormsV2Home />} />\n      <Route path="/forms/:slug" element={<EbgFormsV2Public />} />\n      <Route path="/dashboard" element={account ? <EbgFormsV2Dashboard account={account} /> : <Navigate to="/auth/sign-in" replace />} />`,
  'forms routes',
)

const formsV2 = `function EbgFormsV2Chrome({ children, dashboard = false }: { children: ReactNode; dashboard?: boolean }) {
  return (
    <main className="forms2-shell">
      <header className="forms2-topbar">
        <Link className="forms2-brand" to="/">EBG+ <span>FORMS</span></Link>
        <div className="forms2-actions">
          {dashboard ? <Link className="btn muted" to="/">Public Forms</Link> : <Link className="btn muted" to="/dashboard">Dashboard</Link>}
          <a className="btn" href="https://ebgplus.app">EBG+</a>
        </div>
      </header>
      {children}
    </main>
  )
}

function EbgFormsV2Home() {
  const [forms, setForms] = useState<EbgForm[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPublicForms().then(setForms).catch((error) => setMessage(error instanceof Error ? error.message : 'Forms could not be loaded.'))
  }, [])

  return (
    <EbgFormsV2Chrome>
      <section className="forms2-hero">
        <p className="forms2-eyebrow">EBG FORMS 2.0</p>
        <h1>Step into the EBG universe.</h1>
        <p>Applications, casting calls, sign-ups, and official EBG submissions now live in one place. Choose an open form below.</p>
        <div className="forms2-form-list">
          {forms.map((form) => <Link className="forms2-form-card" key={form.id} to={'/forms/' + form.slug}><span>{form.eyebrow}</span><h2>{form.title}</h2><p>{form.description}</p><strong>Open form →</strong></Link>)}
        </div>
        {!forms.length && !message && <div className="forms2-empty">No forms are open right now.</div>}
        {message && <p className="forms2-error">{message}</p>}
        <p className="forms2-legacy-note">Legacy EBG Forms has been sunset. New submissions are collected through EBG Forms 2.0.</p>
      </section>
    </EbgFormsV2Chrome>
  )
}

function EbgFormsV2Public() {
  const { slug = '' } = useParams()
  const [form, setForm] = useState<EbgForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setLoading(true)
    loadPublicForm(slug).then(setForm).catch((error) => setMessage(error instanceof Error ? error.message : 'Form could not be loaded.')).finally(() => setLoading(false))
  }, [slug])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    setMessage('Submitting…')
    setSuccess(false)
    const data = new FormData(event.currentTarget)
    const answers: Record<string, unknown> = {}
    for (const question of form.questions ?? []) answers[question.key] = String(data.get(question.key) ?? '').trim()
    const emailQuestion = (form.questions ?? []).find((question) => question.type === 'email')
    const email = emailQuestion ? String(answers[emailQuestion.key] ?? '') : ''
    try {
      await submitEbgForm(form.id, answers, email)
      event.currentTarget.reset()
      setSuccess(true)
      setMessage(form.submit_message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Your response could not be submitted.')
    }
  }

  if (loading) return <EbgFormsV2Chrome><div className="forms2-empty">Opening form…</div></EbgFormsV2Chrome>
  if (!form) return <EbgFormsV2Chrome><div className="forms2-empty"><h1>Form unavailable</h1><p>{message || 'This form is closed or does not exist.'}</p><Link className="btn" to="/">View open forms</Link></div></EbgFormsV2Chrome>

  return (
    <EbgFormsV2Chrome>
      <section className="forms2-public-card">
        <p className="forms2-eyebrow">{form.eyebrow}</p><h1>{form.title}</h1><p>{form.description}</p>
        <form onSubmit={submit}>
          <div className="forms2-question-grid">
            {(form.questions ?? []).map((question) => <label className={'forms2-question ' + (question.type === 'textarea' ? 'full' : '')} key={question.id}>{question.label}{question.type === 'textarea' ? <textarea name={question.key} required={question.required} placeholder={question.placeholder ?? ''} /> : question.type === 'select' ? <select name={question.key} required={question.required}><option value="">Choose one</option>{(question.options ?? []).map((option) => <option key={option}>{option}</option>)}</select> : <input name={question.key} type={question.type} required={question.required} placeholder={question.placeholder ?? ''} min={question.key === 'age' ? 21 : undefined} />}</label>)}
          </div>
          <button className="forms2-submit" type="submit">Submit to EBG</button>
        </form>
        {message && <p className={success ? 'forms2-success' : 'forms2-error'}>{message}</p>}
      </section>
    </EbgFormsV2Chrome>
  )
}

function EbgFormsV2Dashboard({ account }: { account: Account }) {
  const allowed = ['founder','administrator','producer','editor'].includes(account.role)
  const [forms, setForms] = useState<EbgForm[]>([])
  const [submissions, setSubmissions] = useState<EbgFormSubmission[]>([])
  const [formId, setFormId] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  const refresh = async () => {
    try {
      const nextForms = await loadStaffForms()
      const selected = formId || nextForms[0]?.id || ''
      if (!formId && selected) setFormId(selected)
      setForms(nextForms)
      setSubmissions(await loadStaffSubmissions(selected || undefined))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Dashboard could not be loaded.')
    }
  }

  useEffect(() => {
    if (!allowed) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), 2500)
    return () => window.clearInterval(timer)
  }, [allowed, formId])

  if (!allowed) return <EbgFormsV2Chrome dashboard><div className="forms2-empty"><h1>Staff access required.</h1><p>This dashboard is available to the EBG team.</p></div></EbgFormsV2Chrome>

  const activeForm = forms.find((form) => form.id === formId)
  const visible = submissions.filter((submission) => filter === 'all' || submission.status === filter)
  const newCount = submissions.filter((submission) => submission.status === 'new').length
  const accepted = submissions.filter((submission) => submission.status === 'accepted').length
  const today = submissions.filter((submission) => Date.now() - Date.parse(submission.created_at) < 86400000).length
  const labelFor = (key: string) => activeForm?.questions?.find((question) => question.key === key)?.label ?? key

  const saveStatus = async (submission: EbgFormSubmission, status: EbgFormSubmission['status']) => {
    await updateSubmission(submission.id, { status })
    setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, status } : item))
  }

  const saveNotes = async (submission: EbgFormSubmission, internal_notes: string) => {
    await updateSubmission(submission.id, { internal_notes })
    setMessage('Notes saved.')
  }

  return (
    <EbgFormsV2Chrome dashboard>
      <section className="forms2-dashboard">
        <div><p className="forms2-eyebrow">LIVE RESPONSE CENTER</p><h1>Forms Dashboard</h1><p className="forms2-live-dot">Live refresh every 2.5 seconds</p></div>
        <div className="forms2-stats"><div className="forms2-stat"><span>Total</span><strong>{submissions.length}</strong></div><div className="forms2-stat"><span>New</span><strong>{newCount}</strong></div><div className="forms2-stat"><span>Today</span><strong>{today}</strong></div><div className="forms2-stat"><span>Accepted</span><strong>{accepted}</strong></div></div>
        {message && <p className="forms2-success">{message}</p>}
        <div className="forms2-dashboard-grid">
          <aside className="forms2-panel forms2-sidebar">
            {forms.map((form) => <button key={form.id} className={form.id === formId ? 'active' : ''} type="button" onClick={() => setFormId(form.id)}><strong>{form.title}</strong><br/><small>{form.status}</small></button>)}
            {activeForm && <select value={activeForm.status} onChange={(event) => { const status = event.target.value as EbgForm['status']; void updateFormStatus(activeForm.id, status).then(() => setForms((current) => current.map((form) => form.id === activeForm.id ? { ...form, status } : form))) }}><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select>}
          </aside>
          <div className="forms2-panel">
            <div className="forms2-status-row"><strong>{activeForm?.title ?? 'Responses'}</strong><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All responses</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="contacted">Contacted</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div>
            <div className="forms2-response-list">
              {visible.map((submission) => <article className="forms2-response" key={submission.id}><div><h3>{submission.respondent_email || 'Anonymous response'}</h3><p className="forms2-response-meta">Submitted {new Date(submission.created_at).toLocaleString()}</p><div className="forms2-answer-grid">{Object.entries(submission.answers).map(([key,value]) => <div className="forms2-answer" key={key}><small>{labelFor(key)}</small><span>{String(value)}</span></div>)}</div><textarea className="forms2-notes" defaultValue={submission.internal_notes} placeholder="Internal notes…" onBlur={(event) => void saveNotes(submission, event.target.value)} /></div><div><select value={submission.status} onChange={(event) => void saveStatus(submission, event.target.value as EbgFormSubmission['status'])}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="contacted">Contacted</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div></article>)}
              {!visible.length && <div className="forms2-empty">No responses in this view yet.</div>}
            </div>
          </div>
        </div>
      </section>
    </EbgFormsV2Chrome>
  )
}

`

must(/function EbgFormsPage\([^)]*\)[\s\S]*?\n}\n\nfunction ComingSoonPage/, `${formsV2}function ComingSoonPage`, 'legacy forms sundown')

fs.writeFileSync(appPath, source)
console.log('Applied EBG Forms 2.0 live dashboard and sunset legacy Forms.')
