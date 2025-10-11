# 🎨 Documentación Completa - Integración Frontend con Backend API

Guía completa para integrar el frontend (Next.js 15 + Viem + Wagmi + TanStack Query) con el Backend API de desencriptación.

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Configuración de la API](#configuración-de-la-api)
3. [Hooks Personalizados](#hooks-personalizados)
4. [Componentes Listos para Usar](#componentes-listos-para-usar)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Tipos TypeScript](#tipos-typescript)
7. [Manejo de Errores](#manejo-de-errores)
8. [Testing](#testing)

---

## 🚀 Configuración Inicial

### 1. Variables de Entorno

**Archivo: `frontend/.env.local`**

```bash
# Desarrollo local
NEXT_PUBLIC_API_URL=http://localhost:3001

# Producción (actualizar después del deploy)
# NEXT_PUBLIC_API_URL=https://bae-backend-api.onrender.com
```

**Archivo: `frontend/.env.production`**

```bash
# URL del backend en producción
NEXT_PUBLIC_API_URL=https://bae-backend-api.onrender.com
```

### 2. Estructura de Carpetas

```
frontend/
├── src/
│   ├── config/
│   │   └── api.ts              # Configuración de la API
│   ├── lib/
│   │   ├── api-client.ts       # Cliente HTTP con fetch
│   │   └── types.ts            # Tipos TypeScript
│   ├── hooks/
│   │   ├── useLatestReading.ts
│   │   ├── useReading.ts
│   │   ├── useReadingHistory.ts
│   │   ├── useReadingCount.ts
│   │   └── useReadingStats.ts
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── ReadingCard.tsx
│   │   ├── ReadingHistory.tsx
│   │   ├── StatisticsPanel.tsx
│   │   └── RealtimeIndicator.tsx
│   └── app/
│       ├── layout.tsx
│       └── page.tsx
└── package.json
```

---

## ⚙️ Configuración de la API

### Archivo: `src/config/api.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    HEALTH: '/health',
    LATEST_READING: '/api/readings/latest/decrypt',
    READING_BY_INDEX: (index: number) => `/api/readings/${index}/decrypt`,
    HISTORY: '/api/readings/history',
    COUNT: '/api/readings/count',
    STATS: '/api/readings/stats',
  },
  DEFAULT_TIMEOUT: 30000, // 30 segundos
} as const;
```

### Archivo: `src/lib/types.ts`

```typescript
// Tipos para lecturas desencriptadas
export interface DecryptedReading {
  deviceId: string;
  temperature: number;
  humidity: number;
  timestamp: number;
  timestampDate: string;
  blockNumber: number;
}

// Tipos para historial
export interface ReadingHistoryResponse {
  readings: DecryptedReading[];
  total: number;
  limit: number;
  offset: number;
  returned: number;
}

// Tipos para estadísticas
export interface ReadingStats {
  total: number;
  analyzed: number;
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  hotAlerts: number;
  coldAlerts: number;
}

// Tipos para conteo
export interface ReadingCount {
  total: number;
}

// Tipos para health check
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

// Tipo de alerta
export type AlertType = 'hot' | 'cold' | null;

// Error de la API
export interface APIError {
  error: string;
  message: string;
}
```

### Archivo: `src/lib/api-client.ts`

```typescript
import { API_CONFIG } from '@/config/api';
import type {
  DecryptedReading,
  ReadingHistoryResponse,
  ReadingStats,
  ReadingCount,
  HealthResponse,
  APIError,
} from './types';

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  // Health Check
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Obtener última lectura desencriptada
  async getLatestReading(): Promise<DecryptedReading> {
    return this.request<DecryptedReading>(API_CONFIG.ENDPOINTS.LATEST_READING);
  }

  // Obtener lectura específica por índice
  async getReading(index: number): Promise<DecryptedReading> {
    if (index < 0) {
      throw new Error('Index must be non-negative');
    }
    return this.request<DecryptedReading>(
      API_CONFIG.ENDPOINTS.READING_BY_INDEX(index)
    );
  }

  // Obtener historial de lecturas
  async getHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<ReadingHistoryResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    const endpoint = `${API_CONFIG.ENDPOINTS.HISTORY}${query ? `?${query}` : ''}`;

    return this.request<ReadingHistoryResponse>(endpoint);
  }

  // Obtener total de lecturas
  async getCount(): Promise<ReadingCount> {
    return this.request<ReadingCount>(API_CONFIG.ENDPOINTS.COUNT);
  }

  // Obtener estadísticas
  async getStats(limit?: number): Promise<ReadingStats> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<ReadingStats>(`${API_CONFIG.ENDPOINTS.STATS}${query}`);
  }
}

