<template>
  <div class="home-container">
    <!-- 左上角个人信息简要和退出按钮 -->
    <div class="user-info">
      <span style="padding-right: 5px">{{ currentUser.username }}</span>
      <el-button @click="logout" plain>退出</el-button>
    </div>

    <!-- 左侧菜单 -->
    <el-aside width="200px" style="margin-top: 50px;">
      <el-menu :default-active="currentMenu" class="el-menu-vertical-demo" @select="handleMenuSelect">
        <el-menu-item index="myFiles">我的文件</el-menu-item>
        <el-menu-item index="profile">个人中心</el-menu-item>
        <el-menu-item index="recycleBin">回收站</el-menu-item>
        <el-menu-item index="management" v-if="currentUser.isAdmin === 1">管理</el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-main>
      <!-- 根据菜单切换展示不同内容 -->
      <div v-if="currentMenu === 'myFiles'">
        <FilePage/>
      </div>

      <div v-else-if="currentMenu === 'profile'">
        <ProfilePage :currentUser="currentUser" @update:currentUser="updateUsername"/>
      </div>

      <div v-else-if="currentMenu === 'recycleBin'">
        <!-- 回收站内容 -->
        <RecycleBinPage/>
      </div>

      <div v-else-if="currentMenu === 'management'">
        <ManagementPage/>
      </div>
    </el-main>
  </div>
</template>

<script>
import axios from 'axios';
import {BASE_URL} from "@/main";
import {ElMessage} from "element-plus";
import ProfilePage from '@/components/ProfilePage.vue'
import ManagementPage from '@/components/ManagementPage.vue'
import FilePage from '@/components/FilePage.vue'
import RecycleBinPage from '@/components/RecycleBinPage.vue'

export default {
  components: {
    ProfilePage,
    ManagementPage,
    FilePage,
    RecycleBinPage
  },
  data() {
    return {
      currentUser: {
        email: '',
        username: '',
        isAdmin: 0,
        storageUsed: 0,
        storageTotal: 0
      }, // 从服务端获取的用户信息
      currentMenu: 'myFiles', // 当前选中的菜单
    };
  },
  methods: {
    handleMenuSelect(index) {
      this.currentMenu = index;
    },

    getUser() {
      axios.get(BASE_URL+'/user', {withCredentials: true})
          .then(response => {
            if(response.data.code === 1) {
              this.currentUser = response.data.data;
            } else
              ElMessage.error('用户信息获取失败，'+response.data.msg);
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          });
    },
    logout() {
      // 实现登出逻辑，例如清除本地存储的用户信息等
      axios.post(BASE_URL+'/user/logout', {}, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1)
              this.$router.push({name: 'Login'})
            else ElMessage.error('退出失败，'+response.data.msg)
          })
          .catch(error => {
            ElMessage.error('请求失败：'+error);
          });
    },

    //接受子组件传递的数据更新
    updateUsername(newUsername){
      this.currentUser.username = newUsername;
    },
    updateCloudStorageConfig(newConfig){
      this.cloudStorageConfig = newConfig;
    }
  },
  mounted() {
    this.getUser();
  }
}
</script>

<style scoped>
.home-container {
  display: flex;
}

.user-info {
  position: absolute;
  top: 0;
  left: 0;
  margin: 10px;
}

</style>
