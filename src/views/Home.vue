<template>
    <el-container>
        <!-- 头部 -->
        <el-header>
            <el-row>
                <el-col :span="3">
                    <div class="grid-content bg-purple"
                         style="border: 1px #e8e8e8 solid; border-radius: 50px; padding: 10px 0;cursor: pointer;"    >
                       <i class="el-icon-circle-plus"></i> 新建笔记
                    </div>
                </el-col>

                <el-col :span="10">
                    <div class="grid-content bg-purple-light">
                        在线状态:
                        <el-button type="success" >在线</el-button>
                        <el-button type="danger" disabled>离线</el-button>
                    </div>
                </el-col>

                <el-col :span="11">
                    <div v-model="username" class="grid-content bg-purple-light">
                        用户: {{user.username}}
                        <el-button v-on:click="logout" style="margin-left: 50px;" type="danger" round>退出登录</el-button>
                    </div>
                </el-col>
            </el-row>
        </el-header>

        <!-- 内容 -->
        <el-container>
            <!--侧边栏-->
            <el-aside width="200px">
                <el-menu
                        default-active="2"
                        class="el-menu-vertical-demo"
                        @open="handleOpen"
                        @close="handleClose">
                    <el-submenu index="1">
                        <template slot="title">
                            <i class="el-icon-notebook-1"></i>
                            <span>我的笔记</span>
                        </template>
                        <el-menu-item-group>
                            <!--              笔记存储  -->
                            <el-menu-item index="1-1">选项1</el-menu-item>
                            <el-menu-item index="1-2">选项2</el-menu-item>
                            <el-menu-item index="1-1">选项1</el-menu-item>
                            <el-menu-item index="1-2">选项2</el-menu-item>
                            <el-menu-item index="1-1">选项1</el-menu-item>
                            <el-menu-item index="1-2">选项2</el-menu-item>
                        </el-menu-item-group>
                    </el-submenu>
                </el-menu>
            </el-aside>
            <!-- 笔记编辑区-->
            <editor-bar v-model="editor.info" :isClear="isClear" @change="change"></editor-bar>

        </el-container>

    </el-container>
</template>

<style>

</style>


<script>
    import EditorBar from '@/components/EditorBar'

    export default {
        name: "Home",
        data() {
            return {
                user: {
                    username: ''
                },
                editor: {
                    info: ''
                },
                isClear: false
            }
        },

        methods: {
            change(val) {
                this.editor.info1 = val
            },

            logout() {
                sessionStorage.clear();
                localStorage.clear();
                window.location.reload()
            }
        },

        components: {
            EditorBar
        },

        created() {
            if (this.$store.getters.getUser) {
                this.user.username = this.$store.getters.getUser.username
            } else {
                this.$router.push("/login")
            }
        }
    }


</script>
