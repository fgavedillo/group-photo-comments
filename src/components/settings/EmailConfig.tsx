
import React, { useState, FormEvent } from 'react';
import supabase from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    
    try {
      const { error } = await supabase
        .from('email_config')
        .upsert({
          ...config,
          company_id: 'default' // Usamos un valor por defecto
        });

      if (error) {
        alert('Error al guardar la configuración: ' + error.message);
      } else {
        alert('Configuración guardada exitosamente');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="smtp_host">Servidor SMTP</Label>
        <Input 
          id="smtp_host" 
          name="smtp_host" 
          value={config.smtp_host} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="smtp_port">Puerto SMTP</Label>
        <Input 
          id="smtp_port" 
          name="smtp_port" 
          type="number" 
          value={config.smtp_port} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="smtp_username">Usuario SMTP</Label>
        <Input 
          id="smtp_username" 
          name="smtp_username" 
          value={config.smtp_username} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="smtp_password">Contraseña SMTP</Label>
        <Input 
          id="smtp_password" 
          name="smtp_password" 
          type="password" 
          value={config.smtp_password} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="from_email">Email de origen</Label>
        <Input 
          id="from_email" 
          name="from_email" 
          type="email" 
          value={config.from_email} 
          onChange={handleChange} 
          required 
        />
      </div>
      
      <Button type="submit">Guardar configuración</Button>
    </form>
  );
};

export default EmailConfigForm;
