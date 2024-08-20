import type { AxiosPromise, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { sendMessage } from 'webext-bridge/content-script'
import { WorkerRequestMessage } from '~/type/worker-message'

export async function contentScriptRequestAdapter(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    sendMessage(WorkerRequestMessage.tag, new WorkerRequestMessage(config)).then((res) => {
      resolve(res)
    }, (reason) => {
      reject(reason)
    })
  })
}

const request = location.protocol === 'chrome-extension:'
  ? axios.create()
  : axios.create({
    adapter: contentScriptRequestAdapter,
  })

export default request
