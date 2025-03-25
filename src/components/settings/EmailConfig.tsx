import React, { useState, FormEvent } from 'react';
import { getSupabaseClient } from '../../lib/supabase';

const EmailConfigForm = () => {
  const [config, setConfig] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true,
    from_email: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('company_email_config')
      .upsert({
        ...config,
        company_id: user.company_id // asume que tienes acceso al company_id del usuario
      });

    if (error) {
      alert('Error al guardar la configuración');
    } else {
      alert('Configuración guardada exitosamente');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
};

export default EmailConfigForm; 