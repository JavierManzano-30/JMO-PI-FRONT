import React, { useState } from 'react';
import { Button } from '../components/ui/Button.jsx';
import { FormField } from '../components/ui/FormField.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { SectionHeader } from '../components/ui/SectionHeader.jsx';
import { StatusMessage } from '../components/ui/StatusMessage.jsx';
import { Card } from '../components/ui/Surface.jsx';
import { ApiError } from '../lib/apiClient.js';
import { sendTestEmail } from '../services/emailService.js';

export function AdminPanel() {
  const [form, setForm] = useState({
    to: '',
    subject: 'Prueba operativa SnapNation',
    text: 'Mensaje de verificación enviado desde el panel de administración.',
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setError('');
    setResult(null);

    if (!form.to.trim() || !form.subject.trim() || !form.text.trim()) {
      setStatus('error');
      setError('Completa destinatario, asunto y mensaje para enviar la prueba.');
      return;
    }

    try {
      const response = await sendTestEmail({
        to: form.to.trim(),
        subject: form.subject.trim(),
        text: form.text.trim(),
      });
      setResult(response);
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('No se pudo enviar el correo de prueba.');
      }
    }
  };

  return (
    <section className="admin-page">
      <Card className="admin-overview-card">
        <PageHeader
          eyebrow="Administración"
          title="Panel de control"
          description={(
            'Área reservada para tareas operativas de SnapNation: seguimiento de rondas, '
            + 'moderación y gestión de métricas de comunidad.'
          )}
        />

        <div className="data-list admin-overview-list">
          <div>
            <strong>Estado actual</strong>
            <span>Conectado a API real y eventos en tiempo real</span>
          </div>
          <div>
            <strong>Acceso</strong>
            <span>Solo perfiles con rol administrador</span>
          </div>
          <div>
            <strong>Módulo activo</strong>
            <span>Verificación de envío de correo transaccional</span>
          </div>
        </div>
      </Card>

      <Card className="admin-email-card">
        <SectionHeader
          title="Correo de prueba"
          description="Comprueba conectividad SMTP y entrega de notificaciones desde backend."
        />

        <form className="form admin-email-form" onSubmit={handleSubmit}>
          <FormField label="Destinatario" htmlFor="adminEmailTo">
            <input
              id="adminEmailTo"
              type="email"
              value={form.to}
              onChange={(event) => setForm((prev) => ({ ...prev, to: event.target.value }))}
              placeholder="snapnationinfo@gmail.com"
              required
            />
          </FormField>

          <FormField label="Asunto" htmlFor="adminEmailSubject">
            <input
              id="adminEmailSubject"
              type="text"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              maxLength={160}
              required
            />
          </FormField>

          <FormField label="Mensaje" htmlFor="adminEmailText">
            <textarea
              id="adminEmailText"
              rows="5"
              value={form.text}
              onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
              maxLength={2000}
              required
            />
          </FormField>

          {status === 'error' && <StatusMessage tone="error">{error}</StatusMessage>}
          {status === 'success' && (
            <StatusMessage tone="success">
              Correo enviado. Aceptados: {(result?.accepted || []).join(', ') || 'sin destinatarios'}.
            </StatusMessage>
          )}

          <div className="inline-actions">
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Enviar prueba'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
