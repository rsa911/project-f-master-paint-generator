const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg)
  }
  return res.json()
}

export const getColors = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== 'All')
  ).toString()
  return request(`/colors${qs ? '?' + qs : ''}`)
}

export const getColor   = id   => request(`/colors/${encodeURIComponent(id)}`)
export const createColor = data => request('/colors', { method: 'POST', body: data })
export const updateColor = (id, data) => request(`/colors/${encodeURIComponent(id)}`, { method: 'PUT', body: data })
export const deleteColor = id  => request(`/colors/${encodeURIComponent(id)}`, { method: 'DELETE' })

export const getPigments    = ()           => request('/pigments')
export const updatePigment  = (code, data) => request(`/pigments/${encodeURIComponent(code)}`, { method: 'PUT', body: data })

export const runPlanner = selections => request('/planner', { method: 'POST', body: { selections } })
