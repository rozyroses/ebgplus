// Verify the deployed page and asset MIME types, not only the upload response.
const origin='https://streaming.ebgplus.app'
async function verify(path){
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(15000)})
  if(!response.ok)throw new Error(`Streaming page ${path} returned ${response.status}.`)
  const html=await response.text()
  if(html.includes('src="/src/main.tsx"'))throw new Error('Streaming is serving source code instead of compiled assets.')
  const script=html.match(/<script[^>]+src="([^"]+)"/),style=html.match(/<link[^>]+href="([^"]+\.css)"/)
  if(!script?.[1].startsWith('/assets/')||!style?.[1].startsWith('/assets/'))throw new Error('Compiled streaming assets are missing.')
  const js=await fetch(new URL(script[1],origin),{signal:AbortSignal.timeout(15000)})
  if(!js.ok||!/(javascript|ecmascript)/i.test(js.headers.get('content-type')||''))throw new Error('Streaming JavaScript did not load with a valid MIME type.')
  if(!(await js.text()).includes('streaming.ebgplus.app'))throw new Error('Streaming domain routing is missing from the deployed application.')
  const css=await fetch(new URL(style[1],origin),{signal:AbortSignal.timeout(15000)})
  if(!css.ok||!(css.headers.get('content-type')||'').includes('text/css'))throw new Error('Streaming stylesheet did not load correctly.')
  console.log(`Verified compiled streaming page, domain routing and CSS: ${path}`)
}
let lastError
for(let attempt=0;attempt<4;attempt++){
  try{await verify('/');await verify('/bijou-nicole/step-on-up');lastError=null;break}catch(error){lastError=error;console.log(error.message);if(attempt<3)await new Promise(resolve=>setTimeout(resolve,5000))}
}
if(lastError)throw lastError
