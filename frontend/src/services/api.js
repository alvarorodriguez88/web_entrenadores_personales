const API_BASE = 'http://localhost:8080/api/v1'


function getAuthHeaders() {
  const stored = localStorage.getItem('user')
  const token  = stored ? JSON.parse(stored).access_token : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {
    ...(auth ? getAuthHeaders() : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || `Error ${res.status}`)
  }

  return data
}


export const authApi = {
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
  },

  register(email, password, nombre, apellidos) {
    return request('/auth/register', {
      method: 'POST',
      body: { email, password, nombre, apellidos },
      auth: false,
    })
  },

  changePassword(currentPassword, newPassword) {
    return request('/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    })
  },
}


export const usersApi = {
  getTrainerProfile() {
    return request('/users/trainers/me')
  },

  updateTrainerProfile(data) {
    return request('/users/trainers/me', { method: 'PUT', body: data })
  },

  getClientProfile() {
    return request('/users/clients/me')
  },

  updateClientProfile(data) {
    return request('/users/clients/me', { method: 'PUT', body: data })
  },

  getTrainerClients() {
    return request('/users/clients')
  },

  getClientById(id) {
    return request(`/users/clients/${id}`)
  },
}


export const exercisesApi = {
  getExercises() {
    return request('/exercises')
  },

  getExercise(id) {
    return request(`/exercises/${id}`)
  },

  createExercise(data) {
    return request('/exercises', { method: 'POST', body: data })
  },

  updateExercise(id, data) {
    return request(`/exercises/${id}`, { method: 'PUT', body: data })
  },

  deleteExercise(id) {
    return request(`/exercises/${id}`, { method: 'DELETE' })
  },

  archiveExercise(id) {
    return request(`/exercises/${id}/archive`, { method: 'PATCH' })
  },

  unarchiveExercise(id) {
    return request(`/exercises/${id}/unarchive`, { method: 'PATCH' })
  },
}


export const routinesApi = {

  getRoutines() {
    return request('/routines')
  },

  getRoutine(id) {
    return request(`/routines/${id}`)
  },

  createRoutine(data) {
    return request('/routines', { method: 'POST', body: data })
  },

  updateRoutine(id, data) {
    return request(`/routines/${id}`, { method: 'PUT', body: data })
  },

  deleteRoutine(id) {
    return request(`/routines/${id}`, { method: 'DELETE' })
  },

  duplicateRoutine(id) {
    return request(`/routines/${id}/duplicate`, { method: 'POST' })
  },

  archiveRoutine(id) {
    return request(`/routines/${id}/archive`, { method: 'PATCH' })
  },

  unarchiveRoutine(id) {
    return request(`/routines/${id}/unarchive`, { method: 'PATCH' })
  },

  getBlocks(routineId) {
    return request(`/routines/${routineId}/blocks`)
  },

  getBlock(routineId, blockId) {
    return request(`/routines/${routineId}/blocks/${blockId}`)
  },

  createBlock(routineId, data) {
    return request(`/routines/${routineId}/blocks`, { method: 'POST', body: data })
  },

  updateBlock(routineId, blockId, data) {
    return request(`/routines/${routineId}/blocks/${blockId}`, { method: 'PUT', body: data })
  },

  deleteBlock(routineId, blockId) {
    return request(`/routines/${routineId}/blocks/${blockId}`, { method: 'DELETE' })
  },

  reorderBlocks(routineId, data) {
    return request(`/routines/${routineId}/blocks/reorder`, { method: 'PATCH', body: data })
  },

  getBlockExercises(routineId, blockId) {
    return request(`/routines/${routineId}/blocks/${blockId}/exercises`)
  },

  getBlockExercise(routineId, blockId, blockExerciseId) {
    return request(`/routines/${routineId}/blocks/${blockId}/exercises/${blockExerciseId}`)
  },

  createBlockExercise(routineId, blockId, data) {
    return request(`/routines/${routineId}/blocks/${blockId}/exercises`, { method: 'POST', body: data })
  },

  updateBlockExercise(routineId, blockId, blockExerciseId, data) {
    return request(`/routines/${routineId}/blocks/${blockId}/exercises/${blockExerciseId}`, { method: 'PUT', body: data })
  },

  deleteBlockExercise(routineId, blockId, blockExerciseId) {
    return request(`/routines/${routineId}/blocks/${blockId}/exercises/${blockExerciseId}`, { method: 'DELETE' })
  },

  reorderBlockExercises(routineId, blockId, data) {
    return request(`/routines/${routineId}/blocks/${blockId}/exercises/reorder`, { method: 'PATCH', body: data })
  },
}


