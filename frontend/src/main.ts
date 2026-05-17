import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import 'ant-design-vue/dist/reset.css'
import './styles/theme.css'
import './style.css'
import App from './App.vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {

      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
})

createApp(App)
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
