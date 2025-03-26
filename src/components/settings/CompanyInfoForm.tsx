
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/lib/supabase';

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
}

export const CompanyInfoForm = () => {
  const { currentCompany, refreshCompanies } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!currentCompany || !currentCompany.id || currentCompany.id === '00000000-0000-0000-0000-000000000000') {
        return;
      }

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', currentCompany.id)
          .single();
        
        if (error) throw error;
        
        setCompanyInfo({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          description: data.description || ''
        });
      } catch (error) {
        console.error('Error loading company info:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la empresa",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyInfo();
  }, [currentCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        .from('companies')
        .update({
          name: companyInfo.name,
          address: companyInfo.address,
          phone: companyInfo.phone,
          email: companyInfo.email,
          description: companyInfo.description,
          updated_at: new Date()
        })
        .eq('id', currentCompany.id);
      
      if (error) throw error;
      
      toast({
        title: "Actualización exitosa",
        description: "La información de la empresa ha sido actualizada"
      });
      
      // Actualizar la lista de empresas para reflejar el nuevo nombre
      refreshCompanies();
    } catch (error) {
      console.error('Error updating company info:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información de la empresa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la empresa</Label>
          <Input
            id="name"
            name="name"
            value={companyInfo.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={companyInfo.email}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            value={companyInfo.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            value={companyInfo.address}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          value={companyInfo.description}
          onChange={handleChange}
          rows={4}
        />
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
};
