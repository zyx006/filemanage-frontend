<template>
  <h3 style="text-align: left">新增存储策略配置</h3>
  <div style="text-align: left">
    <el-radio-group v-model="storageType" @change="handleChange">
  <!--    <el-radio :value="1">服务端本地存储</el-radio>-->
      <el-radio :value="2">云存储(腾讯云)</el-radio>
    </el-radio-group>
  <!--  <el-button type="primary" @click="handleSave">新增</el-button>-->
  </div>

  <el-table
      :data="configs"
      border
      :v-loading="loading"
      :show-overflow-tooltip=true
  >
    <el-table-column label="序号" type="index" />
    <el-table-column label="存储策略名" prop="name" sortable width="120"></el-table-column>
    <el-table-column label="策略类型" prop="type" sortable width="120">
      <template v-slot="{ row }">
        {{getConfigType(row.type)}}
      </template>
    </el-table-column>
    <el-table-column label="配置信息" prop="config" sortable></el-table-column>
    <el-table-column label="最后更新时间" prop="updateTime" sortable></el-table-column>
    <el-table-column label="创建者" prop="creator" sortable width="140"></el-table-column>
    <el-table-column label="更新者" prop="updater" sortable width="140"></el-table-column>
    <el-table-column label="操作">
      <template v-slot="{ row }">
        <el-button v-if="row.isActive === 0" type="primary" size="small" @click="updateConfigStatus(row)">启用</el-button>
        <el-button type="warning" size="small" @click="handleUpdate(row)">修改</el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-dialog
      title="腾讯云存储配置"
      v-model="dialogVisible"
      @close="handleCloseDialog"
  >
    <!-- 在对话框中输入配置项 -->
    <el-form :model="formConfig" label-width="120px" :rules="rules">
      <el-form-item label="存储策略名" prop="name">
        <el-input v-model="formConfig.name"></el-input>
      </el-form-item>
      <el-form-item label="Secret Id" prop="secretId">
        <el-input v-model="formConfig.secretId"></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="secretKey">
        <el-input v-model="formConfig.secretKey"></el-input>
      </el-form-item>
      <el-form-item label="Region Name" prop="regionName">
        <el-input v-model="formConfig.regionName"></el-input>
      </el-form-item>
      <el-form-item label="Bucket Name" prop="bucketName">
        <el-input v-model="formConfig.bucketName"></el-input>
      </el-form-item>
      <el-form-item label="Custom Url">
        <el-input v-model="formConfig.customUrl"></el-input>
      </el-form-item>
      <p> 自2024年1月1日起，腾讯云对象存储新创建的存储桶不支持使用存储桶默认域名（包括存储桶域名、静态网站域名、全球加速域名）在浏览器预览文件，而是直接下载。<a href="https://cloud.tencent.com/document/product/436/96243" target="_blank" referrerpolicy="unsafe-url">了解更多</a></p>
      <p> 存储桶默认域名存在安全风险，可能暴露敏感信息，建议您为存储桶 配置自定义域名。详情请参见 <a href="https://cloud.tencent.com/document/product/436/102509" target="_blank" referrerpolicy="unsafe-url">存储桶切换自定义域名</a></p>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCloudConfig">保存</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
      title="存储配置修改"
      v-model="updateDialogVisible"
      @close="handleCloseUpdateDialog"
  >
    <!-- 在对话框中输入配置项 -->
    <el-form :model="formConfig" label-width="120px" :rules="rules">
      <el-form-item label="存储策略名" prop="name">
        <el-input v-model="formConfig.name"></el-input>
      </el-form-item>
      <el-form-item label="Secret Id" prop="secretId">
        <el-input v-model="formConfig.secretId" :disabled="true" @copy.prevent></el-input>
      </el-form-item>
      <el-form-item label="Secret Key" prop="secretKey">
        <el-input v-model="formConfig.secretKey" :disabled="true" @copy.prevent></el-input>
      </el-form-item>
      <el-form-item label="Region Name" prop="regionName">
        <el-input v-model="formConfig.regionName" :disabled="true" @copy.prevent></el-input>
      </el-form-item>
      <el-form-item label="Bucket Name" prop="bucketName">
        <el-input v-model="formConfig.bucketName" :disabled="true" @copy.prevent></el-input>
      </el-form-item>
      <el-form-item label="Custom Url">
        <el-input v-model="formConfig.customUrl"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateStorageConfig">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import axios from "axios";
import {ElMessage, ElMessageBox} from "element-plus";
import {BASE_URL} from "@/main";

