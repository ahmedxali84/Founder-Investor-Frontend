'use client'

import { ThemeProvider } from '../context/ThemeContext.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'
import { UnreadMessagesProvider } from '../context/UnreadMessagesContext.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

function DocumentTitle() {
  useDocumentTitle()
  return null
}

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UnreadMessagesProvider>
          <DocumentTitle />
          {children}
        </UnreadMessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
