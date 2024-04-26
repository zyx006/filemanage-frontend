<template>
  <!-- 个人中心内容 -->
  <div>
    <h3 style="text-align: left">个人信息</h3>
    <p style="text-align: left">用户名：{{ currentUser.username }}</p>
    <p style="text-align: left">邮箱：{{ currentUser.email }}</p>
    <p style="text-align: left">当前使用存储空间：{{getSize(this.currentUser.storageUsed) + " / " + getSize(this.currentUser.storageTotal)}} </p>
  </div>
  <!-- 修改密码表单 -->
  <div>
    <h3 style="text-align: left">修改密码</h3>
    <el-form ref="passwordForm" :model="passwordForm" :rules="rules" label-width="80px" style="max-width: 400px;">
      <el-form-item label="旧密码" prop="oldPassword" >
        <el-input v-model="passwordForm.oldPassword" type="password"></el-input>
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="passwordForm.newPassword" type="password"></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="passwordForm.confirmPassword" type="password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updatePassword">提交</el-button>
      </el-form-item>
    </el-form>
  </div>

  <!-- 修改用户名表单 -->
  <div>
    <h3 style="text-align: left">修改用户名</h3>
    <el-form ref="usernameForm" :rules="rules" :model="usernameForm" label-width="80px" style="max-width: 400px;">
      <el-form-item label="新用户名" prop="username">
        <el-input v-model="usernameForm.username"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="updateUsername">提交</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {ElMessage} from "element-plus";
import axios from "axios";
import {BASE_URL} from "@/main";

export default {
  props: {
    currentUser: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      usernameForm: {
        username: ''
      },

      rules: {
        username: [{ required: true, message: '请输入新用户名', trigger: 'blur' }],
        oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
        newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value === this.passwordForm.oldPassword) {
                callback(new Error('新密码不能与旧密码相同'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value === this.passwordForm.newPassword) {
                callback();
              } else {
                callback(new Error('两次输入的密码不一致'));
              }
            },
            trigger: 'blur'
          }
        ]
      },
    }
  },
  methods: {
    getSize(size) {
      if(size/1024 < 1.0)
        return size.toFixed(1)+'B';
      if(size/(1024*1024) < 1.0)
        return (size/(1024)).toFixed(1)+'KB';
      if(size/(1024*1024*1024) < 1.0)
        return (size/(1024*1024)).toFixed(1)+'MB';
      return (size/(1024*1024*1024)).toFixed(1)+'GB';
    },

    updatePassword() {
      if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword || !this.passwordForm.newPassword) {
        ElMessage.error('请填写必填项');
        return;
      }
      if(this.passwordForm.newPassword !== this.passwordForm.confirmPassword){
        ElMessage.error('两次输入的密码不一致');
        return;
      }
      if(this.passwordForm.newPassword === this.passwordForm.oldPassword){
        ElMessage.error('新密码不能与旧密码相同');
        return;
      }
      // 发送修改密码请求
      axios.put(BASE_URL + '/user/updatePassword', {
        oldPassword: this.passwordForm.oldPassword,
        newPassword: this.passwordForm.newPassword
      }, { withCredentials: true })
          .then(response => {
            if(response.data.code === 1) {
              ElMessage.success(response.data.data);
              // 清空表单
              this.passwordForm = {
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
              };
              this.$router.push({name: 'Login'});
            } else {
              ElMessage.error('密码修改失败，'+response.data.msg);
            }
          })
          .catch(error => {
            ElMessage.error('请求失败：'+ error);
          });
    },
    updateUsername() {
      this.$refs.usernameForm.validate(valid => {
        if (valid) {
          // 发送修改用户名请求
          axios.put(BASE_URL + '/user/updateUsername', {
            username: this.usernameForm.username
          }, { withCredentials: true })
              .then(response => {
                if(response.data.code === 1) {
                  ElMessage.success(response.data.data);
                  // 更新当前用户信息
                  this.$emit('update:currentUser', this.usernameForm.username);
                  // this.currentUser.username = this.usernameForm.username;
                  // 清空表单
                  this.usernameForm = {
                    username: ''
                  };
                } else {
                  ElMessage.error('用户名修改失败，'+response.data.msg);
                }
              })
              .catch(error => {
                ElMessage.error('请求失败，'+error);
              });
        } else ElMessage.error('请输入新用户名');
      });
    }
  }
}

</script>

<style scoped>

</style>