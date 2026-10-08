// Pin the streaming Pages project to compiled Studio assets and its production branch.
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN
const name='ebg-studio',branch='feat/ebg-studio-app'
if(!account||!token)throw new Error('Cloudflare deployment configuration is missing.')
const url=`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${name}`
async function request(method,body){
  const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)})
  const data=await response.json()
  if(!data.success)throw new Error(`Pages configuration failed (${response.status}): ${JSON.stringify(data.errors)}`)
  return data.result
}
const project=await request('GET')
if(project.production_branch!==branch)throw new Error('Unexpected streaming production branch. Inspect before changing hosting configuration.')
const envVars={}
for(const key of ['VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY','VITE_STUDIO_LYRICS_URL']){
  if(!process.env[key])throw new Error(`${key} is missing from the deployment configuration.`)
  envVars[key]={type:'plain_text',value:process.env[key]}
}
const deployment_configs={}
for(const kind of ['production','preview']){
  const existing=project.deployment_configs?.[kind]?.env_vars||{}
  if(Object.values(existing).some(value=>value.type==='secret_text')){
    console.log(`${kind} contains existing secrets; preserving its environment configuration.`)
  }else deployment_configs[kind]={env_vars:{...existing,...envVars}}
}
await request('PATCH',{build_config:{build_command:'npm run studio:build',destination_dir:'dist-studio',root_dir:''},deployment_configs})
const verified=await request('GET')
if(verified.build_config?.build_command!=='npm run studio:build'||verified.build_config?.destination_dir!=='dist-studio')throw new Error('Streaming build configuration did not persist.')
console.log(JSON.stringify({streamingProject:name,productionBranch:verified.production_branch,buildCommand:verified.build_config.build_command,output:verified.build_config.destination_dir,domains:verified.domains}))