export const apiClient = new APIClient();
```

---

## 🪝 Hooks Personalizados

### 1. Hook para Última Lectura

**Archivo: `src/hooks/useLatestReading.ts`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useLatestReading() {
  return useQuery({
    queryKey: ['latest-reading'],
    queryFn: () => apiClient.getLatestReading(),
    refetchInterval: 30000, // Refetch cada 30 segundos
    staleTime: 25000, // Considerar stale después de 25s
  });
}

// Uso:
// const { data, isLoading, error, refetch } = useLatestReading();
```

### 2. Hook para Lectura Específica

**Archivo: `src/hooks/useReading.ts`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useReading(index: number) {
  return useQuery({
    queryKey: ['reading', index],
    queryFn: () => apiClient.getReading(index),
    enabled: index >= 0, // Solo ejecutar si index es válido
    staleTime: 60000, // Lecturas antiguas no cambian
  });
}

// Uso:
// const { data, isLoading, error } = useReading(42);
```

### 3. Hook para Historial (con paginación)

**Archivo: `src/hooks/useReadingHistory.ts`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UseReadingHistoryParams {
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useReadingHistory(params?: UseReadingHistoryParams) {
  const { limit = 50, offset = 0, enabled = true } = params || {};

  return useQuery({
    queryKey: ['reading-history', limit, offset],
    queryFn: () => apiClient.getHistory({ limit, offset }),
    enabled,
    staleTime: 30000,
  });
}

// Uso básico:
// const { data, isLoading } = useReadingHistory();

// Con paginación:
// const { data } = useReadingHistory({ limit: 20, offset: 40 });

// Con control de ejecución:
// const { data } = useReadingHistory({ enabled: isReady });
```

### 4. Hook para Total de Lecturas

**Archivo: `src/hooks/useReadingCount.ts`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useReadingCount() {
  return useQuery({
    queryKey: ['reading-count'],
    queryFn: () => apiClient.getCount(),
    staleTime: 60000, // El total no cambia tan rápido
    refetchInterval: 60000, // Refetch cada minuto
  });
}

// Uso:
// const { data, isLoading } = useReadingCount();
// const total = data?.total || 0;
```

### 5. Hook para Estadísticas

**Archivo: `src/hooks/useReadingStats.ts`**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useReadingStats(limit = 20) {
  return useQuery({
    queryKey: ['reading-stats', limit],
    queryFn: () => apiClient.getStats(limit),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// Uso:
// const { data: stats } = useReadingStats(50);
// stats?.avgTemperature
// stats?.hotAlerts
```

### 6. Hook para TODO el Historial (paginación automática)

**Archivo: `src/hooks/useAllReadings.ts`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { DecryptedReading } from '@/lib/types';

export function useAllReadings() {
  const [readings, setReadings] = useState<DecryptedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        let offset = 0;
        const limit = 100;
        const allReadings: DecryptedReading[] = [];

        while (true) {
          const response = await apiClient.getHistory({ limit, offset });
          allReadings.push(...response.readings);

          // Si retornó menos del límite, ya no hay más
          if (response.readings.length < limit) break;

          offset += limit;

          // Límite de seguridad: máximo 1000 lecturas
          if (allReadings.length >= 1000) break;
        }

        setReadings(allReadings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { readings, loading, error };
}

// Uso:
// const { readings, loading, error } = useAllReadings();
// Retorna TODAS las lecturas disponibles (hasta 1000)
```

---

## 🎨 Componentes Listos para Usar

### 1. Dashboard Principal

**Archivo: `src/components/Dashboard.tsx`**

```typescript
'use client';

import { useLatestReading } from '@/hooks/useLatestReading';
import { useReadingCount } from '@/hooks/useReadingCount';
import { useReadingStats } from '@/hooks/useReadingStats';
import { ReadingCard } from './ReadingCard';
import { StatisticsPanel } from './StatisticsPanel';

export function Dashboard() {
  const { data: latest, isLoading: loadingLatest } = useLatestReading();
  const { data: count } = useReadingCount();
  const { data: stats } = useReadingStats(50);

  if (loadingLatest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Bae IoT Dashboard</h1>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total de Lecturas</p>
          <p className="text-3xl font-bold">{count?.total || 0}</p>
        </div>

        {stats && (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Temperatura Promedio</p>
              <p className="text-3xl font-bold">{stats.avgTemperature}°C</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Humedad Promedio</p>
              <p className="text-3xl font-bold">{stats.avgHumidity}%</p>
            </div>
          </>
        )}
      </div>

      {/* Última Lectura */}
      {latest && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Última Lectura</h2>
          <ReadingCard reading={latest} isLatest />
        </div>
      )}

      {/* Panel de Estadísticas */}
      {stats && <StatisticsPanel stats={stats} />}
    </div>
  );
}
```

### 2. Tarjeta de Lectura

**Archivo: `src/components/ReadingCard.tsx`**

```typescript
'use client';

