<script setup lang="ts">
import {onMounted, reactive, ref, watch} from "vue";

const props = defineProps<{
    label: string;
    selecting: String;
    tabindex?: number;
    style?: Object;
    disable?: Boolean;
  }>()

  const emit = defineEmits(['update:selecting', 'clear', 'update'])

  const options = reactive([])

  function initOnce(){
    init()
  }

  function init(){
    if(props.selecting){
      model.value = props.selecting
    }
  }

  let inputValue = ''
  let prevValue = ''
  function input(value){
    inputValue = value
  }

  //テキストボックスに入力されたとき
  async function keydown(event){
    if(event == null){
      return
    }
    if(isCompositionStart){
      return
    }
    if(event.code == 'ArrowDown' || event.code == 'ArrowUp'){
      return
    }
    procEventUpdateOption()
  }

  let timeoutID = null
  function procEventUpdateOption()
  {
    if(timeoutID){
      //setTimeoutを解除
      clearTimeout(timeoutID)
      timeoutID = null
    }

    timeoutID = setTimeout(() => {
      replaceOptions()
    }, 500)
  }

  //選択肢を入れ替え
  async function replaceOptions(){

    if(isCompositionStart){
      return
    }

    //前回入力値と現在入力値が同じ場合はAPIを呼ばない
    if(prevValue && inputValue && (prevValue.trim() == inputValue.trim())){
      return
    }

    //ハイフンを取り除く
    inputValue = inputValue.replace(/-/g, '')

    if(inputValue && inputValue.length && inputValue.length > 0){
      if(!isNaN(inputValue)){
        prevValue = inputValue
        // let resp = await nsUtils.callApi("/api/Master/SearchAddress", {
        //   search_words: inputValue
        // })
        // if(resp && resp.address_list){
        //   options.length = 0
        //   let address_list = resp.address_list
        //   if(resp && address_list && address_list.length && address_list.length > 0) {
        //     address_list.forEach((address) => {
        //       options.push({
        //         label: address.address_full,
        //         value: address.id_address,
        //         address: address,
        //         zip_code: address.zip_code
        //       })
        //     })
        //   }
        // }
      }
    }
    
    if(options.length == 0){
      emit('update:selecting', '1000004')
    }
  }

  function popupHide(event) {
    var tabIndex = props.tabindex
    if(tabIndex){
      for(var i = 0; i < 100; i++){
        ++tabIndex
        var nextFoucusTarget = document.querySelector(`[tabindex="${tabIndex}"]`)
        if(nextFoucusTarget){
          nextFoucusTarget.focus();
          break;
        }
      }
    }
  }

  let zip_code = ''

  //選択肢リストから選択
  async function selected(id_address){
    zip_code = ''
    if(options && options.length && options.length > 0){
      for(const option of options){
        if(option.value == id_address){
          emit('update', option.address)
          zip_code = option.zip_code
          //選択肢を絞り込む
          options.length = 0
          options.push(option)
        }
      }
    }
    emit('update:selecting', zip_code)
    await setTimeout(() => {}, 100)
    model.value = zip_code
  }

  //選択肢リストが表示されないよう制御
  function clear(value){
    model.value = ''
    options.length = 0
    emit('clear', value)
  }

  let isCompositionStart = false

  //全角変換ボタンが押されたとき
  let compositionstart = function(){
    isCompositionStart = true
  }

  //全角入力されたとき
  let compositionupdate = function(event){
    
  }

  //全角入力が終了するとき
  let compositionend = function(){
    isCompositionStart = false
    procEventUpdateOption()
  }

  onMounted(() => {
    //テキストボックスのdomを取得
    const qSelects = Array.from(document.getElementsByName('qSelect'))
    const nsSearchItemCdInput = qSelects[0]?.previousElementSibling
    if(nsSearchItemCdInput){
      nsSearchItemCdInput.addEventListener('compositionstart', compositionstart, false)
      nsSearchItemCdInput.addEventListener('compositionupdate', compositionupdate, false)
      nsSearchItemCdInput.addEventListener('compositionend', compositionend, false)
    }
  })

  const model = ref('')

  //テキストボックス更新
  watch(() => props.selecting, (nowValue, oldValue) => {
    model.value = props.selecting
  }, { deep: true })

  initOnce()

</script>

<template>
  <q-select
    v-model="model"
    @input-value="input"
    @popup-hide="popupHide"
    @update:model-value="selected"
    @clear="clear"
    @keydown="keydown"
    :label="props.label"
    :options="options"
    :style="props.style"
    :disable="props.disable"
    :tabindex="props.tabindex"
    name="qSelect"
    use-input
    hide-selected
    fill-input
    emit-value
    dense
    hide-dropdown-icon
    clearable
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          No results
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<style scoped>

</style>
