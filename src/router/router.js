import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import RegistryPage from '@/components/RegistryPage.vue';
import HomePage from '@/components/HomePage.vue'
import {ElMessage} from "element-plus";

const routes = [
    {
        path: '/',
        name: 'Login',
        component: LoginPage
    },
    {
        path: '/registry',
        name: 'Registry',
        component: RegistryPage
    },
    {
        path: '/home',
        name: 'Home',
        component: HomePage,
        meta: {requiresAuth: true}
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    //console.log(document.cookie);
    const isAuthenticated = document.cookie.includes('user'); // 检查 cookie 中是否包含 user
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated) {
            ElMessage.error('尚未登录，请勿非法访问');
            next({ path: '/' }); // 如果没有登录，则跳转到登录页面
        } else {
            next(); // 已登录，继续访问目标页面
        }
    } else {
        next(); // 不需要验证登录，直接访问
    }
});

export default router;
