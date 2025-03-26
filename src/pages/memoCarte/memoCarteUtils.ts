export const removeHtmlTag = (text: string): string => {
  if (!text) return ""
  
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\s*<\/?div[^>]*>\s*/gi, '\n')
    .replace(/\n+/g, '\n')
    .replace(/\s*<\/?(h[1-6]|p)[^>]*>\s*/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

type InfoField = {
  label: string
  show: boolean  
}

export type PetPdfCarteHeaderType = {
  clinicInfo: Record<string, InfoField>
  customerInfo: Record<string, InfoField>
  petInfo: Record<string, InfoField>
  petBioInfo: Record<string, InfoField>
}