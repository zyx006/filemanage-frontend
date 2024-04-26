<template>
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
        <el-button type="primary" @click="handleBatchRestore">批量恢复</el-button>
        <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
      </el-button-group>
    </el-col>
  </el-row>
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
    <el-table-column label="文件名" prop="name" sortable></el-table-column>
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
        <el-button type="primary" size="small" @click="restoreFile(row)">恢复</el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">彻底删除</el-button>
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
import {ElMessage, ElMessageBox} from "element-plus";
import axios from "axios";
import {BASE_URL} from "@/main";
import {Search} from "@element-plus/icons-vue";

export default {
  computed: {
    Search() {
      return Search
    }
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      total: 0,

      selectedRows: [], // 存储选中的行数据
      searchForm: {name: ''},
      files: [], // 所有文件数据
      loading: false, // 加载状态
    }
  },
  methods: {
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

    // 多选框选中状态变化时
    handleSelectionChange(selection) {
      this.selectedRows = selection; // 更新选中的行数据
    },

    handleBatchRestore() {
      let ids = [];
      this.selectedRows.forEach(item => {
        ids.push(item.id);
      });
      axios.put(BASE_URL+'/file'+'/0', ids, {withCredentials: true})
          .then(response => {
            if(response.data.code === 1){
              ElMessage.success(response.data.data);
            } else {
              ElMessage.error('文件批量恢复失败，'+response.data.msg);
            }
            this.getFiles();
          })
          .catch(error => {
            //console.log(error);
            ElMessage.error('请求失败：'+error);
          });
    },

    handleBatchDelete() {
      ElMessageBox.confirm(
          '确认要彻底删除这些文件吗？',
          'Warning',
          {
            confirmButtonText: '是',
            cancelButtonText: '否',
            type: 'warning',
          }
      )
          .then(() => {
            this.batchPermanentDeleteFile();
          })
    },
    handleDelete(file) {
      ElMessageBox.confirm(
          '确认要彻底删除该文件吗？',
          'Warning',
          {
            confirmButtonText: '是',
            cancelButtonText: '否',
            type: 'warning',
          }
      )
          .then(() => {
            this.permanentDeleteFile(file);
          })
    },

    // 获取文件列表数据
    getFiles() {
      this.loading = true; // 显示加载状态
      let url = BASE_URL + '/file/page/'+this.currentPage+'/'+this.pageSize+'/1';
      axios.get(url, {params: {name: ''}, withCredentials: true})
          .then(response => {
            if (response.data.code === 1) {
              // this.files = response.data.data; // 设置文件列表数据
              this.files = response.data.data.records; // 设置文件列表数据
              this.total = response.data.data.total;
            }
          })
          .catch(error => {
            //console.error('文件列表获取失败', error);
            ElMessage.error('文件列表获取失败'+error);
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
      if(size/(1024*1024*1024*1024) < 1.0)
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
    restoreFile(file) {
      // 恢复文件
      //console.log('恢复文件:', file);
      axios.put(BASE_URL+'/file/'+file.id+'/0', {}, {withCredentials: true})
          .then(response => {
            if(response.data.code === 0){
              ElMessage.error('文件'+file.name+'恢复失败，'+response.data.msg);
            } else {
              ElMessage.success(response.data.data);
            }
            this.getFiles();
          }).catch(error => {
        ElMessage.error("请求失败："+error);
      });
    },
    permanentDeleteFile(file) {
      // 删除文件的操作
      //console.log('删除文件:', file);
      axios.delete(BASE_URL+'/file/'+file.id, {withCredentials: true})
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
    },
    batchPermanentDeleteFile() {
      let ids = [];
      this.selectedRows.forEach(item => {
        ids.push(item.id);
      });
      axios.delete(BASE_URL+'/file', {data: ids, withCredentials: true})
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
    }
  },
  mounted() {
    this.getFiles();
  }
}

</script>

<style scoped>

</style>