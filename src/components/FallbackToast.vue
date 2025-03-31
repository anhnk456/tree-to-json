<!-- FallbackToast.vue -->
<template>
  <div v-if="visible" class="fallback-toast" :class="`severity-${severity}`">
    <div class="toast-content">
      <span class="summary">{{ summary }}</span>
      <span class="detail">{{ detail }}</span>
    </div>
    <button class="close-btn" @click="close">×</button>
  </div>
</template>

<script>
export default {
  props: {
    severity: {
      type: String,
      default: 'info'
    },
    summary: String,
    detail: String,
    life: {
      type: Number,
      default: 3000
    }
  },
  data() {
    return {
      visible: false,
      timer: null
    }
  },
  mounted() {
    this.show()
  },
  methods: {
    show() {
      this.visible = true
      if (this.life > 0) {
        this.timer = setTimeout(() => {
          this.close()
        }, this.life)
      }
    },
    close() {
      this.visible = false
      if (this.timer) {
        clearTimeout(this.timer)
      }
      this.$emit('close')
    }
  }
}
</script>

<style scoped lang="css">
.fallback-toast {
  position: fixed;
  right: 20px;
  top: 20px;
  min-width: 250px;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.severity-info {
  background-color: #2196F3;
  color: white;
}

.severity-success {
  background-color: #4CAF50;
  color: white;
}

.severity-warn {
  background-color: #FFC107;
  color: #212121;
}

.severity-error {
  background-color: #F44336;
  color: white;
}

.close-btn {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.2em;
  cursor: pointer;
  margin-left: 10px;
}

.toast-content {
  display: flex;
  flex-direction: column;
}

.summary {
  font-weight: bold;
  margin-bottom: 4px;
}
</style>