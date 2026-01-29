import { AlertTriangle, Trash2, Info, AlertCircle } from 'lucide-react'

type DialogVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!open) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const icons: Record<DialogVariant, React.ReactNode> = {
    danger: <Trash2 />,
    warning: <AlertTriangle />,
    info: <Info />
  }

  const iconStyles: Record<DialogVariant, string> = {
    danger: 'confirm-dialog-icon danger',
    warning: 'confirm-dialog-icon warning',
    info: 'confirm-dialog-icon info'
  }

  const buttonStyles: Record<DialogVariant, string> = {
    danger: 'btn btn-danger',
    warning: 'btn btn-warning',
    info: 'btn btn-primary'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className={iconStyles[variant]}>
          {icons[variant]}
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button className={buttonStyles[variant]} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

interface AlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  variant?: 'error' | 'warning' | 'info' | 'success'
}

export function AlertDialog({
  open,
  onClose,
  title,
  message,
  variant = 'info'
}: AlertDialogProps) {
  if (!open) return null

  const icons: Record<string, React.ReactNode> = {
    error: <AlertCircle />,
    warning: <AlertTriangle />,
    info: <Info />,
    success: <Info />
  }

  const iconStyles: Record<string, string> = {
    error: 'confirm-dialog-icon danger',
    warning: 'confirm-dialog-icon warning',
    info: 'confirm-dialog-icon info',
    success: 'confirm-dialog-icon success'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className={iconStyles[variant]}>
          {icons[variant]}
        </div>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
