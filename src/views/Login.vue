<template>
    <div>
      <el-container>
        <el-main>
          <el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm"
                  class="demo-ruleForm" style="width: 50%; margin: 100px auto">
            <el-form-item label="用户名" prop="username">
              <el-input type="text" maxlength="12" v-model="ruleForm.username"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm('ruleForm')">登录</el-button>
            </el-form-item>
          </el-form>
        </el-main>
      </el-container>
    </div>
</template>

<script>
  export default {
    name: 'Login',
    data() {
      return {
        isLogin: false,
        ruleForm: {
          username: ''
        },
        rules: {
          username: [
            {required: true, message: '请输入用户名', trigger: 'blur'},
            {min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur'}
          ]
        }
      };
    },
    methods: {
      submitForm(formName) {
        const _this = this
        this.$refs[formName].validate((valid) => {
          if (valid) {
            // 提交逻辑
            this.$axios.post('http://localhost:8899/session/' + this.ruleForm.username).then((res)=>{
              // 获取token
              let data = res.data.data
              const token = data.token
              // 保存到store
              // 然后使用store提交token和用户信息的状态。完成操作之后，跳转到笔记编辑页面。
              _this.$store.commit('SET_TOKEN', token)
              _this.$store.commit('SET_USERINFO', data.user)
              _this.$router.push("/home")
            })
              _this.$router.push("/home")
          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
    },

    created() {
      if (this.$store.getters.getUser) {
        this.$router.push("/home")
      }
    }
  }
</script>
