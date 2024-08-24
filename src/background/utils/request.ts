import axios from 'axios'

/**
 * 供 ContentScript 请求处理函数使用
 * 不用加拦截器处理，直接透传即可；但需要注意Blob等（不支持JSON化）对象的处理
 */
export const requestForHandleContentScript = axios.create({
  adapter: 'fetch',
})
