import { createApp } from 'vue'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import 'ant-design-vue/dist/reset.css'
import './style.css'
import App from './App.vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаем свежими 60 секунд — повторное обращение к тому же queryKey
      // (например, возврат на ту же дату) не идёт в сеть, пока кэш не «протух».
      // После мутаций (создание/удаление заказа) вручную инвалидируем нужный ключ.
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
