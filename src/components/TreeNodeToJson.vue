<template>
  <div class="container">
    <!-- JSON Tree Section -->
    <div class="tree-section">
      <div class="card">
        <div class="tree-container">
          <TreeNodeDemo
              v-for="(node, index) in treeData"
              :key="node.uniqueId || index"
              :node="node"
              :parentNode="node"
              :rootNodes="treeData"
              :isView="isView"
              @update-node="updateTreeNode(index, $event)"
              @update-node-json="updateTreeNodeJson(index, $event)"
              @delete-node="deleteTreeNode(index)"
              @add-sibling="addSiblingNode(index, $event)"
          />
        </div>
      </div>
    </div>
    <!-- JSON Output Section -->
    <div class="output-section ">
      <div class="card">
        <div class="output-header">
          <span>JSON Output</span>
          <div class="button-group">
            <Button
                @click="copyJson"
                class="copy-button"
                label="Copy JSON"
            />
          </div>
        </div>
        <pre class="json-output">{{ transformDataTree(treeDataJson)[0] }}</pre>
      </div>
    </div>
    <div class="toast-container">
      <FallbackToast
          v-for="msg in toastMessages"
          :key="msg.id"
          :severity="msg.severity"
          :summary="msg.summary"
          :detail="msg.detail"
          :life="msg.life"
          @close="removeToast(msg.id)"
      />
    </div>
  </div>
</template>

<script setup>
import {ref, watch, computed, onMounted} from 'vue';
import FallbackToast from './FallbackToast.vue';
import Button from 'primevue/button';
import TreeNodeDemo from "@/components/TreeNodeDemo.vue";

// Props
// eslint-disable-next-line no-undef
const props = defineProps({
  isEditable: {type: Boolean, default: false},
  isCreate: {type: Boolean, default: true},
  isView: {type: Boolean, default: false},
  isData: {type: Array, default : null}
});

// Refs
const treeData = ref([{
  name: "",
  value: "",
  selectArray: "object",
  selectJson: "no_name",
  selectJsonAndArray: "text",
  children: []
}]);

watch(() => props.isData, (newData) => {
  if (newData) {
    treeData.value = transformJsonToTree(newData);
  }
}, {deep: true});
const treeDataJson = ref([]);
const toastMessages = ref([]);
const showToast = (options) => {
  // Nếu không có Toast, dùng fallback
  const id = Date.now();
  toastMessages.value.push({
    id,
    ...options
  });

  // Tự động xóa sau khi hết thời gian
  if (options.life) {
    setTimeout(() => {
      toastMessages.value = toastMessages.value.filter(msg => msg.id !== id);
    }, options.life);
  }
};
const removeToast = (id) => {
  toastMessages.value = toastMessages.value.filter(msg => msg.id !== id);
};

// Computed
const formattedJsonOutput = computed(() => {
  return JSON.stringify(transformDataTree(treeDataJson.value)[0], null, 2);
});

// Watchers
watch(treeData, (newValue) => {
  treeDataJson.value = [{
    name: "",
    value: "",
    selectArray: "object",
    selectJson: "no_name",
    selectJsonAndArray: "json",
    children: newValue,
  }];
}, {deep: true});

const updateTreeNode = (index, updatedNode) => {
  treeData.value[index] = {...updatedNode};
};

const updateTreeNodeJson = (index, updatedNode) => {
  treeData.value = [...updatedNode];
};

const deleteTreeNode = (index) => {
  treeData.value.splice(index, 1);
};

const addSiblingNode = (index, text) => {
  treeData.value.splice(index + 1, 0, {
    name: "",
    value: "",
    selectJson: "",
    selectArray: "object",
    selectJsonAndArray: text || "text",
    children: []
  });
};
const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(formattedJsonOutput.value);
    showToast({
      severity: 'success',
      summary: 'Thành công',
      detail: 'JSON copied to clipboard!',
      life: 3000
    });
  } catch (err) {
    showToast({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to copy JSON',
      life: 3000
    });
  }
};

