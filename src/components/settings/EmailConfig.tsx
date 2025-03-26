
import React, { useState, FormEvent, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from '@/contexts/CompanyContext';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  use_tls: boolean;
  from_email: string;
}

const EmailConfigForm = () => {
  const { currentCompany } = useCompany();
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true,
    from_email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      if (!currentCompany || !currentCompany.id || currentCompany.id === '00000000-0000-0000-0000-000000000000') {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('email_config')
          .select('*')
          .eq('company_id', currentCompany.id)
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // No data found error
            throw error;
          }
        } else if (data) {
          setConfig({
            smtp_host: data.smtp_host,
            smtp_port: data.smtp_port,
            smtp_username: data.smtp_username,
            smtp_password: data.smtp_password,
            use_tls: data.use_tls,
            from_email: data.from_email
          });
        }
      } catch (error) {
        console.error('Error loading email config:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración de email",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [currentCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleToggleTLS = (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      use_tls: checked
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentCompany || !currentCompany.id || currentCompany.id === '00000000-0000-0000-0000-000000000000') {
      toast({
        title: "Error",
        description: "No hay una empresa seleccionada",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('email_config')
        .upsert({
          ...config,
          company_id: currentCompany.id
        });

      if (error) throw error;
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de email ha sido guardada exitosamente"
      });
    } catch (error) {
      console.error('Error saving email config:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">Cargando configuración...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="smtp_host">Servidor SMTP</Label>
          <Input
            id="smtp_host"
            name="smtp_host"
            value={config.smtp_host}
            onChange={handleChange}
            placeholder="smtp.example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
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
        
        <div className="space-y-2">
          <Label htmlFor="smtp_username">Usuario SMTP</Label>
          <Input
            id="smtp_username"
            name="smtp_username"
            value={config.smtp_username}
            onChange={handleChange}
            placeholder="usuario@example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="smtp_password">Contraseña SMTP</Label>
          <Input
            id="smtp_password"
            name="smtp_password"
            type="password"
            value={config.smtp_password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="from_email">Email de remitente</Label>
          <Input
            id="from_email"
            name="from_email"
            type="email"
            value={config.from_email}
            onChange={handleChange}
            placeholder="noreply@example.com"
            required
          />
        </div>
        
        <div className="flex items-center justify-between space-y-0 pt-5">
          <Label htmlFor="use_tls">Usar TLS</Label>
          <Switch
            id="use_tls"
            checked={config.use_tls}
            onCheckedChange={handleToggleTLS}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar configuración"}
      </Button>
    </form>
  );
};

export default EmailConfigForm;
