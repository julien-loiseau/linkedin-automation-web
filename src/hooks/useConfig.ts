'use client'

import { useState, useEffect } from 'react'

interface Config {
  devDebug: boolean
}

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config`)
        
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        } else {
          // Default to false if API call fails
          setConfig({ devDebug: false })
        }
      } catch (error) {
        console.error('Failed to fetch config:', error)
        // Default to false if API call fails
        setConfig({ devDebug: false })
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading }
}