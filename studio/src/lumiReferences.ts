export async function readLumiReferences(files: File[]): Promise<string[]> {
  if (files.length > 3) throw new Error('Choose up to 3 reference images.')
  return Promise.all(files.map(file => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > 3 * 1024 * 1024) {
      throw new Error('References must be PNG, JPEG, or WebP images under 3 MB each.')
    }
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
      reader.readAsDataURL(file)
    })
  }))
}
