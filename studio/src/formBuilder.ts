import type { NetworkFormQuestion } from './formsNetwork'
export function parseFormQuestions(text: string): Array<Omit<NetworkFormQuestion,'id'|'form_id'>> {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  if (!lines.length) throw new Error('Add at least one question.')
  const types = ['text','email','number','textarea','select']
  return lines.map((line,position) => {
    const [label,type='text',choices=''] = line.split('|').map(part => part.trim())
    if (!label || !types.includes(type)) throw new Error(`Question ${position+1}: add a label and a supported question type.`)
    const options = type === 'select' ? choices.split(',').map(option=>option.trim()).filter(Boolean) : null
    if (type === 'select' && !options?.length) throw new Error(`Question ${position+1}: add choices after a third |, separated by commas.`)
    return {label,key:`question_${position+1}`,type:type as NetworkFormQuestion['type'],required:true,position,options,placeholder:null}
  })
}
