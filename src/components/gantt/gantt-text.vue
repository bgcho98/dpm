<template>
  <div :style="{ width : width + 'px', disabled: !editable }">
    <b-button
      :size="'sm'"
      :variant="'outline-primary'"
      @click="moveLink(link)"
      v-b-tooltip.html.right
      :title="value"
    >
      <font-awesome-icon :icon="['fas', 'link']"/>
    </b-button>
    <input
      ref="input"
      class="cell"
      type="text"
      :value="value"
      :placeholder="placeholder"
      @input="onUpdate($event.target.value)"
      :disabled="!editable"
    >
  </div>
</template>

<script>
export default {
  props: {
    /**
     * String value of the cell
     * @type {String}
     */
    value: {
      type: String,
      required: false
    },
    /**
     * Boolean to determine if the cell can be edited
     * @type {Boolean}
     */
    editable: {
      type: Boolean,
      default: true,
      required: false
    },
    /**
     * Number to define the width
     * @default {}
     * @type {Number}
     */
    width: {
      type: Number,
      default: 300
    },
    /**
     * String to define the placeholder of the input
     * @default ''
     * @type {String}
     */
    placeholder: {
      type: String,
      default: "Add a new task..."
    },
    link: {
      type: String
    }
  },
  methods: {
    onUpdate(value) {
      this.$emit("input", value);
      this.$emit("update");
    },
    moveLink(link) {
      window.open(link, "_blank");
    }
  }
};
</script>