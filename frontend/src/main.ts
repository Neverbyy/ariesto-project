import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createApp(App)
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
