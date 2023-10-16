<template>
    <div class="container">
        <div>
            <div @mousedown="startSelection" @mousemove="updateSelection" @mouseup="endSelection"
                style="position: relative; display: inline-block;">
                <img :src="image" alt="Screenshot" ref="screenshot" draggable="false" />
                <div v-if="selection.width && selection.height" :style="{
                    position: 'absolute',
                    left: selection.x + 'px',
                    top: selection.y + 'px',
                    width: selection.width + 'px',
                    height: selection.height + 'px',
                    border: '1px dashed #000'
                }"></div>
            </div>
        </div>
    </div>
</template>
  
<script>
export default {
    data() {
        return {
            image: null,
            selection: { width: 0 },
            isDragging: false,
            startX: null,
            startY: null,
            endX: null,
            endY: null
        }
    },
    methods: {
        startSelection(e) {
            this.isDragging = true
            this.startX = e.clientX - 9
            this.startY = e.clientY - 105
            console.log(this.startX, this.startY);
        },
        updateSelection(e) {
            if (!this.isDragging) return
            let clientY = e.clientY - 105
            let clientX = e.clientX - 9
            const x = Math.min(this.startX, clientX)
            const y = Math.min(this.startY, clientY)
            const width = Math.abs(this.startX - clientX)
            const height = Math.abs(this.startY - clientY)
            this.selection = { x, y, width, height }
            console.log(this.selection);
        },
        endSelection() {
            this.isDragging = false
            if (!this.selection) return
            const canvas = document.createElement('canvas')
            canvas.width = this.selection.width
            canvas.height = this.selection.height

            const ctx = canvas.getContext('2d')
            ctx.drawImage(this.$refs.screenshot, this.selection.x, this.selection.y, this.selection.width, this.selection.height, 0, 0, this.selection.width, this.selection.height)
            this.selection = {}
            this.image = canvas.toDataURL()
            console.log(this.image);
        },
        takeScreenshot() {
            // window.ipcRenderer.send('screenCapture');

        }
    },
    created() {

        // window.ipcRenderer.on('source', (event, image) => {
            // this.$refs.screenshot.src = image
            // this.image = image
            // console.log(image)
        // })
        console.log(this.$route.params.img) // 获取动态路由参数
        this.image = this.$route.params.img
    }
}
// window.ipcRenderer = window.require('electron').ipcRenderer

</script>
  
<style scoped>
/* .container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;

} */

/* img {
    max-width: 100%;
    max-height: 100%;
    user-select: none;
} */
</style>
  