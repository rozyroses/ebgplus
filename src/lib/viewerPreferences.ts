import { useEffect, useState } from 'react'
export type ViewerPreferences = { speed: number; volume: number; keyboard: boolean; reduceMotion: boolean; largeText: boolean }
export const defaultViewerPreferences: ViewerPreferences = { speed: 1, volume: 1, keyboard: true, reduceMotion: false, largeText: false }
const key='ebg.viewer.preferences.v1', event='ebg-viewer-preferences'
export function readViewerPreferences(): ViewerPreferences {
  try {
    const saved=JSON.parse(localStorage.getItem(key)||'{}')
    return { speed:[0.5,0.75,1,1.25,1.5,2].includes(saved.speed)?saved.speed:1, volume:typeof saved.volume==='number'&&Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):1, keyboard:saved.keyboard!==false, reduceMotion:saved.reduceMotion===true, largeText:saved.largeText===true }
  } catch { return {...defaultViewerPreferences} }
}
export function saveViewerPreferences(value: ViewerPreferences) {
  localStorage.setItem(key,JSON.stringify(value)); window.dispatchEvent(new Event(event))
}
export function useViewerPreferences() {
  const [value,setValue]=useState(readViewerPreferences)
  useEffect(()=>{const sync=()=>setValue(readViewerPreferences());window.addEventListener(event,sync);window.addEventListener('storage',sync);return()=>{window.removeEventListener(event,sync);window.removeEventListener('storage',sync)}},[])
  return value
}
export function ViewerPreferencesSync() {
  const value=useViewerPreferences()
  useEffect(()=>{document.documentElement.dataset.reduceMotion=String(value.reduceMotion);document.documentElement.dataset.largeText=String(value.largeText)},[value])
  return null
}
