
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold">PRL Conecta</h1>
          
          <div className="flex items-center space-x-4">
            <Select defaultValue="default">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Empresa por defecto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      
      <div className="flex">
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
