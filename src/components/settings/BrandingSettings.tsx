
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/lib/supabase';

export const BrandingSettings = () => {
  const { currentCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [colors, setColors] = useState({
    primary: '#128C7E',
    secondary: '#DCF8C6',
    accent: '#25D366'
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setColors(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      
      // Mostrar una vista previa
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
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
      
      // Subir logo si hay uno nuevo
      let logoUrl = null;
      if (logo) {
        const fileName = `company_${currentCompany.id}_logo_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company_assets')
          .upload(fileName, logo);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('company_assets')
          .getPublicUrl(fileName);
          
        logoUrl = urlData.publicUrl;
      }
      
      // Actualizar tema de la empresa
      const { error } = await supabase
        .from('company_themes')
        .upsert({
          company_id: currentCompany.id,
          primary_color: colors.primary,
          secondary_color: colors.secondary,
          accent_color: colors.accent,
          ...(logoUrl && { logo_url: logoUrl }),
          updated_at: new Date()
        });
      
      if (error) throw error;
      
      toast({
        title: "Tema actualizado",
        description: "Los cambios en el tema serán visibles al recargar la página"
      });
      
      // Recargar la página para que los cambios surtan efecto
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error updating branding:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el tema de la empresa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary">Color primario</Label>
          <div className="flex space-x-2">
            <div 
              className="w-10 h-10 rounded-md border"
              style={{ backgroundColor: colors.primary }}
            />
            <Input
              id="primary"
              name="primary"
              type="text"
              value={colors.primary}
              onChange={handleColorChange}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secondary">Color secundario</Label>
          <div className="flex space-x-2">
            <div 
              className="w-10 h-10 rounded-md border"
              style={{ backgroundColor: colors.secondary }}
            />
            <Input
              id="secondary"
              name="secondary"
              type="text"
              value={colors.secondary}
              onChange={handleColorChange}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accent">Color de acento</Label>
          <div className="flex space-x-2">
            <div 
              className="w-10 h-10 rounded-md border"
              style={{ backgroundColor: colors.accent }}
            />
            <Input
              id="accent"
              name="accent"
              type="text"
              value={colors.accent}
              onChange={handleColorChange}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="logo">Logo de la empresa</Label>
        <div className="flex flex-col space-y-4">
          {logoPreview && (
            <div className="w-40 h-40 border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <Input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            Recomendado: imagen PNG con fondo transparente, 512x512px
          </p>
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
};