const transformDataTree = (data) => {
  function transformNode(node) {
    if (!node.children || node.children.length === 0) {
      return {[node.name]: node.value};
    }

    if (node.selectJsonAndArray === "array") {
      if (node.selectArray === "item_value") {
        return {[node.name]: node.children.map(child => child.value)};
      }

      // Giữ nguyên thứ tự ban đầu và xử lý key trùng
      const resultArray = [];
      const tempGroups = {};

      node.children.forEach(child => {
        const key = child.selectArrayIndex || "default";

        if (!tempGroups[key]) {
          tempGroups[key] = {};
          // Thêm một object mới vào mảng kết quả
          resultArray.push(tempGroups[key]);
        }

        // Xử lý trường hợp key trùng
        if (tempGroups[key][child.name] !== undefined) {
          // Nếu key đã tồn tại, biến nó thành mảng
          if (!Array.isArray(tempGroups[key][child.name])) {
            tempGroups[key][child.name] = [tempGroups[key][child.name]];
          }
          tempGroups[key][child.name].push(
              child.children.length ? transformNode(child)[child.name] : child.value
          );
        } else {
          tempGroups[key][child.name] = child.children.length
              ? transformNode(child)[child.name]
              : child.value;
        }
      });

      return {[node.name]: resultArray};
    }

    if (node.selectJsonAndArray === "json") {
      const jsonObject = {};
      node.children.forEach(child => {
        // Xử lý trường hợp key trùng trong JSON
        if (jsonObject[child.name] !== undefined) {
          // Nếu key đã tồn tại, biến nó thành mảng
          if (!Array.isArray(jsonObject[child.name])) {
            jsonObject[child.name] = [jsonObject[child.name]];
          }
          jsonObject[child.name].push(
              child?.children?.length ? transformNode(child)[child.name] : child.value
          );
        } else {
          jsonObject[child.name] = child?.children?.length
              ? transformNode(child)[child.name]
              : child.value;
        }
      });
      return node.selectJson === "no_name" ? jsonObject : {[node.name]: jsonObject};
    }

    return {[node.name]: node.children.map(transformNode)};
  }

  return data.map(transformNode);
};
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);
}