import type { DecryptedReading, AlertType } from '@/lib/types';

interface ReadingCardProps {
  reading: DecryptedReading;
  isLatest?: boolean;
}

function getAlertType(temperature: number): AlertType {
  if (temperature > 29) return 'hot';
  if (temperature < 17) return 'cold';
  return null;
}

export function ReadingCard({ reading, isLatest }: ReadingCardProps) {
  const alert = getAlertType(reading.temperature);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
      {isLatest && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-green-600">
            ÚLTIMA LECTURA
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Temperatura */}
        <div
          className={`p-4 rounded-lg border-2 ${
            alert === 'hot'
              ? 'bg-red-50 border-red-300'
              : alert === 'cold'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Temperatura
            </span>
            {alert && (
              <span className="text-xl">
                {alert === 'hot' ? '⚠️' : '🥶'}
              </span>
            )}
          </div>
          <p className="text-4xl font-bold">{reading.temperature}°C</p>
          {alert && (
            <p className="text-xs mt-2 font-semibold">
              {alert === 'hot' ? 'Alerta de calor' : 'Alerta de frío'}
            </p>
          )}
        </div>

        {/* Humedad */}
        <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
          <span className="text-sm font-medium text-gray-600">Humedad</span>
          <p className="text-4xl font-bold">{reading.humidity}%</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-t pt-4">
        <div>
          <span className="text-gray-600">Device ID:</span>
          <p className="font-mono font-semibold">{reading.deviceId}</p>
        </div>

        <div>
          <span className="text-gray-600">Timestamp:</span>
          <p className="font-semibold">
            {new Date(reading.timestampDate).toLocaleString('es-ES')}
          </p>
        </div>

        <div>
          <span className="text-gray-600">Block:</span>
          <a
            href={`https://blockscout-passet-hub.parity-testnet.parity.io/block/${reading.blockNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline"
          >
            {reading.blockNumber}
          </a>
        </div>
      </div>
    </div>
  );
}
```

### 3. Historial con Paginación

**Archivo: `src/components/ReadingHistory.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { ReadingCard } from './ReadingCard';

