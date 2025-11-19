"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/RichTextEditor'
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer'

interface BookingTermsVersion {
  id: string
  version_number: number
  title: string
  html_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function BookingTermsAdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [versions, setVersions] = useState<BookingTermsVersion[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [editingVersion, setEditingVersion] = useState<BookingTermsVersion | null>(null)
  const [editingHtml, setEditingHtml] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewVersionForm, setShowNewVersionForm] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadVersions()
    }
  }, [user])

  const loadVersions = async () => {
    try {
      const res = await fetch('/api/booking-terms-versions')
      const data = await res.json()
      
      if (res.status === 403) {
        alert('You do not have permission to access this page')
        router.push('/')
        return
      }
      
      setIsAdmin(data.isAdmin)
      setVersions(data.versions || [])
    } catch (error) {
      console.error('Error loading versions:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleEdit = (version: BookingTermsVersion) => {
    setEditingVersion(version)
    setEditingHtml(version.html_content)
    setEditingTitle(version.title)
    setShowNewVersionForm(false)
  }

  const handleCancelEdit = () => {
    setEditingVersion(null)
    setEditingHtml('')
    setEditingTitle('')
    setShowNewVersionForm(false)
  }

  const handleSave = async () => {
    if (!editingVersion) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/booking-terms-versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVersion.id,
          title: editingTitle,
          html_content: editingHtml
        })
      })
      
      if (res.ok) {
        alert('Version updated successfully')
        await loadVersions()
        handleCancelEdit()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save')
      }
    } catch (error) {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSetActive = async (versionId: string) => {
    if (!confirm('Are you sure you want to set this as the active version? Clients will sign this version.')) {
      return
    }
    
    try {
      const res = await fetch('/api/booking-terms-versions/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      })
      
      if (res.ok) {
        alert('Active version updated')
        await loadVersions()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to set active version')
      }
    } catch (error) {
      alert('Failed to set active version')
    }
  }

  const handleCreateNew = () => {
    const nextVersionNumber = Math.max(...versions.map(v => v.version_number), 0) + 1
    setEditingTitle(`Service Agreement v${nextVersionNumber}`)
    setEditingHtml(versions.find(v => v.is_active)?.html_content || '')
    setShowNewVersionForm(true)
    setEditingVersion(null)
  }

  const handleSaveNew = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/booking-terms-versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle,
          html_content: editingHtml
        })
      })
      
      if (res.ok) {
        alert('New version created successfully')
        await loadVersions()
        handleCancelEdit()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create version')
      }
    } catch (error) {
      alert('Failed to create version')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Booking Terms Management</h1>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create New Version
          </button>
        </div>

        {(editingVersion || showNewVersionForm) ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {showNewVersionForm ? 'Create New Version' : `Edit Version ${editingVersion?.version_number}`}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Service Agreement v2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <RichTextEditor value={editingHtml} onChange={setEditingHtml} />
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={showNewVersionForm ? handleSaveNew : handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <div className="border rounded p-4 bg-gray-50">
                <SafeHtmlRenderer html={editingHtml} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {versions.map((version) => (
                  <tr key={version.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      v{version.version_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {version.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {version.is_active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(version.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(version)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {!version.is_active && (
                        <button
                          onClick={() => handleSetActive(version.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

