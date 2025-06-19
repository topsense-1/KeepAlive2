// src/stores/companies.js
import { defineStore } from 'pinia'
import { companiesApi } from '../services/db2rest'

export const useCompaniesStore = defineStore('companies', {
  state: () => ({
    companies: [],
    loading: false,
    error: null,
  }),

  getters: {
    getCompanyById: (state) => (id) => {
      return state.companies.find((company) => company.id === id)
    },

    companiesCount: (state) => state.companies.length,

    companiesSortedByName: (state) => {
      return [...state.companies].sort((a, b) => a.name.localeCompare(b.name))
    },
  },

  actions: {
    async fetchAllCompanies() {
      this.loading = true
      this.error = null

      try {
        // קריאה לחברות עם ספירת אתרים ובתים
        const response = await companiesApi.getAll()
        this.companies = response || []

        return this.companies
      } catch (error) {
        this.error = error.message || 'Failed to fetch companies'
        console.error('Error fetching companies:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCompany(companyData) {
      this.loading = true
      this.error = null

      try {
        const newCompany = await companiesApi.create({
          ...companyData,
          created_at: new Date().toISOString(),
        })

        // הוסף את החברה החדשה לרשימה
        this.companies.push(newCompany)

        return newCompany
      } catch (error) {
        this.error = error.message || 'Failed to create company'
        console.error('Error creating company:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateCompany(companyId, updates) {
      this.loading = true
      this.error = null

      try {
        const updatedCompany = await companiesApi.update(companyId, updates)

        // עדכן את החברה במערך
        const index = this.companies.findIndex((company) => company.id === companyId)
        if (index !== -1) {
          this.companies[index] = { ...this.companies[index], ...updatedCompany }
        }

        return updatedCompany
      } catch (error) {
        this.error = error.message || 'Failed to update company'
        console.error('Error updating company:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteCompany(companyId) {
      this.loading = true
      this.error = null

      try {
        await companiesApi.delete(companyId)

        // הסר את החברה מהמערך
        this.companies = this.companies.filter((company) => company.id !== companyId)

        return true
      } catch (error) {
        this.error = error.message || 'Failed to delete company'
        console.error('Error deleting company:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCompanyDetails(companyId) {
      this.loading = true
      this.error = null

      try {
        const company = await companiesApi.getById(companyId)

        // עדכן את החברה במערך אם קיימת
        const index = this.companies.findIndex((c) => c.id === companyId)
        if (index !== -1) {
          this.companies[index] = company
        } else {
          this.companies.push(company)
        }

        return company
      } catch (error) {
        this.error = error.message || 'Failed to fetch company details'
        console.error('Error fetching company details:', error)
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
      this.companies = []
      this.loading = false
      this.error = null
    },
  },
})
