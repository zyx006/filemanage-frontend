<template>
  <div>
    <div class="background"></div>
    <div class="content">
      <h1 class="welcome-title">欢迎使用文件管理系统</h1>
      <el-form :model="loginForm" :rules="rules">
        <el-form-item label="邮箱/用户名" prop="email">
          <el-input v-model="loginForm.email" placeholder="请输入邮箱/用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item label="验证码" prop="captcha">
          <el-row>
            <el-col :span="16">
              <el-input v-model="loginForm.captcha" placeholder="请输入验证码"></el-input>
            </el-col>
            <el-col :span="8">
              <img :src="captchaImageUrl" @click="refreshCaptcha" alt="验证码" style="cursor: pointer; width: 130px; height: 48px;">
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-button" @click="login">登录</el-button>
          <el-button @click="goToRegister" plain>注册</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ElForm, ElFormItem, ElInput, ElButton, ElRow, ElCol, ElMessage } from 'element-plus';
import axios from "axios";
import { BASE_URL } from "@/main";

export default {
  components: {
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElRow,
    ElCol
  },
  mounted() {
    this.refreshCaptcha();
  },
  data() {
    return {
      loginForm: {
        email: '',
        password: '',
        captcha: '',
        verKey: ''
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ]
      },
      captchaImageUrl: ''
    };
  },
  methods: {
    login() {
      if(!this.loginForm.email || !this.loginForm.password || !this.loginForm.captcha){
        ElMessage.error('请填写必填项');
        return;
      }
      //console.log('登录', this.loginForm);
      axios.post(BASE_URL + '/user/login', this.loginForm, {withCredentials:true})
          .then(response => {
            // 请求成功
            if (response.data.code === 1) {
              //console.log('登录成功', response.data);
              ElMessage.success(response.data.data);
              this.$router.push({name:'Home'});
            } else if (response.data.code === 0) {
              //console.log('登录失败', response.data);
              ElMessage.error('登录失败，' + response.data.msg)
            }
          })
          .catch(error => {
            // 请求失败
            ElMessage.error('请求失败：'+ error);
            // 根据错误信息进行处理，比如提示用户或者重试等
          });
    },
    refreshCaptcha() {
      // 发送请求获取新的图片验证码
      axios.get(BASE_URL + '/user/captcha')
          .then(response => {
            let data = JSON.parse(response.data.data);
            this.loginForm.verKey = data.key;
            this.captchaImageUrl = data.image;
          })
          .catch(error => {
            ElMessage.error('验证码获取异常：'+error);
          });
      //console.log('刷新验证码');
    },
    goToRegister() {
      //console.log('跳转到注册页面');
      this.$router.push({name:'Registry'});
    }
  }
}
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

.login-button {
  margin-right: 10px;
}
</style>
