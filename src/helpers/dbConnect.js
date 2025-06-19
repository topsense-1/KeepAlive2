// helpers/dbCommand.js
import { Notify } from 'quasar'

export function sendCommandHelper() {
  const sendCommand = async (table, params, successMessage, errorMessage) => {
    if (params !== null) {
      console.log(params)
      const url = `http://192.168.1.179:8087/v1/rdbms/db/${encodeURIComponent(table)}&${encodeURIComponent(params)}`
      console.log(url)
      try {
        const response = await fetch(url)

        if (!response.ok) {
          if (errorMessage !== null) {
            Notify.create({ message: errorMessage, color: 'negative' })
          }
          return false
        }

        if (successMessage !== null) {
          Notify.create({ message: successMessage, color: 'positive' })
        }

        const data = await response.json()
        return data // מחזיר את המידע לשימוש בהמשך
      } catch (error) {
        if (errorMessage !== null) {
          Notify.create({ message: errorMessage, color: 'negative' })
        }
        console.error('Fetch error:', error)
        return false
      }
    }
    return false
  }

  return { sendCommand }
}
