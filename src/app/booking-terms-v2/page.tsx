"use client"

import { useEffect, useState } from 'react'
import RichTextEditor from '@/components/RichTextEditor'
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer'
import { useAuth } from '@/context/AuthContext'

export default function BookingTermsV2Page() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingHtml, setEditingHtml] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/booking-terms-v2')
      .then(r => r.json())
      .then(data => {
        setPage(data.page)
        setIsAdmin(!!data.isAdmin)
        setEditingHtml(data.page?.html_content || '')
      })
      .catch(() => {
        setPage(null)
      })
  }, [])

  useEffect(() => {
    // if user logs in/out, re-check admin status
    if (!loading) {
      fetch('/api/booking-terms-v2')
        .then(r => r.json())
        .then(data => setIsAdmin(!!data.isAdmin))
        .catch(() => {})
    }
  }, [user, loading])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/booking-terms-v2', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html_content: editingHtml }),
      })
      const json = await res.json()
      if (res.ok) {
        setPage(json.page)
        alert('Saved')
      } else {
        alert(json.error || 'Save failed')
      }
    } catch (e) {
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Booking Terms (v2)</h1>

      {page ? (
        <div>
          {!isAdmin && (
            <div className="mb-4">
              <SafeHtmlRenderer html={page.html_content || ''} />
            </div>
          )}

          {isAdmin && (
            <div>
              <div className="mb-4">
                <RichTextEditor value={editingHtml} onChange={setEditingHtml} />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Preview</h3>
                <div className="mt-2">
                  <SafeHtmlRenderer html={editingHtml} />
                </div>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="mt-6 text-sm text-gray-600">If you are an admin, sign in to edit this page.</div>
          )}
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
}
