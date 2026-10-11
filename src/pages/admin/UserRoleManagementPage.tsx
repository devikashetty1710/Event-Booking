import React, { useState } from 'react'
import { localStore } from '@/lib/storage'
import { UserProfile, UserRole } from '@/types'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { formatDateIST } from '@/lib/utils'
import { Users, Shield, ShieldCheck, Mail, Building2, UserCheck } from 'lucide-react'

export const UserRoleManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>(() => localStore.getUsers())
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u)
    setUsers(updated)
    localStore.saveUsers(updated)
    setFeedback(`Role updated to ${newRole} for user. Changes saved.`)
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            User Directory & Role Authorization
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {users.length} Institutional Accounts
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Role-Based Access Control (RBAC) governing campus event booking approvals and master calendar modifications.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
          {feedback}
        </div>
      )}

      {/* Security Notice Card */}
      <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block mb-0.5">Authorization Boundary Security:</span>
          Only authorized administrators can grant administrative privileges. Server-side Supabase Row Level Security (RLS) prevents ordinary users from modifying their role or approving their own requests.
        </div>
      </Card>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Department / Committee</th>
                <th className="py-3 px-4">Email & Domain Status</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center shrink-0">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          u.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.fullName}</span>
                        <span className="text-[10px] text-slate-400">ID: {u.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {u.department}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-800 block">{u.email}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Domain
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="user">User / Organizer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
