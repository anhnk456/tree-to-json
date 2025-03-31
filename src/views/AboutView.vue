<template>
  <div class="home">
    <TreeNodeJson/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import TreeNodeJson from '@/components/TreeNodeToJson.vue'; // @ is an alias to /src

@Options({
  components: {
    TreeNodeJson
  },
})
export default class HomeView extends Vue {}
</script>
