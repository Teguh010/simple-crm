export const convertBlobToBase64 = (blobUrl: string) => {
  return new Promise<string | ArrayBuffer | null>((resolve, reject) => {
    fetch(blobUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })
}