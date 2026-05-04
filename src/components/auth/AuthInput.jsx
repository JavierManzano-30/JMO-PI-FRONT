import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function AuthInput({ label, icon: Icon, type = 'text', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="auth-input-group">
      {label && <label className="auth-label">{label}</label>}
      <div className="auth-input-wrapper">
        {Icon && <Icon className="auth-input-icon" size={20} />}
        <input 
          className="auth-input" 
          type={inputType} 
          {...props} 
        />
        {isPassword && (
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
