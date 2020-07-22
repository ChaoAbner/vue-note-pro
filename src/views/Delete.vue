<template>
    <el-container>
        <!-- 头部 -->
        <el-header>

            <el-row>
                <el-col :span="4">
                    <el-page-header @back="goBack"></el-page-header>
                </el-col>
                <el-col :span="20">
                    <div v-model="username" class="grid-content bg-purple-light" style="color: #409EFF">
                        {{user.username}}
                        <el-button v-on:click="logout" style="margin-left: 50px;" type="danger" round>退出登录</el-button>
                        <el-button v-on:click="foreverDelete" style="margin-left: 50px;" type="warn" round>彻底删除</el-button>
                        <el-button v-on:click="restore" style="margin-left: 50px;" type="success" round>还原</el-button>
                    </div>
                </el-col>
            </el-row>
        </el-header>

        <!-- 内容 -->
        <el-container>
            <!--侧边栏-->
            <el-aside width="200px">
                <el-menu
                        default-active="0"
                        class="el-menu-vertical-demo"
                        @open="handleOpen"
                        @close="handleClose">
                    <!--                        default-openeds="1">-->
                    <!--                    <el-scrollbar>-->

                    <el-submenu index="1">
                        <template slot="title">
                            <i class="el-icon-notebook-1"></i>
                            <span>垃圾箱</span>
                        </template>
                        <el-menu-item-group>
                            <!--  笔记存储  -->
                            <el-menu-item @click="showDetail(item, i)"
                                          v-for="(item, i) in deletedData" :index="i" >
                                {{item.title}}
                            </el-menu-item>
                        </el-menu-item-group>
                    </el-submenu>
                    <!--                    </el-scrollbar>-->
                </el-menu>
            </el-aside>
            <!-- 笔记编辑区-->
            <!--            v-model="editor.info"-->
            <editor-bar :disable="true" :isClear="isClear" :value="editor.value" v-model="editor.value"
                        ></editor-bar>
        </el-container>

    </el-container>
</template>

<script>
    import EditorBar from '@/components/EditorBar'

    export default {
        name: "ShowDelete",
        data() {
            return {
                user: {
                    username: ''
                },
                editor: {
                  value: ""
                },
                isClear: false,
                deletedData: [],
                index: 0,
                start: 0,
                limit: 20
            }
        },

        methods: {
            reload(){
                location.reload()
            },

            initDeletedData() {
                let _this = this
                this.$axios.get(`note/basket?start=${this.start}&limit=${this.limit}`,)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data.data)
                            _this.deletedData = data.data
                            _this.editor.value = data.data[_this.index].content
                        }
                    })
            },

            // 永久删除
            foreverDelete() {
                let _this = this
                let note = this.deletedData[this.index]
                if (note.id) {
                    this.$axios.put(`note/${note.id}/status/${3}`,)
                        .then(res => {
                            let data = res.data
                            if (data.code === 0) {
                                this.$message({
                                    type: "success",
                                    message: "笔记已永久删除"
                                })
                                setTimeout(() => {
                                    _this.reload()
                                }, 1000)
                            }
                        })
                } else {
                    // 恢复离线数据

                }

            },

            // 还原数据
            restore() {
                let _this = this
                let note = this.deletedData[this.index]
                if (note.id) {
                    this.$axios.put(`note/${note.id}/status/${1}`,)
                        .then(res => {
                            let data = res.data
                            if (data.code === 0) {
                                this.$message({
                                    type: "success",
                                    message: "笔记已恢复"
                                })
                                setTimeout(() => {
                                    _this.reload()
                                }, 1000)
                            }
                        })
                } else {
                    // 恢复离线数据

                }
            },

            showDetail(item, index) {
                this.editor.value = item.content
                this.index = index
            },

            goBack() {
                console.log("go")
                this.$router.push("/home")
            },

            logout() {
                this.$store.commit('REMOVE_INFO')
                window.location.reload()
            },
        },

        created() {
            this.initDeletedData()
            if (this.$store.getters.getUser) {
                this.user = this.$store.getters.getUser
            } else {
                this.$router.push("/login")
            }
        },

        components: {
            EditorBar
        },

    }
</script>

<style scoped>

</style>
