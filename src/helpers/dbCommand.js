// helpers/dbCommand.js
import { Notify } from 'quasar'

export function sendCommandHelper() {
  const sendCommand = async (table, params, successMessage, errorMessage) => {
    if (params !== null) {
      const url = `http://192.168.1.179:8087/v1/rdbms/db/${encodeURIComponent(table)}&${encodeURIComponent(params)}`
      try {
        const response = await fetch(url)

        if (!response.ok) {
          if (errorMessage) {
            Notify.create({ message: errorMessage, color: 'negative' })
          }
          return null
        }

        if (successMessage) {
          Notify.create({ message: successMessage, color: 'positive' })
        }

        return await response.json()
      } catch (error) {
        if (errorMessage) {
          Notify.create({ message: errorMessage, color: 'negative' })
        }
        console.error('Fetch error:', error)
        return null
      }
    }
    return null
  }

  const checkIfUserIsAuthenticated = async (email, t) => {
    const result = await sendCommand(
      'users',
      `filter=email=="${email}"&fields=isAuthenticated`,
      null,
      t('errorAlarmGetData'),
    )

    if (Array.isArray(result) && result.length > 0) {
      return result[0].isAuthenticated === true
    }

    return false
  }

  const loginUserAuthentication = async (email, password, t) => {
    const result = await sendCommand(
      'users',
      `filter=email=="${email}"&fields=email,password`,
      null,
      t('errorAlarmGetData'),
    )

    if (Array.isArray(result) && result.length > 0) {
      const user = result[0]
      // השוואה ישירה של הסיסמה (אם הסיסמאות לא מוצפנות)
      return user.password === password
    }

    return false
  }

  const bcrypt = require('bcrypt') // או כל ספריית הצפנה אחרת

  const loginUserAuthenticationCrypt = async (email, password, t) => {
    const result = await sendCommand(
      'users',
      `filter=email=="${email}"&fields=email,password`,
      null,
      t('errorAlarmGetData'),
    )

    if (Array.isArray(result) && result.length > 0) {
      const user = result[0]
      // השוואה עם סיסמה מוצפנת
      return await bcrypt.compare(password, user.password)
    }

    return false
  }

  const getCurrentUser = async (email, t) => {
    const result = await sendCommand(
      'users',
      `filter=email=="${email}"`,
      null,
      t('errorAlarmGetData'),
    )

    if (Array.isArray(result) && result.length > 0) {
      return result[0]
    }

    return null
  }

  return {
    sendCommand,
    checkIfUserIsAuthenticated,
    loginUserAuthentication,
    loginUserAuthenticationCrypt,
    getCurrentUser,
  }
}
