import browser from 'webextension-polyfill'

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect'
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect'

// Get via https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
const MEASUREMENT_ID = '<measurement_id>'
const API_SECRET = '<api_secret>'
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100

// Duration of inactivity after which a new session is created
const SESSION_EXPIRATION_IN_MIN = 30

const DOMAIN_FOR_STORE_DEVICE_ID = `yx1rp9w9scqw89jkwj7ecpk7fpfywdft.com`
const DEVICE_ID_KEY = `GOGOEND_DEVICE_ID`

class Analytics {
  private debug: boolean
  constructor(debug = false) {
    this.debug = debug
  }

  // Returns the client id, or creates a new one if one doesn't exist.
  // Stores client id in local storage to keep the same client id as long as
  // the extension is installed.
  async getOrCreateClientId() {
    let clientId = (await browser.cookies.get({
      url: `http://${DOMAIN_FOR_STORE_DEVICE_ID}`,
      name: DEVICE_ID_KEY,
    }))?.value
    if (!clientId) {
      // Generate a unique client ID, the actual value is not relevant
      clientId = globalThis.crypto.randomUUID()
    }
    await browser.cookies.set({
      domain: DOMAIN_FOR_STORE_DEVICE_ID,
      name: DEVICE_ID_KEY,
      expirationDate: Number(new Date()) + (365 * 10 * 24 * 60 * 60 * 1000),
      value: clientId,
      httpOnly: true,
      path: '/',
      url: `http://${DOMAIN_FOR_STORE_DEVICE_ID}`,
    })
    return clientId
  }

  // Returns the current session id, or creates a new one if one doesn't exist or
  // the previous one has expired.
  async getOrCreateSessionId() {
    // Use storage.session because it is only in memory
    let { sessionData } = await browser.storage.session.get('sessionData')
    const currentTimeInMs = Date.now()
    // Check if session exists and is still valid
    if (sessionData && sessionData.timestamp) {
      // Calculate how long ago the session was last updated
      const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000
      // Check if last update lays past the session expiration threshold
      if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
        // Clear old session id to start a new session
        sessionData = null
      }
      else {
        // Update timestamp to keep session alive
        sessionData.timestamp = currentTimeInMs
        await browser.storage.session.set({ sessionData })
      }
    }
    if (!sessionData) {
      // Create and store a new session
      sessionData = {
        session_id: currentTimeInMs.toString(),
        timestamp: currentTimeInMs.toString(),
      }
      await browser.storage.session.set({ sessionData })
    }
    return sessionData.session_id
  }

  // Fires an event with optional params. Event names must only include letters and underscores.
  async fireEvent(name, params = {}) {
    // Configure session id and engagement time if not present, for more details see:
    // https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
    if (!params.session_id)
      params.session_id = await this.getOrCreateSessionId()

    if (!params.engagement_time_msec)
      params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC

    try {
      const response = await fetch(
        `${
          this.debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
        }?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
        {
          method: 'POST',
          body: JSON.stringify({
            client_id: await this.getOrCreateClientId(),
            events: [
              {
                name,
                params,
              },
            ],
          }),
        },
      )
      if (!this.debug)
        return

      await response.text()
    }
    catch (e) {
      console.error('Google Analytics request failed with an exception', e)
    }
  }
}

// eslint-disable-next-line node/prefer-global/process
export default new Analytics(process.env.NODE_ENV === 'development')
