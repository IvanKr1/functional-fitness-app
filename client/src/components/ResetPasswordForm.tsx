import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, TextField, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material'
import { Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store/useStore'
import { apiService } from '../services/api.js'

export function ResetPasswordForm({ onSuccess, onCancel }) {
  const { currentUser } = useStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await apiService.post(`/auth/reset-password/${currentUser.id}`, {
        currentPassword,
        newPassword
      })
      if (response.success) {
        setSuccess('Password reset successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        if (onSuccess) onSuccess()
      } else {
        setError(response.error || 'Failed to reset password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TextField
        label="Current Password"
        type={showCurrent ? 'text' : 'password'}
        fullWidth
        margin="normal"
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
                onClick={() => setShowCurrent(v => !v)}
                edge="end"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <TextField
        label="New Password"
        type={showNew ? 'text' : 'password'}
        fullWidth
        margin="normal"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showNew ? 'Hide password' : 'Show password'}
                onClick={() => setShowNew(v => !v)}
                edge="end"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <TextField
        label="Confirm New Password"
        type={showConfirm ? 'text' : 'password'}
        fullWidth
        margin="normal"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm(v => !v)}
                edge="end"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={isSubmitting} variant="outlined">Cancel</Button>
        )}
        <Button type="submit" variant="contained" color="warning" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={20} /> : 'Reset Password'}
        </Button>
      </Box>
    </Box>
  )
}

ResetPasswordForm.propTypes = {
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func
} 