export function ReadingHistory() {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const offset = page * pageSize;

  const { data, isLoading, error } = useReadingHistory({
    limit: pageSize,
    offset,
  });

  if (isLoading) {
    return <div className="text-center py-12">Cargando historial...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const canGoPrevious = page > 0;
  const canGoNext = data && data.readings.length === pageSize;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Historial de Lecturas</h2>

      {/* Información de paginación */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {data?.readings.length || 0} de {data?.total || 0} lecturas
        {totalPages > 0 && ` • Página ${page + 1} de ${totalPages}`}
      </div>

      {/* Lista de lecturas */}
      <div className="space-y-4 mb-6">
        {data?.readings.map((reading, index) => (
          <ReadingCard key={`${reading.timestamp}-${index}`} reading={reading} />
        ))}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={!canGoPrevious}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        <span className="text-sm text-gray-600">
          Página {page + 1}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!canGoNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
```

### 4. Panel de Estadísticas

**Archivo: `src/components/StatisticsPanel.tsx`**

```typescript
'use client';

import type { ReadingStats } from '@/lib/types';

interface StatisticsPanelProps {
  stats: ReadingStats;
}

export function StatisticsPanel({ stats }: StatisticsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        Estadísticas (últimas {stats.analyzed} lecturas)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Temperatura Promedio */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Temp. Promedio</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats.avgTemperature}°C
          </p>
        </div>

        {/* Humedad Promedio */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Hum. Promedio</p>
          <p className="text-3xl font-bold text-cyan-600">
            {stats.avgHumidity}%
          </p>
        </div>

        {/* Rango de Temperatura */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Rango de Temp.</p>
          <p className="text-xl font-bold">
            <span className="text-blue-400">{stats.minTemperature}°</span>
            {' - '}
            <span className="text-red-400">{stats.maxTemperature}°</span>
          </p>
        </div>

        {/* Alertas */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Alertas</p>
          <div className="flex justify-center gap-4">
            <div>
              <span className="text-2xl">⚠️</span>
              <p className="text-sm font-semibold">{stats.hotAlerts}</p>
            </div>
            <div>
              <span className="text-2xl">🥶</span>
              <p className="text-sm font-semibold">{stats.coldAlerts}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📖 Ejemplos de Uso Completos

### Ejemplo 1: Página Principal Simple

**Archivo: `src/app/page.tsx`**

```typescript
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Dashboard />
    </main>
  );
}
```

### Ejemplo 2: Página con Historial Completo

**Archivo: `src/app/history/page.tsx`**

```typescript
'use client';

import { ReadingHistory } from '@/components/ReadingHistory';

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Historial Completo</h1>
        <ReadingHistory />
      </div>
    </main>
  );
}
```

### Ejemplo 3: Ver Lectura Específica

**Archivo: `src/app/reading/[index]/page.tsx`**

```typescript
'use client';

import { useReading } from '@/hooks/useReading';
import { ReadingCard } from '@/components/ReadingCard';

export default function ReadingPage({ params }: { params: { index: string } }) {
  const index = parseInt(params.index, 10);
  const { data, isLoading, error } = useReading(index);

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No se encontró la lectura</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Lectura #{index}</h1>
        <ReadingCard reading={data} />
      </div>
    </main>
  );
}
```

### Ejemplo 4: Gráfica de Temperatura con Recharts

**Instalar Recharts:**

```bash
npm install recharts
```

**Archivo: `src/components/TemperatureChart.tsx`**

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReadingHistory } from '@/hooks/useReadingHistory';

export function TemperatureChart() {
  const { data, isLoading } = useReadingHistory({ limit: 100 });

  if (isLoading) return <div>Cargando gráfica...</div>;

  const chartData = data?.readings.map((reading) => ({
    time: new Date(reading.timestampDate).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    temperatura: reading.temperature,
    humedad: reading.humidity,
  })) || [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Últimas 100 Lecturas</h2>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="temperatura" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="Temperatura (°C)"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="humedad" 
            stroke="#06b6d4" 
            strokeWidth={2}
            name="Humedad (%)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 🧪 Testing

### Archivo: `src/app/test/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useLatestReading } from '@/hooks/useLatestReading';
import { useReadingCount } from '@/hooks/useReadingCount';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { apiClient } from '@/lib/api-client';

export default function TestPage() {
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const { data: latest, isLoading: loadingLatest, error: errorLatest } = useLatestReading();
  const { data: count, isLoading: loadingCount } = useReadingCount();
  const { data: history, isLoading: loadingHistory } = useReadingHistory({ limit: 5 });

  const testHealth = async () => {
    setHealthStatus('loading');
    try {
      await apiClient.health();
      setHealthStatus('success');
    } catch {
      setHealthStatus('error');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Página de Testing</h1>

      {/* Test 1: Health Check */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Test 1: Health Check</h2>
        <button
          onClick={testHealth}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Probar Conexión
        </button>
        {healthStatus === 'loading' && <p className="mt-2">Probando...</p>}
        {healthStatus === 'success' && (
          <p className="mt-2 text-green-600 font-bold">✅ Conectado exitosamente</p>
        )}
        {healthStatus === 'error' && (
          <p className="mt-2 text-red-600 font-bold">❌ Error de conexión</p>
        )}
      </div>

      {/* Test 2: Total de Lecturas */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Test 2: Total de Lecturas</h2>
        {loadingCount ? (
          <p>Cargando...</p>
        ) : (
          <div>
            <p className="text-green-600 font-bold">✅ Datos obtenidos</p>
            <p className="text-2xl font-bold mt-2">Total: {count?.total}</p>
          </div>
        )}
      </div>

      {/* Test 3: Última Lectura */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Test 3: Última Lectura Desencriptada</h2>
        {loadingLatest ? (
          <p>Cargando...</p>
        ) : errorLatest ? (
          <p className="text-red-600">❌ Error: {errorLatest.message}</p>
        ) : latest ? (
          <div>
            <p className="text-green-600 font-bold mb-4">✅ Datos desencriptados</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded">
                <p className="text-sm text-gray-600">Temperatura</p>
                <p className="text-3xl font-bold">{latest.temperature}°C</p>
              </div>
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Humedad</p>
                <p className="text-3xl font-bold">{latest.humidity}%</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm">
              <p><strong>Device:</strong> {latest.deviceId}</p>
              <p><strong>Block:</strong> {latest.blockNumber}</p>
              <p><strong>Timestamp:</strong> {new Date(latest.timestampDate).toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <p className="text-yellow-600">⚠️ No hay datos</p>
        )}
      </div>

      {/* Test 4: Historial */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Test 4: Historial (últimas 5)</h2>
        {loadingHistory ? (
          <p>Cargando...</p>
        ) : history ? (
          <div>
            <p className="text-green-600 font-bold mb-2">
              ✅ {history.readings.length} lecturas obtenidas
            </p>
            <p className="text-sm text-gray-600">
              Total en blockchain: {history.total}
            </p>
          </div>
        ) : (
          <p className="text-yellow-600">⚠️ No hay datos</p>
        )}
      </div>

      {/* Resumen */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg">
        <h2 className="text-xl font-bold mb-2">📊 Resumen</h2>
        <div className="space-y-1">
          <p>{healthStatus === 'success' ? '✅' : '⏳'} Conexión al backend</p>
          <p>{count ? '✅' : '⏳'} Lectura de conteo</p>
          <p>{latest ? '✅' : '⏳'} Desencriptación de datos</p>
          <p>{history ? '✅' : '⏳'} Historial</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 📚 Referencia Rápida de Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Última Lectura Desencriptada
```bash
curl http://localhost:3001/api/readings/latest/decrypt
```

### Lectura Específica
```bash
curl http://localhost:3001/api/readings/0/decrypt
curl http://localhost:3001/api/readings/42/decrypt
```

### Historial (últimas 50)
```bash
curl http://localhost:3001/api/readings/history?limit=50
```

### Historial con Paginación
```bash
# Primeras 20
curl http://localhost:3001/api/readings/history?limit=20&offset=0

# Lecturas 20-40
curl http://localhost:3001/api/readings/history?limit=20&offset=20

# Lecturas 40-60
curl http://localhost:3001/api/readings/history?limit=20&offset=40
```

### Total de Lecturas
```bash
curl http://localhost:3001/api/readings/count
```

### Estadísticas (últimas 20)
```bash
curl http://localhost:3001/api/readings/stats?limit=20
```

### Estadísticas (últimas 100)
```bash
curl http://localhost:3001/api/readings/stats?limit=100
```

---

## ✅ Checklist de Integración

- [ ] Variables de entorno configuradas (.env.local)
- [ ] Tipos TypeScript creados (src/lib/types.ts)
- [ ] API Client configurado (src/lib/api-client.ts)
- [ ] Hooks personalizados creados
- [ ] Componentes básicos implementados
- [ ] Página de testing funciona
- [ ] Backend API accesible
- [ ] Datos desencriptados visibles
- [ ] Paginación funciona correctamente
- [ ] Estadísticas se muestran

---

## 🎉 ¡Listo para Usar!

Con esta documentación tienes todo lo necesario para integrar completamente el frontend con el backend API. Todos los hooks, componentes y ejemplos están listos para copiar y pegar.

**URLs importantes:**
- Local: `http://localhost:3001`
- Producción: `https://bae-backend-api.onrender.com`

**¿Necesitas ayuda?** Revisa la página de testing en `/test` para diagnosticar problemas.
