import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const AccountDetails = () => {
  const { t } = useLanguage();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    fetchAccountDetails();
  }, []);

  const fetchAccountDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/account/details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching account details:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{t('account.error_loading')}</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('common.not_available');
    return new Date(dateString).toLocaleDateString();
  };

  const tabs = [
    { id: 'account', label: t('account.tab_account'), icon: '👤' },
    { id: 'company', label: t('account.tab_company'), icon: '🏢' },
    { id: 'subscription', label: t('account.tab_subscription'), icon: '💳' },
    { id: 'support', label: t('account.tab_support'), icon: '🎫' },
    { id: 'about', label: t('account.tab_about'), icon: 'ℹ️' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('account.title')}</h1>
        <p className="text-blue-100">
          {t('account.welcome')}, {accountData.firstName} {accountData.lastName}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('account.personal_info')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon="👤"
              label={t('account.full_name')}
              value={`${accountData.firstName} ${accountData.lastName}`}
            />
            <InfoCard
              icon="📧"
              label={t('account.email')}
              value={accountData.email}
              copyable
            />
            <InfoCard
              icon="📱"
              label={t('account.phone')}
              value={accountData.phone || t('common.not_set')}
            />
            <InfoCard
              icon="🔑"
              label={t('account.role')}
              value={accountData.role}
              badge
            />
            <InfoCard
              icon="📅"
              label={t('account.account_created')}
              value={formatDate(accountData.accountCreatedAt)}
            />
            <InfoCard
              icon="🕐"
              label={t('account.last_login')}
              value={formatDate(accountData.lastLoginAt)}
            />
          </div>

          {/* Login Credentials */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">
              🔐 {t('account.login_credentials')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('account.login_email')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={accountData.email}
                    readOnly
                    className="flex-1 px-4 py-2 border rounded bg-white"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(accountData.email)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    📋 {t('common.copy')}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('account.password')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value="●●●●●●●●●●"
                    readOnly
                    className="flex-1 px-4 py-2 border rounded bg-white"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    {showPassword ? '🙈' : '👁️'} {showPassword ? t('common.hide') : t('common.show')}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {t('account.password_note')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('account.login_url')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={accountData.loginUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border rounded bg-white"
                  />
                  <button
                    onClick={() => window.open(accountData.loginUrl, '_blank')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    🔗 {t('common.open')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('account.company_info')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon="🏢"
              label={t('account.company_name')}
              value={accountData.companyName}
            />
            <InfoCard
              icon="🌐"
              label={t('account.company_domain')}
              value={`${accountData.companyDomain}.teamsphere.com`}
              copyable
            />
            <InfoCard
              icon="📧"
              label={t('account.company_email')}
              value={accountData.companyEmail}
              copyable
            />
            <InfoCard
              icon="📱"
              label={t('account.company_phone')}
              value={accountData.companyPhone || t('common.not_set')}
            />
            <InfoCard
              icon="🌍"
              label={t('account.country')}
              value={accountData.country}
            />
            <InfoCard
              icon="👥"
              label={t('account.employees')}
              value={`${accountData.currentEmployeeCount} / ${accountData.maxEmployees}`}
            />
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('account.subscription_info')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon="📦"
              label={t('account.subscription_plan')}
              value={accountData.subscriptionPlan}
              badge
            />
            <InfoCard
              icon="✅"
              label={t('account.subscription_status')}
              value={accountData.subscriptionStatus}
              badge
              color={accountData.subscriptionStatus === 'ACTIVE' ? 'green' : 'yellow'}
            />
            <InfoCard
              icon="🔄"
              label={t('account.billing_cycle')}
              value={accountData.billingCycle}
            />
            <InfoCard
              icon="💳"
              label={t('account.payment_method')}
              value={accountData.paymentMethod}
            />
            <InfoCard
              icon="📅"
              label={t('account.subscription_start')}
              value={formatDate(accountData.subscriptionStartDate)}
            />
            <InfoCard
              icon="⏰"
              label={t('account.next_billing')}
              value={formatDate(accountData.nextBillingDate)}
            />
          </div>

          {accountData.trialEndDate && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⚠️ {t('account.trial_ends')}: <strong>{formatDate(accountData.trialEndDate)}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('account.support_info')}</h2>
          
          {/* Internal Ticketing System */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900">
              🎫 {t('account.ticketing_system')}
            </h3>
            <p className="text-gray-700 mb-4">{t('account.ticketing_description')}</p>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <p className="text-sm text-gray-600 mb-2">
                  To submit a ticket, please visit the Tickets page from your dashboard.
                </p>
                <button
                  onClick={() => window.location.href = '/tickets'}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Go to Tickets
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon="📧"
              label={t('account.support_email')}
              value={accountData.supportEmail}
              copyable
            />
            <InfoCard
              icon="📱"
              label={t('account.support_phone')}
              value={accountData.supportPhone}
            />
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              💡 {t('account.support_tip')}
            </p>
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">{t('account.about_teamsphere')}</h2>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              {t('account.about_description')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <LinkCard
                icon="🌐"
                title={t('account.website')}
                url="https://teamsphere.com"
              />
              <LinkCard
                icon="📱"
                title={t('account.mobile_app')}
                url={accountData.mobileAppUrl}
              />
              <LinkCard
                icon="📚"
                title={t('account.api_documentation')}
                url={accountData.apiUrl + '/swagger-ui.html'}
              />
              <LinkCard
                icon="🔒"
                title={t('account.privacy_policy')}
                url="https://teamsphere.com/privacy"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('account.features')}</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>{t('account.feature_1')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>{t('account.feature_2')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>{t('account.feature_3')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>{t('account.feature_4')}</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>{t('account.feature_5')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon, label, value, copyable, badge, color = 'blue' }) => {
  const { t } = useLanguage();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    // You could add a toast notification here
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">{icon}</span>
            <span className="text-sm text-gray-600">{label}</span>
          </div>
          {badge ? (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800`}>
              {value}
            </span>
          ) : (
            <p className="text-gray-900 font-medium">{value}</p>
          )}
        </div>
        {copyable && (
          <button
            onClick={handleCopy}
            className="ml-2 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            title={t('common.copy')}
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
};

// Link Card Component
const LinkCard = ({ icon, title, url }) => {
  const { t } = useLanguage();
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
    >
      <span className="text-3xl mr-3">{icon}</span>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 truncate">{url}</p>
      </div>
      <span className="text-blue-500">→</span>
    </a>
  );
};

export default AccountDetails;


