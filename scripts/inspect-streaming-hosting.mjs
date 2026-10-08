// Read only hosting diagnostics. Never log credentials or request headers.
const account = process.env.CLOUDFLARE_ACCOUNT_ID
const token = process.env.CLOUDFLARE_API_TOKEN
if (!account || !token) throw new Error('Cloudflare deployment configuration is missing.')
const base = 'https://api.cloudflare.com/client/v4'
async function read(path) {
  const response = await fetch(base + path, {headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)})
  const body = await response.json()
  if (!body.success) { console.log(JSON.stringify({path,status:response.status,errors:body.errors})); return null }
  return body.result
}
for (const name of ['ebg-studio','ebgplus']) {
  const project = await read(`/accounts/${account}/pages/projects/${name}`)
  if (project) console.log(JSON.stringify({project:name,productionBranch:project.production_branch,domains:project.domains,build:{command:project.build_config?.build_command,destination:project.build_config?.destination_dir,root:project.build_config?.root_dir},production:project.canonical_deployment && {id:project.canonical_deployment.id,url:project.canonical_deployment.url,created:project.canonical_deployment.created_on}}))
}
const domains=await read(`/accounts/${account}/workers/domains`)
if(domains)console.log(JSON.stringify({workerDomains:domains.filter(x=>['streaming.ebgplus.app','studio.ebgplus.app'].includes(x.hostname)).map(x=>({id:x.id,hostname:x.hostname,service:x.service,environment:x.environment}))}))
const zones=await read('/zones?name=ebgplus.app')
if(zones?.[0]){const records=await read(`/zones/${zones[0].id}/dns_records?name=streaming.ebgplus.app`);if(records)console.log(JSON.stringify({streamingDns:records.map(x=>({type:x.type,name:x.name,content:x.content,proxied:x.proxied}))}))}
