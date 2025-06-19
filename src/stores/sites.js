// src/stores/sites.js
import { defineStore } from 'pinia'
import { sitesApi } from '../services/db2rest'

export const useSitesStore = defineStore('sites', {
  state: () => ({
    sites: [],
    loading: false,
    error: null,
  }),

  getters: {
    getSiteById: (state) => (id) => {
      return state.sites.find((site) => site.id === id)
    },

    sitesCount: (state) => state.sites.length,

    sitesSortedByName: (state) => {
      return [...state.sites].sort((a, b) => a.name.localeCompare(b.name))
    },

    getSitesByCompanyId: (state) => (companyId) => {
      return state.sites.filter((site) => site.company_id === companyId)
    },
  },

  actions: {
    async fetchAllSites() {
      this.loading = true
      this.error = null

      try {
        const response = await sitesApi.getAll()
        this.sites = response || []

        return this.sites
      } catch (error) {
        this.error = error.message || 'Failed to fetch sites'
        console.error('Error fetching sites:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createSite(siteData) {
      this.loading = true
      this.error = null

      try {
        const newSite = await sitesApi.create({
          ...siteData,
          created_at: new Date().toISOString(),
        })

        // הוסף את האתר החדש לרשימה
        this.sites.push(newSite)

        return newSite
      } catch (error) {
        this.error = error.message || 'Failed to create site'
        console.error('Error creating site:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSite(siteId, updates) {
      this.loading = true
      this.error = null

      try {
        const updatedSite = await sitesApi.update(siteId, updates)

        // עדכן את האתר במערך
        const index = this.sites.findIndex((site) => site.id === siteId)
        if (index !== -1) {
          this.sites[index] = { ...this.sites[index], ...updatedSite }
        }

        return updatedSite
      } catch (error) {
        this.error = error.message || 'Failed to update site'
        console.error('Error updating site:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSite(siteId) {
      this.loading = true
      this.error = null

      try {
        await sitesApi.delete(siteId)

        // הסר את האתר מהמערך
        this.sites = this.sites.filter((site) => site.id !== siteId)

        return true
      } catch (error) {
        this.error = error.message || 'Failed to delete site'
        console.error('Error deleting site:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSiteDetails(siteId) {
      this.loading = true
      this.error = null

      try {
        const site = await sitesApi.getById(siteId)

        // עדכן את האתר במערך אם קיים
        const index = this.sites.findIndex((s) => s.id === siteId)
        if (index !== -1) {
          this.sites[index] = site
        } else {
          this.sites.push(site)
        }

        return site
      } catch (error) {
        this.error = error.message || 'Failed to fetch site details'
        console.error('Error fetching site details:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSitesByCompany(companyId) {
      this.loading = true
      this.error = null

      try {
        const sites = await sitesApi.getByCompanyId(companyId)

        // עדכן את האתרים של החברה במערך
        sites.forEach((site) => {
          const index = this.sites.findIndex((s) => s.id === site.id)
          if (index !== -1) {
            this.sites[index] = site
          } else {
            this.sites.push(site)
          }
        })

        return sites
      } catch (error) {
        this.error = error.message || 'Failed to fetch sites by company'
        console.error('Error fetching sites by company:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // פונקציה לניקוי השגיאות
    clearError() {
      this.error = null
    },

    // פונקציה לאיפוס הסטור
    reset() {
      this.sites = []
      this.loading = false
      this.error = null
    },
  },
})
