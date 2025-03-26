<script setup lang="ts">
import MtHeader from '@/components/layouts/MtHeader.vue';
import useConversationStore from '@/stores/Conversation'
import { storeToRefs } from 'pinia'

const conversationStore = useConversationStore()


const emits = defineEmits(['close'])


const closeModal = () => emits('close')


const copyMultipleDivContents = async (
  divIds: string[],
  separator: string = '\n'
): Promise<{
  success: boolean;
  copiedCount: number;
  missingDivs: string[];
  copiedDivs: string[];
}> => {
  try {
    // Initialize results
    const copiedContent: string[] = [];
    const missingDivs: string[] = [];
    const copiedDivs: string[] = [];

    // Validate input
    if (!Array.isArray(divIds) || divIds.length === 0) {
      throw new Error('Invalid input: divIds must be a non-empty array');
    }

    // Process each div
    for (const divId of divIds) {
      const div = document.getElementById(divId);

      if (div) {
        const content = div.textContent || '';
        if (content.trim()) {
          copiedContent.push(content.trim());
          copiedDivs.push(divId);
        }
      } else {
        missingDivs.push(divId);
        console.warn(`Div with id "${divId}" not found - continuing with remaining divs`);
      }
    }

    // If we found any content, try to copy it
    if (copiedContent.length > 0) {
      const finalContent = copiedContent.join(separator);

      // Try modern Clipboard API first
      try {
        await navigator.clipboard.writeText(finalContent);
        return {
          success: true,
          copiedCount: copiedContent.length,
          missingDivs,
          copiedDivs
        };
      } catch (clipboardError) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = finalContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        return {
          success: success,
          copiedCount: copiedContent.length,
          missingDivs,
          copiedDivs
        };
      }
    }

    // If no content was found at all
    return {
      success: false,
      copiedCount: 0,
      missingDivs,
      copiedDivs: []
    };

  } catch (error) {
    console.error('Error copying div contents:', error);
    return {
      success: false,
      copiedCount: 0,
      missingDivs: divIds,
      copiedDivs: []
    };
  }
};


const { getKoekaruResult } = storeToRefs(conversationStore)
const result = getKoekaruResult.value
console.log(result)
</script>

<template>
  <MtHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 bold">
      Result
    </q-toolbar-title>
  </MtHeader>
  <q-card-section class="result-section">
    <div id="transcript">
      <h3 class="heading">
        文字起こし
      </h3>
      {{ result.transcript }}
    </div>
  </q-card-section>
  <q-card-section v-if="result.summary">
    <div id="summary">
      <h3 class="heading">
        要約
      </h3>
      <p>
        {{ result.summary }}
      </p>
    </div>
  </q-card-section>
  <q-card-section>
    <button class="bg-grey-700 text-white no-border round-sm"
      @click="copyMultipleDivContents(['transcript', 'summary'])">Copy Contents</button>
  </q-card-section>

</template>

<style>
  .container {
    padding: 1rem;
    display: flex;
    flex-direction: column;

  }

  .container>* {
    margin-bottom: 1rem;
  }

  button {
    border: none;
    border-radius: 2px;
    padding: 7px;
    margin-right: 10px;
  }

  .heading {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  p {
    white-space: pre;
  }

  .result-section {
    margin-top: 50px;
  }
</style>