
import { computed, Ref } from 'vue';

interface CharacterCountResult {
  charCount: Ref<number>;
  isCharCountValid: Ref<boolean>;
  validationMessage: Ref<string>;
}

export function useCharacterCount(
  data: Ref<string>, 
  maxChars: number = 500,
  customMessage: string = '最大500文字をご入力できます'
): CharacterCountResult {

  const charCount = computed(() => {
    const text = data.value || ''; 
    const cleanedText = text.replace(/<[^>]+>/g, '').trim(); 
    return cleanedText.length;
  });

  const isCharCountValid = computed(() => charCount.value <= maxChars);

  const validationMessage = computed(() => {
    if (charCount.value > maxChars) {
      return customMessage; 
    }
    return '';
  });

  return {
    charCount,
    isCharCountValid,
    validationMessage,
  };
}
