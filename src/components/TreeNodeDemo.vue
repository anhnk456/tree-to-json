<template>
  <div class="tree-node">
    <!-- Regular Node -->
    <div class="node-content" v-if="!isArrayItem && !isHidden">
      <i v-if="hasChildren"
         :class="['toggle-icon', node.isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right']"
         @click="toggleExpand"></i>
      <span v-else class="toggle-spacer"></span>

      <InputText :disabled="isView" :value="node.name" placeholder="Nhập key" @input="validateInput($event, node)" />
      <InputText :disabled="isView" v-if="['text', 'number'].includes(node.selectJsonAndArray)"
                 :placeholder="node.selectJsonAndArray === 'number' ? 'Nhập số' : 'Nhập Value'"
                 class="value-input" :value="node.value" @input="validateInputValue($event, node)" />
      <Select :disabled="isView" v-if="node.selectJsonAndArray === 'boolean'" class="select-input" :v-model="node.value"
              :options="dropdownBoolean" optionValue="value" optionLabel="name" placeholder="Select One" />
      <DatePicker :disabled="isView"
                  v-if="node.selectJsonAndArray === 'date'"
                  :v-model="node.value"
                  placeholder="Chọn thời điểm"
                  dateFormat="dd/mm/yy"
                  showIcon
                  iconDisplay="input"
                  :modelValue="parseISOToDate(node.value)"
                  @update:modelValue="handleDateUpdate(node,$event)"/>
