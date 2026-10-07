import assert from 'node:assert/strict'
import { parseFormQuestions } from '../studio/src/formBuilder.ts'
const questions = parseFormQuestions('Name | text\nName | text\nRole | select | Artist, Producer')
assert.equal(new Set(questions.map(question => question.key)).size,3)
assert.deepEqual(questions[2].options,['Artist','Producer'])
assert.throws(()=>parseFormQuestions('Role | select'),/choices/)
assert.throws(()=>parseFormQuestions('Name | invalid'),/supported/)
assert.throws(()=>parseFormQuestions('   '),/at least/)
console.log('Form questions support select choices and distinct answer keys; invalid and empty questions are rejected.')