export default {
  data() {
    return {
      formConfig: {
        name: '',
        secretId: '',
        secretKey: '',
        regionName: '',
        bucketName: '',
        type: 1,
        customUrl: ''
      },
      configs: [],
      loading: false, // 加载状态
      storageType: 1, // 默认选中服务端本地存储
      dialogVisible: false, // 控制对话框显示隐藏
      updateDialogVisible: false,// 控制修改对话框显示隐藏
      updateId: '',//修改配置的id

      rules: {
        name: [
          { required: true, message: '请输入存储策略名', trigger: 'blur' }
        ],
        secretId: [
          { required: true, message: '请输入Secret Id', trigger: 'blur' }
        ],
        secretKey: [
          { required: true, message: '请输入Secret Key', trigger: 'blur' }
        ],
        regionName: [
          { required: true, message: '请输入Region Name', trigger: 'blur' }
        ],
        bucketName: [
          { required: true, message: '请输入Bucket Name', trigger: 'blur' }
        ]
      },
    }
  },
  methods: {
    getStorageConfigs() {
      this.loading = true;
      axios.get(BASE_URL+'/oss', {withCredentials: true})
          .then(response => {
            if (response.data.code === 1) {
              this.configs = response.data.data;
            } else {
              ElMessage.error('配置信息获取失败，'+response.data.msg);
            }
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          }).finally(() => {
            this.loading = false;
      });
    },
    getConfigType(type) {
      if(type === 0)
        return '阿里云';
      else if(type === 1)
        return '腾讯云';
      else if(type === 2)
        return '七牛云';
      else return '本地';
    },

    handleChange(val) {
      if (val === 2) {
        this.dialogVisible = true; // 显示对话框
        this.formConfig.type = 1;
      }
    },
    // handleSave() {
    //   if (this.storageType === 2) {
    //     this.saveCloudConfig();
    //   } else {
    //     // 如果选择服务端本地存储，直接保存
    //     this.saveStorageConfig();
    //   }
    // },
    handleCloseDialog() {
      // 关闭对话框时重置配置项
      this.dialogVisible = false;
      this.storageType = 1;
      this.formConfig = {};
    },
    handleCloseUpdateDialog() {
      // 关闭修改对话框时重置配置项
      this.updateDialogVisible = false;
      this.formConfig = {};
      this.updateId = '';
    },

    handleDelete(row) {
      ElMessageBox.confirm(
          '确认要删除该存储配置吗？',
          'Warning',
          {
            confirmButtonText: '是',
            cancelButtonText: '否',
            type: 'warning',
          }
      )
          .then(() => {
            this.deleteConfig(row);
          })
    },
    deleteConfig(row) {
      axios.delete(BASE_URL+'/oss/'+row.id, {withCredentials:true})
          .then(response => {
            if(response.data.code === 1){
              ElMessage.success(response.data.data);
              this.getStorageConfigs();
            } else {
              ElMessage.error('存储配置 '+row.name+' 删除失败，'+response.data.msg);
            }
          })
          .catch(error => {
            ElMessage.error('请求失败：'+error);
          });
    },

    handleUpdate(row) {
      this.updateId = row.id;
      this.formConfig.name = row.name;
      if(row.config !== null) {
        let config = JSON.parse(row.config);
        this.formConfig.secretId = config.secretId;
        this.formConfig.secretKey = config.secretKey;
        this.formConfig.regionName = config.regionName;
        this.formConfig.bucketName = config.bucketName;
        this.formConfig.customUrl = config.customUrl;
      }
      this.updateDialogVisible = true;
    },
    updateStorageConfig() {
      // 发送云存储配置到后端保存
      axios.put(BASE_URL+'/oss/'+this.updateId, this.formConfig, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1) {
              ElMessage.success(response.data.data);
              this.getStorageConfigs();
            } else {
              ElMessage.error('修改存储配置失败，'+response.data.msg);
            }
            this.handleCloseUpdateDialog();
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          });
    },

    updateConfigStatus(row) {
      axios.put(BASE_URL+'/oss/'+row.id+'/'+row.isActive, {}, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1){
              this.getStorageConfigs();
            } else {
              ElMessage.error('修改存储配置失败，'+response.data.msg);
            }
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          });
    },

    saveCloudConfig() {
      // 发送云存储配置到后端保存
      axios.post(BASE_URL+'/oss', this.formConfig, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1) {
              ElMessage.success(response.data.data);
              this.getStorageConfigs();
            } else {
              ElMessage.error('保存云存储配置失败，'+response.data.msg);
            }
            this.handleCloseDialog();
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          });
    },
  },
  mounted() {
    this.getStorageConfigs();
  }
}

</script>

<style scoped>

</style>