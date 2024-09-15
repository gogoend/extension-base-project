import type { AxiosPromise, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { sendToBackground } from '~/utils/messaging'
import { WorkerRequestMessage } from '~/type/worker-message'

function contentScriptRequestAdapter(config: AxiosRequestConfig): AxiosPromise {
  return new Promise((resolve, reject) => {
    sendToBackground(new WorkerRequestMessage(config)).then((res) => {
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
