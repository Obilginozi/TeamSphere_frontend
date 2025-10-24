import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const { user } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies')
      setCompanies(response.data.data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchCompanies()
      return
    }

    try {
      const response = await api.get(`/companies/search?q=${encodeURIComponent(searchTerm)}`)
      setCompanies(response.data.data)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleCreateCompany = async (companyData) => {
    try {
      await api.post('/companies', companyData)
      fetchCompanies()
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create company:', error)
    }
  }

  const handleUpdateCompany = async (id, companyData) => {
    try {
      await api.put(`/companies/${id}`, companyData)
      fetchCompanies()
      setEditingCompany(null)
    } catch (error) {
      console.error('Failed to update company:', error)
    }
  }

  const handleDeleteCompany = async (id) => {
    if (window.confirm(t('company.confirmDelete'))) {
      try {
        await api.delete(`/companies/${id}`)
        fetchCompanies()
      } catch (error) {
        console.error('Failed to delete company:', error)
      }
    }
  }

  const handleUpdateSubscription = async (id, subscriptionPlan) => {
    try {
      await api.put(`/companies/${id}/subscription`, { subscriptionPlan })
      fetchCompanies()
    } catch (error) {
      console.error('Failed to update subscription:', error)
    }
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">{t('common.error')}</h2>
          <p className="text-red-600">{t('common.unauthorized')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t('company.title')}</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('company.createCompany')}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('company.searchCompanies')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {t('common.search')}
            </button>
          </div>
        </div>

        {/* Companies List */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('company.companyName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('company.contactEmail')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('company.subscriptionPlan')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('company.employees')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      {company.domain && (
                        <div className="text-sm text-gray-500">{company.domain}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.contactEmail}</div>
                    {company.phone && (
                      <div className="text-sm text-gray-500">{company.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.subscriptionPlan === 'UNLIMITED' ? 'bg-purple-100 text-purple-800' :
                      company.subscriptionPlan === 'ENTERPRISE' ? 'bg-blue-100 text-blue-800' :
                      company.subscriptionPlan === 'PROFESSIONAL' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {company.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.currentEmployeeCount}/{company.maxEmployees === -1 ? '∞' : company.maxEmployees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {company.isActive ? t('subscription.status.active') : t('subscription.status.suspended')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingCompany(company)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {companies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('company.noCompaniesFound')}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Company Modal */}
      {(showCreateForm || editingCompany) && (
        <CompanyForm
          company={editingCompany}
          onSave={editingCompany ? handleUpdateCompany : handleCreateCompany}
          onClose={() => {
            setShowCreateForm(false)
            setEditingCompany(null)
          }}
        />
      )}
    </div>
  )
}

// Company Form Component
const CompanyForm = ({ company, onSave, onClose }) => {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    domain: company?.domain || '',
    contactEmail: company?.contactEmail || '',
    phone: company?.phone || '',
    address: company?.address || '',
    city: company?.city || '',
    state: company?.state || '',
    postalCode: company?.postalCode || '',
    country: company?.country || '',
    subscriptionPlan: company?.subscriptionPlan || 'STARTER_20',
    paymentMethod: company?.paymentMethod || 'STRIPE',
    isActive: company?.isActive ?? true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(company?.id, formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {company ? t('company.editCompany') : t('company.createCompany')}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company.companyName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company.contactEmail')} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company.domain')}
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company.phone')}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company.subscriptionPlan')}
                </label>
                <select
                  value={formData.subscriptionPlan}
                  onChange={(e) => setFormData({...formData, subscriptionPlan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STARTER_20">{t('subscription.plan.starter')}</option>
                  <option value="GROWTH_50">{t('subscription.plan.growth')}</option>
                  <option value="BUSINESS_100">{t('subscription.plan.business')}</option>
                  <option value="ENTERPRISE_150">{t('subscription.plan.enterprise')}</option>
                  <option value="UNLIMITED">{t('subscription.plan.unlimited')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('company.paymentMethod')}
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STRIPE">{t('payment.method.stripe')}</option>
                  <option value="IYZICO">{t('payment.method.iyzico')}</option>
                  <option value="PAYTR">{t('payment.method.paytr')}</option>
                  <option value="PARAM">{t('payment.method.param')}</option>
                  <option value="GARANTI_PAY">{t('payment.method.garanti_pay')}</option>
                  <option value="WIRE_TRANSFER">{t('payment.method.wire_transfer')}</option>
                  <option value="BANK_TRANSFER_TR">{t('payment.method.bank_transfer_tr')}</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">{t('company.isActive')}</label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('company.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {company ? t('common.save') : t('common.add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompanyManagement
