import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const CompanySelector = ({ onCompanySelect }) => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const { user } = useAuth()

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

  const handleCompanySelect = (company) => {
    setSelectedCompany(company)
    if (onCompanySelect) {
      onCompanySelect(company)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Company</h2>
        
        {user?.role === 'ADMIN' && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Admin Access:</strong> You can access all companies. Select a company to manage.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedCompany?.id === company.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleCompanySelect(company)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{company.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {company.description && (
                <p className="text-gray-600 text-sm mb-2">{company.description}</p>
              )}
              
              <div className="text-sm text-gray-500">
                <p><strong>Plan:</strong> {company.subscriptionPlan}</p>
                <p><strong>Employees:</strong> {company.currentEmployeeCount}/{company.maxEmployees === -1 ? '∞' : company.maxEmployees}</p>
                {company.domain && (
                  <p><strong>Domain:</strong> {company.domain}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No companies found.</p>
          </div>
        )}

        {selectedCompany && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Selected Company:</h4>
            <p className="text-gray-600">{selectedCompany.name}</p>
            <p className="text-sm text-gray-500">
              {selectedCompany.currentEmployeeCount} employees • {selectedCompany.subscriptionPlan} plan
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanySelector
