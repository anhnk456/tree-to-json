# Create by: Nguyễn Thuần Huy - Phú Thọ - VNPT-IT



#cách dùng khi install về

    <DatePicker v-show="showDate"/>
    <Dialog v-show="showDate"></Dialog>
    <div v-show="showDate">
      <Select />
    </div>
    <TreeToJson :isData="DataJson" :isView="false" :isEditable="false" :isCreate="true" />




Sau khi cài đặt package, thêm vào file sử dụng thư viện

```javascript
const showDate = ref(false);
import TreeToJson from 'tree-to-json-v2';
import "tree-to-json-v2/dist/TreeToJson.css"
import "tree-to-json-v2/dist/assets/base.css"
import "tree-to-json-v2/dist/assets/custom.css"
import "tree-to-json-v2/dist/assets/tailwind.css"
import "tree-to-json-v2/dist/assets/primeicons/primeicons.css"
import { Select, DatePicker,Dialog } from "primevue";
// Hoặc import từng file riêng nếu cần
