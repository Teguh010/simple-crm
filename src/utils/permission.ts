import { Directive, nextTick } from 'vue';
import { typeOccupation } from '@/utils/enum';

import useClinicStore from '@/stores/clinics';

const permissionDirective: Directive = {
  mounted(el, binding) {
    if ((! binding.hasOwnProperty('value')) || binding.value) {
      // The user wants NO  directive to be applied...
     
    }else{
      const clinicStore = useClinicStore();
      let isEditable = false;
      if(clinicStore.getClinic?.flg_master_data_control){ // only 1107 and 1000 can create/update/delete
        const type_occupation = localStorage.getItem('userTypeOccupation')
        if (type_occupation == '1107' || type_occupation == '1000'){
          isEditable = true;
        }
      }else{  // all can create/update/delete
        isEditable = true
      }
      if(!isEditable){
        el.setAttribute('disabled', true);
        el.classList.add('q-btn--disabled'); // Add a disabled style class if needed
      }
    }
  },
};

export default permissionDirective;
