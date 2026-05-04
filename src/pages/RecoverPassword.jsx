import React from 'react';
import { Link } from 'react-router-dom';

export function RecoverPassword() {
  return (
    <div className="auth-layout">
      <div className="login-card" style={{ width: 'min(520px, 100%)' }}>
        <h2 className="login-card-title">Recupera tu cuenta</h2>
        <p className="login-card-sub">
          Introduce tu usuario o correo y te enviaremos un enlace para restablecer la contrasena.
        </p>
        <form className="form">
          <div className="field">
            <label htmlFor="recover">Usuario o correo</label>
            <input id="recover" type="text" placeholder="javier o javier@mail.com" />
          </div>
          <button className="btn" type="button">
            Enviar enlace
          </button>
        </form>
        <div className="login-footer">
          Recuerdas tu contrasena? <Link to="/login">Volver al login</Link>
        </div>
      </div>
    </div>
  );
}
