<template>
  <!-- 文件上传表单 -->
  <el-upload
      class="upload-demo"
      :action="uploadUrl"
      :with-credentials="true"
      :on-success="handleUploadSuccess"
      :before-upload="beforeUpload"
      drag
  >
    <el-button size="small" type="primary">点击上传</el-button>
    <template v-slot:tip>
      <div class="el-upload__tip">或将文件拖到此处上传</div>
    </template>
  </el-upload>

  <el-divider></el-divider>

  <el-row>
    <el-col :span="18">
      <el-form ref="searchForm" :model="searchForm" >
        <el-row>
            <el-input v-model="searchForm.name" placeholder="请输入要查询的文件名" style="width: 240px; padding-right: 10px"></el-input>
            <el-button type="primary" @click="getFiles" :icon="Search"></el-button>
        </el-row>
      </el-form>
    </el-col>
    <el-col :span="6">
      <!-- 批量操作按钮 -->
      <el-button-group>
        <el-button type="primary" @click="handleBatchDownload">批量下载</el-button>
        <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
      </el-button-group>
    </el-col>
  </el-row>

  <!-- 图片预览模态框 -->
  <el-dialog :title="previewImage.name" v-model="previewVisible" width="50%" @close="handleCloseDialog" center>
    <img :src="previewImage.image" style="width: 100%" alt="预览图片" />
  </el-dialog>

  <!-- 文件列表 -->
  <el-table
      :data="files"
      border
      :v-loading="loading"
      :default-sort="{ prop: 'name', order: 'ascending' }"
      @selection-change="handleSelectionChange"
      :show-overflow-tooltip=true
  >
    <el-table-column type="selection" width="55" />
    <el-table-column label="序号" type="index" />
    <el-table-column label="文件名" prop="name" sortable>
      <template v-slot="{ row }">
        <span v-if="row.type === 0" @click="getPreviewImage(row)" style="color: blue">{{ row.name }}</span>
        <span v-else>{{ row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="文件大小" prop="size" sortable>
      <template v-slot="{ row }">
        {{getFileSize(row.size)}}
      </template>
    </el-table-column>
    <el-table-column prop="type" label="文件类型" sortable>
      <template v-slot="{ row }">
        {{ getFileType(row.type) }}
      </template>
    </el-table-column>
    <el-table-column label="最后更新时间" prop="updateTime" sortable></el-table-column>
    <el-table-column label="操作">
      <template v-slot="{ row }">
        <el-button type="primary" size="small" @click="downloadFile(row)">下载</el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :total="total"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange">
  </el-pagination>
</template>

<script>
import {BASE_URL} from "@/main";
import axios from "axios";
import {ElMessage, ElMessageBox} from "element-plus";
import { Search } from "@element-plus/icons-vue"

export default {
  computed: {
    Search() {
      return Search
    }
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 20,
      total: 0,

      selectedRows: [], // 存储选中的行数据
      searchForm: {name: ''},
      files: [], // 所有文件数据
      loading: false, // 加载状态

      previewVisible: false,
      previewImage: {
        name: '',
        image: ''
      },

      uploadUrl: BASE_URL+'/file/upload',
    }
  },
  methods: {
    handleCloseDialog() {
      this.previewVisible =false;
      this.previewImage = {
        name: '',
        image: ''
      };
    },

    //图片预览
    getPreviewImage(file) {
      axios.get(BASE_URL + '/file/preview/' + file.id, {withCredentials: true})
          .then(response => {
            if (response.data.code === 1) {
              this.previewVisible = true;
              this.previewImage.name = file.name;
              this.previewImage.image = response.data.data;
            } else {
              ElMessage.error('预览失败，'+response.data.msg);
            }
          })
          .catch(error => {
            ElMessage.error('请求失败，'+error);
          });
    },

    // 多选框选中状态变化时
    handleSelectionChange(selection) {
      this.selectedRows = selection; // 更新选中的行数据
    },

    handleBatchDownload() {
      this.selectedRows.forEach(item => {
        this.downloadFile(item);
      });
    },
    handleBatchDelete() {
      let ids = [];
      this.selectedRows.forEach(item => {
        ids.push(item.id);
      });
      axios.put(BASE_URL+'/file'+'/1', ids, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1){
              ElMessage.success(response.data.data);
            } else {
              ElMessage.error('文件批量删除失败，'+response.data.msg);
            }
            this.getFiles();
          })
          .catch(error => {
            //console.log(error);
            ElMessage.error('请求失败：'+error);
          });
    },

    handleUploadSuccess() {
      this.getFiles();
    },
    beforeUpload() {
      // 在这里可以添加一些文件上传前的逻辑，比如文件大小限制等
      return true; // 返回 true 表示允许上传
    },

    // 处理每页显示条数变化
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1; // 重置当前页码为1
      this.getFiles();
    },
    // 处理当前页码变化
    handleCurrentChange(page) {
      this.currentPage = page;
      this.getFiles();
    },
    handleDelete(file) {
      ElMessageBox.confirm(
          '确认要删除该文件吗(移入回收站)？',
          'Warning',
          {
            confirmButtonText: '是',
            cancelButtonText: '否',
            type: 'warning',
          }
      )
          .then(() => {
            this.logicDeleteFile(file);
          })
    },

    // 获取文件列表数据
    getFiles() {
      this.loading = true; // 显示加载状态
      let url = BASE_URL + '/file/page/'+this.currentPage+'/'+this.pageSize+'/0';
      axios.get(url, {params:{name: this.searchForm.name}, withCredentials: true})
          .then(response => {
            if (response.data.code === 1) {
              // this.files = response.data.data; // 设置文件列表数据
              this.files = response.data.data.records; // 设置文件列表数据
              this.total = response.data.data.total;
            }
          })
          .catch(error => {
            //console.error('文件列表获取失败', error);
            ElMessage.error('文件列表获取失败，'+error);
          })
          .finally(() => {
            this.loading = false; // 隐藏加载状态
          });
    },
    getFileSize(size) {
      if(size/1024 < 1.0)
        return size.toFixed(1)+'B';
      if(size/(1024*1024) < 1.0)
        return (size/(1024)).toFixed(1)+'KB';
      if(size/(1024*1024*1024) < 1.0)
        return (size/(1024*1024)).toFixed(1)+'MB';
      return (size/(1024*1024*1024)).toFixed(1)+'GB';
    },
    getFileType(type) {
      // 根据文件类型代码返回对应的文字描述
      switch (type) {
        case 0:
          return '图片';
        case 1:
          return '视频';
        case 2:
          return '音频';
        case 3:
          return '文档';
        default:
          return '其他';
      }
    },
    downloadFile(file) {
      // 下载文件
      axios.get(BASE_URL+'/file/download/'+file.id, {
        responseType: 'blob',
        withCredentials: true
      }).then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
        // 下载完成后销毁 URL 对象
        window.URL.revokeObjectURL(url);
      }).catch(error => {
        console.log(error)
        if(error.response.status === 404){
          ElMessage.error('文件'+file.name+'下载失败，文件不存在或被删除');
          this.getFiles();
          return;
        }
        ElMessage.error("请求失败："+error);
      });
    },
    logicDeleteFile(file) {
      // 删除文件的操作
      //console.log('删除文件:', file);
      axios.put(BASE_URL+'/file/'+file.id+'/1', {}, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1){
              ElMessage.success(response.data.data);
            } else {
              ElMessage.error('文件'+file.name+'删除失败，'+response.data.msg);
            }
            this.getFiles();
          })
          .catch(error => {
            //console.log(error);
            ElMessage.error('请求失败：'+error);
      });
    }
  },
  mounted() {
    this.getFiles();
  }
}

</script>

<style scoped>

</style>