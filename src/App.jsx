import React from 'react'
import KanbanBoard from './components/KanbanBoard'
import JqueryList from './components/JqueryList'

export default function App() {
  return (
    <div style={{ padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <KanbanBoard />
      <div style={{ marginTop: 30 }}>
        <JqueryList />
      </div>
    </div>
  )
}