<!--      <Select v-if="node.selectJsonAndArray === 'array'"  class="select-input" style="margin-left: 10px" :v-model="node.selectArray"-->
<!--              :options="dropdownItemArray" optionValue="value" optionLabel="name" placeholder="Select One"  @change="handleArrayTypeChange(node)" />-->
      <Button v-if="isLastNode && !isView" type="button" icon="pi pi-plus" label="Thêm" @click="toggle" class="add-button" />
      <i v-if="!isView" class="pi pi-trash delete-icon" @click="confirmDelete"></i>
    </div>

    <!-- Array Group Container -->
    <template v-if="isArrayParent && node.isExpanded">
      <div v-for="(group, groupIndex) in groupedArrayItems"
           :key="`group-${group[0].uniqueId}`"
           class="array-group">

        <div class="group-header" >
          <div class="group-header-content" @click="toggleGroupExpansion(group[0].selectArrayIndex)">
            <i :class="['toggle-icon', isGroupExpanded(group[0].selectArrayIndex) ? 'pi pi-chevron-down' : 'pi pi-chevron-right']"></i>
            <span class="group-label">Object {{ group[0].selectArrayIndex }}</span>
          </div>
          <div class="group-actions">
            <Button v-if="!isView" icon="pi pi-trash" @click.stop="confirmDeleteGroup(group)"
                    class="group-action-button delete-group-button"/>
            <Button v-if="!isView" icon="pi pi-plus" @click.stop="duplicateGroup(group)"
                    class="group-action-button duplicate-group-button" />
          </div>
        </div>

        <div class="form-box" v-show="isGroupExpanded(group[0].selectArrayIndex)">
          <div v-for="(item, itemIndex) in group"
               :key="item.uniqueId"
               class="array-item">

            <div class="node-content">
              <i v-if="item.children?.length"
                 :class="['toggle-icon', item.isExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right']"
                 @click.stop="toggleItemExpand(item)"></i>
              <span v-else class="toggle-spacer"></span>

              <InputText :disabled="isView" :value="item.name" placeholder="Nhập key" @input="validateInput($event, item)" />
              <InputText :disabled="isView" v-if="['text', 'number'].includes(item.selectJsonAndArray)"
                         :placeholder="item.selectJsonAndArray === 'number' ? 'Nhập số' : 'Nhập Value'"
                         class="value-input" :value="item.value" @input="validateInputValue($event, item)" />
              <Select :disabled="isView" v-if="item.selectJsonAndArray === 'boolean'" class="select-input" v-model="item.value"
                      :options="dropdownBoolean" optionValue="value" optionLabel="name" placeholder="Select One" />
              <DatePicker :disabled="isView" v-if="item.selectJsonAndArray === 'date'" v-model="item.value"
                          placeholder="Chọn thời điểm" dateFormat="dd/mm/yy" showIcon iconDisplay="input"
                          :modelValue="parseISOToDate(item.value)"
                          @update:modelValue="handleDateUpdate(item,$event)"/>

              <Button
                  v-if="isLastItemInGroup(item, group) && !isView"
                  type="button"
                  icon="pi pi-plus"
                  label="Thêm"
                  @click.stop="toggle2($event, item.selectArrayIndex)"
                  class="add-button"
              />
              <i v-if="!isView" class="pi pi-trash delete-icon" @click.stop="removeItemFromGroup(groupIndex, itemIndex)"></i>
            </div>

            <!-- Render children for non-array items -->
            <div class="children" v-if="item.children?.length && item.isExpanded && item.selectJsonAndArray !== 'array'">
              <TreeNodeDemo
                  v-for="(child, childIndex) in item.children"
                  :key="child.uniqueId"
                  :node="child"
                  :parentNode="item"
                  :rootNodes="item.children"
                  :isView="isView"
                  @update-node="updateChildNode(item, childIndex, $event)"
                  @delete-node="deleteChildNode(item, childIndex)"
                  @add-sibling="addSiblingToNode(item, childIndex)"
              />
            </div>

            <!-- Special handling for nested arrays -->
            <template v-if="item.selectJsonAndArray === 'array' && item.isExpanded">
              <div class="nested-array-container">
                <TreeNodeDemo
                    :node="item"
                    :parentNode="item"
                    :isView="isView"
                    :rootNodes="item.children"
                    @update-node="(updatedNode) => updateNestedArrayItem(groupIndex, itemIndex, updatedNode)"
                    @delete-node="() => removeItemFromGroup(groupIndex, itemIndex)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>

    <!-- Regular Children -->
    <div class="children" v-if="shouldRenderChildren && node.isExpanded">
      <TreeNodeDemo
          v-for="(child, index) in node.children"
          :key="child.uniqueId"
          :node="child"
          :parentNode="node"
          :isView="isView"
          :rootNodes="node.children"
          @update-node="updateChild(index, $event)"
          @delete-node="deleteChild(index)"
          @add-sibling="addSiblingToChild(index, $event)"
      />
    </div>

    <!-- Add Node Menu -->
    <Popover ref="op">
      <div class="popover-content">
        <div>
          <ul class="menu">
            <li v-for="member in members" :key="member.name" class="menu-item" @click="selectMember(member)">
              <span class="menu-text">{{ member.name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Popover>

    <!-- Add Array Item Menu -->
    <Popover ref="op2">
      <div class="popover-content">
        <div>
          <ul class="menu">
            <li v-for="member in members" :key="member.name" class="menu-item" @click="selectMember2(member)">
              <span class="menu-text">{{ member.name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Popover>

    <!-- Delete Node Dialog -->
    <Dialog v-model:visible="showDeleteModal" modal header="Xác nhận xóa">
      <p>Bạn có chắc chắn muốn xóa node <b>{{ node.name || '(Không có tên)' }}</b> này không?</p>
      <template #footer>
        <Button label="Hủy" @click="showDeleteModal = false" class="cancel-button" />
        <Button label="Xóa" @click="remove" class="delete-button" />
      </template>
    </Dialog>

    <!-- Delete Group Dialog -->
    <Dialog v-model:visible="showDeleteGroupModal" modal header="Xác nhận xóa nhóm">
      <p>Bạn có chắc chắn muốn xóa nhóm <b>{{ deletingGroupId || '' }}</b> và tất cả các phần tử trong nhóm?</p>
      <template #footer>
        <Button label="Hủy" @click="showDeleteGroupModal = false" class="cancel-button" />
        <Button label="Xóa" @click="deleteGroup" class="delete-button" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { InputText, Button, Dialog, Select, DatePicker, Popover } from "primevue";

// eslint-disable-next-line no-undef
const props = defineProps({
  node: Object,
  parentNode: Object,
  rootNodes: Array,
  isView: Boolean
});

// eslint-disable-next-line no-undef
const emit = defineEmits(["update-node", "delete-node", "add-sibling", "update-node-json"]);

// Refs
const op = ref();
const op2 = ref();
const showDeleteGroupModal = ref(false);
const deletingGroupId = ref('');
const deletingGroup = ref(null);
const indexGroupClick = ref(null);
const showDeleteModal = ref(false);
const selectedMember = ref(null);
const groupExpansionStates = ref({});

// Data
const dropdownBoolean = ref([
  { name: "True", value: "True" },
  { name: "False", value: "False" }
]);
const dropdownItemArray = ref([
  { name: "Mảng đơn", value: "item_value" },
  { name: "Object", value: "object" },
]);

const members = ref([
  { name: "Text", value: "text" },
  { name: "Number", value: "number" },
  { name: "Boolean", value: "boolean" },
  { name: "DateTime", value: "date" },
  { name: "Array", value: "array" },
  { name: "Object", value: "json" }
]);

const handleArrayTypeChange = (node) => {
  // Xử lý logic khi thay đổi loại array nếu cần
  emit("update-node", { ...node });
};
// Computed Properties
const isLastItemInGroup = (item, group) => {
  return group[group.length - 1] === item;
};

const isHidden = computed(() => {
  return props.parentNode?.selectJsonAndArray === 'array' && props.node.selectJsonAndArray !== 'array';
});

const isArrayItem = computed(() => {
  return props.parentNode?.selectJsonAndArray === 'array' && props.node.selectArrayIndex !== '';
});

const isArrayParent = computed(() => {
  return props.node.selectJsonAndArray === 'array';
});

const isLastNode = computed(() => {
  return props.rootNodes?.[props.rootNodes.length - 1] === props.node;
});

const shouldRenderChildren = computed(() => {
  return props.node.children?.length && !isArrayParent.value;
});

const hasChildren = computed(() => {
  return (props.node.children && props.node.children.length > 0) ||
      props.node.selectJsonAndArray === 'json' ||
      props.node.selectJsonAndArray === 'array';
});

const groupedArrayItems = computed(() => {
  if (!isArrayParent.value) return [];

  const groups = {};
  props.node.children.forEach(child => {
    const key = child.selectArrayIndex || 'ungrouped';
    if (!groups[key]) groups[key] = [];
    if (!groups[key].some(item => item.uniqueId === child.uniqueId)) {
      groups[key].push(child);
    }
  });

  return Object.values(groups);
});

// Methods
const handleDateUpdate = (node,newValue) => {
  node.value = formatDateToISO(newValue);
};
// Hàm chuyển từ ISO string sang Date object
const parseISOToDate = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString);
};

// Hàm chuyển từ Date object sang ISO string
const formatDateToISO = (date) => {
  if (!date) return '';
  return date.toISOString();
};
const isGroupExpanded = (groupId) => {
  return groupExpansionStates.value[groupId] !== false;
};

const toggleGroupExpansion = (groupId) => {
  groupExpansionStates.value = {
    ...groupExpansionStates.value,
    [groupId]: !isGroupExpanded(groupId)
  };
};

const toggleExpand = () => {
  // eslint-disable-next-line vue/no-mutating-props
  props.node.isExpanded = !props.node.isExpanded;
  emit("update-node", { ...props.node });
};

const toggleItemExpand = (item) => {
  item.isExpanded = !item.isExpanded;
  emit("update-node", { ...props.node });
};

const confirmDeleteGroup = (group) => {
  if (!group || !group.length) return;

  deletingGroupId.value = group[0].selectArrayIndex;
  deletingGroup.value = group;
  showDeleteGroupModal.value = true;
};

const deleteGroup = () => {
  if (!deletingGroup.value) return;

  // eslint-disable-next-line vue/no-mutating-props
  props.node.children = props.node.children.filter(
      child => child.selectArrayIndex !== deletingGroupId.value
  );

  emit("update-node", { ...props.node });
  showDeleteGroupModal.value = false;
  deletingGroupId.value = '';
  deletingGroup.value = null;
};

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const removeItemFromGroup = (groupIndex, itemIndex) => {
  const group = groupedArrayItems.value[groupIndex];
  if (!group || !group[itemIndex]) return;

  const itemToRemove = group[itemIndex];
  const globalIndex = props.node.children.findIndex(child => child.uniqueId === itemToRemove.uniqueId);

  if (globalIndex !== -1) {
    // eslint-disable-next-line vue/no-mutating-props
    props.node.children.splice(globalIndex, 1);
    emit("update-node", { ...props.node });
  }
};

const updateNestedArrayItem = (groupIndex, itemIndex, updatedNode) => {
  const group = groupedArrayItems.value[groupIndex];
  if (group && group[itemIndex]) {
    group[itemIndex] = updatedNode;
    emit("update-node", { ...props.node });
  }
};

const duplicateGroup = (groupToClone) => {
  if (!groupToClone.length) return;

  const originalId = groupToClone[0].selectArrayIndex;
  const isNested = originalId.includes('-');
  let newId;

  if (isNested) {
    const [parentId, childId] = originalId.split('-');
    const siblings = props.node.children
        .filter(item => item.selectArrayIndex?.startsWith(`${parentId}-`))
        .map(item => parseInt(item.selectArrayIndex.split('-')[1]));
    newId = `${parentId}-${siblings.length ? Math.max(...siblings) + 1 : 1}`;
  } else {
    const topGroups = props.node.children
        .filter(item => item.selectArrayIndex && !item.selectArrayIndex.includes('-'))
        .map(item => parseInt(item.selectArrayIndex));
    newId = `${topGroups.length ? Math.max(...topGroups) + 1 : 1}`;
  }

  const deepClone = (node) => {
    const clone = {
      ...JSON.parse(JSON.stringify(node)),
      uniqueId: generateUniqueId(),
      selectArrayIndex: newId
    };
    if (clone.children) {
      clone.children = clone.children.map(child => ({
        ...deepClone(child),
        selectArrayIndex: newId
      }));
    }
    return clone;
  };

  const newItems = groupToClone.map(deepClone);
  // eslint-disable-next-line vue/no-mutating-props
  props.node.children = [...props.node.children, ...newItems];
  emit("update-node", { ...props.node });
};

const toggle = (event) => {
  op.value.toggle(event);
};

const toggle2 = (event, index) => {
  indexGroupClick.value = index;
  op2.value.toggle(event);
};

const selectMember = (member) => {
  selectedMember.value = member;
  if (member.value === 'json') {
    const newNode = createJsonNode();
    // eslint-disable-next-line vue/no-mutating-props
    props.rootNodes.push(newNode);
    emit("update-node-json", [...props.rootNodes]);
  } else if (member.value === 'array') {
    const newNode = createArrayNode();
    // eslint-disable-next-line vue/no-mutating-props
    props.rootNodes.push(newNode);
    emit("update-node-json", [...props.rootNodes]);
  } else {
    emit("add-sibling", member.value);
  }
  op.value.hide();
};

const selectMember2 = (member) => {
  selectedMember.value = member;
  if (member.value === 'json') {
    const newNode = createJsonNodeChildren(indexGroupClick.value);
    // eslint-disable-next-line vue/no-mutating-props
    props.node.children.push(newNode);
    emit("update-node", { ...props.node });
  } else if (member.value === 'array') {
    const newNode = createArrayNodeChildren(indexGroupClick.value);
    // eslint-disable-next-line vue/no-mutating-props
    props.node.children.push(newNode);
    emit("update-node", { ...props.node });
  } else {
    addItemToGroup(indexGroupClick.value, member.value);
  }
  op.value.hide();
};

// Node Creation Helpers
const createJsonNode = () => ({
  uniqueId: generateUniqueId(),
  name: "",
  value: "",
  selectArray: "object",
  selectJsonAndArray: 'json',
  isExpanded: true,
  children: [
    {
      uniqueId: generateUniqueId(),
      name: "",
      value: "",
      selectArray: "object",
      selectJsonAndArray: 'text',
      isExpanded: true,
      children: []
    }
  ]
});

const createArrayNode = () => ({
  uniqueId: generateUniqueId(),
  name: "",
  value: "",
  selectArrayIndex: '',
  selectArray: "object",
  selectJsonAndArray: 'array',
  isExpanded: true,
  children: [
    {
      uniqueId: generateUniqueId(),
      name: "",
      value: "",
      selectArray: "object",
      selectArrayIndex: '1',
      selectJsonAndArray: 'text',
      isExpanded: true,
      children: []
    }
  ]
});

const createArrayNodeChildren = (groupId) => ({
  uniqueId: generateUniqueId(),
  name: "",
  value: "",
  selectArray: "object",
  selectArrayIndex: groupId,
  selectJsonAndArray: 'array',
  isExpanded: true,
  children: [
    {
      uniqueId: generateUniqueId(),
      name: "",
      value: "",
      selectArray: "object",
      selectArrayIndex: `${groupId}-1`,
      selectJsonAndArray: 'text',
      isExpanded: true,
      children: []
    }
  ]
});

const createJsonNodeChildren = (groupId) => ({
  uniqueId: generateUniqueId(),
  name: "",
  value: "",
  selectArrayIndex: groupId,
  selectJsonAndArray: 'json',
  selectArray: "object",
  isExpanded: true,
  children: [
    {
      uniqueId: generateUniqueId(),
      name: "",
      value: "",
      selectArray: "object",
      selectJsonAndArray: 'text',
      selectArrayIndex: groupId,
      isExpanded: true,
      children: []
    }
  ]
});

const addItemToGroup = (groupId, type = 'text') => {
  const newItem = {
    uniqueId: generateUniqueId(),
    name: "",
    value: type === 'number' ? "" : type === 'boolean' ? 'True' : "",
    selectArrayIndex: groupId,
    selectArray: "object",
    selectJsonAndArray: type,
    isExpanded: true,
    children: []
  };

  // eslint-disable-next-line vue/no-mutating-props
  props.node.children.push(newItem);
  emit("update-node", { ...props.node });
};

const updateChildNode = (parent, index, updatedChild) => {
  parent.children[index] = updatedChild;
  emit("update-node", { ...props.node });
};

const deleteChildNode = (parent, index) => {
  parent.children.splice(index, 1);
  emit("update-node", { ...props.node });
};

const addSiblingToNode = (parent, index) => {
  parent.children.splice(index + 1, 0, {
    uniqueId: generateUniqueId(),
    name: "",
    value: "",
    selectJsonAndArray: "text",
    selectArray: "object",
    selectArrayIndex: parent.selectArrayIndex,
    isExpanded: true,
    children: []
  });
  emit("update-node", { ...props.node });
};

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const remove = () => {
  showDeleteModal.value = false;
  emit("delete-node");
};

const updateChild = (index, updatedChild) => {
  // eslint-disable-next-line vue/no-mutating-props
  props.node.children[index] = updatedChild;
  emit("update-node", { ...props.node });
};

const deleteChild = (index) => {
  // eslint-disable-next-line vue/no-mutating-props
  props.node.children.splice(index, 1);
  emit("update-node", { ...props.node });
};

const addSiblingToChild = (index, text) => {
  // eslint-disable-next-line vue/no-mutating-props
  props.node.children.splice(index + 1, 0, {
    name: "",
    value: "",
    selectJson: "",
    selectArray: "object",
    selectJsonAndArray: text ? text : "text",
    isExpanded: true,
    children: []
  });
  emit("update-node", { ...props.node });
};

const validateInput = (event, node) => {
  let newValue = event.target.value.replace(/[^a-zA-Z0-9_@#$%^&*()=!\-+]/g, "");
  node.name = newValue;
  event.target.value = newValue;
};

const validateInputValue = (event, node) => {
  if (node.selectJsonAndArray === 'number') {
    let newValue = event.target.value.replace(/[^0-9.]/g, "");
    let dotCount = (newValue.match(/\./g) || []).length;
    if (dotCount > 1) {
      newValue = newValue.slice(0, newValue.lastIndexOf('.'));
    }
    node.value = newValue;
    event.target.value = newValue;
  } else {
    node.value = event.target.value;
  }
};
</script>

<style scoped>
.tree-node {
  margin-left: 20px;
  padding-left: 10px;
  border-left: 2px solid #ddd;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 10px 0;
}

.children {
  margin-left: 10px;
  border-left: 2px solid #eee;
  padding-left: 15px;
}

.array-group {
  display: block;
  width: fit-content;
  border: 1px solid #b2abab;
  border-radius: 10px;
  padding: 5px;
  margin: 10px 0 10px 50px;
  position: relative;
}

.array-group .array-group {
  margin-left: 60px;
  border-left: 2px dashed #ccc;
  background-color: #f9f9f9;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.group-header-content {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.array-group .array-group .group-header {
  background-color: #f0f0f0;
}

.group-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.p-button-sm {
  padding: 0.5rem;
}

.p-button-danger {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.p-button-success {
  background-color: #52c41a;
  border-color: #52c41a;
}

.group-label {
  font-weight: bold;
}

.form-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #fafafa;
  border-radius: 0 0 4px 4px;
}

.array-item {
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding: 0px 8px 0px 0px;
  margin-left: 0px;
}

.menu {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  width: 120px;
  list-style: none;
  margin: 0;
}

.menu-item {
  padding: 10px 15px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.menu-item:hover {
  background-color: orange;
  color: white;
}

.toggle-icon {
  cursor: pointer;
  margin-right: 5px;
  color: #666;
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.toggle-icon:hover {
  color: #6366f1;
}

.toggle-spacer {
  display: inline-block;
  width: 16px;
  margin-right: 5px;
}

input {
  font-family: inherit;
  font-feature-settings: inherit;
  color: #334155;
  background:#ffffff ;
  padding-block: 0.5rem;
  padding-inline: 0.75rem;
  padding: 10px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
  outline-color: transparent;
  appearance: none;
  border-radius: 0.25rem;
  box-shadow: 0 0 #00000000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05);
}


/* Base styles */
.tree-node {
  margin-left: 20px;
  padding-left: 10px;
  border-left: 2px solid #ddd;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 10px 0;
}

.children {
  margin-left: 10px;
  border-left: 2px solid #eee;
  padding-left: 15px;
}

/* Input styles */

/* Button styles */
.add-button {
  min-width: 12rem;
}

.delete-icon {
  margin-left: 1rem;
  color: #bebb26;
  cursor: pointer;
}

.group-action-button {
  padding: 0.5rem;
  background-color: white;
  color: black;
  border: none;
}

.delete-group-button {
  color: #ff4d4f;
}

.duplicate-group-button {
  color: #1890ff;
}

.cancel-button {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.delete-button {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

/* Array group styles */
.array-group {
  display: block;
  width: fit-content;
  border: 1px solid #b2abab;
  border-radius: 10px;
  padding: 5px;
  margin: 10px 0 10px 50px;
  position: relative;
}

.array-group .array-group {
  margin-left: 60px;
  border-left: 2px dashed #ccc;
  background-color: #f9f9f9;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.group-header-content {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.array-group .array-group .group-header {
  background-color: #f0f0f0;
}

.group-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.group-label {
  font-weight: bold;
  margin-left: 5px;
}

.form-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #fafafa;
  border-radius: 0 0 4px 4px;
}

.array-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 8px 0 0;
  margin-left: 0;
}

/* Menu styles */
.popover-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  width: 120px;
  list-style: none;
  margin: 0;
}

.menu-item {
  padding: 10px 15px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.menu-item:hover {
  background-color: orange;
  color: white;
}

/* Toggle icon styles */
.toggle-icon {
  cursor: pointer;
  margin-right: 5px;
  color: #666;
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.toggle-icon:hover {
  color: #6366f1;
}

.toggle-spacer {
  display: inline-block;
  width: 16px;
  margin-right: 5px;
}

/* Input element styles */
input {
  font-family: inherit;
  font-feature-settings: inherit;
  color: #334155;
  background: #ffffff;
  padding: 10px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
  outline-color: transparent;
  appearance: none;
  border-radius: 0.25rem;
  box-shadow: 0 1px 2px 0 rgba(18, 18, 23, 0.05);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .node-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }


  .array-group {
    margin-left: 20px;
  }
}
</style>