function transformJsonToTree(input, parentIndex = '', level = 0, isInArray = false) {
  const result = [];

  // Hàm kiểm tra date chính xác hơn
  const isValidDate = (value) => {
    // Kiểm tra object Date
    if (value instanceof Date && !isNaN(value)) {
      return true;
    }

    // Kiểm tra chuỗi date ISO (yyyy-mm-dd hoặc yyyy-mm-ddThh:mm:ss)
    if (typeof value === 'string') {
      const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
      if (isoRegex.test(value) && !isNaN(Date.parse(value))) {
        return true;
      }

      // Có thể thêm các định dạng date khác nếu cần
      const dateRegex = /^\d{4}[/\\-]\d{2}[/\\-]\d{2}$/;
      if (dateRegex.test(value) && !isNaN(Date.parse(value))) {
        return true;
      }
    }

    return false;
  };

  if (typeof input === 'object' && !Array.isArray(input) && input !== null) {
    // Xử lý object
    for (const [key, value] of Object.entries(input)) {
      const node = {
        name: key,
        value: value, // Luôn điền giá trị
        selectJson: "name",
        selectJsonAndArray: "",
        uniqueId: generateUniqueId(),
        isExpanded: level < 2,
        selectArrayIndex: isInArray ? parentIndex : '',
        children: []
      };

      if (Array.isArray(value)) {
        node.selectJsonAndArray = "array";
        node.value = JSON.stringify(value); // Hiển thị array dưới dạng string
        value.forEach((item, index) => {
          const arrayIndex = parentIndex ? `${parentIndex}-${index + 1}` : `${index + 1}`;
          const children = transformJsonToTree(item, arrayIndex, level + 1, true);
          children.forEach(child => {
            child.selectArrayIndex = arrayIndex;
            node.children.push(child);
          });
        });
      }
      else if (typeof value === 'object' && value !== null) {
        node.selectJsonAndArray = "json";
        node.value = JSON.stringify(value); // Hiển thị object dưới dạng string
        node.children = transformJsonToTree(value, parentIndex, level + 1, false);
      }
      else {
        // Xử lý các kiểu dữ liệu đặc biệt
        if (typeof value === 'boolean') {
          node.selectJsonAndArray = "boolean";
        }
        else if (typeof value === 'number') {
          node.selectJsonAndArray = "number";
        }
        else if (isValidDate(value)) {
          node.selectJsonAndArray = "date";
          // Format lại date để hiển thị đẹp hơn
          const dateObj = new Date(value);
          node.value = dateObj.toISOString().split('T')[0]; // Chỉ lấy phần ngày
        }
        else {
          node.selectJsonAndArray = "text";
        }
      }

      result.push(node);
    }
  }
  else if (Array.isArray(input)) {
    // Xử lý array root
    input.forEach((item, index) => {
      const arrayIndex = `${index + 1}`;
      const children = transformJsonToTree(item, arrayIndex, level + 1, true);
      result.push(...children);
    });
  }
  else {
    // Xử lý giá trị nguyên thủy
    const node = {
      uniqueId: generateUniqueId(),
      name: '',
      value: input, // Luôn điền giá trị
      selectArray: "",
      selectJson: "no_name",
      isExpanded: false,
      selectArrayIndex: isInArray ? parentIndex : '',
      children: []
    };

    if (typeof input === 'boolean') {
      node.selectJsonAndArray = "boolean";
    }
    else if (typeof input === 'number') {
      node.selectJsonAndArray = "number";
    }
    else if (isValidDate(input)) {
      node.selectJsonAndArray = "date";
      const dateObj = new Date(input);
      node.value = dateObj.toISOString().split('T')[0];
    }
    else {
      node.selectJsonAndArray = "text";
    }

    result.push(node);
  }

  return result;
}

// Hàm kiểm tra xem giá trị có phải là date hợp lệ không
function isValidDate(value) {
  // Kiểm tra chuỗi date theo định dạng ISO
  if (typeof value === 'string' && !isNaN(Date.parse(value))) {
    return true;
  }

  // Kiểm tra object Date
  if (value instanceof Date && !isNaN(value)) {
    return true;
  }

  // Có thể thêm các kiểm tra định dạng date khác nếu cần
  return false;
}
// Lifecycle Hooks
onMounted(() => {
  if (props.isData) {
    treeData.value = transformJsonToTree(props.isData);
  }
});
</script>

<style scoped lang="css">
.fallback-toast-container {
  position: fixed;
  right: 20px;
  top: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.flex-9 {
  flex: 9;
}

.flex-3 {
  flex: 3;
}

.card {
  display: flex;
  flex-direction: column;
  height: calc(83vh - 50px);
}

.tree-container, pre {
  flex: 1;
  overflow-y: auto;
}
/* Base styles */
.container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.tree-section {
  flex: 9;
  background-color: #f3f4f6;
  display: flex;
  gap: 1rem;
}

.output-section {
  flex: 3;
  background-color: #f3f4f6;
  display: flex;
  gap: 1rem;
}

.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: calc(83vh - 50px);
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
}

.output-header {
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.copy-button {
  padding: 0.5rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
}

.copy-button:hover {
  background-color: #2563eb;
}

.json-output {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow: auto;
  text-align: justify;
  max-height: calc(100vh - 100px);
}

.toast-container {
  position: fixed;
  right: 20px;
  top: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }

  .tree-section,
  .output-section {
    flex: 1;
  }
}
</style>