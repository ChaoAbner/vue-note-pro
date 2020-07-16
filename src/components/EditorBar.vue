<template lang="html">
    <div class="editor">
        <div ref="toolbar" class="toolbar" />
        <div ref="editor" class="text" />
<!--        <div ref="editorForm"/>-->
    </div>
</template>

<script>
    import E from 'wangeditor'
    export default {
        name: 'Editorbar',
        data() {
            return {
                editor: null,
                info_: this.value
            }
        },
        model: {
            prop: 'value',
            event: 'change'
        },
        props: {
            value: {
                type: String,
                default: ''
            },
            isClear: {
                type: Boolean,
                default: false
            }
        },
        watch: {
            isClear(val) {
                // 触发清除文本域内容
                if (val) {
                    this.editor.txt.clear()
                    this.info_ = null
                }
            },
            value(val) {
                this.editor.txt.html(this.value)
            }
        },

        mounted() {
            this.seteditor()
            this.editor.txt.html(this.value)
        },

        methods: {
            seteditor() {
                this.editor = new E(this.$refs.toolbar, this.$refs.editor)

                // 配置菜单
                this.editor.customConfig.menus = [
                    'head', // 标题
                    'bold', // 粗体
                    'fontSize', // 字号
                    'fontName', // 字体
                    'italic', // 斜体
                    'underline', // 下划线
                    'strikeThrough', // 删除线
                    'foreColor', // 文字颜色
                    'backColor', // 背景颜色
                    'link', // 插入链接
                    'list', // 列表
                    'justify', // 对齐方式
                    'quote', // 引用
                    'emoticon', // 表情
                    'image', // 插入图片
                    'table', // 表格
                    'video', // 插入视频
                    'code', // 插入代码
                    'undo', // 撤销
                    'redo' // 重复
                ]

                this.editor.customConfig.uploadImgHooks = {
                    fail: (xhr, editor, result) => {
                        // 插入图片失败回调
                    },
                    success: (xhr, editor, result) => {
                        // 图片上传成功回调
                    },
                    timeout: (xhr, editor) => {
                        // 网络超时的回调
                    },
                    error: (xhr, editor) => {
                        // 图片上传错误的回调
                    },
                    customInsert: (insertImg, result, editor) => {
                        // 图片上传成功,插入图片的回调
                    }
                }

                this.editor.customConfig.onchange = (html) => {
                    this.info_ = html // 绑定当前逐渐地值
                    this.$emit('change', this.info_) // 将内容同步到父组件中
                }

                // 创建富文本编辑器
                this.editor.create()
                // this.editor.txt.html(this.value)
            }
        }
    }
</script>

<style lang="css">
    .editor {
        width: 80%;
        margin: 0 auto;
    }

    .toolbar {
        border: 1px solid #ccc;
    }

    .text {
        border: 1px solid #ccc;
        height: 500px;
    }
</style>
