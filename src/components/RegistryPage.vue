<template>
  <div>
    <div class="background"></div>
    <div class="content">
      <h1 class="welcome-title">欢迎注册文件管理系统</h1>
      <el-form :model="registerForm" :rules="rules" label-width="100px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="registerForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input type="password" v-model="registerForm.confirmPassword" placeholder="请确认密码"></el-input>
        </el-form-item>
        <el-form-item label="验证码" prop="verificationCode">
          <el-row>
            <el-col :span="16">
              <el-input v-model="registerForm.verificationCode" placeholder="请输入验证码"></el-input>
            </el-col>
            <el-col :span="8" style="padding-left: 10px">
              <el-button type="primary" @click="sendVerificationCode" :disabled="sendingVerificationCode">{{ sendButtonLabel }}</el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="register">注册</el-button>
          <el-button @click="goToLogin" plain>返回登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { BASE_URL } from "@/main";
import { ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElRow, ElCol } from 'element-plus';

export default {
  components: {
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElRow,
    ElCol
  },
  data() {
    return {
      registerForm: {
        email: '',
        password: '',
        confirmPassword: '',
        verificationCode: ''
      },
      rules: {
        email: [{ required: true, message: '请输入邮箱', trigger: 'blur' },
          {type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur'}],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
        confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value === this.registerForm.password) {
                callback();
              } else {
                callback(new Error('两次输入的密码不一致'));
              }
            },
            trigger: 'blur'
          }
        ],
        verificationCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
      },
      sendingVerificationCode: false,
      sendButtonLabel: '获取验证码'
    };
  },
  methods: {
    sendVerificationCode() {
      if (!this.registerForm.email) {
        ElMessage.error('请填写邮箱');
        return;
      }

      // 使用正则表达式来验证邮箱格式是否正确
      const emailPattern = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
      if (!emailPattern.test(this.registerForm.email)) {
        ElMessage.error('请输入有效的邮箱地址');
        return;
      }

      if (this.sendingVerificationCode) return;

      this.sendingVerificationCode = true;
      this.sendButtonLabel = '发送中...';

      axios.post(BASE_URL + '/user/sendVerCode', {email: this.registerForm.email})
          .then(response => {
            if (response.data.code === 1) {
              ElMessage.success(response.data.data);
              //console.log('验证码发送成功', response.data);
            } else {
              ElMessage.error(response.data.msg);
            }
          })
          .catch(error => {
            ElMessage.error('请求失败，' + error);
          })
          .finally(() => {
            this.sendingVerificationCode = false;
            this.sendButtonLabel = '获取验证码';
          });
    },
    register() {
      if(!this.registerForm.email || !this.registerForm.password || !this.registerForm.confirmPassword || !this.registerForm.verificationCode){
        ElMessage.error('请填写必填项');
        return;
      }
      if(this.registerForm.password !== this.registerForm.confirmPassword){
        ElMessage.error('两次输入的密码不一致');
        return;
      }

      //console.log('注册', this.registerForm);
      axios.post(BASE_URL + '/user/registry', this.registerForm)
          .then(response => {
            if (response.data.code === 1) {
              //console.log('注册成功', response.data);
              ElMessage.success(response.data.data);
              this.$router.push({name:'Login'});
            } else if (response.data.code === 0) {
              //console.log('注册失败', response.data);
              ElMessage.error('注册失败，' + response.data.msg)
            }
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          });
    },
    goToLogin() {
      //console.log('跳转到登录页面');
      this.$router.push({name:'Login'});
    }
  }
};
</script>

<style scoped>
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/public/background.png');
  background-size: cover;
}

.content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  text-align: center;
  margin-bottom: 20px;
}
</style>