export const assignmentsApi = {

  getAssignments() {
    return request('/assignments')
  },

  getAssignmentHistory() {
    return request('/assignments/history')
  },

  createAssignment(clientId, data) {
    return request(`/assignments/clients/${clientId}`, { method: 'POST', body: data })
  },

  deleteAssignment(id) {
    return request(`/assignments/${id}`, { method: 'DELETE' })
  },

  updateAssignmentStatus(id, status) {
    return request(`/assignments/${id}/status`, { method: 'PATCH', body: { estado: status } })
  },

  getClientAssignments(clientId) {
    return request(`/assignments/clients/${clientId}`)
  },

  getClientAssignmentHistory(clientId) {
    return request(`/assignments/clients/${clientId}/history`)
  },

  getAssignmentExercises(assignmentId) {
    return request(`/assignments/${assignmentId}/exercises`)
  },

  createAssignmentExercise(assignmentId, data) {
    return request(`/assignments/${assignmentId}/exercises`, { method: 'POST', body: data })
  },

  updateAssignmentExercise(assignmentId, customizationId, data) {
    return request(`/assignments/${assignmentId}/exercises/${customizationId}`, { method: 'PUT', body: data })
  },

  deleteAssignmentExercise(assignmentId, customizationId) {
    return request(`/assignments/${assignmentId}/exercises/${customizationId}`, { method: 'DELETE' })
  },

  getSessions(assignmentId) {
    return request(`/assignments/${assignmentId}/sessions`)
  },

  getSession(assignmentId, sessionId) {
    return request(`/assignments/${assignmentId}/sessions/${sessionId}`)
  },

  getSessionLogs(sessionId) {
    return request(`/assignments/sessions/${sessionId}/logs`)
  },

  getMyAssignments() {
    return request('/assignments/me')
  },

  getMyAssignmentExercises(assignmentId) {
    return request(`/assignments/me/${assignmentId}/exercises`)
  },

  getMySessions(assignmentId) {
    return request(`/assignments/me/${assignmentId}/sessions`)
  },

  createMySession(assignmentId, data) {
    return request(`/assignments/me/${assignmentId}/sessions`, { method: 'POST', body: data })
  },

  updateMySession(assignmentId, sessionId, data) {
    return request(`/assignments/me/${assignmentId}/sessions/${sessionId}`, { method: 'PUT', body: data })
  },

  deleteMySession(assignmentId, sessionId) {
    return request(`/assignments/me/${assignmentId}/sessions/${sessionId}`, { method: 'DELETE' })
  },

  createMyExerciseLog(sessionId, data) {
    return request(`/assignments/me/sessions/${sessionId}/logs`, { method: 'POST', body: data })
  },

  updateMyExerciseLog(logId, data) {
    return request(`/assignments/me/logs/${logId}`, { method: 'PUT', body: data })
  },

  deleteMyExerciseLog(logId) {
    return request(`/assignments/me/logs/${logId}`, { method: 'DELETE' })
  },
}


export const metricsApi = {
  getClientMetrics(clientId) {
    return request(`/metrics/clients/${clientId}`)
  },

  getClientMetric(clientId, metricId) {
    return request(`/metrics/clients/${clientId}/${metricId}`)
  },

  createMetric(clientId, data) {
    return request(`/metrics/clients/${clientId}`, { method: 'POST', body: data })
  },

  updateMetric(clientId, metricId, data) {
    return request(`/metrics/clients/${clientId}/${metricId}`, { method: 'PUT', body: data })
  },

  deleteMetric(clientId, metricId) {
    return request(`/metrics/clients/${clientId}/${metricId}`, { method: 'DELETE' })
  },

  getMyMetrics() {
    return request('/metrics/clients/me')
  },

  createClientMetric(data) {
    return request('/metrics/clients/me', { method: 'POST', body: data })
  }
}
