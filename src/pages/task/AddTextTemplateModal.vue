<script setup lang="ts">
  import { computed, withDefaults,ref } from "vue";
  import mtUtils from '@/utils/mtUtils'
  import aahMessages from '@/utils/aahMessages'

  const props = withDefaults(defineProps<{
    modelTitle: string,
    options: {
      title: string,
      isShown: boolean,
      isSelected: boolean,
      attr?: {
        class: any,
        clickable: boolean
      }
    }[]
    data: Object,
    value?: boolean
    memoKey?: string
    singleOption?: boolean
  }>(), {
    modalTitle: '',
    value: false,
    memoKey: '',
    singleOption: true
  })

  const emit = defineEmits(['update:modelValue', 'update:value', 'update:memo'])
  const selectedValue = ref(null)

  const dialogModel = computed({
    get() {
      return props.value
    },
    set(value: Boolean) {
      emit('update:value', value)
    }
  })
function handleCloseModal () {
  dialogModel.value = false
  // emit('close')
}
const handleTemplate = (option) => {
  if (option.flg_title === false) {
      // Deselect all other options
      props.options.forEach((item) => {
      item.isSelected = item.title === option.title; // Only the clicked item remains selected
    });
  }

  // Handle single option case
  if (props.singleOption) {
    addTemplates();
  }
}

function addTemplates() {
  if (props.singleOption) {
  
    // This is for single option only, make sure to use single option props.
    // Implementation this single function can be found on CreateLabResultModal.vue or UpdateLabResultModal.vue.
         // Find the first selected option
         const selectedOption = props.options.find((item) => item.isSelected);

if (selectedOption) {
  const templatesText = selectedOption?.title;
  
if(templatesText){
  
  handleCloseModal()
  emit('update:memo', templatesText);
}

  // Deselect the option
  selectedOption.isSelected = false;
}
  } else {
    // This is for multiple options.
   
    let selectedTemplates = props.options.filter((item: any) => item.isSelected == true)

    if (selectedTemplates.length) {
      // Why do we need to return HTML string and add div tag to template? The HTML tag will be rendered to the text area/input field on the parent component
      // If need to revert, just uncomment the line below that added div tag to template
      // let templatesText = selectedTemplates.map((template: any) => `<div>${template.title.replace(/\n/g, '<br>')}</div>`).join('');
      let templatesText = selectedTemplates.map((template: any) => { return template.title }).join('')

      // Please do not update props data by any means, as it voilates the vue rule. one component should not update the data of another component directly.
      // As this AddTextTemplateModal component is used from many places, so I just change the code for specific component which is UpdateMemoCarteModal
      // For other component old code will be used untill I don't update the code for all of the them
      //this is the old code here you can it updates the props which is very bad practice. 
      // props.data[props.memoKey] = props.data[props.memoKey] ? `${props.data[props.memoKey]}${templatesText}` : templatesText

      if(props.memoKey)
      {
        // Use the old code for the components which are not updated yet. 
        props.data[props.memoKey] = props.data[props.memoKey] ? `${props.data[props.memoKey]}${templatesText}` : templatesText
      }
      else
      {
        // Current this code will run only for UpdateMemoCarteModal as I have handled this there, here you can see I don't update the props intead I pass the data in emit function.
        // Emit the update:value event with data
        emit('update:memo', templatesText);
      }
    }
  }
  mtUtils.autoCloseAlert(aahMessages.success)
  dialogModel.value = false
}
</script>

<template>
  <q-dialog v-model="dialogModel">
    <q-card class="text-template-modal">
      <div class="header-row row flex justify-between q-py-sm q-px-md items-center">
        <div>入力テンプレ：{{ modelTitle ? modelTitle : '操作' }}</div>
        <q-btn @click="handleCloseModal" flat round dense icon="close" />
      </div>
      
      <q-scroll-area :style="options.length > 6 ? {'height' : '350px'} : {'height' : `${props.memoKey == 'memo_goal' ? 150 : 53 * options.length}px`}">
        <q-list separator>
          <q-item @click="handleTemplate(option)"  v-for="(option, index) in options" :key="index" clickable :class="index === 0 ? 'q-mt-xs' : ''" class="q-py-none cursor-pointer text-left" v-bind="option.attr">
            <q-item-section style="flex-basis: 80%;" >
              <div v-html="option.title" ></div>
            </q-item-section>
            <q-item-section v-if="option?.isSelected">
              <!-- <q-checkbox v-model="option.isSelected" checked-icon="check_circle" unchecked-icon="circle" indeterminate-icon="circle" class="option-checkbox" /> -->
                <q-icon name="check_circle" size="20px" class="checkIcon"/>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
      <p class="text-center q-mt-lg" v-if="!options.length">登録がありません。</p>
      <div v-if="!props.singleOption" class="flex justify-center">
        <q-btn unelevated color="primary" class="add-template-btn" @click="addTemplates()">
          <span>追加</span>
        </q-btn>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.text-template-modal {
  width: 400px;
  .dialog-header {
    .heading {
      font-size: 14px;
      font-weight: 700;
    }
    .label {
      font-size: 12px;
      font-weight: 400;
      color: #868686;
    }
  }
  .header-row {
    background-color: #dddddd;
  }

  // .option-checkbox{
  //   :deep(.q-checkbox__icon) {
  // color: $positive;
  // border: 0px;
  //   }
  // }

  .checkIcon{
    color: $positive;
  }
  .add-template-btn {
    width: 100%;
    margin: 15px;
  }
}

</style>
